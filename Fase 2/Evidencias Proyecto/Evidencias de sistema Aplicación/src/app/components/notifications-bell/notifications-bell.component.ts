import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Notification } from '../../models/Notification';
import { NotificationService } from '@shared/services/notification.service';
import { AuthService } from '@core/services/auth.service';
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
  currentUserId!: string;

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
          this.currentUserId = user.uid;
          return this.notificationService.getForUser(user.uid);
        }
        return [];
      })
    );

    this.unreadCount$ = this.notifications$.pipe(
      map(notifications => notifications.filter(n => !n.read).length)
    );
  }

  toggleNotifications() {
    this.router.navigate(['/notifications']);
  }

  async onNotificationClick(notification: Notification) {
    if (!notification.read && this.currentUserId) {
      await this.notificationService.markAsRead(notification.id!);
    }
    // Always navigate to the notifications page
    this.router.navigate(['/notifications']);
  }
}
