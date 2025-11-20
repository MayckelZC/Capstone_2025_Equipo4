import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { AppointmentService } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';
import { VeterinaryAppointment } from '../../models/VeterinaryAppointment';
import { AppointmentType, getOnlineSchedulableTypes, getAppointmentTypeById } from '../../models/AppointmentType';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-schedule-appointment-modal',
  templateUrl: './schedule-appointment-modal.component.html',
  styleUrls: ['./schedule-appointment-modal.component.scss'],
})
export class ScheduleAppointmentModalComponent implements OnInit {
  @Input() petId!: string;
  @Input() petName!: string;

  selectedDate: string = '';
  selectedTimeSlot: string = '';
  reason: string = '';
  selectedAppointmentType: AppointmentType | null = null;
  
  availableTimeSlots: string[] = [];
  bookedSlots: string[] = [];
  allTimeSlots: string[] = [
    '09:00', '10:00', '11:00', '12:00',
    '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  minDate: string;
  maxDate: string;
  
  // Tipos de cita disponibles para agendamiento online
  appointmentTypes: AppointmentType[] = getOnlineSchedulableTypes();

  constructor(
    private modalController: ModalController,
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private toastController: ToastController
  ) {
    // Configurar fechas mínimas y máximas
    const today = new Date();
    this.minDate = today.toISOString();
    
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // 30 días adelante
    this.maxDate = maxDate.toISOString();
  }

  ngOnInit() {
    // Seleccionar tipo de cita por defecto: Consulta General
    this.selectedAppointmentType = this.appointmentTypes.find(t => t.id === 'consulta') || this.appointmentTypes[0];
    
    // Si no hay fecha seleccionada, usar mañana como default
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.selectedDate = tomorrow.toISOString();
    this.loadAvailableSlots();
  }
  
  selectAppointmentType(type: AppointmentType) {
    this.selectedAppointmentType = type;
    // Recargar horarios disponibles porque la duración puede haber cambiado
    if (this.selectedDate) {
      this.selectedTimeSlot = ''; // Resetear horario seleccionado
      this.loadAvailableSlots();
    }
  }

  onDateChange() {
    this.selectedTimeSlot = '';
    this.loadAvailableSlots();
  }

  loadAvailableSlots() {
    if (!this.selectedDate) {
      this.availableTimeSlots = [];
      return;
    }

    const selectedDate = new Date(this.selectedDate);
    selectedDate.setHours(0, 0, 0, 0);
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    
    console.log('🔍 [DEBUG] Iniciando carga de horarios...');
    console.log('📅 [DEBUG] Fecha seleccionada:', selectedDate.toISOString());
    console.log('🕐 [DEBUG] Es hoy?:', isToday);
    
    // Filtrar horarios que ya pasaron solo si es hoy
    let validTimeSlots = [...this.allTimeSlots];
    if (isToday) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      validTimeSlots = this.allTimeSlots.filter(slot => {
        const [slotHour, slotMinute] = slot.split(':').map(Number);
        // Mostrar solo horarios con al menos 1 hora de anticipación
        return slotHour > currentHour || (slotHour === currentHour && slotMinute > currentMinute + 60);
      });
    }
    
    console.log('✅ [DEBUG] Slots válidos (después de filtrar por hora):', validTimeSlots);
    
    // Crear una fecha para la consulta (inicio y fin del día)
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    console.log('🔍 [DEBUG] Consultando horarios ocupados en Firestore...');
    console.log('📅 [DEBUG] Rango de consulta - Inicio:', startOfDay.toISOString());
    console.log('📅 [DEBUG] Rango de consulta - Fin:', endOfDay.toISOString());
    
    this.appointmentService.getBookedTimeSlotsForDate(startOfDay).subscribe(
      bookedSlots => {
        console.log('✅ [DEBUG] Respuesta de Firestore recibida');
        // Asegurar que bookedSlots es un array (puede ser null/undefined si no hay citas)
        this.bookedSlots = bookedSlots || [];
        
        console.log('📅 Fecha seleccionada:', selectedDate.toLocaleDateString());
        console.log('🔒 Slots ocupados:', this.bookedSlots);
        console.log('✅ Slots válidos (antes de filtrar):', validTimeSlots);
        
        // Si el tipo de cita requiere más de 30 minutos, validar slots consecutivos
        const duration = this.selectedAppointmentType?.duration || 30;
        const slotsNeeded = Math.ceil(duration / 30); // Cada slot es 30 min
        
        console.log('⏱️ Duración tipo de cita:', duration, 'min');
        console.log('📊 Slots necesarios:', slotsNeeded);
        
        // Filtrar horarios disponibles considerando duración
        this.availableTimeSlots = validTimeSlots.filter(slot => {
          // Verificar si el slot está ocupado
          if (this.bookedSlots.includes(slot)) {
            return false;
          }
          
          // Si solo necesita 1 slot (30 min o menos), ya está disponible
          if (slotsNeeded === 1) {
            return true;
          }
          
          // Para citas más largas, verificar que haya espacio consecutivo
          return this.hasConsecutiveSpace(slot, slotsNeeded, this.bookedSlots);
        });
        
        console.log('🎯 Horarios disponibles finales:', this.availableTimeSlots);
        console.log('🌅 Mañana:', this.getMorningSlots());
        console.log('🌆 Tarde:', this.getAfternoonSlots());
        
        if (this.availableTimeSlots.length === 0) {
          console.warn('⚠️ [ADVERTENCIA] No hay horarios disponibles para esta fecha');
        }
      },
      error => {
        console.error('❌ [ERROR] Error al cargar horarios ocupados:', error);
        console.error('❌ [ERROR] Detalles del error:', {
          message: error.message,
          code: error.code,
          stack: error.stack
        });
        
        // En caso de error, mostrar todos los slots como disponibles
        this.bookedSlots = [];
        this.availableTimeSlots = validTimeSlots;
        
        // Mostrar mensaje al usuario
        this.toastController.create({
          message: '⚠️ Problema al verificar disponibilidad. Intenta nuevamente.',
          duration: 3000,
          color: 'warning'
        }).then(toast => toast.present());
      }
    );
  }
  
