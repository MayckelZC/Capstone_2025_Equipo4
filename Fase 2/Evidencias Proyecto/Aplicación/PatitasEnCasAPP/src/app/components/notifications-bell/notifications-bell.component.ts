import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Notification } from '../../models/Notification';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { map, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-notifications-bell',
  templateUrl: './notifications-bell.component.html',
  styleUrls: ['./notifications-bell.component.scss'],
})
export class NotificationsBellComponent implements OnInit {
  notifications$: Observable<Notification[]>;
  unreadCount$: Observable<number>;

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    console.log('NotificationsBellComponent: ngOnInit called');
    this.notifications$ = this.authService.user$.pipe(
      switchMap(user => {
        if (user) {
          console.log('NotificationsBellComponent: User UID:', user.uid);
          return this.notificationService.getForUser(user.uid);
        }
        console.log('NotificationsBellComponent: No user logged in.');
        return [];
      }),
      map(notifications => {
        console.log('NotificationsBellComponent: Fetched notifications:', notifications);
        return notifications;
      })
    );

    this.unreadCount$ = this.notifications$.pipe(
      map(notifications => notifications.filter(n => !n.isRead).length)
    );
  }

  toggleNotifications() {
    this.router.navigate(['/notifications']);
  }

  async onNotificationClick(notification: Notification) {
    if (!notification.isRead) {
      await this.notificationService.markAsRead(notification.id);
    }
    // Always navigate to the notifications page
    this.router.navigate(['/notifications']);
  }
}
