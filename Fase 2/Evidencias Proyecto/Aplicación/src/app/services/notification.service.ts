import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ToastController, Platform } from '@ionic/angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Notification } from '../models/Notification';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

export interface EnhancedNotificationData {
  id?: string;
  userId: string;
  title: string;
  body: string;
  type: 'adoption_request' | 'appointment' | 'message' | 'general' | 'system';
  data?: any;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(
    private firestore: AngularFirestore,
    private toastController: ToastController,
    private platform: Platform
  ) {}

  // MÉTODOS ORIGINALES MANTENIDOS
  create(notification: Partial<Notification>): Promise<void> {
    const id = this.firestore.createId();
    return this.firestore.collection('notifications').doc(id).set({
      ...notification,
      id,
      createdAt: new Date(),
      isRead: false
    });
  }

  getForUser(userId: string) {
    return this.firestore.collection<Notification>('notifications', ref =>
      ref.where('userId', '==', userId).orderBy('createdAt', 'desc')
    ).valueChanges();
  }

  markAsRead(notificationId: string): Promise<void> {
    return this.firestore.collection('notifications').doc(notificationId).update({ isRead: true });
  }

  // NUEVAS FUNCIONALIDADES MEJORADAS
  
  async showToastNotification(title: string, message: string, actionUrl?: string): Promise<void> {
    const toast = await this.toastController.create({
      header: title,
      message: message,
      duration: 5000,
      position: 'top',
      cssClass: 'toast-enhanced',
      buttons: [
        {
          text: actionUrl ? 'Ver' : 'OK',
          handler: () => {
            if (actionUrl) {
              console.log('Navigate to:', actionUrl);
            }
          }
        },
        {
          text: 'Cerrar',
          role: 'cancel'
        }
      ]
    });

    await toast.present();
  }

  async createEnhanced(notification: Omit<EnhancedNotificationData, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await this.firestore.collection('notifications').add({
        ...notification,
        createdAt: new Date()
      });
      
      // Mostrar toast si la app está en primer plano
      await this.showToastNotification(notification.title, notification.body, notification.actionUrl);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating enhanced notification:', error);
      throw error;
    }
  }

  getUnreadCount(userId: string): Observable<number> {
    return this.firestore.collection('notifications', ref =>
      ref.where('userId', '==', userId)
         .where('read', '==', false)
    ).valueChanges().pipe(
      map(notifications => notifications.length)
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      const batch = this.firestore.firestore.batch();
      const notifications = await this.firestore.collection('notifications', ref =>
        ref.where('userId', '==', userId).where('read', '==', false)
      ).get().toPromise();

      if (notifications) {
        notifications.forEach(doc => {
          batch.update(doc.ref, { read: true });
        });

        await batch.commit();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await this.firestore.collection('notifications').doc(notificationId).delete();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  // NOTIFICACIONES PREDEFINIDAS
  async sendAdoptionRequestNotification(
    ownerUserId: string,
    petName: string,
    requesterName: string,
    requestId: string
  ) {
    return this.createEnhanced({
      userId: ownerUserId,
      title: '🐾 Nueva solicitud de adopción',
      body: `${requesterName} está interesado en adoptar a ${petName}`,
      type: 'adoption_request',
      read: false,
      data: {
        requestId,
        petName,
        requesterName
      },
      actionUrl: `/adoption-requests/${requestId}`
    });
  }

  async sendAppointmentNotification(
    veterinarianUserId: string,
    petName: string,
    ownerName: string,
    appointmentDate: Date,
    appointmentId: string
  ) {
    return this.createEnhanced({
      userId: veterinarianUserId,
      title: '🏥 Nueva cita veterinaria',
      body: `${ownerName} ha agendado una cita para ${petName} el ${appointmentDate.toLocaleDateString()}`,
      type: 'appointment',
      read: false,
      data: {
        appointmentId,
        petName,
        ownerName,
        appointmentDate: appointmentDate.toISOString()
      },
      actionUrl: `/vet-appointments/${appointmentId}`
    });
  }

  async sendGeneralNotification(
    userId: string,
    title: string,
    body: string,
    actionUrl?: string
  ) {
    return this.createEnhanced({
      userId,
      title,
      body,
      type: 'general',
      read: false,
      actionUrl
    });
  }

  // CONFIGURACIÓN DE USUARIO
  async updateNotificationPreferences(
    userId: string,
    preferences: {
      adoptionRequests?: boolean;
      appointments?: boolean;
      messages?: boolean;
      general?: boolean;
      pushEnabled?: boolean;
    }
  ) {
    try {
      await this.firestore.collection('user_notification_preferences').doc(userId).set(
        preferences,
        { merge: true }
      );
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  }

  async getNotificationPreferences(userId: string): Promise<any> {
    try {
      const doc = await this.firestore.collection('user_notification_preferences').doc(userId).get().toPromise();
      return doc?.data() || {
        adoptionRequests: true,
        appointments: true,
        messages: true,
        general: true,
        pushEnabled: true
      };
    } catch (error) {
      console.error('Error getting preferences:', error);
      return {};
    }
  }
}
