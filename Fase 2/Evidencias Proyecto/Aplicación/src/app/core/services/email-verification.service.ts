import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { User } from 'src/app/models/user';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

/**
 * EmailVerificationService
 * 
 * Maneja la verificación de email y cambios de email.
 */
@Injectable({
    providedIn: 'root'
})
export class EmailVerificationService {
    private pendingEmailPolls: Map<string, { timerId: any; attempts: number }> = new Map();

    constructor(
        private afAuth: AngularFireAuth,
        private firestore: AngularFirestore
    ) { }

    /**
     * Verificar si el correo del usuario actual está verificado
     */
    async isEmailVerified(): Promise<boolean> {
        const user = await this.afAuth.currentUser;
        await user?.reload();
        return user?.emailVerified || false;
    }

    /**
     * Reenviar el correo de verificación
     */
    async sendVerificationEmail(): Promise<void> {
        const user = await this.afAuth.currentUser;
        if (user) {
            await user.sendEmailVerification();
        } else {
            throw new Error('No hay usuario autenticado para enviar el correo de verificación.');
        }
    }

    /**
     * Cambio seguro de email con re-autenticación
     */
    async requestSecureEmailUpdate(currentPassword: string, newEmail: string): Promise<void> {
        const user = await this.afAuth.currentUser;
        if (!user) {
            throw new Error('No hay usuario autenticado');
        }

        // Paso 1: Verificar que el nuevo email no esté en uso
        const emailExists = await this.checkEmailExists(newEmail);
        if (emailExists) {
            throw new Error('El correo electrónico ya está registrado en otra cuenta.');
        }

        // Paso 2: Intentar enviar verificación directamente
        try {
            console.log('Intentando enviar verificación a:', newEmail);
            await user.verifyBeforeUpdateEmail(newEmail);
            console.log('✅ Email de verificación enviado exitosamente');

            // Si llega aquí, funcionó - guardar estado pendiente
            const currentUserData = await this.getCurrentUser();
            if (currentUserData) {
                await this.firestore.collection('users').doc(currentUserData.uid).update({
                    pendingEmail: newEmail,
                    pendingEmailRequestedAt: new Date(),
                    emailChangeToken: this.generateSecureToken()
                });
                console.log('✅ Estado pendiente guardado en Firestore');
            }
        } catch (error: any) {
            console.error('Error al intentar cambiar email:', error);

            // Si requiere re-autenticación, intentarlo
            if (error.code === 'auth/requires-recent-login') {
                console.log('Se requiere re-autenticación...');
                try {
                    await this.reauthenticate(currentPassword);
                    // Reintentar después de re-autenticar
                    await user.verifyBeforeUpdateEmail(newEmail);

                    // Guardar estado pendiente
                    const currentUserData = await this.getCurrentUser();
                    if (currentUserData) {
                        await this.firestore.collection('users').doc(currentUserData.uid).update({
                            pendingEmail: newEmail,
                            pendingEmailRequestedAt: new Date(),
                            emailChangeToken: this.generateSecureToken()
                        });
                    }
                } catch (reAuthError: any) {
                    console.error('Error en re-autenticación:', reAuthError);
                    if (reAuthError.code === 'auth/wrong-password' || reAuthError.code === 'auth/invalid-credential') {
                        throw new Error('Contraseña incorrecta. Verifícala e intenta de nuevo.');
                    } else if (reAuthError.code === 'auth/network-request-failed') {
                        throw new Error('Error de conexión. Verifica tu internet e intenta de nuevo.');
                    } else if (reAuthError.code === 'auth/too-many-requests') {
                        throw new Error('Demasiados intentos. Espera unos minutos.');
                    } else {
                        throw new Error(reAuthError.message || 'Error al cambiar email.');
                    }
                }
            } else if (error.code === 'auth/email-already-in-use') {
                throw new Error('El nuevo correo electrónico ya está en uso.');
            } else if (error.code === 'auth/network-request-failed') {
                throw new Error('Error de conexión. Verifica tu internet e intenta de nuevo.');
            } else if (error.code === 'auth/invalid-email') {
                throw new Error('El formato del email no es válido.');
            } else {
                throw new Error(error.message || 'No se pudo enviar el correo de verificación.');
            }
        }
    }

    /**
     * Confirmar cambio de email después de verificación
     */
    async confirmEmailUpdate(): Promise<void> {
        const user = await this.afAuth.currentUser;
        if (!user) {
            throw new Error('No hay usuario autenticado');
        }

        const currentUserData = await this.getCurrentUser();
        if (!currentUserData) {
            throw new Error('No se pudo obtener los datos del usuario');
        }

        if (!currentUserData.pendingEmail) {
            throw new Error('No hay cambio de email pendiente');
        }

        await user.reload();
        if (user.email === currentUserData.pendingEmail && user.emailVerified) {
            await this.firestore.collection('users').doc(currentUserData.uid).update({
                email: user.email,
                pendingEmail: null,
                pendingEmailRequestedAt: null,
                emailChangeToken: null,
                emailUpdatedAt: new Date()
            });
        } else {
            throw new Error('El nuevo email aún no ha sido verificado');
        }
    }

