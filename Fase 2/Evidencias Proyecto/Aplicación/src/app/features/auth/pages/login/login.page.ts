import { Component } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { LoggerService } from '@core/services/logger.service';
import { Router } from '@angular/router';
import { ToastService } from '@shared/services/toast.service';
import { AdoptionService } from '@features/adoption/services/adoption.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  identifier: string = ''; // Almacena el correo electrónico o nombre de usuario
  password: string = ''; // Almacena la contraseña
  keepSession: boolean = false; // Variable para mantener la sesión iniciada
  loading: boolean = false; // Indicador de carga

  passwordType: string = 'password'; // Controla el tipo de input de la contraseña
  passwordToggleIcon: string = 'eye-off'; // Controla el icono de visibilidad de la contraseña

  constructor(
    private authService: AuthService,
    private logger: LoggerService,
    private router: Router,
    private toastService: ToastService,
    private adoptionService: AdoptionService
  ) { }

  async login() {
    this.loading = true; // Activar el indicador de carga

    if (!this.identifier || !this.password) {
      await this.toastService.presentToast('Por favor, introduce tu correo y contraseña.', 'warning', 'alert-outline');
      this.loading = false;
      return;
    }

    try {
      const trimmedIdentifier = this.identifier.trim();
      await this.authService.login(trimmedIdentifier, this.password, this.keepSession);

      const isEmailVerified = await this.authService.isEmailVerified();

      if (!isEmailVerified) {
        await this.toastService.presentToast('¡Casi listo! Revisa tu email para verificar tu cuenta.', 'warning', 'mail-unread-outline');
        this.router.navigate(['/auth/verificacion-pendiente']);
        return;
      }

      this.router.navigate(['/pets/home']);
      await this.toastService.presentToast('¡Bienvenido de vuelta!', 'success', 'person-circle-outline');

      // Check for pending requests
      const currentUser = await this.authService.getCurrentUser();
      if (currentUser) {
        this.adoptionService.getRequestsForUser(currentUser.uid).pipe(
          take(1)
        ).subscribe(requests => {
          const pendingRequests = requests.filter(r => r.status === 'pending');
          if (pendingRequests.length > 0) {
            this.toastService.presentToast(`Tienes ${pendingRequests.length} solicitudes de adopción pendientes.`, 'warning', 'alert-circle-outline');
          }
        });
      }
    } catch (error: any) {
      this.logger.error('Error in login:', error);
      if (error.code === 'auth/user-blocked') {
        await this.toastService.presentToast('Tu cuenta ha sido bloqueada. Por favor, contacta con el soporte.', 'danger', 'lock-closed-outline');
      } else {
        await this.toastService.presentToast('¡Uy! Parece que la contraseña o el correo no son correctos. ¿Intentamos de nuevo?', 'danger', 'alert-circle-outline');
      }
    } finally {
      this.loading = false; // Desactivar el indicador de carga
    }
  }

  navigateToResetPassword() {
    this.router.navigate(['/auth/restablecer']);
  }

  register() {
    this.router.navigate(['/auth/registro']);
  }

  togglePasswordVisibility() {
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
    this.passwordToggleIcon = this.passwordToggleIcon === 'eye-off' ? 'eye' : 'eye-off';
  }
}
