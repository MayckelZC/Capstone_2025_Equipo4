import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Appointment } from '@models/Appointment';
import { VeterinaryAppointment } from '@models/VeterinaryAppointment';
import { NotificationService } from '@shared/services/notification.service';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {

  constructor(
    private firestore: AngularFirestore,
    private notificationService: NotificationService
  ) { }

  // Helper method to convert Firestore Timestamp to Date
  private convertTimestampToDate(timestamp: any): Date {
    return timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  }

  // Obtener citas de un usuario
  getAppointmentsForUser(userId: string): Observable<Appointment[]> {
    return this.firestore.collection<Appointment>('appointments', ref =>
      ref.where('userId', '==', userId).orderBy('date', 'desc')
    ).valueChanges({ idField: 'id' });
  }

  // Agregar una cita
  addAppointment(appointment: Omit<Appointment, 'id'>): Promise<firebase.default.firestore.DocumentReference> {
    

    return this.firestore.collection('appointments').add({
      ...appointment,
      createdAt: new Date()
    }).then((docRef) => {
      
      return docRef;
    }).catch((error) => {
      console.error('❌ Error creating appointment:', error);
      throw error;
    });
  }

  // Obtener una cita por ID
  getAppointment(id: string): Observable<Appointment | undefined> {
    return this.firestore.collection<Appointment>('appointments').doc(id).valueChanges();
  }

  // Actualizar una cita
  updateAppointment(id: string, appointment: Partial<Appointment>): Promise<void> {
    return this.firestore.collection('appointments').doc(id).update({
      ...appointment,
      updatedAt: new Date()
    });
  }

  // Eliminar una cita
  deleteAppointment(id: string): Promise<void> {
    return this.firestore.collection('appointments').doc(id).delete();
  }

  // ========== VETERINARY APPOINTMENTS ==========

  // Crear cita veterinaria
  createVeterinaryAppointment(appointment: Omit<VeterinaryAppointment, 'id'>): Promise<firebase.default.firestore.DocumentReference> {
    
    return this.firestore.collection('veterinaryAppointments').add({
      ...appointment,
      createdAt: new Date(),
      status: 'pendiente'
    }).then(async (docRef) => {
      

      // Notify the user (owner) that the appointment is pending
      try {
        const date = appointment.appointmentDate instanceof Date ? appointment.appointmentDate : new Date(appointment.appointmentDate);
        await this.notificationService.create({
          userId: appointment.userId,
          title: 'Cita Solicit ada',
          body: `Has solicitado una cita para ${appointment.petName} el ${date.toLocaleDateString()}. Estado: Pendiente.`,
          type: 'appointment_request',
          read: false,
          actionUrl: `/appointments`
        });
      } catch (error) {
        console.error('Error creating appointment notification:', error);
      }

      return docRef;
    }).catch((error) => {
      console.error('❌ Error guardando cita en Firestore:', error);
      throw error;
    });
  }

  // Obtener citas del usuario
  getMyVeterinaryAppointments(userId: string): Observable<VeterinaryAppointment[]> {
    
    return this.firestore.collection<VeterinaryAppointment>('veterinaryAppointments', ref =>
      ref.where('userId', '==', userId)
    ).valueChanges({ idField: 'id' }).pipe(
      map(appointments => {
        
        const converted = appointments.map(apt => ({
          ...apt,
          appointmentDate: this.convertTimestampToDate(apt.appointmentDate),
          createdAt: this.convertTimestampToDate(apt.createdAt)
        }));
        
        return converted;
      })
    );
  }

  // Obtener todas las citas para el veterinario
  getAllVeterinaryAppointments(): Observable<VeterinaryAppointment[]> {
    return this.firestore.collection<VeterinaryAppointment>('veterinaryAppointments', ref =>
      ref.orderBy('appointmentDate', 'asc')
    ).valueChanges({ idField: 'id' }).pipe(
      map(appointments => appointments.map(apt => ({
        ...apt,
        appointmentDate: this.convertTimestampToDate(apt.appointmentDate),
        createdAt: this.convertTimestampToDate(apt.createdAt)
      })))
    );
  }

  // Número de citas próximas para un usuario (pendientes o confirmadas)
  getUpcomingAppointmentsCount(userId: string): Observable<number> {
    const now = new Date();
    return this.getMyVeterinaryAppointments(userId).pipe(
      map(appointments => appointments.filter(apt => {
        const date = this.convertTimestampToDate(apt.appointmentDate);
        const isUpcoming = date >= now;
        const isActive = apt.status === 'pendiente' || apt.status === 'confirmada';
        return isUpcoming && isActive;
      }).length)
    );
  }

  // Obtener cit as del día
  getTodayVeterinaryAppointments(): Observable<VeterinaryAppointment[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.firestore.collection<VeterinaryAppointment>('veterinaryAppointments', ref =>
      ref.where('appointmentDate', '>=', today)
        .where('appointmentDate', '<', tomorrow)
        .orderBy('appointmentDate', 'asc')
    ).valueChanges({ idField: 'id' }).pipe(
      map(appointments => appointments.map(apt => ({
        ...apt,
        appointmentDate: this.convertTimestampToDate(apt.appointmentDate),
        createdAt: this.convertTimestampToDate(apt.createdAt)
      })))
    );
  }

  // Actualizar estado de cita
  async updateVeterinaryAppointmentStatus(id: string, status: VeterinaryAppointment['status']): Promise<void> {
    await this.firestore.collection('veterinaryAppointments').doc(id).update({ status });

    // Notify the owner about the status change
    try {
      const doc = await this.firestore.collection<VeterinaryAppointment>('veterinaryAppointments').doc(id).get().toPromise();
      const appointment = doc?.data();

      if (appointment) {
        const title = status === 'confirmada' ? 'Cita Confirmada' :
          status === 'cancelada' ? 'Cita Cancelada' : 'Actualización de Cita';
        const body = status === 'confirmada' ? `Tu cita para ${appointment.petName} ha sido confirmada.` :
          status === 'cancelada' ? `Tu cita para ${appointment.petName} ha sido cancelada.` :
            `El estado de tu cita para ${appointment.petName} ha cambiado a ${status}.`;

        await this.notificationService.create({
          userId: appointment.userId,
          title: title,
          body: body,
          type: 'appointment_update',
          read: false,
          actionUrl: `/appointments`
        });
      }
    } catch (error) {
      console.error('Error sending status update notification:', error);
    }
  }

  // Cancelar cita
  cancelVeterinaryAppointment(id: string): Promise<void> {
    return this.updateVeterinaryAppointmentStatus(id, 'cancelada');
  }

  // Obtener horarios ocupados para una fecha
  getBookedTimeSlotsForDate(date: Date): Observable<string[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    
    console.log('📅 [AppointmentService] Fecha inicio:', startOfDay.toISOString());
    console.log('📅 [AppointmentService] Fecha fin:', endOfDay.toISOString());

    // Usar solo una condición de rango para evitar problemas de índices
    // y filtrar el resto en memoria
    return this.firestore.collection<VeterinaryAppointment>('veterinaryAppointments', ref =>
      ref.where('appointmentDate', '>=', startOfDay)
        .orderBy('appointmentDate', 'asc')
    ).valueChanges().pipe(
      map(appointments => {
        

        // Filtrar en memoria por fecha fin, status y validar que tenga timeSlot
        const filteredAppointments = appointments.filter(apt => {
          const aptDate = this.convertTimestampToDate(apt.appointmentDate);
          const isInRange = aptDate >= startOfDay && aptDate <= endOfDay;
          const isActive = apt.status === 'pendiente' || apt.status === 'confirmada';
          const hasTimeSlot = apt.timeSlot && apt.timeSlot.trim() !== '';

          return isInRange && isActive && hasTimeSlot;
        });

        
        

        const bookedSlots = filteredAppointments.map(apt => apt.timeSlot);
        

        return bookedSlots;
      })
    );
  }
}