import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { AdoptionRequest } from 'src/app/models/AdoptionRequest';
import { AdoptionService } from 'src/app/services/adoption.service';
import { AuthService } from 'src/app/services/auth.service';

import { ToastService } from 'src/app/services/toast.service';
import { UserService } from 'src/app/services/user.service';
import { ModalController } from '@ionic/angular';
import { QuestionnaireDetailModalComponent } from '../../components/questionnaire-detail-modal/questionnaire-detail-modal.component';

interface AdoptionRequestWithNewStatus extends AdoptionRequest {
  isNew?: boolean;
  ownerPhone?: string;
  ownerEmail?: string;
  ownerName?: string;
}

interface RequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  completed: number;
}

@Component({
  selector: 'app-my-adoptions',
  templateUrl: './my-adoptions.page.html',
  styleUrls: ['./my-adoptions.page.scss'],
})
export class MyAdoptionsPage implements OnInit {
  allRequests: AdoptionRequestWithNewStatus[] = [];
  filteredRequests: AdoptionRequestWithNewStatus[] = [];
  stats: RequestStats = { total: 0, pending: 0, approved: 0, rejected: 0, completed: 0 };
  isLoading = true;
  segment: 'pending' | 'approved' | 'rejected' | 'completed' = 'pending';
  newApprovedCount = 0;
  newRejectedCount = 0;

  // Filtros adicionales
  searchTerm: string = '';
  selectedPetType: string = 'all';

  private readonly LAST_VISIT_KEY = 'my_adoptions_last_visit';

  constructor(
    private authService: AuthService,
    private adoptionService: AdoptionService,
    private router: Router,
    private toastService: ToastService,

    private modalController: ModalController,
    private userService: UserService
  ) { }

