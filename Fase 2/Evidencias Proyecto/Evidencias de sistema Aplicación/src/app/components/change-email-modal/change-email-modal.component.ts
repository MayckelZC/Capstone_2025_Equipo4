import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@shared/services/toast.service';

@Component({
  selector: 'app-change-email-modal',
  templateUrl: './change-email-modal.component.html',
  styleUrls: ['./change-email-modal.component.scss'],
})
export class ChangeEmailModalComponent implements OnInit {
  emailForm!: FormGroup;
  loading = false;
  step: 'input' | 'verification' | 'success' = 'input';
  newEmail = '';
  showPassword = false;
  lastError: string = '';
  retryCount = 0;
  maxRetries = 3;

  constructor(
    private fb: FormBuilder,
    private modalController: ModalController,
    private authService: AuthService,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.emailForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newEmail: ['', [Validators.required, Validators.email]],
      confirmEmail: ['', [Validators.required]]
    }, { validators: this.emailMatchValidator });

    // Limpiar errores cuando el usuario empiece a escribir
    this.currentPassword?.valueChanges.subscribe(() => {
      if (this.currentPassword?.hasError('incorrect')) {
        this.currentPassword.setErrors(
          this.currentPassword.hasError('required') || this.currentPassword.hasError('minlength') ?
            { required: true } : null
        );
      }
      this.lastError = '';
    });

    // También limpiar errores al cambiar el email
    this.newEmailControl?.valueChanges.subscribe(() => {
      if (this.lastError === 'email-exists') {
        this.lastError = '';
      }
    });
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
    const { currentPassword, newEmail } = this.emailForm.value;
    this.newEmail = newEmail;

    try {
      // Llamar directamente al servicio que hace re-autenticación + envío de email
      await this.authService.requestSecureEmailUpdate(currentPassword, newEmail);

      // Ir directamente al paso de verificación de email
      this.step = 'verification';
      this.retryCount = 0;

      this.toastService.presentToast(
        `Se envió un correo de verificación a ${newEmail}`,
        'success',
        'mail-outline'
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
    } else if (errorMessage.includes('Contraseña') || errorMessage.includes('incorrecta')) {
      this.lastError = 'password';
      this.currentPassword?.setErrors({ incorrect: true });
    } else if (errorMessage.includes('ya está registrado') || errorMessage.includes('ya está en uso')) {
      this.lastError = 'email-exists';
      errorIcon = 'person-outline';
    } else {
      this.lastError = 'general';
    }

    this.toastService.presentToast(errorMessage, errorColor, errorIcon);
  }

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

  // Getters para facilitar acceso a controles del formulario
  get currentPassword() { return this.emailForm.get('currentPassword'); }
  get newEmailControl() { return this.emailForm.get('newEmail'); }
  get confirmEmail() { return this.emailForm.get('confirmEmail'); }
}