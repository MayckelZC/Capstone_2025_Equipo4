import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdoptionRequest } from '../../../../models/AdoptionRequest';
import { AdoptionService } from '@features/adoption/services/adoption.service';
import { ToastService } from '@shared/services/toast.service';
import { AlertController, ModalController } from '@ionic/angular';
import { QuestionnaireViewComponent } from '../../../../components/questionnaire-view/questionnaire-view.component';
import { QuestionnaireDetailModalComponent } from '../../../../components/questionnaire-detail-modal/questionnaire-detail-modal.component';
import { User } from '../../../../models/user';
import { AuthService } from '@core/services/auth.service';
import { PetsService } from '@features/pets/services/pets.service';
import { switchMap, map } from 'rxjs/operators';
import { forkJoin, of, from, Observable } from 'rxjs';


interface AdoptionRequestWithApplicant extends AdoptionRequest {
  applicant: User;
  pet?: {
    name: string;
    type: string;
    imageUrl: string;
    breed?: string;
  };
}

interface RequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

@Component({
  selector: 'app-adoption-requests',
  templateUrl: './adoption-requests.page.html',
  styleUrls: ['./adoption-requests.page.scss'],
})
export class AdoptionRequestsPage implements OnInit {
  petId!: string;
  requests: AdoptionRequestWithApplicant[] = [];
  filteredRequests: AdoptionRequestWithApplicant[] = [];
  stats: RequestStats = { total: 0, pending: 0, approved: 0, rejected: 0 };
  loading = true;

  // Filtros
  selectedStatus: string = 'all';
  selectedPetType: string = 'all';
  searchTerm: string = '';

  constructor(
    private route: ActivatedRoute,
    private adoptionService: AdoptionService,
    private authService: AuthService,
    private petsService: PetsService,
    private toastService: ToastService,
    private alertController: AlertController,
    private modalController: ModalController,
    private router: Router,

  ) { }

  ngOnInit() {
    this.petId = this.route.snapshot.paramMap.get('id');
    if (this.petId) {
      this.loadRequests();
    }
  }

  async loadRequests() {
    this.loading = true;

    try {
      // Obtener información de la mascota primero
      const pet = await this.petsService.getPetById(this.petId);

      this.adoptionService.getRequestsForPet(this.petId).pipe(
        switchMap(requests => {
          if (requests.length === 0) {
            return of([]);
          }
          const userPromises = requests.map(async request => {
            const user = await this.authService.getUserData(request.applicantId);
            return {
              ...request,
              applicant: user as User,
              pet: {
                name: pet?.nombre || 'Mascota',
                type: pet?.tipoMascota || 'Desconocido',
                imageUrl: pet?.urlImagen || 'assets/imgs/paw.png',
                breed: pet?.raza || ''
              }
            };
          });
          return from(Promise.all(userPromises)) as Observable<AdoptionRequestWithApplicant[]>;
        }),
        map(requestsWithApplicants => (requestsWithApplicants as AdoptionRequestWithApplicant[]).sort((a, b) => {
          const dateA = a.requestDate instanceof Date ? a.requestDate.getTime() : new Date(a.requestDate).getTime();
          const dateB = b.requestDate instanceof Date ? b.requestDate.getTime() : new Date(b.requestDate).getTime();
          return dateB - dateA;
        }))
      ).subscribe({
        next: (data) => {
          this.requests = data as AdoptionRequestWithApplicant[];
          this.calculateStats();
          this.applyFilters();
          this.loading = false;
        },
        error: (err) => {
          console.error('Error fetching requests:', err);
          this.toastService.presentToast('Error al cargar las solicitudes.', 'danger', 'alert-circle-outline');
          this.loading = false;
        }
      });
    } catch (error) {
      console.error('Error loading pet data:', error);
      this.loading = false;
    }
  }

  calculateStats() {
    this.stats = {
      total: this.requests.length,
      pending: this.requests.filter(r => r.status === 'pending').length,
      approved: this.requests.filter(r => r.status === 'approved').length,
      rejected: this.requests.filter(r => r.status === 'rejected').length
    };
  }

