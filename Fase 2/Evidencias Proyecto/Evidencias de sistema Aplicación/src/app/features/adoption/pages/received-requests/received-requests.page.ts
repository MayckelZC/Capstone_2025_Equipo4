import { Component, OnInit, OnDestroy } from '@angular/core';
import { AdoptionService } from '@features/adoption/services/adoption.service';
import { AuthService } from '@core/services/auth.service';
import { PetsService } from '@features/pets/services/pets.service';
import { LoadingController, ToastController, AlertController, ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AdoptionRequest } from '../../../../models/AdoptionRequest';
import { QuestionnaireModalComponent } from '../../../../components/questionnaire-modal/questionnaire-modal.component';
import { QuestionnaireDetailModalComponent } from '../../../../components/questionnaire-detail-modal/questionnaire-detail-modal.component';

interface AdoptionRequestWithPet extends AdoptionRequest {
  pet: {
    name: string;
    type: string;
    imageUrl: string;
    breed?: string;
  };
  requester: {
    name: string;
    email: string;
  };
  viewedByOwner?: boolean;
}

interface RequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  completed: number;
}

@Component({
  selector: 'app-received-requests',
  templateUrl: './received-requests.page.html',
  styleUrls: ['./received-requests.page.scss'],
})
export class ReceivedRequestsPage implements OnInit, OnDestroy {
  requests: AdoptionRequestWithPet[] = [];
  filteredRequests: AdoptionRequestWithPet[] = [];
  stats: RequestStats = { total: 0, pending: 0, approved: 0, rejected: 0, completed: 0 };

  // Filtros
  selectedStatus: string = 'all';
  selectedPetType: string = 'all';
  searchTerm: string = '';
  dateRange: { start?: Date; end?: Date } = {};
  sortBy: 'newest' | 'oldest' | 'petName' | 'requesterName' = 'newest';

  // Estados
  isLoading = true;
  hasRequests = false;
  showAdvancedFilters = false;
  today = new Date().toISOString();

  private subscription: Subscription = new Subscription();
  private requestsListener: Subscription = new Subscription();

  constructor(
    private adoptionService: AdoptionService,
    private authService: AuthService,
    private petsService: PetsService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController,
    private modalController: ModalController
  ) { }

  ngOnInit() {
    this.loadRequests();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.requestsListener.unsubscribe();
  }

