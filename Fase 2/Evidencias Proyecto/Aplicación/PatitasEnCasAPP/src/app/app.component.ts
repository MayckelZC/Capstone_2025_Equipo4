import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { AlertController, MenuController } from '@ionic/angular';
import { Observable, firstValueFrom, of, combineLatest } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { User } from './models/user';
import { RealTimeNotificationService } from './services/real-time-notification.service';
import { NotificationService } from './services/notification.service';
import { AdoptionService } from './services/adoption.service';
import { AppointmentService } from './services/appointment.service';
import { ThemeService } from './services/theme.service';

interface MenuStats {
  unreadNotifications: number;
  pendingOwnerRequests: number;
  pendingApplicantRequests: number;
  upcomingAppointments: number;
  nextAction: string;
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  user$: Observable<User | null>;
  selectedPath = '';
  isAuthenticated$: Observable<boolean>;
   menuStats$: Observable<MenuStats>;
  private readonly emptyStats: MenuStats = {
    unreadNotifications: 0,
    pendingOwnerRequests: 0,
    pendingApplicantRequests: 0,
    upcomingAppointments: 0,
    nextAction: 'Estás al día. Explora nuevas mascotas o crea una publicación.'
  };
  private readonly publicPaths = ['/login', '/registro', '/restablecer', '/home'];

  constructor(
    private router: Router, 
    private authService: AuthService,
    private menu: MenuController,
    private alertController: AlertController,
    private realTimeNotificationService: RealTimeNotificationService,
    private notificationService: NotificationService,
    private adoptionService: AdoptionService,
    private appointmentService: AppointmentService,
    private themeService: ThemeService
  ) {
    this.initializeApp();
    this.user$ = this.authService.user$;
    this.isAuthenticated$ = this.authService.isAuthenticated();
    this.router.events.subscribe((event: any) => {
      if (event.url) {
        this.selectedPath = event.url;
      }
    });
    this.realTimeNotificationService.init();
    this.menuStats$ = this.buildMenuStatsStream();
    // Ensure the theme service initializes the stored/system preference even without UI controls
    this.themeService.getCurrentPreference();
  }

  initializeApp() {
    this.authService.isAuthenticated().subscribe(isAuth => {
      const currentPath = this.router.url?.split('?')[0] || '/';
      if (isAuth) {
        this.authService.syncUserEmailWithFirebase();
        if (currentPath === '/' || currentPath === '/login') {
          this.router.navigate(['/home']);
        }
      } else {
        if (!this.publicPaths.includes(currentPath)) {
          this.router.navigate(['/home']);
        }
      }
    });
  }

  async navigateTo(path: string) {
    await this.menu.close();
    this.router.navigate([path]);
  }

  isSelected(path: string): boolean {
    return this.selectedPath === path;
  }

  async goToProfile() {
    const user = await firstValueFrom(this.user$);
    if (user && user.uid) {
      this.navigateTo(`/perfil/${user.uid}`);
    } else {
      console.error('No se pudo navegar al perfil: usuario no disponible o sin UID.');
    }
  }

  async logout() {
    await this.menu.close();
    const alert = await this.alertController.create({
      header: 'Confirmar cierre de sesión',
      message: '¿Estás seguro de que quieres cerrar sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Aceptar',
          handler: async () => {
            await this.authService.logout();
            this.router.navigate(['/login']);
          },
        },
      ],
    });

    await alert.present();
  }

  private buildMenuStatsStream(): Observable<MenuStats> {
    return this.user$.pipe(
      switchMap(user => {
        if (!user) {
          return of(this.emptyStats);
        }

        return combineLatest([
          this.notificationService.getUnreadCount(user.uid),
          this.adoptionService.getPendingRequestsForOwner(user.uid),
          this.adoptionService.getPendingRequestsForApplicant(user.uid),
          this.appointmentService.getUpcomingAppointmentsCount(user.uid)
        ]).pipe(
          map(([unread, ownerPending, applicantPending, appointments]) => {
            const stats: MenuStats = {
              unreadNotifications: unread || 0,
              pendingOwnerRequests: ownerPending || 0,
              pendingApplicantRequests: applicantPending || 0,
              upcomingAppointments: appointments || 0,
              nextAction: this.getNextActionMessage(unread || 0, ownerPending || 0, applicantPending || 0, appointments || 0)
            };
            return stats;
          })
        );
      }),
      shareReplay(1)
    );
  }

  private getNextActionMessage(unread: number, ownerPending: number, applicantPending: number, appointments: number): string {
    if (ownerPending > 0) {
      return `Tienes ${ownerPending} solicitud${ownerPending === 1 ? '' : 'es'} por revisar`;
    }
    if (applicantPending > 0) {
      return `Revisa el estado de tus ${applicantPending} solicitud${applicantPending === 1 ? '' : 'es'} enviadas`;
    }
    if (unread > 0) {
      return `Tienes ${unread} notificación${unread === 1 ? '' : 'es'} sin leer`;
    }
    if (appointments > 0) {
      return `Próxima cita confirmada (${appointments})`;
    }
    return this.emptyStats.nextAction;
  }
}
