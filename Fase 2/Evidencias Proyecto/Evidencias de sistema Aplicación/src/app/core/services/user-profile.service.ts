import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { User } from 'src/app/models/user';

/**
 * UserProfileService
 * 
 * Maneja la gestión de datos de perfil de usuario.
 */
@Injectable({
    providedIn: 'root'
})
export class UserProfileService {

    constructor(
        private afAuth: AngularFireAuth,
        private firestore: AngularFirestore
    ) { }

    /**
     * Obtener los datos del usuario por UID
     */
    async getUserData(uid: string): Promise<User | null> {
        const userDoc = await this.firestore.collection('users').doc(uid).get().toPromise();
        return userDoc && userDoc.exists ? (userDoc.data() as User) : null;
    }

    /**
     * Obtener el usuario actualmente autenticado
     */
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

    /**
     * Obtener el correo electrónico del usuario actualmente autenticado
     */
    async getCurrentUserEmail(): Promise<string | null> {
        const user = await this.afAuth.currentUser;
        return user?.email || null;
    }

    /**
     * Actualizar el perfil de usuario
     */
    async updateUserProfile(uid: string, data: Partial<User>): Promise<void> {
        return this.firestore.collection('users').doc(uid).update(data);
    }

    /**
     * Obtener información de usuario por ID
     */
    async getUserById(userId: string): Promise<User | null> {
        try {
            const userDoc = await this.firestore.collection('users').doc(userId).get().toPromise();
            return userDoc && userDoc.exists ? userDoc.data() as User : null;
        } catch (error) {
            console.error('Error obteniendo usuario por ID:', error);
            return null;
        }
    }

    /**
     * Verificar si un nombre de usuario existe
     */
    async checkUsernameExists(username: string): Promise<boolean> {
        try {
            const snapshot = await this.firestore.collection('users', ref => ref.where('nombreUsuario', '==', username)).get().toPromise();
            return snapshot ? !snapshot.empty : false;
        } catch (error) {
            console.error('Error verificando existencia de usuario:', error);
            return false;
        }
    }
}
