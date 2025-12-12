import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@shared/services/toast.service';
import { User } from 'src/app/models/user';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AlertController, ModalController } from '@ionic/angular';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import { ChangeEmailModalComponent } from '../../../../components/change-email-modal/change-email-modal.component';


@Component({
  selector: 'app-editar-perfil',
  templateUrl: './editar-perfil.page.html',
  styleUrls: ['./editar-perfil.page.scss']
})
export class EditarPerfilPage implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;

  profileForm!: FormGroup;
  user: User | null = null;
  loading = false;

  // Image Cropper Properties
  previewImage: string | null = null; // For existing image
  imageChangedEvent: any = '';
  croppedImage: any = '';
  selectedImageFile: Blob | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private storage: AngularFireStorage,
    private toastService: ToastService,
    private router: Router,
    private alertController: AlertController,
    private modalController: ModalController
  ) { }

  async ngOnInit() {
    this.profileForm = this.fb.group({
      nombreCompleto: ['', Validators.required],
      nombreUsuario: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      direccion: ['', Validators.required],
      region: [''],
      ciudad: [''],
    });

    this.loading = true;
    this.user = await this.authService.getCurrentUser();
    if (this.user) {
      this.profileForm.patchValue(this.user);
      this.previewImage = this.user.profileImageUrl || 'assets/imgs/paw.png';
    }
    this.loading = false;
  }

  // Step 1: Trigger file input
  selectFile() {
    this.fileInput.nativeElement.click();
  }

  // Step 2: Get file from input
  onFileSelected(event: any): void {
    this.imageChangedEvent = event;
  }

  // Step 2b: Get file from camera
  async captureImage() {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false, // Editing will be done by the cropper
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    });

    if (image.dataUrl) {
      this.imageChangedEvent = image.dataUrl;
    }
  }

  // Step 3: Cropper generates image
  imageCropped(event: ImageCroppedEvent) {
    if (event.objectUrl && event.blob) {
      this.selectedImageFile = event.blob;
    }
  }

  // Step 4: User confirms crop
  confirmCrop() {
    if (this.selectedImageFile) {
      const reader = new FileReader();
      reader.onload = () => {
        this.croppedImage = reader.result as string;
      };
      reader.readAsDataURL(this.selectedImageFile);
    }
    this.imageChangedEvent = ''; // Hide cropper
  }

  // Step 5: User cancels crop
  cancelCrop() {
    this.imageChangedEvent = '';
    this.selectedImageFile = null;
    this.croppedImage = '';
  }

  async saveProfile() {
    if (!this.profileForm.valid || !this.user) {
      this.toastService.presentToast('Por favor, completa todos los campos requeridos.', 'warning', 'alert-circle-outline');
      return;
    }
    if (this.imageChangedEvent) {
      this.toastService.presentToast('Por favor, confirma o cancela el recorte de la imagen.', 'warning', 'crop-outline');
      return;
    }

    this.loading = true;

    try {
      // El email ahora se cambia solo a través del modal seguro
      await this.updateFirestoreProfile();

      this.toastService.presentToast('¡Perfil actualizado con éxito!', 'success', 'person-circle-outline');
      this.router.navigate(['/user/perfil', this.user!.uid]);

    } catch (error: any) {
      console.error('Error updating profile:', error);
      const fallbackMsg = error?.message || 'Hubo un error al actualizar tu perfil.';
      this.toastService.presentToast(fallbackMsg, 'danger', 'alert-circle-outline');
    } finally {
      this.loading = false;
    }
  }

  async updateFirestoreProfile() {
    if (!this.user) return;

    let profileImageUrl = this.user.profileImageUrl;
    if (this.selectedImageFile) {
      const filePath = `profile-images/${this.user!.uid}`;
      const fileRef = this.storage.ref(filePath);
      // Use the cropped blob to upload
      await fileRef.put(this.selectedImageFile);
      profileImageUrl = await fileRef.getDownloadURL().toPromise();
    }

    const { email, ...profileData } = this.profileForm.value;

    const updatedData: Partial<User> = {
      ...this.user,
      ...profileData,
      profileImageUrl: profileImageUrl || this.user.profileImageUrl,
    };

    await this.authService.updateUserProfile(this.user!.uid, updatedData);
  }

  private async handleReauthForEmailChange() {
    const alert = await this.alertController.create({
      header: 'Se requiere autenticación',
      message: 'Por tu seguridad, para cambiar el email debes volver a iniciar sesión. Se cerrará tu sesión actual.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            this.loading = false;
          }
        },
        {
          text: 'Ir a Login',
          handler: async () => {
            await this.authService.logout();
            this.router.navigate(['/auth/login']);
            this.toastService.presentToast('Por favor, inicia sesión de nuevo.', 'warning', 'log-in-outline');
          }
        }
      ]
    });
    await alert.present();
  }

  async cancel() {
    const alert = await this.alertController.create({
      header: 'Descartar Cambios',
      message: '¿Estás seguro de que quieres descartar los cambios? No se guardará nada.',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
        },
        {
          text: 'Sí, Descartar',
          handler: () => {
            this.router.navigate(['/user/perfil', this.user!.uid]);
          },
        },
      ],
    });

    await alert.present();
  }



  // Método para abrir el modal de cambio de email seguro
  async openChangeEmailModal() {
    const modal = await this.modalController.create({
      component: ChangeEmailModalComponent,
      cssClass: 'change-email-modal',
      backdropDismiss: false
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data?.success) {
      // Recargar datos del usuario después de cambio exitoso
      this.user = await this.authService.getCurrentUser();
      if (this.user) {
        this.profileForm.patchValue({ email: this.user.email });
      }
    }
  }

  // Método para cambiar contraseña
  async changePassword() {
    const alert = await this.alertController.create({
      header: 'Cambiar Contraseña',
      message: 'Será redirigido para cambiar su contraseña de forma segura.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Continuar',
          handler: () => {
            // Aquí podrías implementar la navegación al componente de cambio de contraseña
            // o usar Firebase Auth UI para cambiar contraseña
            this.toastService.presentToast('Funcionalidad de cambio de contraseña en desarrollo', 'warning', 'construct-outline');
          }
        }
      ]
    });

    await alert.present();
  }

}