  applyFilters() {
    let filtered = this.requests.filter(request => {
      const statusMatch = this.selectedStatus === 'all' || request.status === this.selectedStatus;
      const typeMatch = this.selectedPetType === 'all' || request.pet?.type === this.selectedPetType;
      const searchMatch = !this.searchTerm ||
        request.applicantName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        request.pet?.name?.toLowerCase().includes(this.searchTerm.toLowerCase());

      return statusMatch && typeMatch && searchMatch;
    });

    // Ordenar por más recientes primero
    filtered.sort((a, b) => {
      const dateA = a.requestDate instanceof Date ? a.requestDate.getTime() : new Date(a.requestDate).getTime();
      const dateB = b.requestDate instanceof Date ? b.requestDate.getTime() : new Date(b.requestDate).getTime();
      return dateB - dateA;
    });

    this.filteredRequests = filtered;
  }

  onFilterChange() {
    this.applyFilters();
  }

  async refreshRequests(event?: any) {
    await this.loadRequests();
    if (event) {
      event.target.complete();
    }
  }

  public getWhatsAppLink(telefono: string): string {
    if (!telefono) {
      return '';
    }
    const sanitizedPhone = telefono.replace(/\D/g, '');
    return `https://wa.me/${sanitizedPhone}`;
  }

  async viewQuestionnaire(request: AdoptionRequest) {
    const modal = await this.modalController.create({
      component: QuestionnaireDetailModalComponent,
      componentProps: {
        request: request
      },
      cssClass: 'questionnaire-modal'
    });
    return await modal.present();
  }

