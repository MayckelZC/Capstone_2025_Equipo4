import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { ToastController } from '@ionic/angular';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-verificacion-pendiente',
  templateUrl: './verificacion-pendiente.page.html',
  styleUrls: ['./verificacion-pendiente.page.scss'],
})
export class VerificacionPendientePage implements OnInit, OnDestroy {
  userEmail: string | null = null;
  private checkVerificationSubscription: Subscription | undefined;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) { }

  async ngOnInit() {
    this.userEmail = await this.authService.getCurrentUserEmail();

    // Start checking verification status periodically
    this.checkVerificationSubscription = interval(5000).subscribe(async () => {
      const isVerified = await this.authService.isEmailVerified();
      if (isVerified) {
        await this.showToast('¡Correo verificado exitosamente!');
        if (this.checkVerificationSubscription) {
          this.checkVerificationSubscription.unsubscribe();
        }
        this.router.navigate(['/home']);
      }
    });
  }

  ngOnDestroy() {
    if (this.checkVerificationSubscription) {
      this.checkVerificationSubscription.unsubscribe();
    }
  }

  async resendVerificationEmail() {
    try {
      await this.authService.sendVerificationEmail();
      await this.showToast('Correo de verificación reenviado. Revisa tu bandeja de entrada.');
    } catch (error) {
      console.error('Error al reenviar correo de verificación:', error);
      await this.showToast('Error al reenviar el correo de verificación. Inténtalo de nuevo más tarde.');
    }
  }

  async goToLogin() {
    await this.authService.logout(); // Log out the user if they go back to login
    this.router.navigate(['/login']);
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
    });
    toast.present();
  }
}
