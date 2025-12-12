import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { NotificationsPageRoutingModule } from './notifications-routing.module';

import { NotificationsPage } from './notifications.page';
import { TimeAgoPipe } from '@pipes/time-ago.pipe';
import { NotificationFilterPipe } from '@pipes/notification-filter.pipe';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NotificationsPageRoutingModule
  ],
  declarations: [
    NotificationsPage,
    TimeAgoPipe,
    NotificationFilterPipe
  ]
})
export class NotificationsPageModule { }