  async viewCommitmentDocument(request: AdoptionRequest) {
    if (!request.commitmentPdfUrl) {
      this.toastService.presentToast('No hay documento de compromiso disponible.', 'warning', 'alert-circle-outline');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Documento de Compromiso',
      message: `Este documento contiene los compromisos legales que ${request.applicantName} aceptó al enviar su solicitud de adopción. Incluye términos sobre cuidado a largo plazo, gastos veterinarios, política de no abandono y otras responsabilidades.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Ver Documento',
          handler: () => {
            try {
              // Open PDF in a new window/tab
              window.open(request.commitmentPdfUrl, '_blank');
            } catch (error) {
              console.error('Error opening commitment document:', error);
              this.toastService.presentToast('Error al abrir el documento.', 'danger', 'alert-circle-outline');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async approve(request: AdoptionRequestWithApplicant) {
    const alert = await this.alertController.create({
      header: 'Confirmar Aprobación',
      message: `¿Estás seguro de aprobar la solicitud de ${request.applicantName}? Todas las demás solicitudes pendientes para esta mascota serán rechazadas automáticamente.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Sí, Aprobar',
          handler: async () => {
            try {
              await this.adoptionService.approveRequest(request);
              this.toastService.presentToast('Solicitud Aprobada.', 'success', 'checkmark-circle-outline');

              // Mostrar modal con próximos pasos
              await this.showNextStepsModal(request);
            } catch (error) {
              console.error('Error approving request:', error);
              this.toastService.presentToast('Error al aprobar la solicitud.', 'danger', 'alert-circle-outline');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async showNextStepsModal(request: AdoptionRequestWithApplicant) {
    const applicantPhone = request.applicant?.telefono ? request.applicant.telefono.replace(/\D/g, '') : '';
    const whatsappLink = applicantPhone ? `https://wa.me/${applicantPhone}` : '';

    const modal = await this.alertController.create({
      header: '✅ Solicitud Aprobada',
      message: `
        <div style="text-align: left; padding: 8px;">
          <p style="margin-bottom: 12px;">Contacta a ${request.applicantName} para coordinar la entrega.</p>
          
          <div style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
            <strong style="color: #4CAF50;">📱 Próximos pasos:</strong>
            <ul style="margin: 8px 0; padding-left: 20px; font-size: 13px;">
              <li>Contacta por WhatsApp, email o teléfono</li>
              <li>Coordina fecha, hora y lugar de entrega</li>
              <li>Prepara documentos de la mascota (vacunas, médicos)</li>
              <li>Realiza la entrega presencial</li>
              <li>Confirma la entrega en la aplicación</li>
            </ul>
          </div>
          
          <p style="font-size: 13px; color: #666; margin: 0;">
            📞 Puedes ver los datos de contacto en la lista de solicitudes
          </p>
        </div>
      `,
      cssClass: 'next-steps-alert',
      buttons: [
        {
          text: 'Entendido',
          role: 'cancel'
        }
      ]
    });

    await modal.present();
  }

  async reject(request: AdoptionRequest) {
    const alert = await this.alertController.create({
      header: 'Confirmar Rechazo',
      message: `¿Estás seguro de rechazar la solicitud de ${request.applicantName}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Sí, Rechazar',
          handler: async () => {
            try {
              await this.adoptionService.rejectRequest(request);
              this.toastService.presentToast('Solicitud Rechazada.', 'success', 'checkmark-circle-outline');
            } catch (error) {
              console.error('Error rejecting request:', error);
              this.toastService.presentToast('Error al rechazar la solicitud.', 'danger', 'alert-circle-outline');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async confirmDeliveryAsOwner(request: AdoptionRequest) {
    const alert = await this.alertController.create({
      header: 'Confirmar Entrega como Publicador',
      message: '¿Confirmas que has entregado la mascota? Ambas partes (publicador y adoptante) deben confirmar la entrega para completar la adopción.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          handler: async () => {
            try {
              await this.adoptionService.confirmDeliveryAsOwner(request.id!, this.petId);
              this.toastService.presentToast('¡Entrega confirmada! Esperando confirmación del adoptante.', 'success', 'checkmark-circle');

              // Recargar las solicitudes
              await this.loadRequests();
            } catch (error) {
              console.error('Error al confirmar la entrega:', error);
              this.toastService.presentToast('Error al confirmar la entrega', 'danger', 'alert-circle-outline');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  getRedFlags(request: AdoptionRequest): string[] {
    const flags: string[] = [];

    if (request.housingType === 'rented' && !request.landlordAllowsPets) {
      flags.push('El arrendador no permite mascotas');
    }

    if (request.hoursAlone > 8) {
      flags.push('La mascota estará sola más de 8 horas');
    }

    if (!request.previousExperience) {
      flags.push('Sin experiencia previa con mascotas');
    }

    if (!request.unexpectedExpenses) {
      flags.push('No cubrirá gastos veterinarios inesperados');
    }

    return flags;
  }



  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendiente',
      'approved': 'Aprobada',
      'rejected': 'Rechazada'
    };
    return statusMap[status] || status;
  }

  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'pending': 'warning',
      'approved': 'success',
      'rejected': 'medium'
    };
    return colorMap[status] || 'medium';
  }

  viewPetDetails() {
    if (this.petId) {
      window.open(`/detalle/${this.petId}`, '_blank');
    }
  }

  getTimeAgo(date: any): string {
    const now = new Date().getTime();
    const requestDate = date instanceof Date ? date.getTime() : new Date(date).getTime();
    const diffMs = now - requestDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return `Hace ${Math.floor(diffDays / 30)} meses`;
  }

  // TrackBy function for performance optimization
  trackByRequestId(index: number, request: AdoptionRequest): string {
    return request.id!;
  }

  // Navegar al perfil del solicitante
  viewApplicantProfile(request: AdoptionRequestWithApplicant) {
    if (request.applicantId) {
      this.router.navigate(['/perfil', request.applicantId]);
    }
  }

  // Formatear fecha de solicitud
  formatRequestDate(date: any): string {
    const requestDate = date instanceof Date ? date : new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return requestDate.toLocaleDateString('es-ES', options).replace(',', '');
  }
}

