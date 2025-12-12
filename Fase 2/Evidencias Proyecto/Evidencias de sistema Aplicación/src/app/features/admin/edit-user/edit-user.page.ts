import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { User } from '../../../models/user';
import { ToastService } from '@shared/services/toast.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.page.html',
  styleUrls: ['./edit-user.page.scss'],
})
export class EditUserPage implements OnInit {
  editUserForm!: FormGroup;
  userId!: string;
  loading: boolean = false;
  previewImage: string | null = null;
  selectedImageFile: Blob | null = null;

  readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  readonly ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private firestore: AngularFirestore,
    private router: Router,
    private toastService: ToastService,
    private storage: AngularFireStorage
  ) { }

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id')!;
    this.initForm();
    this.loadUserData();
  }

  initForm() {
    this.editUserForm = this.fb.group({
      nombreCompleto: ['', [Validators.required, Validators.minLength(3)]],
      nombreUsuario: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{8,15}$')]],
      direccion: ['', [Validators.required, Validators.minLength(5)]],
      role: ['individual', Validators.required],
      isAdmin: [false],
      isVeterinarian: [false],
      isBlocked: [false],
      isOrganization: [false],
      profileImageUrl: [''],
    });
  }

  async loadUserData() {
    if (this.userId) {
      this.loading = true;
      try {
        const userDoc = await this.firestore.collection('users').doc<User>(this.userId).get().toPromise();
        if (userDoc?.exists) {
          const userData = userDoc.data();
          // Simplificamos el patch. Los toggles y el rol ya no están acoplados.
          const patchedData = {
            ...userData,
            isAdmin: userData?.isAdmin || false,
            isVeterinarian: userData?.isVeterinarian || false,
            isBlocked: userData?.isBlocked || false,
            isOrganization: userData?.isOrganization || false,
            // Aseguramos un rol por defecto si no existe
            role: userData?.role || 'individual',
          };
          this.editUserForm.patchValue(patchedData as any);
          this.previewImage = userData?.profileImageUrl || null;
        } else {
          this.toastService.presentToast('User not found.', 'danger', 'alert-circle-outline');
          this.router.navigate(['/admin/users']);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        this.toastService.presentToast('Error loading user data.', 'danger', 'alert-circle-outline');
        this.router.navigate(['/admin/users']);
      } finally {
        this.loading = false;
      }
    }
  }

  async takePicture() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
      });

      if (image.dataUrl) {
        this.processSelectedImage(image.dataUrl);
      }
    } catch (error) {
      console.error('Error en takePicture():', error);
      await this.toastService.presentToast('Error al abrir la cámara/galería.', 'danger', 'alert-circle-outline');
    }
  }

  async handleFileInput(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.processSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async processSelectedImage(dataUrl: string) {
    const capturedFile = this.dataURLtoBlob(dataUrl, 'profile_image.png');

    if (!this.ALLOWED_MIME_TYPES.includes(capturedFile.type)) {
      await this.toastService.presentToast('Tipo de archivo no permitido. Solo se aceptan JPG, PNG, GIF.', 'danger', 'alert-circle-outline');
      return;
    }
    if (capturedFile.size > this.MAX_FILE_SIZE) {
      await this.toastService.presentToast('El tamaño del archivo excede el límite de 5MB.', 'danger', 'alert-circle-outline');
      return;
    }

    this.previewImage = dataUrl;
    this.selectedImageFile = capturedFile;
  }

  dataURLtoBlob(dataurl: string, filename: string): Blob {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  async uploadImage(): Promise<string | null> {
    if (!this.selectedImageFile) {
      return this.previewImage; // No new file selected, return existing image URL
    }
    try {
      const filePath = `profile-images/${this.userId}_${new Date().getTime()}`;
      const fileRef = this.storage.ref(filePath);
      await this.storage.upload(filePath, this.selectedImageFile);
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
    if (this.editUserForm.valid) {
      this.loading = true;
      try {
        const imageUrl = await this.uploadImage();

        // Sincronizar los booleanos basados en el rol seleccionado antes de guardar
        const formValue = this.editUserForm.value;
        formValue.isVeterinarian = formValue.role === 'veterinarian';
        formValue.isOrganization = formValue.role === 'organization';

        const userDataToUpdate = { ...formValue, profileImageUrl: imageUrl };

        await this.firestore.collection('users').doc(this.userId).update(userDataToUpdate);
        this.toastService.presentToast('Usuario actualizado con éxito.', 'success', 'checkmark-circle-outline');
        this.router.navigate(['/admin/users']);
      } catch (error) {
        console.error('Error al actualizar usuario:', error);
        this.toastService.presentToast('Error al actualizar usuario.', 'danger', 'alert-circle-outline');
      } finally {
        this.loading = false;
      }
    } else {
      this.toastService.presentToast('Por favor, completa todos los campos requeridos.', 'warning', 'warning-outline');
    }
  }
}