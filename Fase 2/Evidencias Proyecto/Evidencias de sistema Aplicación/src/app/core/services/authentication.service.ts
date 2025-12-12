import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { User } from 'src/app/models/user';
import { Observable, of, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

/**
 * AuthenticationService
 * 
 * Maneja la autenticación pura: login, logout, registro y gestión de sesión.
 */
@Injectable({
    providedIn: 'root'
})
export class AuthenticationService {
    public user$: Observable<User | null>;

    constructor(
        private afAuth: AngularFireAuth,
        private firestore: AngularFirestore,
        private storage: AngularFireStorage
    ) {
        // user$ emite el documento de usuario de Firestore para el usuario autenticado de Firebase.
        this.user$ = this.afAuth.authState.pipe(
            switchMap(user => {
                if (!user) return of(null);

                return this.firestore.doc<User>(`users/${user.uid}`).snapshotChanges().pipe(
                    switchMap(snapshot => {
                        if (!snapshot.payload.exists) return of(null);
                        const data = snapshot.payload.data() as User;
                        const uid = snapshot.payload.id;

                        // Sincronizar estado de verificación de email si es necesario
                        if (user.emailVerified && !data.emailVerified) {
                            this.firestore.collection('users').doc(uid).update({ emailVerified: true })
                                .catch(err => console.error('Error syncing emailVerified:', err));
                        }

                        const pending = (data as any).pendingEmail;
                        // Si hay un pendingEmail y el usuario Auth ya tiene ese email,
                        // finalizar el cambio en Firestore inmediatamente.
                        if (pending && user.email === pending) {
                            const updated = { ...data, email: pending } as Partial<User>;
                            const updateObj: any = {
                                email: pending,
                                pendingEmail: null,
                                pendingEmailRequestedAt: null
                            };
                            return from(this.firestore.collection('users').doc(user.uid).update(updateObj)).pipe(
                                map(() => ({ uid, ...updated }))
                            );
                        }

                        return of({ ...data, uid });
                    })
                );
            })
        ) as unknown as Observable<User | null>;
    }

    /**
     * Registrar un nuevo usuario con nombre completo, nombre de usuario, email, teléfono y dirección
     */
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
            if (usernameSnapshot && !usernameSnapshot.empty) {
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

    /**
     * Registrar usuario por administrador
     */
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
            if (usernameSnapshot && !usernameSnapshot.empty) {
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

                // 4. Guardar datos de usuario en Firestore
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

    /**
     * Iniciar sesión con nombre de usuario o correo electrónico
     */
    async login(identifier: string, password: string, keepSession: boolean): Promise<any> {
        try {
            // Establecer la persistencia de la sesión antes de iniciar sesión
            const persistence = keepSession ? 'local' : 'session';
            await this.afAuth.setPersistence(persistence);

            let userCredential;
            let userData: User | null = null;

            // Primero, intentar iniciar sesión con el identificador como un email
            try {
                userCredential = await this.afAuth.signInWithEmailAndPassword(identifier, password);
                if (!userCredential.user) throw new Error('No user in credential');
                userData = await this.getUserData(userCredential.user.uid);
            } catch (emailError: any) {
                // Si el inicio de sesión por email falla, intentar encontrar un usuario por nombre de usuario
                const userSnapshot = await this.firestore.collection('users', ref => ref.where('nombreUsuario', '==', identifier)).get().toPromise();

                if (userSnapshot && !userSnapshot.empty) {
                    const userDoc = userSnapshot.docs[0];
                    userData = userDoc.data() as User;
                    const email = userData.email;
                    userCredential = await this.afAuth.signInWithEmailAndPassword(email, password);
                } else {
                    throw emailError;
                }
            }

            if (userData && userData.isBlocked) {
                await this.afAuth.signOut();
                throw { code: 'auth/user-blocked' };
            }

            return userCredential;
        } catch (error: any) {
            console.error('Error en el inicio de sesión:', error.code, error.message);
            throw error;
        }
    }

    /**
     * Verificar si el usuario está autenticado
     */
    isAuthenticated(): Observable<boolean> {
        return this.afAuth.authState.pipe(map(user => !!user));
    }

    /**
     * Cerrar sesión
     */
    async logout(): Promise<void> {
        await this.afAuth.signOut();
    }

    /**
     * Restablecer la contraseña
     */
    async resetPassword(email: string): Promise<void> {
        try {
            await this.afAuth.sendPasswordResetEmail(email);
        } catch (error) {
            console.error('Error al enviar el correo de restablecimiento:', error);
            throw error;
        }
    }

    /**
     * Re-autenticar al usuario
     */
    async reauthenticate(password: string): Promise<any> {
        const user = await this.afAuth.currentUser;
        if (!user || !user.email) {
            throw new Error('No hay usuario autenticado para re-autenticar.');
        }

        try {
            const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
            const result = await user.reauthenticateWithCredential(credential);
            return result;
        } catch (error: any) {
            console.error('Error re-autenticando con credencial:', error);
            throw {
                code: error.code || 'auth/unknown-error',
                message: error.message || 'Error desconocido durante la re-autenticación'
            };
        }
    }

    /**
     * Obtener el objeto de usuario de Firebase actualmente autenticado
     */
    async getCurrentFirebaseUser(): Promise<firebase.User | null> {
        return await this.afAuth.currentUser;
    }

    /**
     * Obtener los datos del usuario por UID (helper interno)
     */
    private async getUserData(uid: string): Promise<User | null> {
        const userDoc = await this.firestore.collection('users').doc(uid).get().toPromise();
        return userDoc && userDoc.exists ? (userDoc.data() as User) : null;
    }
}