  async loadRequests() {
    try {
      this.isLoading = true;

      const currentUser = await this.authService.getCurrentUser();
      if (!currentUser) {
        console.log('No current user found');
        return;
      }

      console.log('Loading requests for user:', currentUser.uid);

      // Obtener todas las solicitudes de adopción para las mascotas del usuario
      const userPets = await this.petsService.getUserPets(currentUser.uid);
      console.log('User pets found:', userPets.length);

      // Mostrar información de las mascotas encontradas
      if (userPets.length > 0) {
        console.log('User pets details:', userPets.map(pet => ({ id: pet.id, name: pet.nombre, type: pet.tipoMascota })));
      }

      const allRequests: AdoptionRequestWithPet[] = [];

      if (userPets.length === 0) {
        console.log('No pets found for user');
        this.requests = [];
        this.calculateStats();
        this.applyFilters();
        this.hasRequests = false;
        return;
      }

      for (const pet of userPets) {
        console.log('Processing pet:', pet.nombre || pet.id, 'with ID:', pet.id);

        try {
          const petRequests = await this.adoptionService.getAdoptionRequestsForPet(pet.id);
          console.log(`Found ${petRequests.length} requests for pet ${pet.nombre}`);

          for (const request of petRequests) {
            console.log('Processing request:', request.id, 'from user:', request.applicantId);

            // Obtener información del solicitante
            const requesterInfo = await this.authService.getUserById(request.applicantId);

            allRequests.push({
              ...request,
              pet: {
                name: pet.nombre || 'Sin nombre',
                type: pet.tipoMascota || 'Desconocido',
                imageUrl: pet.urlImagen || '/assets/imgs/paw.png',
                breed: pet.raza || ''
              },
              requester: {
                name: requesterInfo?.nombreCompleto || request.applicantName || 'Usuario desconocido',
                email: requesterInfo?.email || 'Email no disponible'
              },
              viewedByOwner: false // Por defecto como no visto hasta implementar el tracking real
            });
          }
        } catch (error) {
          console.error(`Error processing pet ${pet.nombre}:`, error);
        }
      }

      this.requests = allRequests.sort((a, b) =>
        new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
      );

      console.log(`Total requests loaded: ${this.requests.length}`);

      this.calculateStats();
      this.applyFilters();
      this.hasRequests = this.requests.length > 0;

      // Configurar listener en tiempo real para nuevas solicitudes
      this.setupRealTimeUpdates();

    } catch (error) {
      console.error('Error loading requests:', error);
      this.showToast('Error al cargar las solicitudes', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  calculateStats() {
    this.stats = {
      total: this.requests.length,
      pending: this.requests.filter(r => r.status === 'pending').length,
      approved: this.requests.filter(r => r.status === 'approved').length,
      rejected: this.requests.filter(r => r.status === 'rejected').length,
      completed: this.requests.filter(r => r.status === 'completed').length
    };
  }

  applyFilters() {
    let filtered = this.requests.filter(request => {
      const statusMatch = this.selectedStatus === 'all' || request.status === this.selectedStatus;
      const typeMatch = this.selectedPetType === 'all' || request.pet.type === this.selectedPetType;
      const searchMatch = !this.searchTerm ||
        request.pet.name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        request.requester.name.toLowerCase().includes(this.searchTerm.toLowerCase());

      // Date range filter
      let dateMatch = true;
      if (this.dateRange.start || this.dateRange.end) {
        const requestDate = new Date(request.requestDate);
        if (this.dateRange.start) {
          dateMatch = dateMatch && requestDate >= new Date(this.dateRange.start);
        }
        if (this.dateRange.end) {
          const endDate = new Date(this.dateRange.end);
          endDate.setHours(23, 59, 59, 999); // Include the entire end date
          dateMatch = dateMatch && requestDate <= endDate;
        }
      }

      return statusMatch && typeMatch && searchMatch && dateMatch;
    });

    // Apply sorting
    switch (this.sortBy) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime());
        break;
      case 'petName':
        filtered.sort((a, b) => (a.pet.name || '').localeCompare(b.pet.name || ''));
        break;
      case 'requesterName':
        filtered.sort((a, b) => a.requester.name.localeCompare(b.requester.name));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
        break;
    }

    this.filteredRequests = filtered;
  }

  onFilterChange() {
    this.applyFilters();
  }

  async respondToRequest(request: AdoptionRequestWithPet, action: 'approve' | 'reject') {
    const alert = await this.alertController.create({
      header: action === 'approve' ? 'Aprobar Solicitud' : 'Rechazar Solicitud',
      message: `¿Estás seguro de ${action === 'approve' ? 'aprobar' : 'rechazar'} la solicitud de ${request.requester.name} para ${request.pet.name}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: action === 'approve' ? 'Aprobar' : 'Rechazar',
          handler: async () => {
            await this.processResponse(request, action);
          }
        }
      ]
    });

    await alert.present();
  }

  private async processResponse(request: AdoptionRequestWithPet, action: 'approve' | 'reject') {
    const loading = await this.loadingController.create({
      message: 'Procesando respuesta...'
    });

    try {
      await loading.present();

      if (action === 'approve') {
        await this.adoptionService.initiateHandover(request.id!, request.petId, request.applicantId, request.applicantName);
      } else { // action === 'reject'
        await this.adoptionService.updateAdoptionRequestStatus(request.id!, 'rejected');
      }

      // Actualizar el estado local
      const index = this.requests.findIndex(r => r.id === request.id!);
      if (index !== -1) {
        this.requests[index].status = action === 'approve' ? 'approved' : 'rejected';
        this.calculateStats();
        this.applyFilters();
      }

      this.showToast(
        `Solicitud ${action === 'approve' ? 'aprobada' : 'rechazada'} exitosamente`,
        'success'
      );

    } catch (error) {
      console.error('Error processing response:', error);
      this.showToast('Error al procesar la respuesta', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async viewRequestDetails(request: AdoptionRequestWithPet) {
    const modal = await this.modalController.create({
      component: QuestionnaireDetailModalComponent,
      componentProps: {
        request: request
      },
      cssClass: 'questionnaire-modal'
    });

    await modal.present();
  }

  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'Pendiente',
      'approved': 'Aprobada',
      'rejected': 'Rechazada'
    };
    return statusMap[status] || status;
  }

  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      'pending': 'warning',
      'approved': 'success',
      'rejected': 'danger'
    };
    return colorMap[status] || 'medium';
  }

  async refreshRequests(event?: any) {
    await this.loadRequests();
    if (event) {
      event.target.complete();
    }
  }

  private async showToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  // Quick Actions
  async approveAll() {
    const pendingRequests = this.filteredRequests.filter(r => r.status === 'pending');

    if (pendingRequests.length === 0) {
      this.showToast('No hay solicitudes pendientes', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Aprobar Todas',
      message: `¿Estás seguro de aprobar todas las ${pendingRequests.length} solicitudes pendientes?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Aprobar Todas',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Aprobando solicitudes...'
            });

            await loading.present();

            try {
              for (const request of pendingRequests) {
                await this.adoptionService.updateAdoptionRequestStatus(request.id!, 'approved');
                request.status = 'approved';
              }

              this.calculateStats();
              this.applyFilters();
              this.showToast(`${pendingRequests.length} solicitudes aprobadas`, 'success');

            } catch (error) {
              console.error('Error approving all requests:', error);
              this.showToast('Error al aprobar algunas solicitudes', 'danger');
            } finally {
              await loading.dismiss();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  toggleAdvancedFilters() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  clearDateFilters() {
    this.dateRange = {};
    this.onFilterChange();
  }

  // Quick Actions
  async viewPetDetails(petId: string) {
    // Navegar a la página de detalles de la mascota
    window.open(`/detalle/${petId}`, '_blank');
  }

  async viewRequesterProfile(request: AdoptionRequestWithPet) {
    try {
      // Obtener información completa del solicitante
      const requesterInfo = await this.authService.getUserById(request.applicantId);

      const alert = await this.alertController.create({
        header: `Perfil de ${request.requester.name}`,
        message: `
<div class="profile-container">

  <!-- Información de Contacto -->
  <div class="profile-section contact-info">
    <h4 class="section-title"><ion-icon name="call-outline"></ion-icon> INFORMACIÓN DE CONTACTO</h4>
    <p><strong>Nombre:</strong> ${requesterInfo?.nombreCompleto || request.requester.name}</p>
    <p><strong>Email:</strong> ${request.requester.email}</p>
    ${requesterInfo?.telefono ? `<p><strong>Teléfono:</strong> ${requesterInfo.telefono}</p>` : ''}
    ${requesterInfo?.direccion ? `<p><strong>Dirección:</strong> ${requesterInfo.direccion}</p>` : ''}
  </div>

  <!-- Información del Hogar -->
  <div class="profile-section home-info">
    <h4 class="section-title"><ion-icon name="home-outline"></ion-icon> INFORMACIÓN DEL HOGAR</h4>
    <p><strong>Tipo de vivienda:</strong> ${request.housingType === 'own' ? 'Casa Propia' : 'Casa Alquilada'}</p>
    <p><strong>Espacio disponible:</strong> ${this.getSpaceText(request.petLivingSpace)}</p>
    <p><strong>Horas que estaría sola:</strong> ${request.hoursAlone || 'No especificado'} horas/día</p>
    <p><strong>Acceso veterinario:</strong> ${request.veterinaryAccess ? '✅ Confirmado' : '⚠️ Sin confirmar'}</p>
    ${request.secureFencing !== undefined ? `<p><strong>Jardín seguro:</strong> ${request.secureFencing ? '✅ Sí' : '❌ No'}</p>` : ''}
  </div>

  <!-- Experiencia con Mascotas -->
  <div class="profile-section experience-info">
    <h4 class="section-title"><ion-icon name="paw-outline"></ion-icon> EXPERIENCIA CON MASCOTAS</h4>
    <p><strong>Experiencia previa:</strong> ${request.previousExperience ? '✅ Sí tiene experiencia' : '⚠️ Sin experiencia previa'}</p>
    <p><strong>Otras mascotas:</strong> ${request.otherPets ? '🐕 Sí tiene otras mascotas' : '🏠 No tiene otras mascotas'}</p>
    ${request.householdMembers ? `<p><strong>Miembros del hogar:</strong> ${request.householdMembers}</p>` : ''}
    ${request.allergies ? `<p><strong>Alergias:</strong> ${request.allergies === 'yes' ? '⚠️ Sí hay alergias' : '✅ No hay alergias'}</p>` : ''}
  </div>

  <!-- Información de la Solicitud -->
  <div class="profile-section request-info">
    <h4 class="section-title"><ion-icon name="document-text-outline"></ion-icon> INFORMACIÓN DE LA SOLICITUD</h4>
    <p><strong>Fecha:</strong> ${new Date(request.requestDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
    <p><strong>Estado:</strong> <span class="status-badge status-${request.status}">${this.getStatusText(request.status)}</span></p>
    <p><strong>Mascota:</strong> ${request.pet.name} (${request.pet.type})</p>
  </div>

  <!-- Biografía -->
  ${requesterInfo?.bio ? `
  <div class="profile-section bio-info">
    <h4 class="section-title"><ion-icon name="person-outline"></ion-icon> BIOGRAFÍA</h4>
    <p class="bio-text">${requesterInfo.bio}</p>
  </div>
  ` : ''}

  <!-- Comentarios Adicionales -->
  ${request.adminNotes ? `
  <div class="profile-section comments-info">
    <h4 class="section-title"><ion-icon name="chatbubble-ellipses-outline"></ion-icon> COMENTARIOS ADICIONALES</h4>
    <p>${request.adminNotes}</p>
  </div>
  ` : ''}

</div>
        `,
        cssClass: 'profile-alert-custom',
        buttons: [
          {
            text: 'CERRAR',
            role: 'cancel',
            cssClass: 'alert-button-cancel'
          }
        ]
      });

      await alert.present();

    } catch (error) {
      console.error('Error loading requester profile:', error);
      this.showToast('Error al cargar el perfil del solicitante', 'danger');
    }
  }

  async contactViaWhatsApp(request: AdoptionRequestWithPet) {
    try {
      // Obtener información completa del solicitante
      const requesterInfo = await this.authService.getUserById(request.applicantId);

      if (!requesterInfo?.telefono) {
        this.showToast('No se encontró número de WhatsApp del solicitante', 'warning');
        return;
      }

      // Crear mensaje personalizado
      const message = `Hola ${request.requester.name}! 👋

Soy el dueño de ${request.pet.name} (${request.pet.type}). He recibido tu solicitud de adopción.

Me gustaría conversar contigo sobre los detalles de la adopción.

¡Gracias por tu interés! 🐕❤️`;

      // Formatear número de teléfono (remover caracteres no numéricos)
      const phoneNumber = requesterInfo.telefono.replace(/\D/g, '');

      // Crear URL de WhatsApp
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

      // Abrir WhatsApp
      window.open(whatsappUrl, '_blank');

      // Mostrar confirmación
      this.showToast('Abriendo WhatsApp...', 'success');

    } catch (error) {
      console.error('Error contacting via WhatsApp:', error);
      this.showToast('Error al intentar contactar por WhatsApp', 'danger');
    }
  }

  async viewAdoptionHistory(request: AdoptionRequestWithPet) {
    const alert = await this.alertController.create({
      header: 'Historial de Adopciones',
      message: 'Cargando historial...',
      buttons: []
    });
    await alert.present();

    try {
      // Obtener historial de adopciones del solicitante
      // Esto requeriría un método en el servicio para obtener el historial
      // Simular historial por ahora - esto se implementaría en el servicio
      const history: any[] = [];

      let historyText = '';
      if (history.length === 0) {
        historyText = 'Este usuario no tiene historial de adopciones previas.';
      } else {
        historyText = `<strong>Adopciones completadas:</strong> ${history.length}<br><br>`;
        history.forEach((adoption, index) => {
          historyText += `${index + 1}. ${adoption.petName} - ${adoption.completedDate}<br>`;
        });
      }

      await alert.dismiss();

      const historyAlert = await this.alertController.create({
        header: 'Historial de Adopciones',
        message: historyText,
        buttons: ['Cerrar']
      });

      await historyAlert.present();
    } catch (error) {
      await alert.dismiss();
      this.showToast('Error al cargar el historial', 'danger');
    }
  }

  private getSpaceText(space: string): string {
    const spaceMap: Record<string, string> = {
      'indoor': 'Interior',
      'indoor_with_garden': 'Interior con jardín',
      'outdoor': 'Exterior',
      'other': 'Otro'
    };
    return spaceMap[space] || space;
  }



  private async setupRealTimeUpdates() {
    const currentUser = await this.authService.getCurrentUser();
    if (!currentUser) return;

    // Por ahora simularemos actualizaciones en tiempo real
    // En producción esto sería un listener real a Firebase
    console.log('Real-time updates would be set up here for user:', currentUser.uid);
  }

  // Método para marcar solicitudes como vistas
  async markRequestAsViewed(requestId: string) {
    try {
      // Simular marcado como visto
      const request = this.requests.find(r => r.id === requestId);
      if (request) {
        request.viewedByOwner = true;
      }
    } catch (error) {
      console.error('Error marking request as viewed:', error);
    }
  }

  // Método para obtener el número de solicitudes no vistas
  getUnviewedCount(): number {
    return this.requests.filter(r => !r.viewedByOwner).length;
  }

  // Navegar al perfil completo del solicitante
  async navigateToRequesterProfile(request: AdoptionRequestWithPet) {
    try {
      // Navegar a la página de perfil del usuario solicitante
      window.open(`/user/perfil/${request.applicantId}`, '_blank');
    } catch (error) {
      console.error('Error navigating to requester profile:', error);
      this.showToast('Error al acceder al perfil del solicitante', 'danger');
    }
  }

  // Llamar por teléfono al solicitante
  async callRequester(request: AdoptionRequestWithPet) {
    try {
      const requesterInfo = await this.authService.getUserById(request.applicantId);

      if (!requesterInfo?.telefono) {
        this.showToast('No se encontró número de teléfono del solicitante', 'warning');
        return;
      }

      // Abrir la aplicación de teléfono
      const phoneNumber = requesterInfo.telefono.replace(/\D/g, '');
      window.open(`tel:${phoneNumber}`, '_self');

    } catch (error) {
      console.error('Error calling requester:', error);
      this.showToast('Error al realizar la llamada', 'danger');
    }
  }

  // Enviar email al solicitante
  async emailRequester(request: AdoptionRequestWithPet) {
    try {
      const requesterInfo = await this.authService.getUserById(request.applicantId);

      if (!requesterInfo?.email) {
        this.showToast('No se encontró email del solicitante', 'warning');
        return;
      }

      // Crear mensaje personalizado para el email
      const subject = encodeURIComponent(`Solicitud de adopción para ${request.pet.name}`);
      const body = encodeURIComponent(`Hola ${request.requester.name},

He recibido tu solicitud de adopción para ${request.pet.name} (${request.pet.type}).

Me gustaría conversar contigo sobre los detalles de la adopción.

¡Gracias por tu interés!

Saludos cordiales`);

      // Abrir cliente de email
      window.open(`mailto:${requesterInfo.email}?subject=${subject}&body=${body}`, '_self');

    } catch (error) {
      console.error('Error sending email to requester:', error);
      this.showToast('Error al abrir el email', 'danger');
    }
  }

  // Confirmar entrega como propietario
  async confirmDeliveryAsOwner(request: AdoptionRequestWithPet) {
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
            const loading = await this.loadingController.create({
              message: 'Confirmando entrega...'
            });

            try {
              await loading.present();

              await this.adoptionService.confirmDeliveryAsOwner(request.id!, request.petId);

              this.showToast('¡Entrega confirmada! Esperando confirmación del adoptante.', 'success');

              // Recargar las solicitudes
              await this.loadRequests();

            } catch (error) {
              console.error('Error al confirmar la entrega:', error);
              this.showToast('Error al confirmar la entrega', 'danger');
            } finally {
              await loading.dismiss();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  viewReceipt(pdfUrl: string) {
    if (pdfUrl) {
      window.open(pdfUrl, '_system');
    }
  }
  toDate(timestamp: any): Date {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    // Handle Firestore Timestamp
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    // Handle object with seconds (serialized Timestamp)
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000);
    }
    // Handle string or number
    return new Date(timestamp);
  }

  // TrackBy function for performance optimization
  trackByRequestId(index: number, request: AdoptionRequest): string {
    return request.id!;
  }
}