  /**
   * Verifica si hay suficiente espacio consecutivo desde un slot inicial
   */
  private hasConsecutiveSpace(startSlot: string, slotsNeeded: number, bookedSlots: string[]): boolean {
    const startIndex = this.allTimeSlots.indexOf(startSlot);
    if (startIndex === -1) return false;
    
    // Verificar que existan suficientes slots consecutivos
    if (startIndex + slotsNeeded > this.allTimeSlots.length) {
      return false;
    }
    
    // Verificar que ninguno de los slots consecutivos esté ocupado
    for (let i = 0; i < slotsNeeded; i++) {
      const slotToCheck = this.allTimeSlots[startIndex + i];
      if (bookedSlots.includes(slotToCheck)) {
        return false;
      }
    }
    
    return true;
  }

  selectTimeSlot(slot: string) {
    this.selectedTimeSlot = slot;
  }

  getMorningSlots(): string[] {
    // Solo retornar slots disponibles (no ocupados)
    return this.availableTimeSlots.filter(slot => {
      const hour = parseInt(slot.split(':')[0]);
      return hour < 14; // Solo horarios de mañana
    });
  }

  getAfternoonSlots(): string[] {
    // Solo retornar slots disponibles (no ocupados)
    return this.availableTimeSlots.filter(slot => {
      const hour = parseInt(slot.split(':')[0]);
      return hour >= 14; // Solo horarios de tarde
    });
  }

  async dismiss() {
    await this.modalController.dismiss();
  }

  async scheduleAppointment() {
    if (!this.selectedDate || !this.selectedTimeSlot || !this.selectedAppointmentType) {
      const toast = await this.toastController.create({
        message: 'Por favor completa todos los campos',
        duration: 2000,
        color: 'warning'
      });
      toast.present();
      return;
    }

    try {
      const user = await this.authService.getCurrentUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // VALIDACIÓN: Verificar nuevamente si el horario sigue disponible
      const appointmentDate = new Date(this.selectedDate);
      appointmentDate.setHours(0, 0, 0, 0);
      
      const bookedSlots = await firstValueFrom(this.appointmentService.getBookedTimeSlotsForDate(appointmentDate));
      
      if (bookedSlots && bookedSlots.includes(this.selectedTimeSlot)) {
        const toast = await this.toastController.create({
          message: `⚠️ El horario ${this.selectedTimeSlot} ya fue reservado por otra persona. Por favor selecciona otro horario.`,
          duration: 4000,
          color: 'warning'
        });
        toast.present();
        
        // Recargar horarios disponibles
        this.loadAvailableSlots();
        this.selectedTimeSlot = '';
        return;
      }

      const appointmentDateTime = new Date(this.selectedDate);
      const [hours, minutes] = this.selectedTimeSlot.split(':');
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const appointment: Omit<VeterinaryAppointment, 'id'> = {
        userId: user.uid,
        userName: user.nombreCompleto,
        userEmail: user.email,
        petId: this.petId,
        petName: this.petName,
        appointmentDate: appointmentDateTime,
        timeSlot: this.selectedTimeSlot,
        status: 'pendiente',
        reason: this.reason.trim() || this.selectedAppointmentType.name, // Usar el nombre del tipo si no hay motivo
        createdAt: new Date(),
        // Datos del tipo de cita
        appointmentType: this.selectedAppointmentType.id,
        estimatedDuration: this.selectedAppointmentType.duration,
        preparationInstructions: this.selectedAppointmentType.preparationInstructions || '' // Evitar undefined
      };

      console.log('📝 Creando cita veterinaria:', {
        userId: user.uid,
        userName: user.nombreCompleto,
        petName: this.petName,
        appointmentDate: appointmentDateTime.toISOString(),
        timeSlot: this.selectedTimeSlot,
        appointmentType: this.selectedAppointmentType.name,
        duration: this.selectedAppointmentType.duration,
        status: 'pendiente'
      });

      await this.appointmentService.createVeterinaryAppointment(appointment);

      console.log('✅ Cita creada exitosamente');

      const toast = await this.toastController.create({
        message: `✅ ¡Cita de ${this.selectedAppointmentType.name} agendada para el ${appointmentDateTime.toLocaleDateString('es-ES')} a las ${this.selectedTimeSlot}!`,
        duration: 3000,
        color: 'success'
      });
      toast.present();

      await this.modalController.dismiss({ success: true });
    } catch (error) {
      console.error('❌ Error al agendar cita:', error);
      const toast = await this.toastController.create({
        message: 'Error al agendar la cita. Intenta nuevamente.',
        duration: 3000,
        color: 'danger'
      });
      toast.present();
    }
  }
}
