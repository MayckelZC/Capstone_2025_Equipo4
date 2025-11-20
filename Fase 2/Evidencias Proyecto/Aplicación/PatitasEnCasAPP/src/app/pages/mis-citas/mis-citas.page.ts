import { Component, OnInit, OnDestroy } from '@angular/core';
import { AppointmentService } from 'src/app/services/appointment.service';
import { AuthService } from 'src/app/services/auth.service';
import { VeterinaryAppointment } from 'src/app/models/VeterinaryAppointment';
import { ToastController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-mis-citas',
  templateUrl: './mis-citas.page.html',
  styleUrls: ['./mis-citas.page.scss'],
})
export class MisCitasPage implements OnInit, OnDestroy {
  appointments: VeterinaryAppointment[] = [];
  isLoading = true;
  selectedSegment: string = 'upcoming';
  private appointmentsSubscription?: Subscription;

  constructor(
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private toastController: ToastController,
    private alertController: AlertController,
    private router: Router
  ) { }

  async ngOnInit() {
    const user = await this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadAppointments(user.uid);
  }

  loadAppointments(userId: string) {
    this.isLoading = true;
    this.appointmentsSubscription = this.appointmentService.getMyVeterinaryAppointments(userId).subscribe(
      appointments => {
        this.appointments = appointments;
        this.isLoading = false;
      },
      error => {
        console.error('Error loading appointments:', error);
        this.presentToast('Error al cargar tus citas', 'danger');
        this.isLoading = false;
      }
    );
  }

  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
  }

  private convertToDate(date: Date | any): Date {
    return date instanceof Date ? date : new Date(date);
  }

  private sortByDate(a: VeterinaryAppointment, b: VeterinaryAppointment, ascending = true): number {
    const dateA = this.convertToDate(a.appointmentDate).getTime();
    const dateB = this.convertToDate(b.appointmentDate).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  }

  getFilteredAppointments(): VeterinaryAppointment[] {
    const now = new Date();
    
    switch (this.selectedSegment) {
      case 'upcoming':
        return this.appointments.filter(apt => {
          const aptDate = this.convertToDate(apt.appointmentDate);
          const isFuture = aptDate >= now;
          const isValidStatus = apt.status === 'pendiente' || apt.status === 'confirmada';
          return isFuture && isValidStatus;
        }).sort((a, b) => this.sortByDate(a, b, true));
      
      case 'completed':
        return this.appointments
          .filter(apt => apt.status === 'completada')
          .sort((a, b) => this.sortByDate(a, b, false));
      
      case 'cancelled':
        return this.appointments
          .filter(apt => apt.status === 'cancelada')
          .sort((a, b) => this.sortByDate(a, b, false));
      
      default:
        return [];
    }
  }

  async cancelAppointment(appointment: VeterinaryAppointment) {
    const alert = await this.alertController.create({
      header: 'Cancelar Cita',
      message: `¿Estás seguro de cancelar la cita de ${appointment.petName} para el ${this.formatDate(appointment.appointmentDate)}?`,
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
              this.presentToast('Cita cancelada exitosamente', 'success');
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

  getStatusText(status: string): string {
    switch (status) {
      case 'pendiente':
        return 'Pendiente de confirmación';
      case 'confirmada':
        return 'Confirmada';
      case 'completada':
        return 'Completada';
      case 'cancelada':
        return 'Cancelada';
      default:
        return status;
    }
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
    this.authService.getCurrentUser().then(user => {
      if (user) {
        this.loadAppointments(user.uid);
      }
      setTimeout(() => {
        event.target.complete();
      }, 1000);
    });
  }

  ngOnDestroy() {
    if (this.appointmentsSubscription) {
      this.appointmentsSubscription.unsubscribe();
    }
  }

  trackByAppointmentId(index: number, appointment: VeterinaryAppointment): string {
    return appointment.id || index.toString();
  }
}
