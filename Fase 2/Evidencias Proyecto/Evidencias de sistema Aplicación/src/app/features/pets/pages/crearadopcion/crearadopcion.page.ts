import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AuthService } from '@core/services/auth.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Router } from '@angular/router';
import { ToastService } from '@shared/services/toast.service';
import { PetsService } from '@features/pets/services/pets.service';
import { Preferences } from '@capacitor/preferences';
import { ImageCroppedEvent, ImageTransform } from 'ngx-image-cropper';

@Component({
  selector: 'app-crearadopcion',
  templateUrl: './crearadopcion.page.html',
  styleUrls: ['./crearadopcion.page.scss'],
})
export class CrearadopcionPage implements OnInit {
  adopcionForm!: FormGroup;
  selectedImage: File | null = null;
  loading: boolean = false;

  // Image Cropper properties
  imageChangedEvent: any = '';
  croppedImage: any = '';
  croppedBlob: Blob | null = null;

  // Transform properties
  transform: ImageTransform = {};
  canvasRotation = 0;
  scale = 1;

  readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  readonly ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

  constructor(
    private formBuilder: FormBuilder,
    private alertController: AlertController,
    private storage: AngularFireStorage,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService,
    private petsService: PetsService
  ) { }

  ngOnInit() {
    this.adopcionForm = this.formBuilder.group({
      tipoMascota: ['', Validators.required],
      tamano: ['', Validators.required],
      etapaVida: ['', Validators.required],
      edadMeses: ['', [Validators.min(0), Validators.max(11), Validators.pattern('^[0-9]+$')]],
      edadAnios: ['', [Validators.min(1), Validators.max(100), Validators.pattern('^[0-9]+$')]],
      nombre: ['', [Validators.pattern('^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$')]],
      sexo: ['', Validators.required],
      color: ['', [Validators.required, Validators.pattern('^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$')]],
      esterilizado: [false],
      vacuna: [false],
      desparasitado: [false],
      descripcion: ['', [Validators.pattern('^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñÜü., ]*$')]],
      condicionesSalud: ['', [Validators.pattern('^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñÜü., ]*$')]],

      // Personalidad y compatibilidad
      buenoConNinos: [false],
      buenoConMascotas: [false],
      energetico: [false],
      tranquilo: [false],
      entrenadoEnCasa: [false],
      guardian: [false],

      // Información de ubicación
      ciudad: ['', [Validators.required, Validators.pattern('^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$')]],
      barrio: ['', [Validators.pattern('^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$')]],
      latitud: [''],
      longitud: [''],
    });

    this.adopcionForm.get('etapaVida')?.valueChanges.subscribe((etapa) => {
      this.actualizarValidacionesEdad(etapa);
    });
  }

  actualizarValidacionesEdad(etapa: string) {
    const edadMesesControl = this.adopcionForm.get('edadMeses');
    const edadAniosControl = this.adopcionForm.get('edadAnios');

    // Limpiar validadores primero
    edadMesesControl?.clearValidators();
    edadAniosControl?.clearValidators();

    switch (etapa) {
      case 'cachorro':
        edadMesesControl?.setValidators([Validators.required, Validators.min(0), Validators.max(11), Validators.pattern('^[0-9]+$')]);
        edadAniosControl?.reset();
        break;
      case 'joven':
        edadAniosControl?.setValidators([Validators.required, Validators.min(1), Validators.max(3), Validators.pattern('^[0-9]+$')]);
        edadMesesControl?.reset();
        break;
      case 'adulto':
        edadAniosControl?.setValidators([Validators.required, Validators.min(3), Validators.max(8), Validators.pattern('^[0-9]+$')]);
        edadMesesControl?.reset();
        break;
      case 'senior':
        edadAniosControl?.setValidators([Validators.required, Validators.min(8), Validators.max(20), Validators.pattern('^[0-9]+$')]);
        edadMesesControl?.reset();
        break;
    }

    edadMesesControl?.updateValueAndValidity();
    edadAniosControl?.updateValueAndValidity();
  }

  togglePersonality(field: string) {
    const currentValue = this.adopcionForm.get(field)?.value;
    this.adopcionForm.get(field)?.setValue(!currentValue);
  }

  setSize(size: string) {
    this.adopcionForm.get('tamano')?.setValue(size);
    this.adopcionForm.get('tamano')?.markAsTouched();
  }

  setAgeStage(stage: string) {
    this.adopcionForm.get('etapaVida')?.setValue(stage);
    this.adopcionForm.get('etapaVida')?.markAsTouched();
  }

  setGender(gender: string) {
    this.adopcionForm.get('sexo')?.setValue(gender);
    this.adopcionForm.get('sexo')?.markAsTouched();
  }

  setPetType(type: string) {
    this.adopcionForm.get('tipoMascota')?.setValue(type);
    this.adopcionForm.get('tipoMascota')?.markAsTouched();
  }

  getDescriptionLength(): number {
    const description = this.adopcionForm.get('descripcion')?.value || '';
    return description.length;
  }

