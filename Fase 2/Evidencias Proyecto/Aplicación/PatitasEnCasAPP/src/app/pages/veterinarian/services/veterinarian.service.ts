import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { map, shareReplay, distinctUntilChanged, catchError, debounceTime, switchMap } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { ErrorHandlerService } from './error-handler.service';
import {
  VeterinarianMetrics,
  DayActivity,
  ConsultationStats,
  WeeklyActivity,
  VetNotification,
  AppointmentCard,
  MedicalRecord,
  PatientSummary
} from '../models/veterinarian.interfaces';
import { 
  AppointmentStatus, 
  TIME_CONSTANTS, 
  SUCCESS_MESSAGES,
  ERROR_MESSAGES 
} from '../constants/veterinarian.constants';

@Injectable({
  providedIn: 'root'
})
export class VeterinarianService {
  
  // Observables con shareReplay para evitar múltiples suscripciones
  appointments$: Observable<AppointmentCard[]>;
  medicalRecords$: Observable<MedicalRecord[]>;
  patients$: Observable<PatientSummary[]>;
  
  // BehaviorSubjects para manejo de estado
  private currentVetId$ = new BehaviorSubject<string | null>(null);
  private refreshTrigger$ = new BehaviorSubject<number>(0);

  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService,
    private errorHandler: ErrorHandlerService
  ) {
    this.initializeObservables();
  }

  /**
   * Inicializar observables optimizados
   */
  private initializeObservables() {
    // Observable de citas con optimizaciones
    this.appointments$ = combineLatest([
      this.currentVetId$.pipe(
        distinctUntilChanged(),
        debounceTime(TIME_CONSTANTS.DEBOUNCE_TIME_MS)
      ),
      this.refreshTrigger$
    ]).pipe(
      switchMap(([vetId]) => {
        if (!vetId) {
          return of([]);
        }
        
        return this.firestore
          .collection<AppointmentCard>('appointments', ref =>
            ref.where('veterinarianId', '==', vetId)
              .orderBy('date', 'desc')
          )
          .valueChanges({ idField: 'id' })
          .pipe(
            map(appointments => appointments.map(apt => ({
              ...apt,
              date: this.toDate(apt.date)
            }))),
            catchError(error => {
              console.error('Error loading appointments:', error);
              this.errorHandler.handleError(error, true, ERROR_MESSAGES.LOAD_DATA_FAILED);
              return of([]);
            }),
            shareReplay(1)
          );
      })
    );

    // Observable de registros médicos con optimizaciones
    this.medicalRecords$ = this.currentVetId$.pipe(
      distinctUntilChanged(),
      debounceTime(TIME_CONSTANTS.DEBOUNCE_TIME_MS),
      switchMap(vetId => {
        if (!vetId) {
          return of([]);
        }
        
        return this.firestore
          .collection<MedicalRecord>('medical-records', ref =>
            ref.where('veterinarianId', '==', vetId)
              .orderBy('date', 'desc')
              .limit(100)
          )
          .valueChanges({ idField: 'id' })
          .pipe(
            map(records => records.map(rec => ({
              ...rec,
              date: this.toDate(rec.date),
              createdAt: this.toDate(rec.createdAt),
              updatedAt: this.toDate(rec.updatedAt)
            }))),
            catchError(error => {
              console.error('Error loading medical records:', error);
              this.errorHandler.handleError(error, false);
              return of([]);
            }),
            shareReplay(1)
          );
      })
    );

    // Inicializar veterinario actual
    this.initializeCurrentVet();
  }

  /**
   * Inicializar ID del veterinario actual
   */
  private async initializeCurrentVet() {
    try {
      const user = await this.authService.getCurrentUser();
      if (user) {
        const userDoc = await this.firestore
          .doc(`users/${user.uid}`)
          .get()
          .toPromise();
        
        const userData = userDoc?.data() as any;
        if (userData?.isVeterinarian) {
          this.currentVetId$.next(user.uid);
        } else {
          this.errorHandler.handleError(
            { code: 'permission-denied' },
            true,
            ERROR_MESSAGES.NO_PERMISSIONS
          );
        }
      }
    } catch (error) {
      console.error('Error initializing veterinarian:', error);
      this.errorHandler.handleError(error, true);
    }
  }

  /**
   * Obtener métricas del veterinario
   */
  getMetrics(): Observable<VeterinarianMetrics> {
    return this.appointments$.pipe(
      map(appointments => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const todayAppointments = appointments.filter(apt => {
          const aptDate = new Date(apt.date);
          return aptDate >= today && aptDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
        });

        return {
          totalAppointments: appointments.length,
          todayAppointments: todayAppointments.length,
          pendingAppointments: appointments.filter(apt => apt.status === AppointmentStatus.Pending).length,
          completedToday: todayAppointments.filter(apt => apt.status === AppointmentStatus.Completed).length,
          activePatients: new Set(appointments.map(apt => apt.petId)).size,
          emergenciesToday: todayAppointments.filter(apt => apt.priority === 'critical' || apt.priority === 'high').length
        };
      }),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      shareReplay(1)
    );
  }

  /**
   * Obtener actividades del día
   */
  getTodayActivities(): Observable<DayActivity[]> {
    return this.appointments$.pipe(
      map(appointments => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return appointments
          .filter(apt => {
            const aptDate = new Date(apt.date);
            return aptDate >= today && aptDate < tomorrow;
          })
          .map(apt => ({
            id: apt.id,
            type: apt.priority === 'critical' ? 'emergency' as const : 'appointment' as const,
            title: `Cita: ${apt.petName}`,
            description: apt.reason,
            time: apt.date,
            priority: apt.priority,
            petId: apt.petId,
            petName: apt.petName,
            status: apt.status
          }))
          .sort((a, b) => a.time.getTime() - b.time.getTime());
      }),
      shareReplay(1)
    );
  }

  /**
   * Obtener estadísticas de consultas
   */
  getConsultationStats(): Observable<ConsultationStats[]> {
    return this.medicalRecords$.pipe(
      map(records => {
        const stats = new Map<string, number>();
        const total = records.length;

        records.forEach(record => {
          const count = stats.get(record.type) || 0;
          stats.set(record.type, count + 1);
        });

        const consultationColors: Record<string, string> = {
          'checkup': '#4CAF50',
          'vaccine': '#2196F3',
          'emergency': '#F44336',
          'surgery': '#FF9800',
          'treatment': '#9C27B0',
          'followup': '#00BCD4'
        };

        return Array.from(stats.entries()).map(([type, count]) => ({
          type: this.translateRecordType(type),
          count,
          percentage: total > 0 ? (count / total) * 100 : 0,
          color: consultationColors[type] || '#757575'
        }));
      }),
      shareReplay(1)
    );
  }

  /**
   * Obtener actividad semanal
   */
  getWeeklyActivity(): Observable<WeeklyActivity[]> {
    return this.appointments$.pipe(
      map(appointments => {
        const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const weeklyStats = new Map<number, { appointments: number; emergencies: number }>();

        appointments
          .filter(apt => apt.date >= weekAgo)
          .forEach(apt => {
            const day = apt.date.getDay();
            const stats = weeklyStats.get(day) || { appointments: 0, emergencies: 0 };
            stats.appointments++;
            if (apt.priority === 'critical' || apt.priority === 'high') {
              stats.emergencies++;
            }
            weeklyStats.set(day, stats);
          });

        return weekDays.map((day, index) => {
          const stats = weeklyStats.get(index) || { appointments: 0, emergencies: 0 };
          return {
            day,
            appointments: stats.appointments,
            emergencies: stats.emergencies
          };
        });
      }),
      shareReplay(1)
    );
  }

  /**
   * Obtener notificaciones no leídas
   */
  getUnreadNotifications(): Observable<VetNotification[]> {
    return this.currentVetId$.pipe(
      distinctUntilChanged(),
      switchMap(vetId => {
        if (!vetId) {
          return of([]);
        }

        return this.firestore
          .collection<VetNotification>('vet-notifications', ref =>
            ref.where('veterinarianId', '==', vetId)
              .where('read', '==', false)
              .orderBy('date', 'desc')
              .limit(10)
          )
          .valueChanges({ idField: 'id' })
          .pipe(
            map(notifications => notifications.map(notif => ({
              ...notif,
              date: this.toDate(notif.date)
            }))),
            catchError(() => of([])),
            shareReplay(1)
          );
      })
    );
  }

  /**
   * Obtener citas próximas
   */
  getUpcomingAppointments(): Observable<AppointmentCard[]> {
    return this.appointments$.pipe(
      map(appointments => {
        const now = new Date();
        return appointments
          .filter(apt =>
            apt.date > now &&
            apt.status !== AppointmentStatus.Completed &&
            apt.status !== AppointmentStatus.Cancelled
          )
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .slice(0, 5);
      }),
      shareReplay(1)
    );
  }

  /**
   * Obtener emergencias activas
   */
  getActiveEmergencies(): Observable<AppointmentCard[]> {
    return this.appointments$.pipe(
      map(appointments =>
        appointments.filter(apt =>
          (apt.priority === 'critical' || apt.priority === 'high') &&
          apt.status !== AppointmentStatus.Completed &&
          apt.status !== AppointmentStatus.Cancelled
        )
      ),
      shareReplay(1)
    );
  }

  /**
   * Actualizar estado de cita
   */
  async updateAppointmentStatus(appointmentId: string, status: string): Promise<void> {
    try {
      await this.firestore
        .doc(`appointments/${appointmentId}`)
        .update({
          status,
          updatedAt: new Date()
        });

      this.refreshTrigger$.next(this.refreshTrigger$.value + 1);
      
      const message = status === 'completed' 
        ? SUCCESS_MESSAGES.APPOINTMENT_COMPLETED 
        : SUCCESS_MESSAGES.APPOINTMENT_CONFIRMED;
      
      await this.errorHandler.showSuccessToast(message);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  }

  /**
   * Cancelar cita
   */
  async cancelAppointment(appointmentId: string, reason: string): Promise<void> {
    try {
      await this.firestore
        .doc(`appointments/${appointmentId}`)
        .update({
          status: AppointmentStatus.Cancelled,
          cancellationReason: reason,
          updatedAt: new Date()
        });

      this.refreshTrigger$.next(this.refreshTrigger$.value + 1);
      await this.errorHandler.showSuccessToast(SUCCESS_MESSAGES.APPOINTMENT_CANCELLED);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  }

  /**
   * Reagendar cita
   */
  async rescheduleAppointment(appointmentId: string, newDate: Date, reason?: string): Promise<void> {
    try {
      await this.firestore
        .doc(`appointments/${appointmentId}`)
        .update({
          date: newDate,
          rescheduleReason: reason,
          updatedAt: new Date()
        });

      this.refreshTrigger$.next(this.refreshTrigger$.value + 1);
      await this.errorHandler.showSuccessToast(SUCCESS_MESSAGES.APPOINTMENT_RESCHEDULED);
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      throw error;
    }
  }

  /**
   * Marcar notificación como leída
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await this.firestore
        .doc(`vet-notifications/${notificationId}`)
        .update({ read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Convertir timestamp de Firestore a Date
   */
  private toDate(value: any): Date {
    if (value instanceof Date) {
      return value;
    }
    if (value?.toDate) {
      return value.toDate();
    }
    if (value?.seconds) {
      return new Date(value.seconds * 1000);
    }
    return new Date(value);
  }

  /**
   * Traducir tipo de registro
   */
  private translateRecordType(type: string): string {
    const translations: Record<string, string> = {
      'checkup': 'Chequeos Generales',
      'vaccine': 'Vacunaciones',
      'emergency': 'Emergencias',
      'surgery': 'Cirugías',
      'treatment': 'Tratamientos',
      'followup': 'Seguimientos'
    };
    return translations[type] || type;
  }

  /**
   * Refrescar datos
   */
  refresh(): void {
    this.refreshTrigger$.next(this.refreshTrigger$.value + 1);
  }
}
