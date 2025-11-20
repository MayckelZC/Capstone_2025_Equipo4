import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { Observable } from 'rxjs';
import { AppointmentCard } from '../models/veterinarian.interfaces';
import { ErrorHandlerService } from './error-handler.service';

export interface ReminderConfig {
  appointmentId: string;
  petName: string;
  ownerName: string;
  ownerEmail?: string;
  ownerPhone?: string;
  appointmentDate: Date;
  reminderDate: Date;
  type: '24h' | '2h' | 'custom';
  sent: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(
    private firestore: AngularFirestore,
    private functions: AngularFireFunctions,
    private errorHandler: ErrorHandlerService
  ) {}

  /**
   * Programar recordatorio de cita (24 horas antes)
   */
  async scheduleAppointmentReminder(appointment: AppointmentCard): Promise<void> {
    try {
      const appointmentDate = new Date(appointment.date);
      const reminderDate24h = new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000);
      const reminderDate2h = new Date(appointmentDate.getTime() - 2 * 60 * 60 * 1000);
      
      // Solo programar si la cita es futura
      const now = new Date();
      
      // Recordatorio 24 horas antes
      if (reminderDate24h > now) {
        await this.createReminder({
          appointmentId: appointment.id,
          petName: appointment.petName,
          ownerName: appointment.ownerName,
          ownerEmail: appointment.ownerEmail,
          ownerPhone: appointment.ownerPhone,
          appointmentDate: appointmentDate,
          reminderDate: reminderDate24h,
          type: '24h',
          sent: false
        });
      }

      // Recordatorio 2 horas antes
      if (reminderDate2h > now) {
        await this.createReminder({
          appointmentId: appointment.id,
          petName: appointment.petName,
          ownerName: appointment.ownerName,
          ownerEmail: appointment.ownerEmail,
          ownerPhone: appointment.ownerPhone,
          appointmentDate: appointmentDate,
          reminderDate: reminderDate2h,
          type: '2h',
          sent: false
        });
      }

      await this.errorHandler.showSuccessToast('Recordatorios programados exitosamente');
    } catch (error) {
      console.error('Error scheduling reminders:', error);
      await this.errorHandler.showErrorToast('Error al programar recordatorios');
    }
  }

  /**
   * Crear recordatorio en Firestore
   */
  private async createReminder(config: ReminderConfig): Promise<void> {
    await this.firestore.collection('appointment-reminders').add({
      ...config,
      createdAt: new Date(),
      processed: false
    });
  }

  /**
   * Enviar recordatorio inmediato (por ejemplo, cambio de cita)
   */
  async sendImmediateReminder(appointment: AppointmentCard, message: string): Promise<void> {
    try {
      // Llamar a Cloud Function para enviar notificación
      const sendNotification = this.functions.httpsCallable('sendAppointmentNotification');
      
      await sendNotification({
        appointmentId: appointment.id,
        ownerEmail: appointment.ownerEmail,
        ownerPhone: appointment.ownerPhone,
        message: message,
        type: 'immediate',
        petName: appointment.petName,
        appointmentDate: appointment.date
      }).toPromise();

      await this.errorHandler.showSuccessToast('Notificación enviada exitosamente');
    } catch (error) {
      console.error('Error sending immediate reminder:', error);
      // No mostrar error al usuario, solo log
    }
  }

  /**
   * Cancelar recordatorios de una cita
   */
  async cancelReminders(appointmentId: string): Promise<void> {
    try {
      const reminders = await this.firestore
        .collection('appointment-reminders', ref =>
          ref.where('appointmentId', '==', appointmentId)
            .where('sent', '==', false)
        )
        .get()
        .toPromise();

      const batch = this.firestore.firestore.batch();
      
      reminders?.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error cancelling reminders:', error);
    }
  }

  /**
   * Obtener recordatorios pendientes
   */
  getPendingReminders(): Observable<ReminderConfig[]> {
    return this.firestore
      .collection<ReminderConfig>('appointment-reminders', ref =>
        ref.where('sent', '==', false)
          .where('reminderDate', '<=', new Date())
          .orderBy('reminderDate', 'asc')
      )
      .valueChanges({ idField: 'id' });
  }

  /**
   * Marcar recordatorio como enviado
   */
  async markReminderAsSent(reminderId: string): Promise<void> {
    await this.firestore
      .doc(`appointment-reminders/${reminderId}`)
      .update({
        sent: true,
        sentAt: new Date()
      });
  }

  /**
   * Programar recordatorios en lote para múltiples citas
   */
  async scheduleBatchReminders(appointments: AppointmentCard[]): Promise<void> {
    try {
      const promises = appointments.map(apt => this.scheduleAppointmentReminder(apt));
      await Promise.all(promises);
      
      await this.errorHandler.showSuccessToast(
        `${appointments.length} recordatorios programados exitosamente`
      );
    } catch (error) {
      console.error('Error scheduling batch reminders:', error);
      await this.errorHandler.showErrorToast('Error al programar recordatorios en lote');
    }
  }

  /**
   * Enviar notificación de confirmación de cita
   */
  async sendAppointmentConfirmation(appointment: AppointmentCard): Promise<void> {
    const message = `
      ✅ Cita Confirmada
      
      Hola ${appointment.ownerName},
      
      Tu cita para ${appointment.petName} ha sido confirmada.
      
      📅 Fecha: ${new Date(appointment.date).toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}
      🕐 Hora: ${new Date(appointment.date).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}
      🐾 Motivo: ${appointment.reason}
      
      Recibirás recordatorios 24 horas y 2 horas antes de tu cita.
      
      ¡Nos vemos pronto!
    `;

    await this.sendImmediateReminder(appointment, message);
  }

  /**
   * Enviar notificación de cancelación
   */
  async sendCancellationNotification(
    appointment: AppointmentCard, 
    reason: string
  ): Promise<void> {
    const message = `
      ❌ Cita Cancelada
      
      Hola ${appointment.ownerName},
      
      Lamentamos informarte que tu cita para ${appointment.petName} ha sido cancelada.
      
      📅 Fecha original: ${new Date(appointment.date).toLocaleDateString('es-ES')}
      🕐 Hora: ${new Date(appointment.date).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}
      
      Motivo de cancelación: ${reason}
      
      Por favor, contacta con nosotros para reagendar.
    `;

    await this.sendImmediateReminder(appointment, message);
    await this.cancelReminders(appointment.id);
  }

  /**
   * Enviar notificación de reagendamiento
   */
  async sendRescheduleNotification(
    appointment: AppointmentCard,
    oldDate: Date,
    reason?: string
  ): Promise<void> {
    const message = `
      📅 Cita Reagendada
      
      Hola ${appointment.ownerName},
      
      Tu cita para ${appointment.petName} ha sido reagendada.
      
      ❌ Fecha anterior: ${oldDate.toLocaleDateString('es-ES')} ${oldDate.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}
      
      ✅ Nueva fecha: ${new Date(appointment.date).toLocaleDateString('es-ES')} ${new Date(appointment.date).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}
      
      ${reason ? `Motivo: ${reason}` : ''}
      
      Recibirás nuevos recordatorios para la nueva fecha.
    `;

    // Cancelar recordatorios antiguos y crear nuevos
    await this.cancelReminders(appointment.id);
    await this.sendImmediateReminder(appointment, message);
    await this.scheduleAppointmentReminder(appointment);
  }
}
