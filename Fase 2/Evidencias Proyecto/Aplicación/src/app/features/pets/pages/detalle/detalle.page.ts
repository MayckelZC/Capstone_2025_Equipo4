import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Adopcion } from 'src/app/models/Adopcion';
import { User } from 'src/app/models/user';
import { Share } from '@capacitor/share';
import { AuthService } from '@core/services/auth.service';
import { Router } from '@angular/router';
import { NgZone } from '@angular/core';
import { AlertController, ModalController, LoadingController } from '@ionic/angular';
import { ImageViewerModalComponent } from './image-viewer.modal';
import { ToastService } from '@shared/services/toast.service';
import { ReportModalPage } from '../../../reports/pages/report-modal/report-modal.page';
import { NotificationService } from '@shared/services/notification.service';
import { PetsService } from '@features/pets/services/pets.service';
import { AdoptionService } from '@features/adoption/services/adoption.service';
import { AdoptionRequest } from 'src/app/models/AdoptionRequest';
import { Observable, of, Subject } from 'rxjs';
import { switchMap, take, takeUntil } from 'rxjs/operators';
import { FavoriteService } from '@features/pets/services/favorite.service';
import { AdoptionQuestionnaireComponent } from 'src/app/components/adoption-questionnaire/adoption-questionnaire.component';
import { Favorite } from 'src/app/models/Favorite';
import { AdoptionDocumentService } from '@features/adoption/services/adoption-document.service';
import { AdoptionCommitment } from 'src/app/models/AdoptionDocument';

@Component({
  selector: 'app-detalle',
  templateUrl: 'detalle.page.html',
  styleUrls: ['detalle.page.scss'],
})
export class DetallePage implements OnInit, OnDestroy {
  pet: Adopcion | null = null;
  user: User | null = null;
  dataNotFound: boolean = false;
  publisherNotFound: boolean = false;
  isFavorite: boolean = false;
  favoriteId: string | null = null;
  favoriteInFlight: boolean = false;
  isOwner: boolean = false;
  isAdopter: boolean = false;
  hasPendingRequest$!: Observable<boolean>;
  showAdoptionUpdateNotification: boolean = false;
  imageLoaded: boolean = false;

  private destroy$ = new Subject<void>();

