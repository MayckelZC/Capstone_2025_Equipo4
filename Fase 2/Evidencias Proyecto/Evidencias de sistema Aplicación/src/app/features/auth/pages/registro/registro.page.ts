import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, AsyncValidatorFn } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { AuthService } from '@core/services/auth.service';
import { Router } from '@angular/router';
import { ToastService } from '@shared/services/toast.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { map, debounceTime, switchMap, first } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
})
export class RegistroPage implements OnInit {
  cuentaForm!: FormGroup;
  validationProgress = 0;
  loading: boolean = false;
  currentStep = 1;

  passwordType: string = 'password';
  passwordToggleIcon: string = 'eye-off';
  confirmPasswordType: string = 'password';
  confirmPasswordToggleIcon: string = 'eye-off';

  previewImage: string | null = null;
  selectedImageFile: Blob | null = null;

  passwordStrength: number = 0; // 0-4 scale

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private alertController: AlertController,
    private router: Router,
    private toastService: ToastService,
    private storage: AngularFireStorage
  ) { }

  ngOnInit() {
    this.cuentaForm = this.formBuilder.group({
      nombreCompleto: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100), Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')]],
      nombreUsuario: ['',
        [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern('^[a-zA-Z0-9_.-]+$')],
        [this.usernameAvailabilityValidator()]
      ],
      correo: ['',
        [Validators.required, Validators.email, Validators.maxLength(100)],
        [this.emailAvailabilityValidator()]
      ],
      contraseña: ['', [Validators.required, this.passwordValidator.bind(this)]],
      confirmarContraseña: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{8,15}$'), Validators.maxLength(15)]],
      direccion: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      region: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      ciudad: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      terminos: [false, Validators.requiredTrue]
    });

    this.cuentaForm.valueChanges.subscribe(() => {
      this.updateValidationProgress();
    });

    this.cuentaForm.get('confirmarContraseña')?.valueChanges.subscribe(() => {
      this.passwordMatchValidator(this.cuentaForm);
    });

    this.cuentaForm.get('contraseña')?.valueChanges.subscribe(value => {
      this.checkPasswordStrength(value);
    });
  }

  nextStep() {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  async takePicture() {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    });

    if (image.dataUrl) {
      this.previewImage = image.dataUrl;
      this.selectedImageFile = this.dataURLtoBlob(image.dataUrl);
    }
  }

  dataURLtoBlob(dataurl: string) {
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

  onClear() {
    this.cuentaForm.reset();
    this.validationProgress = 0;
    this.currentStep = 1;
    this.passwordStrength = 0;
  }

  async onSubmit() {
    if (this.cuentaForm.valid) {
      this.loading = true;
      const { nombreCompleto, nombreUsuario, correo, contraseña, telefono, direccion, region, ciudad } = this.cuentaForm.value;

      try {
        await this.authService.registerUser(
          nombreCompleto,
          nombreUsuario,
          correo,
          contraseña,
          telefono,
          direccion,
          this.selectedImageFile,
          region,
          ciudad
        );

        await this.toastService.presentToast('¡Bienvenido/a a la manada! Revisa tu correo para verificar tu cuenta.', 'success', 'paw-outline');

        this.router.navigate(['/auth/verificacion-pendiente']);
      } catch (error: any) {
        if (error.code === 'auth/username-already-in-use') {
          await this.toastService.presentToast('¡Oh no! Ese nombre de usuario ya fue elegido. ¡Prueba con otro!', 'danger', 'alert-circle-outline');
        } else if (error.code === 'auth/email-already-in-use') {
          await this.toastService.presentToast('Ese correo ya existe. Te llevamos al inicio de sesión...', 'warning', 'log-in-outline');
          this.router.navigate(['/auth/login']);
        } else {
          await this.toastService.presentToast('Error al crear la cuenta. Por favor, verifica los datos.', 'danger', 'alert-circle-outline');
        }
      } finally {
        this.loading = false;
      }
    } else {
      await this.toastService.presentToast('Faltan algunos datos para completar tu perfil. ¡Revisa los campos marcados!', 'warning', 'alert-outline');
    }
  }

  passwordValidator(control: AbstractControl) {
    const value = control.value;
    if (!value) {
      return null;
    }
    const errors: any = {};
    if (value.length < 8) {
      errors.minlength = true;
    }
    if (!/[A-Z]/.test(value)) {
      errors.noUppercase = true;
    }
    if (!/[a-z]/.test(value)) {
      errors.noLowercase = true;
    }
    if (!/[0-9]/.test(value)) {
      errors.noNumber = true;
    }
    if (!/[^a-zA-Z0-9]/.test(value)) {
      errors.noSpecialChar = true;
    }
    return Object.keys(errors).length ? errors : null;
  }

  passwordMatchValidator(formGroup: FormGroup): ValidationErrors | null {
    const password = formGroup.get('contraseña')?.value;
    const confirmPassword = formGroup.get('confirmarContraseña')?.value;
    if (password !== confirmPassword) {
      formGroup.get('confirmarContraseña')?.setErrors({ passwordMismatch: true });
    } else {
      formGroup.get('confirmarContraseña')?.setErrors(null);
    }
    return null;
  }

  updateValidationProgress() {
    const totalFields = 10; // Added terminos
    let validFields = 0;

    if (this.cuentaForm.get('nombreCompleto')?.valid) validFields++;
    if (this.cuentaForm.get('nombreUsuario')?.valid) validFields++;
    if (this.cuentaForm.get('correo')?.valid) validFields++;
    if (this.cuentaForm.get('contraseña')?.valid) validFields++;
    if (this.cuentaForm.get('confirmarContraseña')?.valid) validFields++;
    if (this.cuentaForm.get('telefono')?.valid) validFields++;
    if (this.cuentaForm.get('direccion')?.valid) validFields++;
    if (this.cuentaForm.get('region')?.valid) validFields++;
    if (this.cuentaForm.get('ciudad')?.valid) validFields++;
    if (this.cuentaForm.get('terminos')?.valid) validFields++;

    this.validationProgress = validFields / totalFields;
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  filterNumericInput(event: any) {
    const input = event.target as HTMLInputElement;
    const filteredValue = input.value.replace(/[0-9]/g, '');
    if (input.value !== filteredValue) {
      input.value = filteredValue;
      this.cuentaForm.get('nombreCompleto')?.setValue(filteredValue, { emitEvent: false });
    }
  }

  filterUsernameInput(event: any) {
    const input = event.target as HTMLInputElement;
    const filteredValue = input.value.replace(/[^a-zA-Z0-9_.-]/g, '');
    if (input.value !== filteredValue) {
      input.value = filteredValue;
      this.cuentaForm.get('nombreUsuario')?.setValue(filteredValue, { emitEvent: false });
    }
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword') {
    if (field === 'password') {
      this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
      this.passwordToggleIcon = this.passwordToggleIcon === 'eye-off' ? 'eye' : 'eye-off';
    } else if (field === 'confirmPassword') {
      this.confirmPasswordType = this.confirmPasswordType === 'password' ? 'text' : 'password';
      this.confirmPasswordToggleIcon = this.confirmPasswordToggleIcon === 'eye-off' ? 'eye' : 'eye-off';
    }
  }

  // Async Validators
  usernameAvailabilityValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }
      return of(control.value).pipe(
        debounceTime(500),
        switchMap(username => this.authService.checkUsernameExists(username)),
        map(exists => (exists ? { usernameTaken: true } : null)),
        first()
      );
    };
  }

  emailAvailabilityValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }
      return of(control.value).pipe(
        debounceTime(500),
        switchMap(email => this.authService.checkEmailExists(email)),
        map(exists => (exists ? { emailTaken: true } : null)),
        first()
      );
    };
  }

  checkPasswordStrength(password: string) {
    let strength = 0;
    if (!password) {
      this.passwordStrength = 0;
      return;
    }
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++; // Special char

    // Normalize to 0-4
    if (strength > 4) strength = 4;
    this.passwordStrength = strength;
  }
}
