import { Component, Input, OnInit } from '@angular/core';
import { ModalController, AlertController, LoadingController } from '@ionic/angular';
import { AdoptionRequest } from 'src/app/models/AdoptionRequest';
import { Adopcion } from 'src/app/models/Adopcion';
import { HandoverReceipt, DeliveryChecklist, generateReceiptNumber } from 'src/app/models/AdoptionDocument';
import { AdoptionDocumentService } from 'src/app/services/adoption-document.service';
import { AdoptionService } from 'src/app/services/adoption.service';
import { AuthService } from 'src/app/services/auth.service';
import { ToastService } from 'src/app/services/toast.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-delivery-confirmation-modal',
  templateUrl: './delivery-confirmation-modal.component.html',
  styleUrls: ['./delivery-confirmation-modal.component.scss'],
})
export class DeliveryConfirmationModalComponent implements OnInit {
  @Input() adoptionRequest!: AdoptionRequest;
  @Input() pet!: Adopcion;
  @Input() userRole!: 'owner' | 'adopter'; // Who is confirming
  
  deliveryLocation: string = '';
  deliveryNotes: string = '';
  deliveryPhotos: string[] = [];
  
  checklist: DeliveryChecklist = {
    pet: false,
    vaccinationCard: false,
    medicalDocuments: false,
    food: false,
    accessories: false
  };

  ownerName: string = '';
  adopterName: string = '';
  
  isSubmitting: boolean = false;

  constructor(
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private documentService: AdoptionDocumentService,
    private adoptionService: AdoptionService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  async ngOnInit() {
    // Get owner name from pet data
    this.ownerName = 'Dueño Original'; // Will be loaded from pet owner data
    this.adopterName = this.adoptionRequest.applicantName || 'Adoptante';
  }

  cancel() {
    this.modalCtrl.dismiss();
  }

  async takePhoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      if (image.dataUrl) {
        this.deliveryPhotos.push(image.dataUrl);
        this.toastService.presentToast('Foto agregada', 'success', 'camera-outline');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      this.toastService.presentToast('Error al tomar foto', 'danger', 'alert-circle-outline');
    }
  }

