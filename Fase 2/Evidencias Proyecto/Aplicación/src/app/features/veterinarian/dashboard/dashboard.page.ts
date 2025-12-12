import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppointmentService } from '@features/appointments/services/appointment.service';
import { VeterinaryAppointment } from 'src/app/models/VeterinaryAppointment';
import { ToastController, AlertController } from '@ionic/angular';
import { getAppointmentTypeById, AppointmentType } from 'src/app/models/AppointmentType';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  appointments: VeterinaryAppointment[] = [];
  todayAppointments: VeterinaryAppointment[] = [];
  isLoading = true;
  selectedSegment: string = 'today';

  constructor(
    private router: Router,
    private appointmentService: AppointmentService,
    private toastController: ToastController,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.loadAppointments();
  }

  goToMenu() {
    this.router.navigate(['/pets/home']);
  }

  loadAppointments() {
    this.isLoading = true;

    // Cargar todas las citas
    this.appointmentService.getAllVeterinaryAppointments().subscribe(
      appointments => {
        this.appointments = appointments;
        this.isLoading = false;
      },
      error => {
        console.error('Error loading appointments:', error);
        this.presentToast('Error al cargar las citas', 'danger');
        this.isLoading = false;
      }
    );

    // Cargar citas del día
    this.appointmentService.getTodayVeterinaryAppointments().subscribe(
      appointments => {
        this.todayAppointments = appointments;
      },
      error => {
        console.error('Error loading today appointments:', error);
      }
    );
  }

  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
  }

  getFilteredAppointments(): VeterinaryAppointment[] {
    const now = new Date();

    switch (this.selectedSegment) {
      case 'today':
        return this.todayAppointments;

      case 'pending':
        return this.appointments.filter(apt =>
          apt.status === 'pendiente' && apt.appointmentDate >= now
        );

      case 'confirmed':
        return this.appointments.filter(apt =>
          apt.status === 'confirmada' && apt.appointmentDate >= now
        );

      case 'completed':
        return this.appointments
          .filter(apt => apt.status === 'completada')
          .sort((a, b) => b.appointmentDate.getTime() - a.appointmentDate.getTime());

      case 'all':
        return this.appointments.filter(apt => apt.appointmentDate >= now);

      default:
        return [];
    }
  }

  async confirmAppointment(appointment: VeterinaryAppointment) {
    const alert = await this.alertController.create({
      header: 'Confirmar Cita',
      message: `¿Confirmar la cita de ${appointment.petName} para ${this.formatDate(appointment.appointmentDate)} a las ${appointment.timeSlot}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          handler: async () => {
            try {
              await this.appointmentService.updateVeterinaryAppointmentStatus(
                appointment.id!,
                'confirmada'
              );
              this.presentToast('Cita confirmada exitosamente', 'success');
            } catch (error) {
              console.error('Error confirming appointment:', error);
              this.presentToast('Error al confirmar la cita', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async completeAppointment(appointment: VeterinaryAppointment) {
    const alert = await this.alertController.create({
      header: 'Atender Mascota',
      message: `¿Iniciar consulta de ${appointment.petName}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Iniciar Consulta',
          handler: async () => {
            try {
              // Navegar a pre-consulta
              this.router.navigate(['/veterinarian/consultation-preconsult', appointment.id]);
            } catch (error) {
              console.error('Error starting consultation:', error);
              this.presentToast('Error al iniciar consulta', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Método adicional para marcar como completada directamente
  async markAsCompleted(appointment: VeterinaryAppointment) {
    const alert = await this.alertController.create({
      header: 'Completar Cita',
      message: `¿Marcar como completada la cita de ${appointment.petName}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Completar',
          handler: async () => {
            try {
              await this.appointmentService.updateVeterinaryAppointmentStatus(
                appointment.id!,
                'completada'
              );
              this.presentToast('Cita marcada como completada', 'success');
            } catch (error) {
              console.error('Error completing appointment:', error);
              this.presentToast('Error al completar la cita', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async cancelAppointment(appointment: VeterinaryAppointment) {
    const alert = await this.alertController.create({
      header: 'Cancelar Cita',
      message: `¿Estás seguro de cancelar la cita de ${appointment.petName}?`,
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Motivo de cancelación (opcional)'
        }
      ],
      buttons: [
        {
          text: 'No',
          role: 'cancel'
        },
        {
          text: 'Sí, Cancelar',
          handler: async () => {
            try {
              await this.appointmentService.cancelVeterinaryAppointment(appointment.id!);
              this.presentToast('Cita cancelada', 'warning');
            } catch (error) {
              console.error('Error cancelling appointment:', error);
              this.presentToast('Error al cancelar la cita', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async viewAppointmentDetails(appointment: VeterinaryAppointment) {
    // Navegar a la página de detalles de la consulta
    this.router.navigate(['/veterinarian/consultation', appointment.id], {
      queryParams: { viewOnly: true }
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pendiente':
        return 'warning';
      case 'confirmada':
        return 'primary';
      case 'completada':
        return 'success';
      case 'cancelada':
        return 'danger';
      default:
        return 'medium';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pendiente':
        return 'time-outline';
      case 'confirmada':
        return 'checkmark-circle-outline';
      case 'completada':
        return 'checkmark-done-outline';
      case 'cancelada':
        return 'close-circle-outline';
      default:
        return 'help-outline';
    }
  }

  // ========== APPOINTMENT TYPE HELPERS ==========

  getAppointmentType(appointment: VeterinaryAppointment): AppointmentType | undefined {
    if (!appointment.appointmentType) return undefined;
    return getAppointmentTypeById(appointment.appointmentType);
  }

  getAppointmentTypeName(appointment: VeterinaryAppointment): string {
    const type = this.getAppointmentType(appointment);
    return type ? type.name : 'Consulta General';
  }

  getAppointmentTypeColor(appointment: VeterinaryAppointment): string {
    const type = this.getAppointmentType(appointment);
    return type ? type.color : '#3880ff';
  }

  getAppointmentTypeIcon(appointment: VeterinaryAppointment): string {
    const type = this.getAppointmentType(appointment);
    return type ? type.icon : 'medical-outline';
  }

  getAppointmentDuration(appointment: VeterinaryAppointment): number {
    return appointment.estimatedDuration || 30;
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color
    });
    toast.present();
  }

  doRefresh(event: any) {
    this.loadAppointments();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  // ========== MÉTODOS PARA MÉTRICAS DEL DASHBOARD ==========

  getConfirmedTodayCount(): number {
    if (!this.todayAppointments || !Array.isArray(this.todayAppointments)) {
      return 0;
    }
    return this.todayAppointments.filter(apt => apt.status === 'confirmada').length;
  }

  getPendingCount(): number {
    if (!this.appointments || !Array.isArray(this.appointments)) {
      return 0;
    }
    return this.appointments.filter(apt => apt.status === 'pendiente').length;
  }

  getCompletedThisWeekCount(): number {
    if (!this.appointments || !Array.isArray(this.appointments)) {
      return 0;
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return this.appointments.filter(apt =>
      apt.status === 'completada' &&
      apt.appointmentDate >= oneWeekAgo
    ).length;
  }

  getNextAppointment(): VeterinaryAppointment | null {
    if (!this.appointments || !Array.isArray(this.appointments)) {
      return null;
    }

    const now = new Date();
    const upcoming = this.appointments
      .filter(apt =>
        (apt.status === 'confirmada' || apt.status === 'pendiente') &&
        apt.appointmentDate >= now
      )
      .sort((a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime());

    return upcoming.length > 0 ? upcoming[0] : null;
  }

  getTimeUntilNext(appointment: VeterinaryAppointment | null): string {
    if (!appointment) return '--';

    const now = new Date();
    const diff = appointment.appointmentDate.getTime() - now.getTime();

    // Convertir a minutos
    const minutes = Math.floor(diff / 1000 / 60);

    if (minutes < 0) return 'Vencida';
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ${minutes % 60}m`;

    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
}
