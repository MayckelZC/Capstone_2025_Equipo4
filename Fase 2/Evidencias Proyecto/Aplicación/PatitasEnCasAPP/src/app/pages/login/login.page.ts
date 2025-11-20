import { Component } from '@angular/core';
import { LoginService } from 'src/app/services/loginservice.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  identifier: string = ''; // Almacena el correo electrónico o nombre de usuario
  password: string = ''; // Almacena la contraseña
  keepSession: boolean = false; // Variable para mantener la sesión iniciada
  loading: boolean = false; // Indicador de carga

  passwordType: string = 'password'; // Controla el tipo de input de la contraseña
  passwordToggleIcon: string = 'eye-off'; // Controla el icono de visibilidad de la contraseña

  constructor(private loginService: LoginService) {}

  async login() {
    this.loading = true; // Activar el indicador de carga
    try {
      await this.loginService.login(this.identifier, this.password, this.keepSession);
    } finally {
      this.loading = false; // Desactivar el indicador de carga
    }
  }

  navigateToResetPassword() {
    this.loginService.navigateToResetPassword();
  }

  register() {
    this.loginService.navigateToRegister();
  }

  togglePasswordVisibility() {
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
    this.passwordToggleIcon = this.passwordToggleIcon === 'eye-off' ? 'eye' : 'eye-off';
  }
}
