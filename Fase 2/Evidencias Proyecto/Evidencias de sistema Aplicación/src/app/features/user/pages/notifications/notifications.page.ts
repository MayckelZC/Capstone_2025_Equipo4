import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Notification } from 'src/app/models/Notification';
import { NotificationService } from '@shared/services/notification.service';
import { AuthService } from '@core/services/auth.service';
import { switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
})
export class NotificationsPage implements OnInit {
  notifications$: Observable<Notification[]>;
  selectedFilter: string = 'all';

  filterOptions = [
    { value: 'all', label: 'Todas', icon: 'notifications-outline' },
    { value: 'unread', label: 'No leídas', icon: 'mail-unread-outline' },
    { value: 'adoption', label: 'Adopciones', icon: 'paw' },
    { value: 'appointment', label: 'Citas', icon: 'calendar' }
  ];

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.notifications$ = this.authService.user$.pipe(
      switchMap(user => {
        if (user) {
          return this.notificationService.getForUser(user.uid);
        }
        return of([]);
      })
    );
  }

  async onNotificationClick(notification: Notification) {
    if (!notification.read) {
      await this.notificationService.markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      try {
        await this.router.navigateByUrl(notification.actionUrl);
      } catch (error) {
        console.error('Error navigating to:', notification.actionUrl, error);
        const toast = await this.toastController.create({
          message: 'No se puede abrir esta notificación',
          duration: 2000,
          color: 'warning',
          position: 'bottom'
        });
        await toast.present();
      }
    }
  }

  async deleteNotification(notification: Notification, event?: Event) {
    if (event) {
      event.stopPropagation(); // Prevent notification click
    }

    const alert = await this.alertController.create({
      header: 'Eliminar notificación',
      message: '¿Estás seguro de que quieres eliminar esta notificación?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.notificationService.deleteNotification(notification.id);
              const toast = await this.toastController.create({
                message: 'Notificación eliminada',
                duration: 2000,
                color: 'success',
                position: 'bottom'
              });
              await toast.present();
            } catch (error) {
              console.error('Error deleting notification:', error);
              const toast = await this.toastController.create({
                message: 'Error al eliminar la notificación',
                duration: 2000,
                color: 'danger',
                position: 'bottom'
              });
              await toast.present();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  setFilter(filter: string) {
    this.selectedFilter = filter;
  }

  async markAllAsRead() {
    const alert = await this.alertController.create({
      header: 'Marcar todas como leídas',
      message: '¿Estás seguro de que quieres marcar todas las notificaciones como leídas?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Marcar',
          handler: async () => {
            const user = await this.authService.getCurrentUser();
            if (user) {
              await this.notificationService.markAllAsRead(user.uid);
            }
          },
        },
      ],
    });
    await alert.present();
  }
}

