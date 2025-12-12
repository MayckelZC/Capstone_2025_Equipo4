import { Pipe, PipeTransform } from '@angular/core';
import { Notification } from '@models/Notification';

@Pipe({
    name: 'notificationFilter'
})
export class NotificationFilterPipe implements PipeTransform {
    transform(notifications: Notification[] | null, filterType: string): Notification[] {
        if (!notifications || !filterType || filterType === 'all') {
            return notifications || [];
        }

        return notifications.filter(notification => {
            switch (filterType) {
                case 'adoption':
                    return notification.type === 'adoption_request';
                case 'appointment':
                    return notification.type === 'appointment' ||
                        notification.type === 'appointment_request' ||
                        notification.type === 'appointment_update';
                case 'message':
                    return notification.type === 'message';
                case 'unread':
                    return !notification.read;
                default:
                    return true;
            }
        });
    }
}
