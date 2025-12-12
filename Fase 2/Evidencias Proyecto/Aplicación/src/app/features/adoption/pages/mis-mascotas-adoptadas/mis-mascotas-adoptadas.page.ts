import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdoptionService } from '@features/adoption/services/adoption.service';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@shared/services/toast.service';
import { Adopcion } from 'src/app/models/Adopcion';
import { ModalController } from '@ionic/angular';
import { ScheduleAppointmentModalComponent } from 'src/app/components/schedule-appointment-modal/schedule-appointment-modal.component';

@Component({
  selector: 'app-mis-mascotas-adoptadas',
  templateUrl: './mis-mascotas-adoptadas.page.html',
  styleUrls: ['./mis-mascotas-adoptadas.page.scss'],
})
export class MisMascotasAdoptadasPage implements OnInit {
  mascotasAdoptadas: Adopcion[] = [];
  isLoading = true;

  constructor(
    private authService: AuthService,
    private adoptionService: AdoptionService,
    private router: Router,
    private toastService: ToastService,
    private modalController: ModalController
  ) { }

  async ngOnInit() {
    const currentUser = await this.authService.getCurrentUser();
    if (!currentUser) {
      this.toastService.presentToast('Debes iniciar sesión para ver tus mascotas adoptadas.', 'danger', 'alert-circle-outline');
      this.router.navigate(['/auth/login']);
      return;
    }

    // Obtener las mascotas donde el usuario actual es el dueño actual
    const mascotasRef = this.adoptionService.getMascotasAdoptadas(currentUser.uid);
    mascotasRef.subscribe({
      next: (mascotas) => {
        this.mascotasAdoptadas = mascotas;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al obtener las mascotas adoptadas:', error);
        this.toastService.presentToast('Error al cargar tus mascotas adoptadas.', 'danger', 'alert-circle-outline');
        this.isLoading = false;
      }
    });
  }

  goToPetDetails(petId: string) {
    this.router.navigate(['/pets/detalle'], { queryParams: { id: petId } });
  }

  goToHome() {
    this.router.navigate(['/pets/home']);
  }

  getFechaAdopcionFormatted(mascota: Adopcion): string {
    if (mascota.adoptionCompletionData?.completedAt) {
      const fecha = mascota.adoptionCompletionData.completedAt.toDate();
      return fecha.toLocaleDateString();
    }
    return 'Fecha no disponible';
  }

  editarMascota(mascota: Adopcion) {
    // Navegar a la página de modificar con el ID de la mascota
    this.router.navigate(['/pets/modificar'], { queryParams: { id: mascota.id } });
  }

  async agendarCita(mascota: Adopcion) {
    const modal = await this.modalController.create({
      component: ScheduleAppointmentModalComponent,
      componentProps: {
        petId: mascota.id,
        petName: mascota.nombre
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.success) {
      this.toastService.presentToast(
        '¡Cita agendada exitosamente!',
        'success',
        'checkmark-circle-outline'
      );
    }
  }
}

