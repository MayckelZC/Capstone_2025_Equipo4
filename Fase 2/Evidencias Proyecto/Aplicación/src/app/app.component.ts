import { Component, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { AlertController, MenuController } from '@ionic/angular';
import { Observable, firstValueFrom, of, combineLatest } from 'rxjs';
import { map, shareReplay, switchMap, catchError } from 'rxjs/operators';
import { User } from './models/user';
import { RealTimeNotificationService } from '@shared/services/real-time-notification.service';
import { NotificationService } from '@shared/services/notification.service';
import { AdoptionService } from '@features/adoption/services/adoption.service';
import { AppointmentService } from '@features/appointments/services/appointment.service';
import { ThemeService } from '@core/services/theme.service';

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
  private readonly publicPaths = ['/auth/login', '/auth/registro', '/auth/restablecer', '/pets/home'];

  constructor(
    private router: Router,
    private authService: AuthService,
    private menu: MenuController,
    private alertController: AlertController,
    private injector: Injector,
    // private realTimeNotificationService: RealTimeNotificationService,
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

    // Lazy injection to avoid circular dependency
    setTimeout(() => {
      const realTimeNotificationService = this.injector.get(RealTimeNotificationService);
      realTimeNotificationService.init();
    }, 1000);

    this.menuStats$ = this.buildMenuStatsStream();
    // Ensure the theme service initializes the stored/system preference even without UI controls
    this.themeService.getCurrentPreference();
  }

  initializeApp() {
    this.authService.isAuthenticated().subscribe(isAuth => {
      const currentPath = this.router.url?.split('?')[0] || '/';
      if (isAuth) {
        this.authService.syncUserEmailWithFirebase();
        if (currentPath === '/' || currentPath === '/auth/login') {
          this.router.navigate(['/pets/home']);
        }
      } else {
        // Remove 'home' from allowed public paths
        const allowedPublicPaths = ['/auth/login', '/auth/registro', '/auth/restablecer'];
        if (!allowedPublicPaths.includes(currentPath)) {
          this.router.navigate(['/auth/login']);
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
      this.navigateTo(`/user/perfil/${user.uid}`);
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
            this.router.navigate(['/auth/login']);
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
          }),
          catchError((error) => {
            // Silenciosamente retornar stats vacíos si hay error (ej: durante logout)
            console.debug('Error loading menu stats (expected during logout):', error);
            return of(this.emptyStats);
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
