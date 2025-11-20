export interface Notification {
    id?: string;
    userId: string; // ID of the user who receives the notification
    createdAt: Date;
    message: string;
    isRead: boolean;
    link?: string; // Optional link to navigate to (e.g., /my-adoptions)
}
