import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { ToastService } from './toast.service';
import { AdoptionService } from './adoption.service';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService,
    private adoptionService: AdoptionService
  ) {}

  async login(identifier: string, password: string, keepSession: boolean): Promise<void> {
    console.log('LoginService.login called');
    if (!identifier || !password) {
      await this.toastService.presentToast('Por favor, introduce tu correo y contraseña.', 'warning', 'alert-outline');
      return;
    }

    try {
      const trimmedIdentifier = identifier.trim();
      console.log('Calling authService.login');
      await this.authService.login(trimmedIdentifier, password, keepSession);
      console.log('authService.login successful');
      const isEmailVerified = await this.authService.isEmailVerified();

      if (!isEmailVerified) {
        await this.toastService.presentToast('¡Casi listo! Revisa tu email para verificar tu cuenta.', 'warning', 'mail-unread-outline');
        this.router.navigate(['/verificacion-pendiente']);
        return;
      }

      this.router.navigate(['/home']);
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
      console.error('Error in LoginService.login:', error);
      if (error.code === 'auth/user-blocked') {
        await this.toastService.presentToast('Tu cuenta ha sido bloqueada. Por favor, contacta con el soporte.', 'danger', 'lock-closed-outline');
      } else {
        await this.toastService.presentToast('¡Uy! Parece que la contraseña o el correo no son correctos. ¿Intentamos de nuevo?', 'danger', 'alert-circle-outline');
      }
    }
  }

  navigateToResetPassword() {
    this.router.navigate(['/restablecer']);
  }

  navigateToRegister() {
    this.router.navigate(['/registro']);
  }
}
