import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { User } from 'src/app/models/user';
import { Adopcion } from 'src/app/models/Adopcion'; // Importar la interfaz Adopcion
import { Observable, of, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { AngularFireStorage } from '@angular/fire/compat/storage';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public user$: Observable<User | null>;
  // rastrear temporizadores de sondeo activos para la finalización de email pendiente
  private pendingEmailPolls: Map<string, { timerId: any; attempts: number }> = new Map();

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private storage: AngularFireStorage
  ) { 
    // user$ emite el documento de usuario de Firestore para el usuario autenticado de Firebase.
    // Además, si el documento de usuario contiene un pendingEmail y el email del usuario de Firebase Auth
    // ya es igual a ese pendingEmail (es decir, el usuario hizo clic en el enlace de verificación),
    // finaliza el cambio moviendo pendingEmail -> email en Firestore.
  this.user$ = this.afAuth.authState.pipe(
      switchMap(user => {
        if (!user) return of(null);

        return this.firestore.doc<User>(`users/${user.uid}`).snapshotChanges().pipe(
          switchMap(snapshot => {
            if (!snapshot.payload.exists) return of(null);
            const data = snapshot.payload.data() as User;
            const uid = snapshot.payload.id;

            const pending = (data as any).pendingEmail;
            // Si hay un pendingEmail y el usuario Auth ya tiene ese email,
            // finalizar el cambio en Firestore inmediatamente.
            if (pending && user.email === pending) {
              const updated = { ...data, email: pending } as Partial<User>;
              const updateObj: any = {
                email: pending,
                pendingEmail: firebase.firestore.FieldValue.delete(),
                pendingEmailRequestedAt: firebase.firestore.FieldValue.delete()
              };
              return from(this.firestore.collection('users').doc(user.uid).update(updateObj)).pipe(
                map(() => ({ uid, ...updated }))
              );
            }

            // Si hay un pendingEmail pero el usuario Auth aún no se ha actualizado, iniciar un bucle de
            // sondeo corto para detectar cuándo el usuario confirma el nuevo email (útil si el
            // usuario hace clic en el enlace de verificación desde otro dispositivo).
            if (pending && user.email !== pending) {
              // iniciar sondeo en segundo plano (no bloqueante)
              this.startPendingEmailPoll(user.uid, pending);
            }

            return of({ uid, ...data });
          })
        );
      })
  ) as unknown as Observable<User | null>;
  }

  /**
   * Inicia un bucle de sondeo corto que recarga el usuario de Firebase y verifica si el
   * email del usuario Auth ha sido actualizado al pendingEmail. Si es así, finaliza el
   * cambio en Firestore. Esto permite finalizar cambios de email cuando el enlace de verificación
   * fue clickeado desde otro dispositivo/navegador.
   */
  private startPendingEmailPoll(uid: string, pendingEmail: string) {
    if (this.pendingEmailPolls.has(uid)) return; // ya está sondeando

    const maxAttempts = 30; // ej., 30 * 10s = 5 minutos
    const intervalMs = 10000; // 10 segundos
    const entry = { timerId: null as any, attempts: 0 };
    this.pendingEmailPolls.set(uid, entry);

    entry.timerId = setInterval(async () => {
      try {
        entry.attempts += 1;
        const firebaseUser = await this.afAuth.currentUser;
        if (!firebaseUser) return;
        // recargar para obtener datos frescos
        await firebaseUser.reload();
        const email = firebaseUser.email;
        if (email === pendingEmail) {
          // finalizar en Firestore
          await this.firestore.collection('users').doc(uid).update({
            email: pendingEmail,
            pendingEmail: firebase.firestore.FieldValue.delete(),
            pendingEmailRequestedAt: firebase.firestore.FieldValue.delete()
          });
          this.stopPendingEmailPoll(uid);
        } else if (entry.attempts >= maxAttempts) {
          // rendirse después de los intentos máximos
          this.stopPendingEmailPoll(uid);
        }
      } catch (e) {
        console.warn('Error al sondear para finalización de pendingEmail:', e);
        if (entry.attempts >= maxAttempts) this.stopPendingEmailPoll(uid);
      }
    }, intervalMs);
  }

  private stopPendingEmailPoll(uid: string) {
    const entry = this.pendingEmailPolls.get(uid);
    if (!entry) return;
    clearInterval(entry.timerId);
    this.pendingEmailPolls.delete(uid);
  }

  /**
   * Ayudante de reintento genérico para operaciones transitorias.
   * Reintenta la función asíncrona proporcionada hasta `attempts` veces con `delayMs` entre intentos.
   */
  private async retry<T>(
    fn: () => Promise<T>,
    options: { attempts?: number; delayMs?: number; retryOn?: (error: any) => boolean } = {}
  ): Promise<T> {
    const { attempts = 5, delayMs = 500, retryOn } = options;
    let lastErr: any;

    for (let i = 0; i < attempts; i++) {
      try {
        if (i > 0) console.log(`[AuthService.retry] intento ${i + 1}/${attempts}`);
        return await fn();
      } catch (e) {
        lastErr = e;

        // Si se proporciona un predicado retryOn, probarlo. Si retorna false, no reintentar.
        if (retryOn && !retryOn(e)) {
          break;
        }

        // Si este fue el último intento, relanzar
        if (i === attempts - 1) break;

        // retroceso exponencial con jitter
        const backoff = delayMs * Math.pow(2, i);
        const jitter = Math.floor(Math.random() * 1000);
        const wait = backoff + jitter;
        console.warn(`[AuthService.retry] error transitorio, reintentando en ${wait}ms`, e);
        await new Promise(res => setTimeout(res, wait));
      }
    }
    throw lastErr;
  }

  // Método para registrar un nuevo usuario con nombre completo, nombre de usuario, email, teléfono y dirección
  async registerUser(
    nombreCompleto: string,
    nombreUsuario: string,
    email: string,
    password: string,
    telefono: string,
    direccion: string,
    selectedImageFile: Blob | null,
    region?: string,
    ciudad?: string
  ): Promise<void> {
    try {
      // 1. Verificar si el nombre de usuario es único
      const usernameSnapshot = await this.firestore.collection('users', ref => ref.where('nombreUsuario', '==', nombreUsuario)).get().toPromise();
      if (!usernameSnapshot.empty) {
        throw { code: 'auth/username-already-in-use' };
      }

      // 2. Crear usuario con email y contraseña
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      const uid = user?.uid;

      if (user) {
        // 3. Enviar correo de verificación
        await user.sendEmailVerification();

        let profileImageUrl = '';
        if (selectedImageFile) {
          const filePath = `profile-images/${user.uid}`;
          const fileRef = this.storage.ref(filePath);
          await this.storage.upload(filePath, selectedImageFile);
          profileImageUrl = await fileRef.getDownloadURL().toPromise();
        }

        // 4. Guardar datos de usuario en Firestore
        await this.firestore.collection('users').doc(uid).set({
          uid,
          nombreCompleto,
          nombreUsuario,
          email,
          telefono,
          direccion,
          region: region || '',
          ciudad: ciudad || '',
          profileImageUrl,
          emailVerified: user.emailVerified,
          isAdmin: false,
          createdAt: new Date()
        });
      } else {
        throw new Error('No se pudo crear el usuario.');
      }
    } catch (error: any) {
      console.error('Error en el registro:', error);
      throw error;
    }
  }
  
    async registerUserByAdmin(
    nombreCompleto: string,
    nombreUsuario: string,
    email: string,
    password: string,
    telefono: string,
    direccion: string,
    isAdmin: boolean,
    isBlocked: boolean,
    isOrganization: boolean = false,
    isVeterinarian: boolean = false
  ): Promise<void> {
    try {
      // 1. Verificar si el nombre de usuario es único
      const usernameSnapshot = await this.firestore.collection('users', ref => ref.where('nombreUsuario', '==', nombreUsuario)).get().toPromise();
      if (!usernameSnapshot.empty) {
        throw { code: 'auth/username-already-in-use' };
      }

      // 2. Crear usuario con email y contraseña
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      const uid = user?.uid;

      if (user) {
        // 3. Enviar correo de verificación
        await user.sendEmailVerification();
        
        // Determinar cadena de rol mientras se mantienen banderas booleanas para compatibilidad
        let role: 'individual' | 'organization' | 'veterinarian' | 'admin' | 'blocked';
        if (isVeterinarian) {
          role = 'veterinarian';
        } else if (isOrganization) {
          role = 'organization';
        } else {
          role = 'individual';
        }

        // 4. Guardar datos de usuario en Firestore (persistir tanto cadena de rol como banderas booleanas)
        await this.firestore.collection('users').doc(uid).set({
          uid,
          nombreCompleto,
          nombreUsuario,
          email,
          telefono,
          direccion,
          profileImageUrl: '',
          emailVerified: false,
          isAdmin,
          isBlocked,
          isOrganization,
          isVeterinarian,
          role,
          createdAt: new Date()
        });
      } else {
        throw new Error('No se pudo crear el usuario.');
      }
    } catch (error: any) {
      console.error('Error en el registro por admin:', error);
      throw error;
    }
  }

  // Método para verificar si el correo del usuario actual está verificado
    async isEmailVerified(): Promise<boolean> {
      const user = await this.afAuth.currentUser;
      await user?.reload(); // Recargar el perfil del usuario para obtener el estado más reciente
      return user?.emailVerified || false;
    }
  
    // Método para reenviar el correo de verificación
    async sendVerificationEmail(): Promise<void> {
      const user = await this.afAuth.currentUser;
      if (user) {
        await user.sendEmailVerification();
      } else {
        throw new Error('No hay usuario autenticado para enviar el correo de verificación.');
      }
    }

  // Método para verificar si un nombre de usuario está disponible
  // Método para iniciar sesión con nombre de usuario o correo electrónico
  async login(identifier: string, password: string, keepSession: boolean): Promise<any> {
    console.log('AuthService.login llamado');
    try {
      // Establecer la persistencia de la sesión antes de iniciar sesión
      const persistence = keepSession ? 'local' : 'session';
      await this.afAuth.setPersistence(persistence);

      let userCredential;
      let userData: User | null = null;

      // Primero, intentar iniciar sesión con el identificador como un email
      try {
        console.log('Intentando iniciar sesión con email');
        userCredential = await this.afAuth.signInWithEmailAndPassword(identifier, password);
        console.log('Inicio de sesión con email exitoso');
        userData = await this.getUserData(userCredential.user.uid);
      } catch (emailError: any) {
        console.log('Inicio de sesión con email falló, probando nombre de usuario');
        // Si el inicio de sesión por email falla, intentar encontrar un usuario por nombre de usuario y luego iniciar sesión con su email
        const userSnapshot = await this.firestore.collection('users', ref => ref.where('nombreUsuario', '==', identifier)).get().toPromise();

        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          userData = userDoc.data() as User;
          const email = userData.email;
          console.log('Usuario encontrado por nombre de usuario, intentando iniciar sesión con su email');
          userCredential = await this.afAuth.signInWithEmailAndPassword(email, password);
          console.log('Inicio de sesión con nombre de usuario exitoso');
        } else {
          // Si no se encuentra usuario por email o nombre de usuario, relanzar el error original de email o uno genérico
          throw emailError;
        }
      }

      if (userData && userData.isBlocked) {
        await this.afAuth.signOut();
        throw { code: 'auth/user-blocked' };
      }

      return userCredential;
    } catch (error: any) {
      console.error('Error en el inicio de sesión (AuthService):', error.code, error.message);
      throw error;
    }
  }

  // Método para verificar si el usuario está autenticado
  isAuthenticated(): Observable<boolean> {
    return this.afAuth.authState.pipe(map(user => !!user));
  }

  // Método para cerrar sesión
  async logout(): Promise<void> {
    await this.afAuth.signOut();
  }

  // Método para obtener los datos del usuario por UID
  async getUserData(uid: string): Promise<User | null> {
    const userDoc = await this.firestore.collection('users').doc(uid).get().toPromise();
    return userDoc.exists ? (userDoc.data() as User) : null;
  }

  // Método para obtener el usuario actualmente autenticado
  getCurrentUser(): Promise<User | null> {
    return new Promise((resolve, reject) => {
      this.afAuth.authState.subscribe(async user => {
        if (user) {
          try {
            const userData = await this.getUserData(user.uid);
            resolve(userData);
          } catch (error) {
            console.error('Error al obtener datos del usuario:', error);
            reject(error);
          }
        } else {
          resolve(null);
        }
      });
    });
  }

  // Método para obtener el correo electrónico del usuario actualmente autenticado
  async getCurrentUserEmail(): Promise<string | null> {
    const user = await this.afAuth.currentUser;
    return user?.email || null;
  }

  // Método para obtener el objeto de usuario de Firebase actualmente autenticado
  async getCurrentFirebaseUser(): Promise<firebase.User | null> {
    return await this.afAuth.currentUser;
  }

  // Método para restablecer la contraseña
  async resetPassword(email: string): Promise<void> {
    try {
      await this.afAuth.sendPasswordResetEmail(email);
    } catch (error) {
      console.error('Error al enviar el correo de restablecimiento:', error);
      throw error;
    }
  }

  // Métodos para gestionar favoritos
  async addFavorite(userId: string, adoption: Adopcion): Promise<void> {
    await this.firestore.collection(`users/${userId}/favorites`).doc(adoption.id).set(adoption);
  }

  async removeFavorite(userId: string, adoptionId: string): Promise<void> {
    await this.firestore.collection(`users/${userId}/favorites`).doc(adoptionId).delete();
  }

  async isFavorite(userId: string, adoptionId: string): Promise<boolean> {
    const doc = await this.firestore.collection(`users/${userId}/favorites`).doc(adoptionId).get().toPromise();
    return doc?.exists || false;
  }

  // Método para actualizar el perfil de usuario
  async updateUserProfile(uid: string, data: Partial<User>): Promise<void> {
    return this.firestore.collection('users').doc(uid).update(data);
  }

  // Método mejorado para cambio seguro de email
  async requestSecureEmailUpdate(currentPassword: string, newEmail: string): Promise<void> {
    const user = await this.afAuth.currentUser;
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }

    // Paso 1: Re-autenticar con contraseña actual
    try {
      await this.reauthenticate(currentPassword);
    } catch (error: any) {
      console.error('Error durante la re-autenticación:', error);
      
      // Manejar diferentes tipos de errores específicamente
      if (error.code === 'auth/wrong-password') {
        throw new Error('Contraseña actual incorrecta. Verifícala e intenta de nuevo.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Error de conexión. Verifica tu internet e intenta de nuevo.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Demasiados intentos fallidos. Espera unos minutos e intenta de nuevo.');
      } else if (error.code === 'auth/user-mismatch') {
        throw new Error('Error de autenticación. Por favor inicia sesión de nuevo.');
      } else if (error.code === 'auth/user-not-found') {
        throw new Error('Usuario no encontrado. Por favor inicia sesión de nuevo.');
      } else if (error.code === 'auth/invalid-credential') {
        throw new Error('Credenciales inválidas. Verifica tu contraseña.');
      } else {
        // Error genérico o desconocido
        throw new Error(`Error de autenticación: ${error.message || 'Intenta de nuevo más tarde.'}`);
      }
    }

    // Paso 2: Verificar que el nuevo email no esté en uso
    const emailExists = await this.checkEmailExists(newEmail);
    if (emailExists) {
      throw new Error('El correo electrónico ya está registrado en otra cuenta.');
    }

    // Paso 3: Guardar estado pendiente en Firestore
    const currentUserData = await this.getCurrentUser();
    if (currentUserData) {
      await this.firestore.collection('users').doc(currentUserData.uid).update({
        pendingEmail: newEmail,
        pendingEmailRequestedAt: new Date(),
        emailChangeToken: this.generateSecureToken()
      });
    }

    // Paso 4: Enviar verificación al nuevo email
    try {
      await user.verifyBeforeUpdateEmail(newEmail);
    } catch (error: any) {
      // Limpiar estado pendiente si falla el envío
      if (currentUserData) {
        await this.firestore.collection('users').doc(currentUserData.uid).update({
          pendingEmail: firebase.firestore.FieldValue.delete(),
          pendingEmailRequestedAt: firebase.firestore.FieldValue.delete(),
          emailChangeToken: firebase.firestore.FieldValue.delete()
        });
      }

      console.error('Error solicitando cambio de email:', error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('El nuevo correo electrónico ya está en uso.');
      } else if (error.code.includes('network')) {
        throw new Error('Error de red. Verifica tu conexión.');
      } else {
        throw new Error('No se pudo enviar el correo de verificación.');
      }
    }
  }

  // Generar token seguro para el cambio de email
  private generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Confirmar cambio de email después de verificación
  async confirmEmailUpdate(): Promise<void> {
    const user = await this.afAuth.currentUser;
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }

    const currentUserData = await this.getCurrentUser();
    if (!currentUserData) {
      throw new Error('No se pudo obtener los datos del usuario');
    }

    // Verificar si hay un cambio de email pendiente
    if (!currentUserData.pendingEmail) {
      throw new Error('No hay cambio de email pendiente');
    }

    // Verificar que el email fue verificado en Firebase Auth
    await user.reload();
    if (user.email === currentUserData.pendingEmail && user.emailVerified) {
      // Actualizar Firestore con el nuevo email confirmado
      await this.firestore.collection('users').doc(currentUserData.uid).update({
        email: user.email,
        pendingEmail: firebase.firestore.FieldValue.delete(),
        pendingEmailRequestedAt: firebase.firestore.FieldValue.delete(),
        emailChangeToken: firebase.firestore.FieldValue.delete(),
        emailUpdatedAt: new Date()
      });

      console.log('Email actualizado exitosamente');
    } else {
      throw new Error('El nuevo email aún no ha sido verificado');
    }
  }

  // Cancelar cambio de email pendiente
  async cancelEmailUpdate(): Promise<void> {
    const currentUserData = await this.getCurrentUser();
    if (!currentUserData) {
      throw new Error('No se pudo obtener los datos del usuario');
    }

    if (!currentUserData.pendingEmail) {
      throw new Error('No hay cambio de email pendiente para cancelar');
    }

    // Limpiar estado pendiente
    await this.firestore.collection('users').doc(currentUserData.uid).update({
      pendingEmail: firebase.firestore.FieldValue.delete(),
      pendingEmailRequestedAt: firebase.firestore.FieldValue.delete(),
      emailChangeToken: firebase.firestore.FieldValue.delete()
    });
  }

  // Limpiar emails pendientes expirados (llamar periódicamente)
  async cleanupExpiredEmailChanges(): Promise<void> {
    const expiredTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 horas
    
    try {
      const expiredQuery = this.firestore.collection('users', ref => 
        ref.where('pendingEmailRequestedAt', '<', expiredTime)
      );
      
      const expiredDocs = await expiredQuery.get().toPromise();

      if (expiredDocs && !expiredDocs.empty) {
        const batch = this.firestore.firestore.batch();
        expiredDocs.docs.forEach(doc => {
          batch.update(doc.ref, {
            pendingEmail: firebase.firestore.FieldValue.delete(),
            pendingEmailRequestedAt: firebase.firestore.FieldValue.delete(),
            emailChangeToken: firebase.firestore.FieldValue.delete()
          });
        });

        await batch.commit();
      }
    } catch (error) {
      console.error('Error limpiando emails expirados:', error);
    }
  }

  async requestEmailUpdate(newEmail: string): Promise<void> {
    // Mantener método legacy por compatibilidad
    const user = await this.afAuth.currentUser;
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }

    try {
      await user.verifyBeforeUpdateEmail(newEmail);
    } catch (error: any) {
      console.error('Error solicitando cambio de email:', error);
      if (error.code === 'auth/requires-recent-login') {
        throw error;
      }
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('El nuevo correo electrónico ya está en uso.');
      } else if (error.code.includes('network')) {
        throw new Error('Error de red. Verifica tu conexión.');
      } else {
        throw new Error('No se pudo iniciar el proceso de cambio de correo.');
      }
    }
  }

  // Método para re-autenticar al usuario
  async reauthenticate(password: string): Promise<any> {
    const user = await this.afAuth.currentUser;
    if (!user || !user.email) {
      throw new Error('No hay usuario autenticado para re-autenticar.');
    }

    try {
      console.log('Re-autenticando con email:', user.email);
      const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
      const result = await user.reauthenticateWithCredential(credential);
      console.log('Re-autenticación exitosa');
      return result;
    } catch (error: any) {
      console.error('Error re-autenticando con credencial:', error);
      
      // Re-lanzar el error original con su código para manejo específico arriba
      throw {
        code: error.code || 'auth/unknown-error',
        message: error.message || 'Error desconocido durante la re-autenticación'
      };
    }
  }

  async syncUserEmailWithFirebase(): Promise<void> {
    const firebaseUser = await this.getCurrentFirebaseUser();
    if (!firebaseUser || !firebaseUser.email) {
      return;
    }
  
    const firestoreUser = await this.getUserData(firebaseUser.uid);
    if (firestoreUser && firestoreUser.email !== firebaseUser.email) {
      await this.updateUserProfile(firebaseUser.uid, { email: firebaseUser.email });
    }
  }

  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const methods = await this.afAuth.fetchSignInMethodsForEmail(email);
      return methods.length > 0;
    } catch (error) {
      // Esto puede suceder para formatos de email inválidos, etc. Tratar como 'no encontrado'.
      console.warn('Error verificando existencia de email:', error);
      return false;
    }
  }

  // Método para obtener información de usuario por ID
  async getUserById(userId: string): Promise<User | null> {
    try {
      const userDoc = await this.firestore.collection('users').doc(userId).get().toPromise();
      return userDoc.exists ? userDoc.data() as User : null;
    } catch (error) {
      console.error('Error obteniendo usuario por ID:', error);
      return null;
    }
  }
}

