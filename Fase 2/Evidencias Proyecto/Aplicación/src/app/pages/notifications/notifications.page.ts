import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Notification } from 'src/app/models/Notification';
import { NotificationService } from 'src/app/services/notification.service';
import { AuthService } from 'src/app/services/auth.service';
import { switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
})
export class NotificationsPage implements OnInit {
  notifications$: Observable<Notification[]>;

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.notifications$ = this.authService.user$.pipe(
      switchMap(user => {
        if (user) {
          return this.notificationService.getForUser(user.uid);
        }
        return [];
      })
    );
  }

  async onNotificationClick(notification: Notification) {
    if (!notification.isRead) {
      await this.notificationService.markAsRead(notification.id);
    }
    if (notification.link) {
      this.router.navigate([notification.link]);
    } else {
      const alert = await this.alertController.create({
        header: 'Notificación',
        message: notification.message,
        buttons: ['OK']
      });
      await alert.present();
    }
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
            // Logic to mark all notifications as read
            this.notifications$.subscribe(async notifications => {
              for (const notification of notifications) {
                if (!notification.isRead) {
                  await this.notificationService.markAsRead(notification.id);
                }
              }
            });
          },
        },
      ],
    });
    await alert.present();
  }
}
