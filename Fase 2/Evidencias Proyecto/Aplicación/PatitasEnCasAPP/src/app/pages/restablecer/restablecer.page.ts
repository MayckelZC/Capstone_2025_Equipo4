import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { LoadingController } from '@ionic/angular';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-restablecer',
  templateUrl: './restablecer.page.html',
  styleUrls: ['./restablecer.page.scss'],
})
export class RestablecerPage {
  email: string = '';
  loading: boolean = false;
  emailSent: boolean = false;

  constructor(
    private authService: AuthService,
    private loadingController: LoadingController,
    private toastService: ToastService
  ) {}

  async onSubmit() {
    if (!this.email || !this.isValidEmail(this.email)) {
      await this.toastService.presentToast('Por favor, introduce un correo válido.', 'warning', 'alert-outline');
      return;
    }

    this.loading = true;
    try {
      await this.authService.resetPassword(this.email);
      this.emailSent = true;
      await this.toastService.presentToast('¡Ayuda en camino! Revisa tu correo para crear una nueva contraseña.', 'success', 'mail-outline');
      
      // Hide success animation after 3 seconds
      setTimeout(() => {
        this.emailSent = false;
        this.email = '';
      }, 3000);
    } catch (error) {
      await this.toastService.presentToast('No encontramos una cuenta con ese correo. ¿Lo has escrito bien?', 'danger', 'alert-circle-outline');
    } finally {
      this.loading = false;
    }
  }

  public isValidEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailPattern.test(email);
  }
}