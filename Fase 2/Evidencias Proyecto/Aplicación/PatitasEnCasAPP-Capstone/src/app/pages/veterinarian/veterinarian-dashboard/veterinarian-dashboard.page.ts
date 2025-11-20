import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController, ModalController } from '@ionic/angular';
import { Observable, Subject, combineLatest, BehaviorSubject } from 'rxjs';
import { map, takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Adopcion } from 'src/app/models/Adopcion';
import { PetsService } from 'src/app/services/pets.service';
import { AuthService } from 'src/app/services/auth.service';
import { VeterinarianService } from '../services/veterinarian.service';
import { AppointmentDetailModalComponent } from '../components/appointment-detail-modal/appointment-detail-modal.component';
import { 
  VeterinarianMetrics, 
  DayActivity, 
  ConsultationStats, 
  WeeklyActivity,
  VetNotification,
  AppointmentCard 
} from '../models/veterinarian.interfaces';
import { TIME_CONSTANTS, PAGINATION_CONSTANTS } from '../constants/veterinarian.constants';

@Component({
  selector: 'app-veterinarian-dashboard',
  templateUrl: './veterinarian-dashboard.page.html',
  styleUrls: ['./veterinarian-dashboard.page.scss'],
})
export class VeterinarianDashboardPage implements OnInit, OnDestroy {
  
  private destroy$ = new Subject<void>();
  private searchSubject$ = new BehaviorSubject<string>('');
  
  // Vista actual
  currentView: 'dashboard' | 'appointments' | 'patients' | 'history' = 'dashboard';
  appointmentFilter = 'all';
  currentDate = new Date();
  searchQuery = '';
  
  // Paginación
  appointmentsPage = 0;
  appointmentsPageSize = PAGINATION_CONSTANTS.APPOINTMENTS_PAGE_SIZE;
  patientsPage = 0;
  patientsPageSize = PAGINATION_CONSTANTS.PATIENTS_PAGE_SIZE;
  hasMoreAppointments = true;
  hasMorePatients = true;
  
  // Datos del dashboard
  metrics$: Observable<VeterinarianMetrics>;
  todayActivities$: Observable<DayActivity[]>;
  consultationStats$: Observable<ConsultationStats[]>;
  weeklyActivity$: Observable<WeeklyActivity[]>;
  unreadNotifications$: Observable<VetNotification[]>;
  upcomingAppointments$: Observable<AppointmentCard[]>;
  emergencies$: Observable<AppointmentCard[]>;
  
  // Datos de citas
  allAppointments$: Observable<AppointmentCard[]>;
  filteredAppointments$: Observable<AppointmentCard[]>;
  
  // Datos originales de mascotas
  allPets$: Observable<Adopcion[]>;
  pets$: Observable<Adopcion[]>;
  
  // Estados de carga
  isLoading = false;
  selectedTimeRange = 'today';
  
  constructor(
    private petsService: PetsService,
    private authService: AuthService,
    private veterinarianService: VeterinarianService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private modalController: ModalController
  ) {
    this.initializeObservables();
  }

  async ngOnInit() {
    this.allPets$ = this.petsService.getAllPets();
    
    // Filtrar solo pacientes: mascotas adoptadas o con historial de citas
    // NO mostrar mascotas en adopción (available, in_process, reserved)
    this.pets$ = combineLatest([
      this.allPets$,
      this.allAppointments$
    ]).pipe(
      map(([allPets, appointments]) => {
        // IDs de mascotas que han tenido citas
        const petsWithAppointments = new Set(appointments.map(apt => apt.petId));
        
        // Filtrar mascotas que:
        // 1. Han tenido citas veterinarias O
        // 2. Están adoptadas (tienen currentOwnerId y status === 'adopted') Y
        // 3. NO están en proceso de adopción (status !== 'available', 'in_process', 'reserved')
        return allPets.filter(pet => {
          // Excluir mascotas disponibles para adopción
          const isInAdoption = pet.status === 'available' || 
                               pet.status === 'in_process' || 
                               pet.status === 'reserved';
          
          // Solo incluir si NO está en adopción Y (tiene citas O está adoptada)
          const hasMedicalHistory = petsWithAppointments.has(pet.id || '');
          const isAdopted = pet.status === 'adopted' || pet.currentOwnerId;
          
          return !isInAdoption && (hasMedicalHistory || isAdopted);
        });
      })
    );
    
    // Inicializar datos reales del veterinario
    await this.initializeVeterinarianData();
    
    // Inicializar filtros de citas
    this.filterAppointments('all');
  }