    /**
     * Cancelar cambio de email pendiente
     */
    async cancelEmailUpdate(): Promise<void> {
        const currentUserData = await this.getCurrentUser();
        if (!currentUserData) {
            throw new Error('No se pudo obtener los datos del usuario');
        }

        if (!currentUserData.pendingEmail) {
            throw new Error('No hay cambio de email pendiente para cancelar');
        }

        await this.firestore.collection('users').doc(currentUserData.uid).update({
            pendingEmail: null,
            pendingEmailRequestedAt: null,
            emailChangeToken: null
        });
    }

    /**
     * Método legacy para cambio de email (mantener compatibilidad)
     */
    async requestEmailUpdate(newEmail: string): Promise<void> {
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

    /**
     * Limpiar emails pendientes expirados
     */
    async cleanupExpiredEmailChanges(): Promise<void> {
        const expiredTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

        try {
            const expiredQuery = this.firestore.collection('users', ref =>
                ref.where('pendingEmailRequestedAt', '<', expiredTime)
            );

            const expiredDocs = await expiredQuery.get().toPromise();

            if (expiredDocs && !expiredDocs.empty) {
                const batch = this.firestore.firestore.batch();
                expiredDocs.docs.forEach(doc => {
                    batch.update(doc.ref, {
                        pendingEmail: null,
                        pendingEmailRequestedAt: null,
                        emailChangeToken: null
                    });
                });

                await batch.commit();
            }
        } catch (error) {
            console.error('Error limpiando emails expirados:', error);
        }
    }

    /**
     * Sincronizar email de usuario con Firebase
     */
    async syncUserEmailWithFirebase(): Promise<void> {
        const firebaseUser = await this.afAuth.currentUser;
        if (!firebaseUser || !firebaseUser.email) {
            return;
        }

        const firestoreUser = await this.getUserData(firebaseUser.uid);
        if (firestoreUser && firestoreUser.email !== firebaseUser.email) {
            await this.firestore.collection('users').doc(firebaseUser.uid).update({
                email: firebaseUser.email
            });
        }
    }

    /**
     * Verificar si un email existe
     */
    async checkEmailExists(email: string): Promise<boolean> {
        try {
            const methods = await this.afAuth.fetchSignInMethodsForEmail(email);
            return methods.length > 0;
        } catch (error) {
            console.warn('Error verificando existencia de email:', error);
            return false;
        }
    }

    /**
     * Iniciar sondeo de email pendiente
     */
    startPendingEmailPoll(uid: string, pendingEmail: string): void {
        if (this.pendingEmailPolls.has(uid)) return;

        const maxAttempts = 30;
        const intervalMs = 10000;
        const entry = { timerId: null as any, attempts: 0 };
        this.pendingEmailPolls.set(uid, entry);

        entry.timerId = setInterval(async () => {
            try {
                entry.attempts += 1;
                const firebaseUser = await this.afAuth.currentUser;
                if (!firebaseUser) return;
                await firebaseUser.reload();
                const email = firebaseUser.email;
                if (email === pendingEmail) {
                    await this.firestore.collection('users').doc(uid).update({
                        email: pendingEmail,
                        pendingEmail: null,
                        pendingEmailRequestedAt: null
                    });
                    this.stopPendingEmailPoll(uid);
                } else if (entry.attempts >= maxAttempts) {
                    this.stopPendingEmailPoll(uid);
                }
            } catch (e) {
                console.warn('Error al sondear para finalización de pendingEmail:', e);
                if (entry.attempts >= maxAttempts) this.stopPendingEmailPoll(uid);
            }
        }, intervalMs);
    }

    /**
     * Detener sondeo de email pendiente
     */
    stopPendingEmailPoll(uid: string): void {
        const entry = this.pendingEmailPolls.get(uid);
        if (!entry) return;
        clearInterval(entry.timerId);
        this.pendingEmailPolls.delete(uid);
    }

    // --- Métodos privados auxiliares ---

    private generateSecureToken(): string {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    private async reauthenticate(password: string): Promise<any> {
        const user = await this.afAuth.currentUser;
        if (!user || !user.email) {
            throw new Error('No hay usuario autenticado para re-autenticar.');
        }

        // Usar signIn en lugar de reauthenticate (más confiable con redes inestables)
        return await this.afAuth.signInWithEmailAndPassword(user.email, password);
    }

    private async getCurrentUser(): Promise<User | null> {
        const user = await this.afAuth.currentUser;
        if (!user) return null;
        return this.getUserData(user.uid);
    }

    private async getUserData(uid: string): Promise<User | null> {
        const userDoc = await this.firestore.collection('users').doc(uid).get().toPromise();
        return userDoc && userDoc.exists ? (userDoc.data() as User) : null;
    }
}
