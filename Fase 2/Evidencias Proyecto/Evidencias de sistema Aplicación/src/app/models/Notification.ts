export type NotificationType =
    | 'adoption_request'
    | 'adoption_approved'
    | 'adoption_rejected'
    | 'appointment'
    | 'appointment_request'
    | 'appointment_update'
    | 'appointment_reminder'
    | 'message'
    | 'general'
    | 'system'
    | 'vaccination_reminder'
    | 'pet_birthday';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
    id?: string;
    userId: string;
    title: string;
    body: string;
    type: NotificationType;
    priority?: NotificationPriority;
    data?: {
        petId?: string;
        petName?: string;
        requestId?: string;
        appointmentId?: string;
        requesterName?: string;
        [key: string]: any;
    };
    read: boolean;
    createdAt: Date | any;
    actionUrl?: string;
    imageUrl?: string;
    // Para acciones rápidas
    actions?: NotificationAction[];
}

export interface NotificationAction {
    label: string;
    action: string;
    color?: 'primary' | 'success' | 'danger' | 'warning';
    icon?: string;
}
