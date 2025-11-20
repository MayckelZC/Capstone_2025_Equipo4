import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AdoptionRequest } from 'src/app/models/AdoptionRequest';
import { AdoptionService } from 'src/app/services/adoption.service';
import { ToastService } from 'src/app/services/toast.service';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { PetsService } from 'src/app/services/pets.service'; // Import PetsService

@Component({
  selector: 'app-adoption-requests',
  templateUrl: './adoption-requests.page.html',
  styleUrls: ['./adoption-requests.page.scss'],
})
export class AdoptionRequestsPage implements OnInit {

  requests: AdoptionRequest[] = [];
  isLoading = true;

  constructor(
    private adoptionService: AdoptionService,
    private alertController: AlertController,
    private toastService: ToastService,
    private router: Router,
    private authService: AuthService,
    private petsService: PetsService // Inject PetsService
  ) { }

  ngOnInit() {
    this.adoptionService.getPendingRequests().pipe(
      map(requests => requests.map(request => {
        const req = request as any;
        return {
        ...req,
        requestDate: req['requestDate'].toDate ? req['requestDate'].toDate() : req['requestDate']
      } as AdoptionRequest;
    })),
      map(requests => requests.sort((a, b) => {
        const dateA = new Date(a.requestDate).getTime();
        const dateB = new Date(b.requestDate).getTime();
        return dateA - dateB;
      }))
    ).subscribe({
      next: (data) => {
        this.requests = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Error fetching adoption requests: ", err);
        this.toastService.presentToast('Error al cargar las solicitudes. Revisa la consola para más detalles.', 'danger', 'alert-circle-outline');
        this.isLoading = false;
      }
    });
  }

  async approve(request: AdoptionRequest) {
    const alert = await this.alertController.create({
      header: 'Confirmar Aprobación',
      message: `¿Estás seguro de aprobar la adopción de ${request.petName} para ${request.applicantName}? Esta acción no se puede deshacer.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Sí, aprobar',
          handler: async () => {
            try {
              await this.adoptionService.approveRequest(request);
              this.toastService.presentToast('¡Adopción aprobada!', 'success', 'checkmark-circle-outline');
              this.sendEmailToPublisher(request, 'approved'); // Call email function
            } catch (error) {
              this.toastService.presentToast('Error al aprobar la solicitud.', 'danger', 'alert-circle-outline');
              console.error(error);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async reject(request: AdoptionRequest) {
    const alert = await this.alertController.create({
      header: 'Confirmar Rechazo',
      message: `¿Estás seguro de rechazar la solicitud de ${request.applicantName} para ${request.petName}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Sí, rechazar',
          handler: async () => {
            try {
              await this.adoptionService.rejectRequest(request);
              this.toastService.presentToast('Solicitud rechazada.', 'warning', 'information-circle-outline');
              this.sendEmailToPublisher(request, 'rejected'); // Call email function
            } catch (error) {
              this.toastService.presentToast('Error al rechazar la solicitud.', 'danger', 'alert-circle-outline');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async sendEmailToPublisher(request: AdoptionRequest, status: 'approved' | 'rejected') {
    this.petsService.getPet(request.petId).pipe(take(1)).subscribe(async pet => {
      if (!pet || !pet.creadorId) {
        this.toastService.presentToast('No se pudo obtener la información de la mascota o su publicador.', 'warning', 'alert-circle-outline');
        return;
      }

      const publisher = await this.authService.getUserData(pet.creadorId);
      if (publisher && publisher.email) {
        const subject = encodeURIComponent(`Actualización de tu solicitud de adopción para ${request.petName}`);
        const body = encodeURIComponent(
          `Hola ${publisher.nombreCompleto},\n\n` +
          `Queremos informarte que tu solicitud de adopción para la mascota "${request.petName}" ` +
          `ha sido ${status === 'approved' ? 'APROBADA' : 'RECHAZADA'}.\n\n` +
          `El solicitante fue ${request.applicantName}.\n\n` +
          `Para más detalles, por favor, revisa la aplicación.\n\n` +
          `Gracias por tu paciencia.`
        );
        window.open(`mailto:${publisher.email}?subject=${subject}&body=${body}`);
      } else {
        this.toastService.presentToast('No se pudo obtener el correo del publicador.', 'warning', 'alert-circle-outline');
      }
    });
  }

  goToPetDetails(petId: string) {
    this.router.navigate(['/detalle'], { queryParams: { id: petId } });
  }

  goToApplicantProfile(applicantId: string) {
    this.router.navigate(['/perfil', applicantId]);
  }
}
