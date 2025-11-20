import { Component, OnInit, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReportService } from '../../services/report.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from 'src/app/services/auth.service';
import { Adopcion } from 'src/app/models/Adopcion'; // Import Adopcion interface

@Component({
  selector: 'app-report-modal',
  templateUrl: './report-modal.page.html',
  styleUrls: ['./report-modal.page.scss'],
})
export class ReportModalPage implements OnInit {
  @Input() reportedItemId!: string;
  @Input() reportedItemType!: 'pet' | 'user' | 'adopcion';
  @Input() reportedItem?: Adopcion; // New Input for the full reported item

  reportForm!: FormGroup;
  loading: boolean = false;
  maxLength: number = 500; // Define the maximum length for the details textarea
  detailsLength: number = 0;
  charWarningThreshold: number = 80;
  userAuthenticated: boolean = false;
  publisherName: string | null = null;
  publisherAvatar: string | null = null;
  isSelfReport: boolean = false;
  reasonOptions = [
    {
      value: 'inappropriate_content',
      title: 'Contenido inapropiado',
      description: 'Lenguaje, imágenes o enlaces ofensivos o explícitos.',
      icon: 'ban-outline',
      color: 'danger' as const
    },
    {
      value: 'false_information',
      title: 'Información falsa',
      description: 'Datos incorrectos sobre la mascota o el proceso de adopción.',
      icon: 'alert-circle-outline',
      color: 'warning' as const
    },
    {
      value: 'spam',
      title: 'Spam o publicidad',
      description: 'Contenido repetitivo o con fines comerciales ajenos a la plataforma.',
      icon: 'megaphone-outline',
      color: 'tertiary' as const
    },
    {
      value: 'animal_abuse',
      title: 'Maltrato animal',
      description: 'Indicios de daño, abandono o trato peligroso hacia el animal.',
      icon: 'paw-outline',
      color: 'danger' as const
    },
    {
      value: 'other',
      title: 'Otro motivo',
      description: 'Describe cualquier otra situación que necesitemos revisar.',
      icon: 'chatbox-ellipses-outline',
      color: 'medium' as const
    }
  ];

  constructor(
    private modalController: ModalController,
    private formBuilder: FormBuilder,
    private reportService: ReportService,
    private toastService: ToastService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.reportForm = this.formBuilder.group({
      reason: ['', Validators.required],
      details: ['', Validators.maxLength(this.maxLength)]
    });

    // Initialize detailsLength if there's any initial value
    this.detailsLength = this.reportForm.get('details')?.value?.length || 0;

    // Subscribe to value changes to update the character count
    this.reportForm.get('details')?.valueChanges.subscribe(value => {
      this.detailsLength = value?.length || 0;
    });
  }

  async ionViewWillEnter() {
    // Ensure user is authenticated before allowing submit
    const user = await this.authService.getCurrentUser();
    this.userAuthenticated = !!user;

    // detect self-report: if current user is the owner/creator of the reported pet
    try {
      if (user) {
        if (this.reportedItemType === 'pet' && this.reportedItem && this.reportedItem.creadorId) {
          this.isSelfReport = (this.reportedItem.creadorId === user.uid);
        } else if (this.reportedItemType === 'user') {
          this.isSelfReport = (this.reportedItemId === user.uid);
        } else {
          this.isSelfReport = false;
        }
      }
    } catch (err) {
      console.warn('Error checking self-report status:', err);
      this.isSelfReport = false;
    }

    // Load publisher (creator) info for preview if available
    try {
      const creatorId = this.reportedItem?.creadorId;
      if (creatorId) {
        const creator = await this.authService.getUserData(creatorId);
        if (creator) {
          this.publisherName = creator.nombreCompleto || creator.nombreUsuario || creator.email || creator.uid;
          this.publisherAvatar = (creator.profileImageUrl && creator.profileImageUrl.length) ? creator.profileImageUrl : null;
        }
      }
    } catch (err) {
      console.warn('No se pudo cargar info del publicador:', err);
    }
  }

  get selectedReason(): string {
    return this.reportForm?.get('reason')?.value;
  }

  get remainingCharacters(): number {
    return this.maxLength - this.detailsLength;
  }

  get nearLimit(): boolean {
    return this.remainingCharacters <= this.charWarningThreshold;
  }

  trackReason(_: number, reason: { value: string }) {
    return reason.value;
  }

  async goToLogin() {
    await this.modalController.dismiss();
    this.router.navigate(['/login']);
  }

  updateDetailsLength() {
    // This method is called on ionChange, but the subscription above handles the actual update
    // It's kept for clarity if direct binding was preferred over subscription
  }

  async submitReport() {
    if (this.loading) return; // Prevent double submit
    if (this.reportForm.invalid) {
      await this.toastService.presentToast('Por favor, selecciona un motivo para el reporte y asegúrate de que los detalles no excedan los ' + this.maxLength + ' caracteres.', 'warning', 'alert-outline');
      return;
    }

    if (this.isSelfReport) {
      await this.toastService.presentToast('No puedes reportarte a ti mismo ni reportar tu propia publicación.', 'warning', 'information-circle');
      return;
    }

    this.loading = true;
    const { reason, details } = this.reportForm.value;
    const sanitizedDetails = details?.trim() || '';

    try {
      await this.reportService.submitReport(this.reportedItemId, this.reportedItemType, reason, sanitizedDetails, this.reportedItem);
      // Close the modal first so the toast is shown on the parent page/window
      await this.closeModal();
      await this.toastService.presentToast('Reporte enviado con éxito. Gracias por tu ayuda.', 'success', 'checkmark-circle-outline');
    } catch (error) {
      console.error('Error submitting report:', error);
      await this.toastService.presentToast('Error al enviar el reporte. Inténtalo de nuevo.', 'danger', 'alert-circle-outline');
    } finally {
      this.loading = false;
    }
  }

  async closeModal() {
    await this.modalController.dismiss();
  }
}
