import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@shared/services/toast.service';

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.page.html',
  styleUrls: ['./create-user.page.scss'],
})
export class CreateUserPage implements OnInit {
  createUserForm!: FormGroup;
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.createUserForm = this.fb.group({
      nombreCompleto: ['', [Validators.required, Validators.minLength(3)]],
      nombreUsuario: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{8,15}$')]],
      direccion: ['', [Validators.required, Validators.minLength(5)]],
      isAdmin: [false],
      isVeterinarian: [false],
      isBlocked: [false],
      isOrganization: [false],
    });
  }

  async onSubmit() {
    if (this.createUserForm.valid) {
      this.loading = true;
      const { nombreCompleto, nombreUsuario, email, password, telefono, direccion, isAdmin, isBlocked, isOrganization } = this.createUserForm.value;

      try {
        await this.authService.registerUserByAdmin(
          nombreCompleto,
          nombreUsuario,
          email,
          password,
          telefono,
          direccion,
          isAdmin,
          isBlocked,
          isOrganization
        );
        this.toastService.presentToast('User created successfully.', 'success', 'checkmark-circle-outline');
        this.router.navigate(['/admin/users']);
      } catch (error: any) {
        console.error('Error creating user:', error);
        this.toastService.presentToast(error.message || 'Error creating user.', 'danger', 'alert-circle-outline');
      } finally {
        this.loading = false;
      }
    }
  }
}