  getHealthLength(): number {
    const health = this.adopcionForm.get('condicionesSalud')?.value || '';
    return health.length;
  }



  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (!this.ALLOWED_MIME_TYPES.includes(file.type)) {
        await this.toastService.presentToast('Tipo de archivo no permitido. Solo se aceptan JPG, PNG, GIF.', 'danger', 'alert-circle-outline');
        return;
      }
      if (file.size > this.MAX_FILE_SIZE) {
        await this.toastService.presentToast('El tamaño del archivo excede el límite de 5MB.', 'danger', 'alert-circle-outline');
        return;
      }
      this.imageChangedEvent = event;
    }
  }

  async captureImage() {
    const image = await Camera.getPhoto({
      quality: 90,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      allowEditing: false,
    });

    if (image?.dataUrl) {
      this.imageChangedEvent = image.dataUrl;
    }
  }

  imageCropped(event: ImageCroppedEvent) {
    if (event.objectUrl && event.blob) {
      this.croppedBlob = event.blob;
    }
  }

  rotateLeft() {
    this.canvasRotation--;
    this.flipAfterRotate();
  }

  rotateRight() {
    this.canvasRotation++;
    this.flipAfterRotate();
  }

  private flipAfterRotate() {
    const flippedH = this.transform.flipH;
    const flippedV = this.transform.flipV;
    this.transform = {
      ...this.transform,
      flipH: flippedV,
      flipV: flippedH
    };
  }

  zoomOut() {
    this.scale -= .1;
    this.transform = {
      ...this.transform,
      scale: this.scale
    };
  }

  zoomIn() {
    this.scale += .1;
    this.transform = {
      ...this.transform,
      scale: this.scale
    };
  }

  resetCrop() {
    this.scale = 1;
    this.canvasRotation = 0;
    this.transform = {};
  }

  confirmCrop() {
    if (this.croppedBlob) {
      this.selectedImage = new File([this.croppedBlob], 'cropped_image.jpeg', { type: 'image/jpeg' });
      const reader = new FileReader();
      reader.onload = () => {
        this.croppedImage = reader.result as string;
      };
      reader.readAsDataURL(this.croppedBlob);
    }
    this.imageChangedEvent = ''; // Hide cropper
  }

  cancelCrop() {
    this.imageChangedEvent = '';
    this.croppedImage = '';
    this.selectedImage = null;
    this.croppedBlob = null;
    this.resetCrop();
  }

  removeImage() {
    this.cancelCrop(); // Same logic
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  dataURLtoFile(dataUrl: string, filename: string): File {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  async uploadImage(): Promise<string> {
    if (!this.selectedImage) {
      throw new Error('No se ha seleccionado ninguna imagen para subir.');
    }
    try {
      const filePath = `adopciones/${new Date().getTime()}_${this.selectedImage.name}`;
      const fileRef = this.storage.ref(filePath);
      await this.storage.upload(filePath, this.selectedImage);
      const downloadURL = await fileRef.getDownloadURL().toPromise();
      if (!downloadURL) {
        throw new Error('No se pudo obtener la URL de descarga de la imagen.');
      }
      return downloadURL;
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      throw new Error('Fallo al subir la imagen. Por favor, intenta de nuevo.');
    }
  }

  async onSubmit() {
    if (this.adopcionForm.invalid) {
      await this.toastService.presentToast('Por favor, completa todos los campos requeridos correctamente.', 'warning', 'alert-outline');
      return;
    }
    if (this.imageChangedEvent && !this.croppedImage) {
      await this.toastService.presentToast('Por favor, confirma o cancela el recorte de la imagen.', 'warning', 'crop-outline');
      return;
    }

    this.loading = true;
    const formData = this.adopcionForm.value;

    try {
      const currentUser = await this.authService.getCurrentUser();
      if (!currentUser) {
        await this.toastService.presentToast('¡Un momento! Inicia sesión para crear una publicación.', 'warning', 'log-in-outline');
        this.router.navigate(['/auth/login']);
        this.loading = false;
        return;
      }

      formData.creadorId = currentUser.uid;
      formData.creadorRole = currentUser.role || 'individual';
      formData.createdAt = new Date();
      formData.status = 'available';
      formData.isHidden = false;

      if (this.selectedImage) {
        try {
          const imageUrl = await this.uploadImage();
          formData.urlImagen = imageUrl;
        } catch (imageError: any) {
          await this.toastService.presentToast(imageError.message || 'Error al subir la imagen.', 'danger', 'alert-circle-outline');
          this.loading = false;
          return;
        }
      }

      await this.petsService.createPet(formData);
      await this.toastService.presentToast('¡Una nueva esperanza! Publicación creada.', 'success', 'paw-outline');
      this.adopcionForm.reset();
      this.removeImage();
      await Preferences.remove({ key: 'adopciones' });
      this.router.navigate(['/pets/home']);

    } catch (error) {
      console.error('Error guardando adopción:', error);
      await this.toastService.presentToast('Hubo un error al guardar. Por favor, intenta nuevamente.', 'danger', 'alert-circle-outline');
    } finally {
      this.loading = false;
    }
  }

  async onClear() {
    const alert = await this.alertController.create({
      header: 'Confirmar Limpieza',
      message: '¿Estás seguro de que deseas borrar todos los datos del formulario?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Sí, Limpiar',
          handler: () => {
            this.adopcionForm.reset();
            this.removeImage();
          },
        },
      ],
    });

    await alert.present();
  }

  goToHome() {
    this.router.navigate(['/pets/home']);
  }

  onEdadMesesChange(event: any) {
    const value = event.detail.value;
    if (value !== null && value !== undefined) {
      const numericValue = Number(value);
      if (numericValue > 11) {
        this.adopcionForm.get('edadMeses')?.setValue(11);
        this.toastService.presentToast("Para 12 meses o más, por favor selecciona 'Adulto' y especifica la edad en años.", 'warning', 'information-circle-outline');
      } else if (numericValue < 0) {
        this.adopcionForm.get('edadMeses')?.setValue(0);
      }
    }
  }

  onEdadAniosChange(event: any) {
    const value = event.detail.value;
    if (value !== null && value !== undefined) {
      const numericValue = Number(value);
      if (numericValue > 100) {
        this.adopcionForm.get('edadAnios')?.setValue(100);
      } else if (numericValue < 1) {
        this.adopcionForm.get('edadAnios')?.setValue(1);
      }
    }
  }


}
