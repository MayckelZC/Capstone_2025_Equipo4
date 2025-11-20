import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { AppointmentService } from '../../services/appointment.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Adopcion } from '../../models/Adopcion';
import { User } from '../../models/user';

@Component({
  selector: 'app-appointment-modal',
  templateUrl: './appointment-modal.component.html',
  styleUrls: ['./appointment-modal.component.scss'],
})
export class AppointmentModalComponent implements OnInit {
  @Input() mascota!: Adopcion;

  appointmentForm!: FormGroup;
  veterinarians: User[] = [];
  isLoading = false;
  minDate: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private modalController: ModalController,
    private appointmentService: AppointmentService,
    private userService: UserService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.loadVeterinarians();
    this.setMinDate();
  }

  initializeForm() {
    this.appointmentForm = this.formBuilder.group({
      vetId: ['', Validators.required],
      date: ['', Validators.required],
      time: ['', Validators.required],
      reason: ['', [Validators.required, Validators.minLength(10)]],
      notes: ['', [Validators.maxLength(500)]]
    });
  }

  loadVeterinarians() {
    this.userService.getUsersByRole('isVeterinarian').subscribe(
      (vets: User[]) => {
        this.veterinarians = vets;
      },
      (error) => {
        console.error('Error loading veterinarians:', error);
        this.toastService.presentToast('Error al cargar veterinarios', 'danger', 'alert-circle-outline');
      }
    );
  }

  setMinDate() {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Mínimo mañana
    this.minDate = today.toISOString().split('T')[0];
  }

  async scheduleAppointment() {
    if (this.appointmentForm.invalid) {
      this.toastService.presentToast('Por favor completa todos los campos requeridos', 'warning', 'alert-outline');
      return;
    }

    this.isLoading = true;
    try {
      const currentUser = await this.authService.getCurrentUser();
      if (!currentUser) {
        this.toastService.presentToast('Debes iniciar sesión', 'danger', 'alert-circle-outline');
        return;
      }

      const formValue = this.appointmentForm.value;
      
      // Combinar fecha y hora
      const dateTime = new Date(`${formValue.date}T${formValue.time}`);

      const appointment = {
        vetId: formValue.vetId,
        userId: currentUser.uid,
        petId: this.mascota.id,
        date: dateTime,
        reason: formValue.reason,
        notes: formValue.notes || '',
        status: 'pending' as const,
        createdAt: new Date()
      };

      await this.appointmentService.addAppointment(appointment);
      this.toastService.presentToast('¡Cita agendada exitosamente!', 'success', 'checkmark-circle-outline');
      
      await this.modalController.dismiss({ success: true });
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      this.toastService.presentToast('Error al agendar la cita', 'danger', 'alert-circle-outline');
    } finally {
      this.isLoading = false;
    }
  }

  cancel() {
    this.modalController.dismiss();
  }

  getVeterinarianName(vetId: string): string {
    const vet = this.veterinarians.find(v => v.uid === vetId);
    return vet ? vet.nombreCompleto : 'Veterinario no encontrado';
  }
}
