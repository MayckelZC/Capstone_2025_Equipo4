import { Injectable } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
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
export class VetNotificationService {

  constructor(
    private firestore: AngularFirestore,
    private functions: AngularFireFunctions,
    private errorHandler: ErrorHandlerService,
    private logger: LoggerService
  ) { }

  /**
   * Programar recordatorio de cita (24 horas antes)
   */
  async scheduleAppointmentReminder(appointment: AppointmentCard): Promise<void> {
    try {
      const appointmentDate = new Date(appointment.date);
      const reminderDate24h = new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000);
      const reminderDate2h = new Date(appointmentDate.getTime() - 2 * 60 * 60 * 1000);

      const now = new Date();

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
      this.logger.error('Error scheduling reminders:', error);
      await this.errorHandler.showErrorToast('Error al programar recordatorios');
    }
  }

  private async createReminder(config: ReminderConfig): Promise<void> {
    await this.firestore.collection('appointment-reminders').add({
      ...config,
      createdAt: new Date(),
      processed: false
    });
  }

  async sendImmediateReminder(appointment: AppointmentCard, message: string): Promise<void> {
    try {
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
      this.logger.error('Error sending immediate reminder:', error);
    }
  }

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
      this.logger.error('Error cancelling reminders:', error);
    }
  }

  getPendingReminders(): Observable<ReminderConfig[]> {
    return this.firestore
      .collection<ReminderConfig>('appointment-reminders', ref =>
        ref.where('sent', '==', false)
          .where('reminderDate', '<=', new Date())
          .orderBy('reminderDate', 'asc')
      )
      .valueChanges({ idField: 'id' });
  }

  async markReminderAsSent(reminderId: string): Promise<void> {
    await this.firestore
      .doc(`appointment-reminders/${reminderId}`)
      .update({
        sent: true,
        sentAt: new Date()
      });
  }

  async scheduleBatchReminders(appointments: AppointmentCard[]): Promise<void> {
    try {
      const promises = appointments.map(apt => this.scheduleAppointmentReminder(apt));
      await Promise.all(promises);

      await this.errorHandler.showSuccessToast(
        `${appointments.length} recordatorios programados exitosamente`
      );
    } catch (error) {
      this.logger.error('Error scheduling batch reminders:', error);
      await this.errorHandler.showErrorToast('Error al programar recordatorios en lote');
    }
  }

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
      
      📝 Motivo: ${reason}
      
      Por favor, contacta con nosotros para reprogramar tu cita.
    `;

    await this.sendImmediateReminder(appointment, message);
    await this.cancelReminders(appointment.id);
  }

  async sendRescheduleNotification(
    appointment: AppointmentCard,
    oldDate: Date,
    reason?: string
  ): Promise<void> {
    const message = `
      📅 Cita Reprogramada
      
      Hola ${appointment.ownerName},
      
      Tu cita para ${appointment.petName} ha sido reprogramada.
      
      ❌ Fecha anterior: ${oldDate.toLocaleDateString('es-ES')} ${oldDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })}
      
      ✅ Nueva fecha: ${new Date(appointment.date).toLocaleDateString('es-ES')} ${new Date(appointment.date).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })}
      
      ${reason ? `📝 Motivo: ${reason}` : ''}
      
      Recibirás nuevos recordatorios para la nueva fecha.
    `;

    await this.cancelReminders(appointment.id);
    await this.sendImmediateReminder(appointment, message);
    await this.scheduleAppointmentReminder(appointment);
  }
}