  private async initializeVeterinarianData() {
    try {
      const currentUser = await this.authService.getCurrentUser();
      if (currentUser) {
        // Verificar si el usuario actual es veterinario
        const userDoc = await this.petsService['firestore'].doc(`users/${currentUser.uid}`).get().toPromise();
        const userData = userDoc?.data() as any;
        
        if (userData?.isVeterinarian) {
          // Cargar datos específicos del veterinario
          this.loadVeterinarianSpecificData(currentUser.uid);
        }
      }
    } catch (error) {
      console.error('Error initializing veterinarian data:', error);
    }
  }

  private loadVeterinarianSpecificData(vetId: string) {
    // Las observables ya están configuradas en initializeObservables()
    // Solo necesitamos asegurarnos de que se están cargando datos reales
    console.log('Loading real veterinarian data for:', vetId);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ionViewWillEnter() {
    // Refresh data when entering the view
    this.loadDashboardData();
  }

  private initializeObservables() {
    this.metrics$ = this.veterinarianService.getMetrics();
    this.todayActivities$ = this.veterinarianService.getTodayActivities();
    this.consultationStats$ = this.veterinarianService.getConsultationStats();
    this.weeklyActivity$ = this.veterinarianService.getWeeklyActivity();
    this.unreadNotifications$ = this.veterinarianService.getUnreadNotifications();
    this.upcomingAppointments$ = this.veterinarianService.getUpcomingAppointments();
    this.emergencies$ = this.veterinarianService.getActiveEmergencies();
    
    // Inicializar observables de citas
    this.allAppointments$ = this.veterinarianService.appointments$;
    this.filteredAppointments$ = this.allAppointments$;
    
    // Implementar búsqueda con debounce
    this.setupSearch();
  }

  private loadDashboardData() {
    // Cargar datos del dashboard
    this.isLoading = true;
    
    // Simular carga de datos
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  // Navegación entre vistas
  switchView(view: string | number) {
    this.currentView = String(view) as 'dashboard' | 'appointments' | 'patients' | 'history';
  }

  // Cambio de segmento eliminado - ya no hay segmentos

  // Navegación
  goToPetHistory(petId: string) {
    this.router.navigate(['/veterinarian/pet-medical-history', petId]);
  }

  goToAppointments() {
    this.router.navigate(['/veterinarian/vet-appointments']);
  }

  goToNotifications() {
    this.switchView('notifications');
  }

  goToAddMedicalRecord() {
    this.router.navigate(['/medical-record']);
  }

  // Acciones rápidas
  async handleQuickAction(action: string, data?: any) {
    switch (action) {
      case 'emergency':
        this.router.navigate(['/emergency-appointment'], { queryParams: data });
        break;
      case 'appointment':
        this.switchView('appointments'); // Cambiar a la vista de citas en el mismo dashboard
        break;
      case 'notification':
        this.veterinarianService.markNotificationAsRead(data.id);
        if (data.action) {
          this.router.navigate([data.action.route]);
        }
        break;
      case 'confirm_appointment':
        await this.quickConfirmAppointment(data);
        break;
      case 'start_appointment':
        await this.startAppointment(data);
        break;
    }
  }

  // Confirmar cita rápidamente
  async quickConfirmAppointment(appointment: any) {
    try {
      await this.veterinarianService.updateAppointmentStatus(appointment.id, 'confirmed');
      // Mostrar mensaje de éxito (puedes agregar ToastService si es necesario)
      console.log(`Cita con ${appointment.petName} confirmada`);
    } catch (error) {
      console.error('Error confirming appointment:', error);
    }
  }

  // Iniciar cita
  async startAppointment(appointment: any) {
    try {
      await this.veterinarianService.updateAppointmentStatus(appointment.id, 'in_progress');
      // Navegar a pre-consulta primero
      this.router.navigate(['/veterinarian/preconsult', appointment.id]);
    } catch (error) {
      console.error('Error starting appointment:', error);
    }
  }

  // Filtros de tiempo
  changeTimeRange(range: string) {
    this.selectedTimeRange = range;
    this.loadDashboardData();
  }

  // Configurar búsqueda con debounce
  private setupSearch() {
    // Búsqueda en citas
    this.searchSubject$.pipe(
      debounceTime(TIME_CONSTANTS.DEBOUNCE_TIME_MS),
      distinctUntilChanged(),
      switchMap(query => 
        this.allAppointments$.pipe(
          map(appointments => this.searchAppointments(appointments, query))
        )
      ),
      takeUntil(this.destroy$)
    ).subscribe(filtered => {
      // Actualizar filteredAppointments$ solo si estamos en vista de citas
      if (this.currentView === 'appointments') {
        this.filteredAppointments$ = new BehaviorSubject(filtered).asObservable();
      }
    });

    // Búsqueda en pacientes
    this.searchSubject$.pipe(
      debounceTime(TIME_CONSTANTS.DEBOUNCE_TIME_MS),
      distinctUntilChanged(),
      switchMap(query => 
        this.allPets$.pipe(
          map(pets => this.searchPets(pets, query))
        )
      ),
      takeUntil(this.destroy$)
    ).subscribe(filtered => {
      // Actualizar pets$ solo si estamos en vista de pacientes
      if (this.currentView === 'patients') {
        this.pets$ = new BehaviorSubject(filtered).asObservable();
      }
    });
  }

  // Manejador de cambio de búsqueda (llamado desde el template)
  onSearchChange(event: any) {
    const query = event?.detail?.value || '';
    this.searchQuery = query;
    this.searchSubject$.next(query.toLowerCase().trim());
  }

  // Búsqueda en citas (multi-campo)
  private searchAppointments(appointments: AppointmentCard[], query: string): AppointmentCard[] {
    if (!query) {
      return appointments;
    }

    return appointments.filter(apt => {
      const petNameMatch = apt.petName?.toLowerCase().includes(query);
      const ownerNameMatch = apt.ownerName?.toLowerCase().includes(query);
      const reasonMatch = apt.reason?.toLowerCase().includes(query);
      const statusMatch = apt.status?.toLowerCase().includes(query);
      const dateMatch = new Date(apt.date).toLocaleDateString('es-ES').includes(query);
      
      return petNameMatch || ownerNameMatch || reasonMatch || statusMatch || dateMatch;
    });
  }

  // Búsqueda en mascotas (multi-campo)
  private searchPets(pets: Adopcion[], query: string): Adopcion[] {
    if (!query) {
      return pets;
    }

    return pets.filter(pet => {
      const nameMatch = pet.nombre?.toLowerCase().includes(query);
      const breedMatch = pet.raza?.toLowerCase().includes(query);
      const speciesMatch = pet.tipoMascota?.toLowerCase().includes(query);
      const statusMatch = pet.status?.toLowerCase().includes(query);
      
      return nameMatch || breedMatch || speciesMatch || statusMatch;
    });
  }

  // Obtener color para prioridad
  getPriorityColor(priority: string): string {
    const colors = {
      'low': 'success',
      'medium': 'warning', 
      'high': 'danger',
      'critical': 'danger'
    };
    return colors[priority as keyof typeof colors] || 'medium';
  }

  // Obtener ícono para tipo de actividad
  getActivityIcon(type: string): string {
    const icons = {
      'appointment': 'calendar-outline',
      'emergency': 'alert-circle-outline',
      'followup': 'refresh-outline',
      'reminder': 'alarm-outline'
    };
    return icons[type as keyof typeof icons] || 'ellipse-outline';
  }

  // Obtener color para tipo de consulta
  getConsultationColor(type: string): string {
    const colors = {
      'Chequeos Generales': '#4CAF50',
      'Vacunaciones': '#2196F3',
      'Emergencias': '#F44336', 
      'Cirugías': '#FF9800',
      'Seguimientos': '#9C27B0'
    };
    return colors[type as keyof typeof colors] || '#757575';
  }

  // Filtrar citas
  filterAppointments(filter: string) {
    this.appointmentFilter = filter;
    
    this.filteredAppointments$ = this.allAppointments$.pipe(
      map(appointments => {
        let filtered = [...appointments];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        switch (filter) {
          case 'today':
            filtered = appointments.filter(apt => {
              const aptDate = new Date(apt.date);
              aptDate.setHours(0, 0, 0, 0);
              return aptDate.getTime() === today.getTime();
            });
            break;
          case 'upcoming':
            filtered = appointments.filter(apt => 
              apt.date > new Date() && 
              apt.status !== 'completed' && 
              apt.status !== 'cancelled'
            );
            break;
          case 'pending':
            filtered = appointments.filter(apt => apt.status === 'pending');
            break;
          case 'all':
          default:
            // No filtrar, mostrar todas
            break;
        }
        
        // Ordenar por fecha
        return filtered.sort((a, b) => a.date.getTime() - b.date.getTime());
      })
    );
  }

  // Crear nueva cita
  createNewAppointment() {
    this.router.navigate(['/request-appointment']);
  }

  // Ver detalles de cita
  async openAppointmentDetails(appointment: AppointmentCard) {
    const modal = await this.modalController.create({
      component: AppointmentDetailModalComponent,
      componentProps: {
        appointment: appointment
      },
      cssClass: 'appointment-detail-modal'
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    
    // Manejar acciones cuando se cierra el modal
    if (data) {
      if (data.action === 'start') {
        await this.startAppointment(data.appointment);
      } else if (data.action === 'reschedule') {
        await this.rescheduleAppointment(data.appointment);
      }
    }
  }

  // Obtener color del estado
  getStatusColor(status: string): string {
    const colors = {
      'pending': 'warning',
      'confirmed': 'primary',
      'in_progress': 'secondary',
      'completed': 'success',
      'cancelled': 'danger'
    };
    return colors[status as keyof typeof colors] || 'medium';
  }

  // Obtener texto del estado
  getStatusText(status: string): string {
    const texts = {
      'pending': 'Pendiente',
      'confirmed': 'Confirmada',
      'in_progress': 'En Progreso',
      'completed': 'Completada',
      'cancelled': 'Cancelada'
    };
    return texts[status as keyof typeof texts] || status;
  }

  // Obtener ícono de prioridad
  getPriorityIcon(priority: string): string {
    const icons = {
      'low': 'information-circle',
      'medium': 'warning',
      'high': 'alert-circle',
      'critical': 'skull'
    };
    return icons[priority as keyof typeof icons] || 'help-circle';
  }

  // Completar cita con confirmación
  async completeAppointment(appointment: AppointmentCard) {
    const alert = await this.alertController.create({
      header: '✅ Completar Cita',
      subHeader: `${appointment.petName} - ${appointment.ownerName}`,
      message: `
        <div style="margin: 16px 0; padding: 12px; background: #e8f5e9; border-radius: 8px; border-left: 4px solid #4CAF50;">
          <p style="margin: 4px 0;"><strong>Fecha:</strong> ${appointment.date.toLocaleDateString('es-ES')}</p>
          <p style="margin: 4px 0;"><strong>Hora:</strong> ${appointment.date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
          <p style="margin: 4px 0;"><strong>Motivo:</strong> ${appointment.reason || 'No especificado'}</p>
        </div>
        <p style="margin-top: 12px;">¿Confirmas que deseas marcar esta cita como completada?</p>
        <p style="color: #666; font-size: 13px; margin-top: 8px;">Esta acción no se puede deshacer.</p>
      `,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: '✅ Completar',
          cssClass: 'primary',
          handler: async () => {
            try {
              const loading = await this.loadingController.create({
                message: 'Completando cita...',
                duration: 2000
              });
              await loading.present();

              await this.veterinarianService.updateAppointmentStatus(appointment.id, 'completed');
              
              await loading.dismiss();
              await this.showToast(`Cita con ${appointment.petName} completada exitosamente`, 'success');
            } catch (error) {
              console.error('Error completing appointment:', error);
              await this.showToast('Error al completar la cita', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Cancelar cita con confirmación y motivo
  async cancelAppointment(appointment: AppointmentCard) {
    const alert = await this.alertController.create({
      header: '❌ Cancelar Cita',
      subHeader: `${appointment.petName} - ${appointment.ownerName}`,
      message: `
        <div style="margin: 16px 0; padding: 12px; background: #ffebee; border-radius: 8px; border-left: 4px solid #f44336;">
          <p style="margin: 4px 0;"><strong>Fecha:</strong> ${appointment.date.toLocaleDateString('es-ES')}</p>
          <p style="margin: 4px 0;"><strong>Hora:</strong> ${appointment.date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
          <p style="margin: 4px 0;"><strong>Motivo:</strong> ${appointment.reason || 'No especificado'}</p>
        </div>
        <p style="margin-top: 12px; color: #d32f2f;"><strong>⚠️ ¿Estás seguro de cancelar esta cita?</strong></p>
        <p style="color: #666; font-size: 13px; margin-top: 8px;">Por favor indica el motivo de la cancelación:</p>
      `,
      inputs: [
        {
          name: 'cancellationReason',
          type: 'textarea',
          placeholder: 'Motivo de cancelación (requerido)',
          attributes: {
            rows: 3,
            required: true
          }
        }
      ],
      buttons: [
        {
          text: 'No Cancelar',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: '❌ Sí, Cancelar',
          cssClass: 'danger',
          handler: async (data) => {
            if (!data.cancellationReason || data.cancellationReason.trim() === '') {
              this.showToast('Debes indicar el motivo de cancelación', 'warning');
              return false;
            }

            try {
              const loading = await this.loadingController.create({
                message: 'Cancelando cita...',
                duration: 2000
              });
              await loading.present();

              await this.veterinarianService.cancelAppointment(appointment.id, data.cancellationReason);
              
              await loading.dismiss();
              await this.showToast('Cita cancelada exitosamente', 'success');
              return true;
            } catch (error) {
              console.error('Error cancelling appointment:', error);
              await this.showToast('Error al cancelar la cita', 'danger');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Reagendar cita
  async rescheduleAppointment(appointment: AppointmentCard) {
    // Calcular fecha mínima (ahora) y fecha sugerida (mañana a la misma hora)
    const now = new Date();
    const suggestedDate = new Date(appointment.date);
    suggestedDate.setDate(suggestedDate.getDate() + 1); // Un día después
    
    // Si la fecha sugerida ya pasó, usar mañana
    if (suggestedDate < now) {
      suggestedDate.setTime(now.getTime() + 24 * 60 * 60 * 1000);
      suggestedDate.setHours(appointment.date.getHours(), appointment.date.getMinutes(), 0, 0);
    }

    const alert = await this.alertController.create({
      header: '📅 Reagendar Cita',
      subHeader: `${appointment.petName} - ${appointment.ownerName}`,
      message: `
        <div style="margin: 16px 0; padding: 12px; background: #f0f0f0; border-radius: 8px;">
          <p style="margin: 4px 0;"><strong>Cita actual:</strong></p>
          <p style="margin: 4px 0; color: #666;">📆 ${appointment.date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p style="margin: 4px 0; color: #666;">🕐 ${appointment.date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <p style="margin-top: 16px;"><strong>Seleccione la nueva fecha y hora:</strong></p>
      `,
      inputs: [
        {
          name: 'newDate',
          type: 'datetime-local',
          min: now.toISOString().slice(0, 16),
          value: suggestedDate.toISOString().slice(0, 16),
          attributes: {
            style: 'font-size: 14px; padding: 8px; border: 2px solid #4CAF50; border-radius: 8px;'
          }
        },
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Motivo del reagendamiento (opcional)',
          attributes: {
            rows: 3,
            style: 'font-size: 14px; margin-top: 8px;'
          }
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: '✅ Reagendar',
          cssClass: 'primary',
          handler: (data) => {
            if (data.newDate) {
              const newDateTime = new Date(data.newDate);
              
              // Validar que la nueva fecha sea futura
              if (newDateTime <= now) {
                this.showToast('La fecha debe ser futura', 'warning');
                return false;
              }
              
              this.confirmReschedule(appointment, newDateTime, data.reason);
              return true;
            } else {
              this.showToast('Por favor seleccione una fecha', 'warning');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Confirmar reagendamiento
  private async confirmReschedule(appointment: AppointmentCard, newDate: Date, reason?: string) {
    try {
      const loading = await this.loadingController.create({
        message: 'Reagendando cita...',
        duration: 2000
      });
      await loading.present();

      // Actualizar la cita con la nueva fecha
      await this.veterinarianService.rescheduleAppointment(appointment.id, newDate, reason);
      
      await loading.dismiss();

      // Mostrar mensaje de éxito
      const toast = await this.toastController.create({
        message: `Cita reagendada para el ${newDate.toLocaleDateString('es-ES')} a las ${newDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
        duration: 3000,
        color: 'success',
        position: 'top'
      });
      await toast.present();

      // Notificar al dueño (opcional - aquí puedes implementar notificación)
      if (reason) {
        this.sendRescheduleNotification(appointment, newDate, reason);
      }

    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      
      const errorToast = await this.toastController.create({
        message: 'Error al reagendar la cita. Inténtalo nuevamente.',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await errorToast.present();
    }
  }

  // Enviar notificación de reagendamiento
  private sendRescheduleNotification(appointment: AppointmentCard, newDate: Date, reason: string) {
    // Aquí puedes implementar el envío de notificaciones push, email, etc.
    console.log(`Notification sent: Appointment rescheduled for ${appointment.petName} to ${newDate.toLocaleDateString()}`);
    
    // Ejemplo de notificación en la app
    const notification = {
      userId: appointment.petId, // o el ID del dueño
      title: 'Cita Reagendada',
      message: `Tu cita para ${appointment.petName} ha sido reagendada para el ${newDate.toLocaleDateString('es-ES')} a las ${newDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
      type: 'appointment_reschedule',
      reason: reason
    };
    
    // Guardar notificación en Firestore (implementar según tu estructura)
    // this.notificationService.sendNotification(notification);
  }

  // ===============================================
  // MÉTODOS AUXILIARES PARA LAS NUEVAS VISTAS
  // ===============================================

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Pendiente',
      'confirmed': 'Confirmada',
      'in_progress': 'En Curso',
      'completed': 'Completada',
      'cancelled': 'Cancelada'
    };
    return labels[status] || status;
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'pending': 'time-outline',
      'confirmed': 'checkmark-circle-outline',
      'in_progress': 'hourglass-outline',
      'completed': 'checkmark-done-outline',
      'cancelled': 'close-circle-outline'
    };
    return icons[status] || 'help-outline';
  }

  calculateAge(edad: string | number): string {
    if (!edad) return 'N/A';
    
    const ageNum = typeof edad === 'string' ? parseInt(edad) : edad;
    if (isNaN(ageNum)) return 'N/A';
    
    if (ageNum < 12) {
      return `${ageNum} ${ageNum === 1 ? 'mes' : 'meses'}`;
    }
    
    const years = Math.floor(ageNum / 12);
    const months = ageNum % 12;
    
    if (months === 0) {
      return `${years} ${years === 1 ? 'año' : 'años'}`;
    }
    
    return `${years} ${years === 1 ? 'año' : 'años'} y ${months} ${months === 1 ? 'mes' : 'meses'}`;
  }

  viewPetDetails(pet: Adopcion) {
    // Navegar a los detalles de la mascota
    this.router.navigate(['/detalle', pet.id]);
  }

  viewAppointmentDetails(appointment: AppointmentCard) {
    // Usar el mismo método que openAppointmentDetails
    this.openAppointmentDetails(appointment);
  }

  getFilteredAppointments(appointments: AppointmentCard[]): AppointmentCard[] {
    if (!appointments) return [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (this.appointmentFilter) {
      case 'today':
        return appointments.filter(apt => {
          const aptDate = new Date(apt.date);
          return aptDate >= today && aptDate < tomorrow;
        });
      
      case 'pending':
        return appointments.filter(apt => apt.status === 'pending');
      
      case 'completed':
        return appointments.filter(apt => apt.status === 'completed');
      
      case 'all':
      default:
        return appointments;
    }
  }

  getCompletedAppointments(appointments: AppointmentCard[]): AppointmentCard[] {
    if (!appointments) return [];
    
    return appointments
      .filter(apt => apt.status === 'completed')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  handleSearch(event: any) {
    const query = event.target.value?.toLowerCase() || '';
    this.searchQuery = query;
    
    // Aquí puedes implementar la lógica de búsqueda
    // Por ejemplo, filtrar las citas por nombre de mascota o dueño
    console.log('Buscando:', query);
  }

  async viewMedicalHistory(pet: Adopcion, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/veterinarian/pet-medical-history', pet.id]);
  }

  // Mostrar toast
  private async showToast(message: string, color: string = 'dark') {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'top'
    });
    await toast.present();
  }

  /**
   * PAGINACIÓN
   */

  // Cargar más citas (infinite scroll)
  loadMoreAppointments(event?: any) {
    this.appointmentsPage++;
    
    this.filteredAppointments$ = this.filteredAppointments$.pipe(
      map(appointments => {
        const start = 0;
        const end = (this.appointmentsPage + 1) * this.appointmentsPageSize;
        const paged = appointments.slice(start, end);
        
        // Verificar si hay más datos
        this.hasMoreAppointments = appointments.length > end;
        
        if (event) {
          event.target.complete();
          
          // Deshabilitar infinite scroll si no hay más datos
          if (!this.hasMoreAppointments) {
            event.target.disabled = true;
          }
        }
        
        return paged;
      })
    );
  }

  // Cargar más pacientes (infinite scroll)
  loadMorePatients(event?: any) {
    this.patientsPage++;
    
    this.pets$ = this.pets$.pipe(
      map(pets => {
        const start = 0;
        const end = (this.patientsPage + 1) * this.patientsPageSize;
        const paged = pets.slice(start, end);
        
        // Verificar si hay más datos
        this.hasMorePatients = pets.length > end;
        
        if (event) {
          event.target.complete();
          
          // Deshabilitar infinite scroll si no hay más datos
          if (!this.hasMorePatients) {
            event.target.disabled = true;
          }
        }
        
        return paged;
      })
    );
  }

  // Resetear paginación de citas
  resetAppointmentsPagination() {
    this.appointmentsPage = 0;
    this.hasMoreAppointments = true;
  }

  // Resetear paginación de pacientes
  resetPatientsPagination() {
    this.patientsPage = 0;
    this.hasMorePatients = true;
  }

  // Obtener citas paginadas
  getPaginatedAppointments(appointments: AppointmentCard[]): AppointmentCard[] {
    const end = (this.appointmentsPage + 1) * this.appointmentsPageSize;
    return appointments.slice(0, end);
  }

  // Obtener pacientes paginados
  getPaginatedPatients(pets: Adopcion[]): Adopcion[] {
    const end = (this.patientsPage + 1) * this.patientsPageSize;
    return pets.slice(0, end);
  }
}

