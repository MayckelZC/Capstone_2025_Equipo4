import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from 'src/app/models/user';
import { Adopcion } from 'src/app/models/Adopcion';
import firebase from 'firebase/compat/app';

// Importar servicios especializados
import { AuthenticationService } from './authentication.service';
import { EmailVerificationService } from './email-verification.service';
import { UserProfileService } from './user-profile.service';

/**
 * AuthService - Fachada
 * 
 * Este servicio actúa como fachada para mantener compatibilidad retroactiva.
 * Delega todas las operaciones a los servicios especializados:
 * - AuthenticationService: login, logout, registro, sesión
 * - EmailVerificationService: verificación y cambio de email
 * - UserProfileService: gestión de perfil de usuario
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /**
   * Observable del usuario actual - delegado a AuthenticationService
   */
  public get user$(): Observable<User | null> {
    return this.authenticationService.user$;
  }

  constructor(
    private authenticationService: AuthenticationService,
    private emailVerificationService: EmailVerificationService,
    private userProfileService: UserProfileService
  ) { }

  // =====================================================
  // AUTHENTICATION SERVICE - Delegaciones
  // =====================================================

  /**
   * Registrar un nuevo usuario
   */
  registerUser(
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
    return this.authenticationService.registerUser(
      nombreCompleto, nombreUsuario, email, password,
      telefono, direccion, selectedImageFile, region, ciudad
    );
  }

  /**
   * Registrar usuario por administrador
   */
  registerUserByAdmin(
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
    return this.authenticationService.registerUserByAdmin(
      nombreCompleto, nombreUsuario, email, password,
      telefono, direccion, isAdmin, isBlocked, isOrganization, isVeterinarian
    );
  }

  /**
   * Iniciar sesión
   */
  login(identifier: string, password: string, keepSession: boolean): Promise<any> {
    return this.authenticationService.login(identifier, password, keepSession);
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): Observable<boolean> {
    return this.authenticationService.isAuthenticated();
  }

  /**
   * Cerrar sesión
   */
  logout(): Promise<void> {
    return this.authenticationService.logout();
  }

  /**
   * Restablecer contraseña
   */
  resetPassword(email: string): Promise<void> {
    return this.authenticationService.resetPassword(email);
  }

  /**
   * Re-autenticar usuario
   */
  reauthenticate(password: string): Promise<any> {
    return this.authenticationService.reauthenticate(password);
  }

  /**
   * Obtener usuario de Firebase actual
   */
  getCurrentFirebaseUser(): Promise<firebase.User | null> {
    return this.authenticationService.getCurrentFirebaseUser();
  }

  // =====================================================
  // EMAIL VERIFICATION SERVICE - Delegaciones
  // =====================================================

  /**
   * Verificar si el email está verificado
   */
  isEmailVerified(): Promise<boolean> {
    return this.emailVerificationService.isEmailVerified();
  }

  /**
   * Enviar correo de verificación
   */
  sendVerificationEmail(): Promise<void> {
    return this.emailVerificationService.sendVerificationEmail();
  }

  /**
   * Solicitar cambio de email seguro
   */
  requestSecureEmailUpdate(currentPassword: string, newEmail: string): Promise<void> {
    return this.emailVerificationService.requestSecureEmailUpdate(currentPassword, newEmail);
  }

  /**
   * Confirmar cambio de email
   */
  confirmEmailUpdate(): Promise<void> {
    return this.emailVerificationService.confirmEmailUpdate();
  }

  /**
   * Cancelar cambio de email
   */
  cancelEmailUpdate(): Promise<void> {
    return this.emailVerificationService.cancelEmailUpdate();
  }

  /**
   * Solicitar cambio de email (legacy)
   */
  requestEmailUpdate(newEmail: string): Promise<void> {
    return this.emailVerificationService.requestEmailUpdate(newEmail);
  }

  /**
   * Limpiar cambios de email expirados
   */
  cleanupExpiredEmailChanges(): Promise<void> {
    return this.emailVerificationService.cleanupExpiredEmailChanges();
  }

  /**
   * Sincronizar email con Firebase
   */
  syncUserEmailWithFirebase(): Promise<void> {
    return this.emailVerificationService.syncUserEmailWithFirebase();
  }

  /**
   * Verificar si un email existe
   */
  checkEmailExists(email: string): Promise<boolean> {
    return this.emailVerificationService.checkEmailExists(email);
  }

  // =====================================================
  // USER PROFILE SERVICE - Delegaciones
  // =====================================================

  /**
   * Obtener datos del usuario por UID
   */
  getUserData(uid: string): Promise<User | null> {
    return this.userProfileService.getUserData(uid);
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): Promise<User | null> {
    return this.userProfileService.getCurrentUser();
  }

  /**
   * Obtener email del usuario actual
   */
  getCurrentUserEmail(): Promise<string | null> {
    return this.userProfileService.getCurrentUserEmail();
  }

  /**
   * Actualizar perfil de usuario
   */
  updateUserProfile(uid: string, data: Partial<User>): Promise<void> {
    return this.userProfileService.updateUserProfile(uid, data);
  }

  /**
   * Obtener usuario por ID
   */
  getUserById(userId: string): Promise<User | null> {
    return this.userProfileService.getUserById(userId);
  }

  /**
   * Verificar si un nombre de usuario existe
   */
  checkUsernameExists(username: string): Promise<boolean> {
    return this.userProfileService.checkUsernameExists(username);
  }
}