  static petCache: Map<string, Adopcion> = new Map();
  static userCache: Map<string, User> = new Map();

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private alertController: AlertController,
    private toastService: ToastService,
    private modalController: ModalController,
    private petsService: PetsService,
    private adoptionService: AdoptionService,
    private favoriteService: FavoriteService,
    private notificationService: NotificationService,
    private router: Router,
    private zone: NgZone,
    private loadingCtrl: LoadingController,
    private documentService: AdoptionDocumentService
  ) { }

  async ngOnInit() {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(async (params) => {
      const id = params['id'];
      if (id) {
        this.dataNotFound = false;
        this.publisherNotFound = false;
        await this.fetchPetDetails(id);
      } else {
        this.dataNotFound = true;
      }
    });
  }

  async openImageViewer(index: number = 0) {
    if (!this.pet) return;
    const images = (this.pet.gallery && this.pet.gallery.length) ? this.pet.gallery : (this.pet.urlImagen ? [this.pet.urlImagen] : []);
    const modal = await this.modalController.create({
      component: ImageViewerModalComponent,
      componentProps: {
        images,
        index
      },
      cssClass: 'image-viewer-modal'
    });
    await modal.present();
  }

  private async fetchPetDetails(id: string) {
    this.petsService.getPet(id).pipe(take(1)).subscribe(async pet => {
      if (pet) {
        this.pet = pet;
        await this.fetchUserDetails(this.pet.creadorId);
        await this.checkFavoriteStatus();
        this.setupAdoptionStatus();
      } else {
        console.warn(`No se encontró la mascota con ID: ${id}`);
        this.dataNotFound = true;
      }
    });
  }

  private async fetchUserDetails(creadorId: string) {
    try {
      const user = await this.authService.getUserData(creadorId);
      if (user) {
        this.user = user;
      } else {
        this.publisherNotFound = true;
      }
    } catch (error) {
      console.error('Error al obtener los datos del usuario:', error);
      this.publisherNotFound = true;
    }
  }

  viewPublisherProfile() {
    if (this.user && this.user.uid) {
      // Use router navigation to the perfil page
      this.zone.run(() => this.router.navigate(['/perfil', this.user!.uid]));
    }
  }

  callPublisher() {
    if (this.user && this.user.telefono) {
      window.open(`tel:${this.user.telefono}`);
    }
  }

  emailPublisher() {
    if (this.user && this.user.email) {
      window.open(`mailto:${this.user.email}`);
    }
  }

  public getWhatsAppLink(telefono: string): string {
    if (!telefono) {
      return '';
    }
    // Remove non-numeric characters
    const sanitizedPhone = telefono.replace(/\D/g, '');
    return `https://wa.me/${sanitizedPhone}`;
  }

  private async setupAdoptionStatus() {
    const currentUser = await this.authService.getCurrentUser();
    if (currentUser && this.pet) {
      this.isOwner = currentUser.uid === this.pet.creadorId;
      this.isAdopter = currentUser.uid === this.pet.selectedAdopterId;
      this.hasPendingRequest$ = this.adoptionService.hasPendingRequest(currentUser.uid, this.pet.id);
    } else {
      this.hasPendingRequest$ = of(false);
    }
  }

  async confirmHandover() {
    const currentUser = await this.authService.getCurrentUser();
    if (!currentUser || !this.pet) return;

    const alert = await this.alertController.create({
      header: 'Confirmar Entrega',
      message: '¿Confirmas que has entregado la mascota al adoptante? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: async () => {
            try {
              await this.adoptionService.confirmHandover(this.pet.id, currentUser.uid);
              this.toastService.presentToast('Entrega confirmada. Esperando confirmación del adoptante.', 'success');
              this.pet.giverConfirmedHandover = true; // Optimistic update
            } catch (error) {
              this.toastService.presentToast(`Error: ${error.message}`, 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async confirmReceipt() {
    const currentUser = await this.authService.getCurrentUser();
    if (!currentUser || !this.pet) return;

    const alert = await this.alertController.create({
      header: 'Confirmar Recepción',
      message: '¿Confirmas que has recibido la mascota? Esta acción finalizará el proceso de adopción.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: async () => {
            try {
              await this.adoptionService.confirmReceipt(this.pet.id, currentUser.uid);
              this.toastService.presentToast('¡Recepción confirmada! La adopción está completa.', 'success');
              this.pet.adopterConfirmedReceipt = true; // Optimistic update
            } catch (error) {
              this.toastService.presentToast(`Error: ${error.message}`, 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async solicitarAdopcion() {
    this.toastService.presentToast('Procesando solicitud...', 'success', 'hourglass-outline');
    const currentUser = await this.authService.getCurrentUser();
    if (!currentUser || !this.pet) {
      this.toastService.presentToast('Error: No se puede procesar la solicitud.', 'danger', 'alert-circle-outline');
      return;
    }

    if (this.isOwner) {
      this.toastService.presentToast('No puedes solicitar la adopción de tu propia publicación.', 'warning', 'information-circle');
      return;
    }

    if (this.pet.status && this.pet.status !== 'available') {
      this.toastService.presentToast('Esta mascota no está disponible para adopción.', 'warning', 'information-circle');
      return;
    }

    const modal = await this.modalController.create({
      component: AdoptionQuestionnaireComponent,
      componentProps: {
        petName: this.pet.nombre,
        petId: this.pet.id,
      },
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data) {
      const loading = await this.loadingCtrl.create({
        message: 'Generando documentos...',
        spinner: 'crescent'
      });
      await loading.present();

      try {
        // Complete commitment document with user info
        const commitment: AdoptionCommitment = {
          adoptionRequestId: '', // Will be updated after creating request
          adopterId: currentUser.uid,
          adopterName: currentUser.nombreCompleto,
          petId: this.pet.id!,
          petName: this.pet.nombre,
          personalData: {
            fullName: currentUser.nombreCompleto,
            email: currentUser.email,
            phone: currentUser.telefono || '',
            address: '' // TODO: Get from user profile if available
          },
          commitments: {
            longTermCare: true,
            veterinaryExpenses: true,
            noAbandonment: true,
            returnPolicy: true,
            legalConsequences: true,
            addressChangeNotification: true
          },
          signature: {
            accepted: true,
            timestamp: new Date()
          },
          createdAt: new Date()
        };

        // Generate PDF
        const pdfBlob = await this.documentService.generateCommitmentPDF(commitment);

        // Upload to Firebase Storage
        const pdfPath = `adoption-documents/commitments/${this.pet.id}_${currentUser.uid}_${Date.now()}.pdf`;
        const pdfUrl = await this.documentService.uploadDocument(pdfBlob, pdfPath);

        // Save commitment document to Firestore
        const commitmentId = await this.documentService.saveCommitmentDocument(commitment, pdfUrl);

        const request: AdoptionRequest = {
          petId: this.pet.id,
          petName: this.pet.nombre,
          petImageUrl: this.pet.urlImagen,
          creatorId: this.pet.creadorId, // UID of the pet's creator
          applicantId: currentUser.uid,
          applicantName: currentUser.nombreCompleto,
          requestDate: new Date(),
          status: 'pending',
          ...data.formData,
          commitmentDocumentId: commitmentId, // Reference to commitment document
          commitmentPdfUrl: pdfUrl
        };

        await this.adoptionService.createRequest(request);

        await loading.dismiss();
        this.toastService.presentToast('¡Solicitud y documento enviados con éxito!', 'success', 'checkmark-circle-outline');
        this.setupAdoptionStatus(); // Refresh status
      } catch (error) {
        await loading.dismiss();
        console.error("Error creating adoption request:", error);
        this.toastService.presentToast('Error al enviar la solicitud.', 'danger', 'alert-circle-outline');
      }
    }
  }

  private async checkFavoriteStatus() {
    const currentUser = await this.authService.getCurrentUser();
    if (currentUser && this.pet) {
      this.favoriteService.getFavorites(currentUser.uid).pipe(takeUntil(this.destroy$)).subscribe(favorites => {
        const favorite = favorites.find(fav => fav.petId === this.pet.id);
        if (favorite) {
          this.isFavorite = true;
          this.favoriteId = favorite.id;
        } else {
          this.isFavorite = false;
          this.favoriteId = null;
        }
      });
    }
  }

  async toggleFavorite() {
    const currentUser = await this.authService.getCurrentUser();
    if (!currentUser || !this.pet) {
      // prompt login if needed
      this.toastService.presentToast('Inicia sesión para usar favoritos.', 'warning', 'person-circle');
      return;
    }

    if (this.favoriteInFlight) return; // avoid duplicate requests
    this.favoriteInFlight = true;

    try {
      if (this.isFavorite && this.favoriteId) {
        // optimistic UI
        this.isFavorite = false;
        await this.favoriteService.removeFavorite(currentUser.uid, this.favoriteId);
        this.favoriteId = null;
        this.toastService.presentToast('Eliminado de favoritos', 'success', 'checkmark-circle-outline');
      } else {
        // optimistic UI
        this.isFavorite = true;
        try {
          const newId = await this.favoriteService.addFavorite(currentUser.uid, this.pet.id);
          // because we use petId as doc id, newId should equal this.pet.id
          this.favoriteId = newId;
          this.toastService.presentToast('Añadido a favoritos', 'success', 'checkmark-circle-outline');
        } catch (err) {
          // rollback
          this.isFavorite = false;
          console.error('Error adding favorite:', err);
          this.toastService.presentToast('No se pudo añadir a favoritos.', 'danger', 'alert-circle-outline');
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      // rollback if needed
      this.isFavorite = !!this.favoriteId;
      this.toastService.presentToast('Error al actualizar favoritos.', 'danger', 'alert-circle-outline');
    } finally {
      this.favoriteInFlight = false;
    }
  }

  async shareDetails() {
    if (!this.pet) {
      this.toastService.presentToast('No hay detalles para compartir.', 'warning', 'warning');
      return;
    }

    const content = this.getShareContent();
    const title = `Detalles de ${this.pet.nombre}`;
    const url = typeof window !== 'undefined' ? window.location.href : undefined;

    // Try Capacitor Share first
    try {
      await Share.share({
        title,
        text: content,
        url
      });
      return;
    } catch (err) {
      // Continue to web share fallback
      console.warn('Capacitor Share failed or unavailable:', err);
    }

    // Web Share API fallback
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({
          title,
          text: content,
          url
        });
        return;
      }
    } catch (err) {
      console.warn('Navigator.share failed:', err);
    }

    // Final fallback: copy to clipboard and notify the user
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(content + (url ? `\n\n${url}` : ''));
        this.toastService.presentToast('Detalles copiados al portapapeles.', 'success', 'copy');
        return;
      }
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }

    // As a last resort, show the content in an alert so user can copy manually
    const alert = await this.alertController.create({
      header: 'Compartir detalles',
      message: `<pre style="white-space:pre-wrap;">${this.escapeHtml(content + (url ? `\n\n${url}` : ''))}</pre>`,
      buttons: ['OK']
    });
    await alert.present();
  }

  private getShareContent(): string {
    if (!this.pet) return '';
    const pet = this.pet;
    const age = pet.etapaVida === 'cachorro'
      ? (pet.edadMeses ? `${pet.edadMeses} meses` : 'N/A')
      : (pet.edadAnios ? `${pet.edadAnios} años` : 'N/A');

    const parts: string[] = [];
    parts.push(`Nombre: ${pet.nombre || '-'} `);
    parts.push(`Tipo: ${pet.tipoMascota ? pet.tipoMascota : '-'} `);
    parts.push(`Edad: ${age}`);
    if (pet.color) parts.push(`Color: ${pet.color}`);
    if (pet.tamano) parts.push(`Tamaño: ${pet.tamano}`);
    if (pet.esterilizado !== undefined) parts.push(`Esterilizado: ${pet.esterilizado ? 'Sí' : 'No'}`);
    if (pet.vacuna !== undefined) parts.push(`Vacunas: ${pet.vacuna ? 'Al día' : 'No'}`);
    if (pet.descripcion) parts.push(`Descripción: ${pet.descripcion}`);

    // If current location contains id param, include link too
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (url) parts.push(`Enlace: ${url}`);

    return parts.join('\n');
  }

  private escapeHtml(str: string) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  async openReportModal() {
    if (!this.pet) {
      this.toastService.presentToast('No hay publicación para reportar.', 'warning', 'warning');
      return;
    }

    const modal = await this.modalController.create({
      component: ReportModalPage,
      componentProps: {
        reportedItemId: this.pet.id,
        reportedItemType: 'pet',
        reportedItem: this.pet
      },
      cssClass: 'report-modal'
    });

    await modal.present();
  }

  /**
   * Genera una descripción de la edad basada en la etapa de vida
   */
  getAgeDisplay(pet: Adopcion | null): string {
    if (!pet) return 'N/A';

    switch (pet.etapaVida) {
      case 'cachorro':
        return pet.edadMeses ? `${pet.edadMeses} meses` : 'N/A';
      case 'joven':
      case 'adulto':
        return pet.edadAnios ? `${pet.edadAnios} años` : 'N/A';
      case 'senior':
        return pet.edadAnios ? `${pet.edadAnios} años (Senior)` : 'N/A';
      default:
        return 'N/A';
    }
  }

  /**
   * Verifica si la mascota tiene características de personalidad definidas
   */
  hasPersonalityTraits(pet: Adopcion | null): boolean {
    if (!pet) return false;

    return !!(pet as any).buenoConNinos ||
      !!(pet as any).buenoConMascotas ||
      !!(pet as any).energetico ||
      !!(pet as any).tranquilo ||
      !!(pet as any).entrenadoEnCasa ||
      !!(pet as any).guardian;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
