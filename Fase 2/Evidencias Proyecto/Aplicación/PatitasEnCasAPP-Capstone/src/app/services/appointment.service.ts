import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Appointment } from '../models/Appointment';
import { VeterinaryAppointment } from '../models/VeterinaryAppointment';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {

  constructor(private firestore: AngularFirestore) { }

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
    console.log('📝 Creating appointment:', {
      vetId: appointment.vetId,
      userId: appointment.userId,
      petId: appointment.petId,
      date: appointment.date,
      status: appointment.status
    });
    
    return this.firestore.collection('appointments').add({
      ...appointment,
      createdAt: new Date()
    }).then((docRef) => {
      console.log('✅ Appointment created with ID:', docRef.id);
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
    console.log('💉 Guardando cita en Firestore:', appointment);
    return this.firestore.collection('veterinaryAppointments').add({
      ...appointment,
      createdAt: new Date(),
      status: 'pendiente'
    }).then((docRef) => {
      console.log('✅ Cita guardada con ID:', docRef.id);
      return docRef;
    }).catch((error) => {
      console.error('❌ Error guardando cita en Firestore:', error);
      throw error;
    });
  }

  // Obtener citas del usuario
  getMyVeterinaryAppointments(userId: string): Observable<VeterinaryAppointment[]> {
    console.log('📡 Consultando citas para userId:', userId);
    return this.firestore.collection<VeterinaryAppointment>('veterinaryAppointments', ref =>
      ref.where('userId', '==', userId)
    ).valueChanges({ idField: 'id' }).pipe(
      map(appointments => {
        console.log('📦 Citas crudas de Firestore:', appointments);
        const converted = appointments.map(apt => ({
          ...apt,
          appointmentDate: this.convertTimestampToDate(apt.appointmentDate),
          createdAt: this.convertTimestampToDate(apt.createdAt)
        }));
        console.log('✅ Citas convertidas:', converted);
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

  // Obtener citas del día
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
  updateVeterinaryAppointmentStatus(id: string, status: VeterinaryAppointment['status']): Promise<void> {
    return this.firestore.collection('veterinaryAppointments').doc(id).update({ status });
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

    console.log('🔍 [AppointmentService] Consultando citas ocupadas');
    console.log('📅 [AppointmentService] Fecha inicio:', startOfDay.toISOString());
    console.log('📅 [AppointmentService] Fecha fin:', endOfDay.toISOString());

    // Usar solo una condición de rango para evitar problemas de índices
    // y filtrar el resto en memoria
    return this.firestore.collection<VeterinaryAppointment>('veterinaryAppointments', ref =>
      ref.where('appointmentDate', '>=', startOfDay)
         .orderBy('appointmentDate', 'asc')
    ).valueChanges().pipe(
      map(appointments => {
        console.log('📦 [AppointmentService] Citas encontradas (sin filtrar por fecha fin):', appointments.length);
        
        // Filtrar en memoria por fecha fin, status y validar que tenga timeSlot
        const filteredAppointments = appointments.filter(apt => {
          const aptDate = this.convertTimestampToDate(apt.appointmentDate);
          const isInRange = aptDate >= startOfDay && aptDate <= endOfDay;
          const isActive = apt.status === 'pendiente' || apt.status === 'confirmada';
          const hasTimeSlot = apt.timeSlot && apt.timeSlot.trim() !== '';
          
          return isInRange && isActive && hasTimeSlot;
        });
        
        console.log('📋 [AppointmentService] Citas después de filtrar:', filteredAppointments.length);
        console.log('📋 [AppointmentService] Detalle de citas:', filteredAppointments);
        
        const bookedSlots = filteredAppointments.map(apt => apt.timeSlot);
        console.log('🔒 [AppointmentService] Horarios ocupados:', bookedSlots);
        
        return bookedSlots;
      })
    );
  }
}