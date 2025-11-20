import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { SmsService } from '../../services/sms.service';

@Component({
  selector: 'app-change-email-modal',
  templateUrl: './change-email-modal.component.html',
  styleUrls: ['./change-email-modal.component.scss'],
})
export class ChangeEmailModalComponent implements OnInit, OnDestroy {
  emailForm!: FormGroup;
  otpForm!: FormGroup;
  loading = false;
  step: 'input' | 'sms' | 'verification' | 'success' = 'input';
  newEmail = '';
  formattedPhoneNumber = '';
  showPassword = false;
  lastError: string = '';
  retryCount = 0;
  maxRetries = 3;
  
  // SMS verification
  canResend = 0;
  private resendTimer: any;

  constructor(
    private fb: FormBuilder,
    private modalController: ModalController,
    private authService: AuthService,
    private toastService: ToastService,
    private smsService: SmsService
  ) { }

  ngOnInit() {
    this.emailForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newEmail: ['', [Validators.required, Validators.email]],
      confirmEmail: ['', [Validators.required]],
      phoneNumber: ['', [Validators.required, this.phoneValidator.bind(this)]]
    }, { validators: this.emailMatchValidator });

    this.otpForm = this.fb.group({
      otpCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });

    // Limpiar errores cuando el usuario empiece a escribir
    this.currentPassword?.valueChanges.subscribe(() => {
      if (this.currentPassword?.hasError('incorrect')) {
        this.currentPassword.setErrors(
          this.currentPassword.hasError('required') || this.currentPassword.hasError('minlength') ? 
          { required: true } : null
        );
      }
      this.lastError = ''; // Limpiar el último error
    });

    // También limpiar errores al cambiar el email
    this.newEmailControl?.valueChanges.subscribe(() => {
      if (this.lastError === 'email-exists') {
        this.lastError = '';
      }
    });
  }

  ngOnDestroy() {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
    }
    this.smsService.resetVerification();
  }

  // Validador personalizado para teléfono
  phoneValidator(control: any) {
    if (!control.value) return null;
    const isValid = this.smsService.isValidPhoneNumber(control.value);
    return isValid ? null : { invalidPhone: true };
  }

  // Validador personalizado para confirmar emails
  emailMatchValidator(group: FormGroup) {
    const newEmail = group.get('newEmail')?.value;
    const confirmEmail = group.get('confirmEmail')?.value;
    return newEmail === confirmEmail ? null : { emailMismatch: true };
  }

  async requestEmailChange() {
    if (!this.emailForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.lastError = '';
    const { currentPassword, newEmail, phoneNumber } = this.emailForm.value;
    this.newEmail = newEmail;

    try {
      // Paso 1: Validar credenciales (sin cambiar el email aún)
      await this.authService.reauthenticate(currentPassword);
      
      // Paso 2: Verificar que el email no esté en uso
      const emailExists = await this.authService.checkEmailExists(newEmail);
      if (emailExists) {
        throw new Error('El correo electrónico ya está registrado en otra cuenta.');
      }

      // Paso 3: Formatear y enviar SMS
      this.formattedPhoneNumber = this.smsService.formatColombianPhoneNumber(phoneNumber);
      
      // Inicializar reCAPTCHA
      this.smsService.initializeRecaptcha('recaptcha-container');
      
      // Enviar código SMS
      await this.smsService.sendOTP(this.formattedPhoneNumber);
      
      this.step = 'sms';
      this.startResendTimer();
      this.retryCount = 0;
      
      this.toastService.presentToast(
        `Código SMS enviado a ${this.formattedPhoneNumber}`,
        'success',
        'chatbox-outline'
      );
    } catch (error: any) {
      console.error('Error requesting email change:', error);
      this.handleRequestError(error);
    } finally {
      this.loading = false;
    }
  }

  private handleRequestError(error: any) {
    this.retryCount++;
    let errorMessage = error.message || 'Error al solicitar cambio de email';
    let errorIcon = 'alert-circle-outline';
    let errorColor: 'danger' | 'warning' = 'danger';

    // Categorizar el tipo de error
    if (errorMessage.includes('conexión') || errorMessage.includes('red') || errorMessage.includes('network')) {
      errorColor = 'warning';
      errorIcon = 'wifi-outline';
      this.lastError = 'network';
      
      if (this.retryCount < this.maxRetries) {
        errorMessage += ` (Intento ${this.retryCount}/${this.maxRetries})`;
      } else {
        errorMessage = 'Múltiples errores de conexión. Verifica tu internet y vuelve a intentar más tarde.';
      }
    } else if (errorMessage.includes('Contraseña')) {
      this.lastError = 'password';
      // Marcar el campo de contraseña como incorrecto
      this.currentPassword?.setErrors({ incorrect: true });
    } else if (errorMessage.includes('ya está registrado') || errorMessage.includes('ya está en uso')) {
      this.lastError = 'email-exists';
      errorIcon = 'person-outline';
    } else {
      this.lastError = 'general';
    }

    this.toastService.presentToast(errorMessage, errorColor, errorIcon);
  }

  // Método para reintentar la solicitud automáticamente en caso de errores de red
  async retryEmailChange() {
    if (this.retryCount < this.maxRetries && this.lastError === 'network') {
      await this.requestEmailChange();
    }
  }

  async checkVerificationStatus() {
    this.loading = true;
    try {
      await this.authService.confirmEmailUpdate();
      this.step = 'success';
      this.toastService.presentToast(
        '¡Email actualizado exitosamente!',
        'success',
        'checkmark-circle-outline'
      );
      
      // Auto-cerrar después de mostrar éxito
      setTimeout(() => {
        this.dismiss(true);
      }, 2000);
    } catch (error: any) {
      console.error('Error confirming email:', error);
      this.toastService.presentToast(
        error.message || 'El email aún no ha sido verificado. Por favor revisa tu correo.',
        'warning',
        'time-outline'
      );
    } finally {
      this.loading = false;
    }
  }

  async cancelEmailChange() {
    this.loading = true;
    try {
      await this.authService.cancelEmailUpdate();
      this.toastService.presentToast(
        'Cambio de email cancelado',
        'medium',
        'close-circle-outline'
      );
      this.dismiss(false);
    } catch (error: any) {
      console.error('Error canceling email change:', error);
      this.toastService.presentToast(
        error.message || 'Error al cancelar cambio de email',
        'danger',
        'alert-circle-outline'
      );
    } finally {
      this.loading = false;
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  private markFormGroupTouched() {
    Object.keys(this.emailForm.controls).forEach(field => {
      const control = this.emailForm.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }

  dismiss(success: boolean = false) {
    this.modalController.dismiss({ success });
  }

  // Nuevos métodos para SMS
  async verifyOTP() {
    if (!this.otpForm.valid) {
      this.otpCode?.markAsTouched();
      return;
    }

    this.loading = true;
    try {
      const otpCode = this.otpForm.get('otpCode')?.value;
      const isValid = await this.smsService.verifyOTP(otpCode);
      
      if (isValid) {
        // SMS verificado, ahora proceder con el cambio de email
        await this.authService.requestSecureEmailUpdate(
          this.emailForm.get('currentPassword')?.value,
          this.newEmail
        );
        
        this.step = 'verification';
        this.toastService.presentToast(
          `Verificación SMS exitosa. Se envió correo de verificación a ${this.newEmail}`,
          'success',
          'checkmark-circle-outline'
        );
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      this.toastService.presentToast(
        error.message || 'Código incorrecto. Intenta de nuevo.',
        'danger',
        'alert-circle-outline'
      );
    } finally {
      this.loading = false;
    }
  }

  async resendOTP() {
    if (this.canResend > 0) return;
    
    this.loading = true;
    try {
      await this.smsService.sendOTP(this.formattedPhoneNumber);
      this.startResendTimer();
      this.toastService.presentToast(
        'Código reenviado exitosamente',
        'success',
        'chatbox-outline'
      );
    } catch (error: any) {
      console.error('Error resending OTP:', error);
      this.toastService.presentToast(
        error.message || 'Error reenviando código',
        'danger',
        'alert-circle-outline'
      );
    } finally {
      this.loading = false;
    }
  }

  goBack() {
    this.step = 'input';
    this.smsService.resetVerification();
  }

  onPhoneNumberChange(event: any) {
    const value = event.target.value;
    // Opcional: formatear en tiempo real para mejor UX
    // Aquí podrías agregar formateo visual si lo deseas
  }

  private startResendTimer() {
    this.canResend = 60; // 60 segundos
    this.resendTimer = setInterval(() => {
      this.canResend--;
      if (this.canResend <= 0) {
        clearInterval(this.resendTimer);
      }
    }, 1000);
  }

  // Getters para facilitar acceso a controles del formulario
  get currentPassword() { return this.emailForm.get('currentPassword'); }
  get newEmailControl() { return this.emailForm.get('newEmail'); }
  get confirmEmail() { return this.emailForm.get('confirmEmail'); }
  get phoneNumberControl() { return this.emailForm.get('phoneNumber'); }
  get otpCode() { return this.otpForm.get('otpCode'); }
}