  async selectFromGallery() {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos
      });

      if (image.dataUrl) {
        this.deliveryPhotos.push(image.dataUrl);
        this.toastService.presentToast('Foto agregada', 'success', 'image-outline');
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      this.toastService.presentToast('Error al seleccionar foto', 'danger', 'alert-circle-outline');
    }
  }

  removePhoto(index: number) {
    this.deliveryPhotos.splice(index, 1);
  }

  isFormValid(): boolean {
    return this.deliveryLocation.trim().length > 0 &&
           this.checklist.pet &&
           this.checklist.vaccinationCard &&
           this.checklist.medicalDocuments;
  }

  async confirmDelivery() {
    if (!this.isFormValid()) {
      const alert = await this.alertCtrl.create({
        header: 'Información Incompleta',
        message: 'Por favor completa los campos obligatorios y marca los items críticos de la lista de verificación.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const alert = await this.alertCtrl.create({
      header: '✅ Confirmar Entrega',
      message: `¿Confirmas que ${this.userRole === 'owner' ? 'has entregado' : 'has recibido'} a ${this.pet.nombre}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          handler: async () => {
            await this.submitConfirmation();
          }
        }
      ]
    });
    await alert.present();
  }

  private async submitConfirmation() {
    this.isSubmitting = true;
    const loading = await this.loadingCtrl.create({
      message: 'Procesando confirmación...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const currentUser = await this.authService.getCurrentUser();
      if (!currentUser) throw new Error('No authenticated user');

      const now = new Date();

      // Check if this is the first or second confirmation
      const requestDoc = await this.adoptionService.getRequestById(this.adoptionRequest.id!).toPromise();
      
      const isFirstConfirmation = !requestDoc?.ownerDeliveryConfirmedAt && !requestDoc?.adopterDeliveryConfirmedAt;
      const isBothConfirmed = this.userRole === 'owner' 
        ? !!requestDoc?.adopterDeliveryConfirmedAt 
        : !!requestDoc?.ownerDeliveryConfirmedAt;

      // Update adoption request with confirmation
      const updateData: any = {
        deliveryLocation: this.deliveryLocation,
        deliveryNotes: this.deliveryNotes,
        deliveryChecklist: this.checklist,
        deliveryPhotos: this.deliveryPhotos
      };

      if (this.userRole === 'owner') {
        updateData.ownerDeliveryConfirmedAt = now;
      } else {
        updateData.adopterDeliveryConfirmedAt = now;
      }

      await this.adoptionService.updateRequest(this.adoptionRequest.id!, updateData);

      // If both parties have confirmed, complete the adoption and generate receipt
      if (isBothConfirmed) {
        await this.completeFinalDelivery(now, requestDoc);
      }

      await loading.dismiss();
      
      if (isBothConfirmed) {
        this.toastService.presentToast('¡Adopción completada! Generando recibo...', 'success', 'checkmark-circle-outline');
      } else {
        this.toastService.presentToast('Confirmación registrada. Esperando confirmación de la otra parte.', 'success', 'checkmark-circle-outline');
      }

      this.modalCtrl.dismiss({ confirmed: true, bothConfirmed: isBothConfirmed });
    } catch (error) {
      await loading.dismiss();
      console.error('Error confirming delivery:', error);
      this.toastService.presentToast('Error al confirmar entrega', 'danger', 'alert-circle-outline');
      this.isSubmitting = false;
    }
  }

  private async completeFinalDelivery(deliveryDate: Date, requestDoc: any) {
    // Generate receipt
    const receipt: HandoverReceipt = {
      receiptNumber: generateReceiptNumber(),
      adoptionRequestId: this.adoptionRequest.id!,
      petId: this.pet.id!,
      petName: this.pet.nombre,
      owner: {
        id: this.pet.creadorId,
        name: this.ownerName,
        confirmed: true,
        confirmationDate: requestDoc.ownerDeliveryConfirmedAt || deliveryDate,
        signature: true
      },
      adopter: {
        id: this.adoptionRequest.applicantId,
        name: this.adopterName,
        confirmed: true,
        confirmationDate: requestDoc.adopterDeliveryConfirmedAt || deliveryDate,
        signature: true
      },
      delivery: {
        date: deliveryDate,
        location: this.deliveryLocation,
        checklist: this.checklist,
        photos: this.deliveryPhotos,
        additionalNotes: this.deliveryNotes
      },
      status: 'completed',
      completedAt: deliveryDate,
      createdAt: deliveryDate,
      updatedAt: deliveryDate
    };

    // Generate PDF
    const pdfBlob = await this.documentService.generateHandoverReceiptPDF(receipt);
    
    // Upload to Firebase Storage
    const pdfPath = `adoption-documents/receipts/${this.adoptionRequest.id}_${Date.now()}.pdf`;
    const pdfUrl = await this.documentService.uploadDocument(pdfBlob, pdfPath);

    // Save receipt document to Firestore
    const receiptId = await this.documentService.saveHandoverReceipt(receipt, pdfUrl);

    // Complete adoption
    await this.adoptionService.completeAdoption({
      adoptionId: this.adoptionRequest.id!,
      petId: this.pet.id!,
      adopterId: this.adoptionRequest.applicantId,
      deliveryDate: deliveryDate,
      comments: this.deliveryNotes,
      documents: {
        receiptId,
        receiptPdfUrl: pdfUrl
      }
    });

    // Update request with receipt info
    await this.adoptionService.updateRequest(this.adoptionRequest.id!, {
      receiptId,
      receiptPdfUrl: pdfUrl,
      status: 'completed'
    });
  }

  get allChecklistValid(): boolean {
    return Object.values(this.checklist).every(v => v === true);
  }
}