  async ngOnInit() {
    const currentUser = await this.authService.getCurrentUser();
    if (!currentUser) {
      this.toastService.presentToast('Debes iniciar sesión para ver tus solicitudes.', 'danger', 'alert-circle-outline');
      this.router.navigate(['/login']);
      return;
    }

    const lastVisit = localStorage.getItem(this.LAST_VISIT_KEY);
    const lastVisitTime = lastVisit ? new Date(lastVisit).getTime() : 0;

    this.adoptionService.getRequestsForUser(currentUser.uid).pipe(
      map(requests => requests.map(request => {
        try {
          const req = request as any;
          let reviewedAt: Date | null = null;
          if (req.reviewedAt) {
            reviewedAt = req.reviewedAt.toDate ? req.reviewedAt.toDate() : new Date(req.reviewedAt);
          }

          let requestDate: Date | null = null;
          if (req.requestDate) {
            requestDate = req.requestDate.toDate ? req.requestDate.toDate() : new Date(req.requestDate);
          }

          return {
            ...req,
            requestDate,
            reviewedAt,
            isNew: reviewedAt && reviewedAt.getTime() > lastVisitTime
          } as AdoptionRequestWithNewStatus;
        } catch (error) {
          console.error('Error processing request:', request, error);
          return null; // Return null for corrupted data
        }
      }).filter(Boolean) as AdoptionRequestWithNewStatus[]), // Filter out nulls
      map(requests => requests.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()))
    ).subscribe({
      next: async (data) => {
        this.allRequests = data;

        // Cargar información del dueño para cada solicitud
        for (const request of this.allRequests) {
          try {
            const ownerData = await firstValueFrom(this.userService.getUserData(request.creatorId));
            if (ownerData) {
              request.ownerPhone = ownerData.telefono;
              request.ownerEmail = ownerData.email;
              request.ownerName = ownerData.nombreCompleto || ownerData.nombreUsuario;
            }
          } catch (error) {
            console.error('Error loading owner data for request:', request.id, error);
          }
        }

        this.calculateStats();
        this.newApprovedCount = this.allRequests.filter(r => r.status === 'approved' && r.isNew).length;
        this.newRejectedCount = this.allRequests.filter(r => r.status === 'rejected' && r.isNew).length;

        // Automatically select a segment that has requests
        if (this.allRequests.filter(r => r.status === 'pending').length === 0) {
          if (this.allRequests.filter(r => r.status === 'approved').length > 0) {
            this.segment = 'approved';
          } else if (this.allRequests.filter(r => r.status === 'rejected').length > 0) {
            this.segment = 'rejected';
          }
        }

        this.filterRequests();
        this.isLoading = false;
        localStorage.setItem(this.LAST_VISIT_KEY, new Date().toISOString());
      },
      error: (err) => {
        console.error("Error fetching user's adoption requests: ", err);
        this.toastService.presentToast('Error al cargar tus solicitudes.', 'danger', 'alert-circle-outline');
        this.isLoading = false;
      }
    });
  }

  calculateStats() {
    this.stats = {
      total: this.allRequests.length,
      pending: this.allRequests.filter(r => r.status === 'pending').length,
      approved: this.allRequests.filter(r => r.status === 'approved').length,
      rejected: this.allRequests.filter(r => r.status === 'rejected').length,
      completed: this.allRequests.filter(r => r.status === 'completed').length
    };
  }

  segmentChanged(event: any) {
    this.segment = event.detail.value;
    this.filterRequests();
  }

  filterRequests() {
    let filtered = this.allRequests.filter(request => request.status === this.segment);

    // Aplicar filtro de búsqueda
    if (this.searchTerm) {
      filtered = filtered.filter(request =>
        request.petName?.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    this.filteredRequests = filtered;
  }

  onFilterChange() {
    this.filterRequests();
  }

  async refreshRequests(event?: any) {
    await this.ngOnInit();
    if (event) {
      event.target.complete();
    }
  }

  goToPetDetails(petId: string) {
    this.router.navigate(['/detalle'], { queryParams: { id: petId } });
  }

  async confirmarEntrega(request: AdoptionRequest) {
    const alert = await this.toastService.showAlert({
      header: 'Confirmar Entrega como Adoptante',
      message: '¿Confirmas que has recibido la mascota? Ambas partes (publicador y adoptante) deben confirmar la entrega para completar la adopción.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          handler: async () => {
            try {
              await this.adoptionService.confirmDeliveryAsAdopter(request.id!, request.petId);
              this.toastService.presentToast('¡Entrega confirmada! Esperando confirmación del publicador.', 'success', 'checkmark-circle');

              // Recargar las solicitudes
              await this.ngOnInit();
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



  async viewMyQuestionnaire(request: AdoptionRequest) {
    try {
      console.log('Opening questionnaire for request:', request);
      console.log('Creator ID:', request.creatorId);

      // Obtener información del dueño de la mascota (creatorId)
      const ownerData = await firstValueFrom(this.userService.getUserData(request.creatorId));
      console.log('Owner data retrieved:', ownerData);

      const ownerInfo = ownerData ? {
        name: ownerData.nombreCompleto || ownerData.nombreUsuario || ownerData.email || 'Publicador',
        email: ownerData.email,
        phone: ownerData.telefono,
        whatsapp: ownerData.telefono // Usamos el mismo teléfono para WhatsApp
      } : undefined;

      console.log('Owner info prepared:', ownerInfo);

      const modal = await this.modalController.create({
        component: QuestionnaireDetailModalComponent,
        componentProps: {
          request: {
            ...request,
            owner: ownerInfo
          },
          showOwnerContact: true // Indicar que se deben mostrar los botones de contacto
        },
        cssClass: 'questionnaire-modal'
      });
      await modal.present();
    } catch (error) {
      console.error('Error al abrir el cuestionario:', error);
      this.toastService.presentToast('No se pudo abrir el cuestionario.', 'danger', 'alert-circle-outline');
    }
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendiente',
      'approved': 'Aprobada',
      'rejected': 'Rechazada',
      'completed': 'Completada'
    };
    return statusMap[status] || status;
  }

  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'pending': 'warning',
      'approved': 'success',
      'rejected': 'medium',
      'completed': 'tertiary'
    };
    return colorMap[status] || 'medium';
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

  // Métodos de contacto
  goToOwnerProfile(request: AdoptionRequestWithNewStatus) {
    if (request.creatorId) {
      this.router.navigate(['/perfil', request.creatorId]);
    }
  }

  callOwner(request: AdoptionRequestWithNewStatus) {
    if (request.ownerPhone) {
      window.open(`tel:${request.ownerPhone}`, '_system');
    }
  }

  whatsappOwner(request: AdoptionRequestWithNewStatus) {
    if (request.ownerPhone) {
      const message = encodeURIComponent(`Hola, me interesa la adopción de ${request.petName || 'la mascota'}`);
      window.open(`https://wa.me/${request.ownerPhone}?text=${message}`, '_system');
    }
  }

  emailOwner(request: AdoptionRequestWithNewStatus) {
    if (request.ownerEmail) {
      const subject = encodeURIComponent(`Adopción de ${request.petName || 'mascota'}`);
      const body = encodeURIComponent(`Hola, me interesa la adopción de ${request.petName || 'la mascota'}.`);
      window.open(`mailto:${request.ownerEmail}?subject=${subject}&body=${body}`, '_system');
    }
  }

  getWhatsAppLink(phone: string | undefined): string {
    if (!phone) return '#';
    const sanitizedPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent('Hola, sobre la adopción de la mascota...');
    return `https://wa.me/${sanitizedPhone}?text=${message}`;
  }

  viewReceipt(pdfUrl: string) {
    if (pdfUrl) {
      window.open(pdfUrl, '_system');
    }
  }
}
