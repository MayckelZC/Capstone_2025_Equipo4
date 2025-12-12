import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

@Injectable({
  providedIn: 'root'
})
export class SmsService {
  private verificationId: string | null = null;
  private recaptchaVerifier: any = null;

  constructor(private afAuth: AngularFireAuth) {}

  /**
   * Inicializa el reCAPTCHA para verificación SMS
   * @param containerId ID del contenedor donde se mostrará el reCAPTCHA
   */
  initializeRecaptcha(containerId: string): void {
    if (!this.recaptchaVerifier) {
      this.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(containerId, {
        size: 'invisible', // Puede ser 'normal', 'compact', o 'invisible'
        callback: (response: any) => {
                  },
        'expired-callback': () => {
                  }
      });
    }
  }

  /**
   * Envía un código OTP al número de teléfono especificado
   * @param phoneNumber Número de teléfono en formato internacional (+57...)
   */
  async sendOTP(phoneNumber: string): Promise<void> {
    if (!this.recaptchaVerifier) {
      throw new Error('reCAPTCHA no inicializado. Llama a initializeRecaptcha() primero.');
    }

    try {
      const provider = new firebase.auth.PhoneAuthProvider();
      this.verificationId = await provider.verifyPhoneNumber(phoneNumber, this.recaptchaVerifier);
          } catch (error: any) {
      console.error('Error enviando SMS:', error);
      this.handleSMSError(error);
    }
  }

  /**
   * Verifica el código OTP ingresado por el usuario
   * @param otpCode Código de 6 dígitos ingresado por el usuario
   */
  async verifyOTP(otpCode: string): Promise<boolean> {
    if (!this.verificationId) {
      throw new Error('No hay verificación SMS en curso. Envía un OTP primero.');
    }

    try {
      const credential = firebase.auth.PhoneAuthProvider.credential(this.verificationId, otpCode);
      
      // Solo verificamos el credential sin iniciar sesión
      // porque solo queremos verificar que el usuario controla el teléfono
      const user = await this.afAuth.currentUser;
      if (user) {
        await user.linkWithCredential(credential);
        // Inmediatamente desvinculamos para no cambiar el método de autenticación
        await user.unlink(firebase.auth.PhoneAuthProvider.PROVIDER_ID);
      }
      
      return true;
    } catch (error: any) {
      console.error('Error verificando OTP:', error);
      
      if (error.code === 'auth/invalid-verification-code') {
        throw new Error('Código de verificación inválido. Verifica e intenta de nuevo.');
      } else if (error.code === 'auth/code-expired') {
        throw new Error('El código ha expirado. Solicita un nuevo código.');
      } else if (error.code === 'auth/credential-already-in-use') {
        // Si ya está en uso, significa que la verificación fue exitosa
        return true;
      } else if (error.code === 'auth/provider-already-linked') {
        // Si ya está vinculado, desvinculamos y continuamos
        const user = await this.afAuth.currentUser;
        if (user) {
          try {
            await user.unlink(firebase.auth.PhoneAuthProvider.PROVIDER_ID);
          } catch (unlinkError) {
                      }
        }
        return true;
      } else {
        throw new Error('Error verificando el código. Intenta de nuevo.');
      }
    }
  }

  /**
   * Resetea el estado de verificación SMS
   */
  resetVerification(): void {
    this.verificationId = null;
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = null;
    }
  }

  /**
   * Maneja errores específicos del envío de SMS
   */
  private handleSMSError(error: any): void {
    let errorMessage: string;

    switch (error.code) {
      case 'auth/invalid-phone-number':
        errorMessage = 'Número de teléfono inválido. Usa el formato +57XXXXXXXXX';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Demasiados intentos. Espera unos minutos antes de intentar de nuevo.';
        break;
      case 'auth/quota-exceeded':
        errorMessage = 'Se ha excedido el límite de SMS diarios. Intenta mañana.';
        break;
      case 'auth/missing-phone-number':
        errorMessage = 'Número de teléfono requerido.';
        break;
      case 'auth/captcha-check-failed':
        errorMessage = 'Verificación reCAPTCHA fallida. Intenta de nuevo.';
        break;
      default:
        errorMessage = error.message || 'Error enviando código SMS. Intenta de nuevo.';
        break;
    }

    throw new Error(errorMessage);
  }

  /**
   * Formatea un número de teléfono colombiano al formato internacional
   * @param phoneNumber Número ingresado por el usuario
   * @returns Número en formato internacional (+57...)
   */
  formatColombianPhoneNumber(phoneNumber: string): string {
    // Remover espacios, guiones y otros caracteres
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Si ya tiene código de país, retornarlo
    if (cleaned.startsWith('+57')) {
      return cleaned;
    }
    
    // Si empieza con 57, agregar +
    if (cleaned.startsWith('57') && cleaned.length === 12) {
      return '+' + cleaned;
    }
    
    // Si es un número local de 10 dígitos, agregar +57
    if (cleaned.length === 10) {
      return '+57' + cleaned;
    }
    
    throw new Error('Formato de número inválido. Use el formato: 3001234567 o +573001234567');
  }

  /**
   * Valida si un número de teléfono tiene el formato correcto
   */
  isValidPhoneNumber(phoneNumber: string): boolean {
    try {
      this.formatColombianPhoneNumber(phoneNumber);
      return true;
    } catch {
      return false;
    }
  }
}