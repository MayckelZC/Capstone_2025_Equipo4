import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { AppointmentService } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { PetsService } from '../../services/pets.service';
import { ToastService } from '../../services/toast.service';
import { User } from '../../models/user';
import { Adopcion } from '../../models/Adopcion';

@Component({
  selector: 'app-emergency-appointment',
  templateUrl: './emergency-appointment.page.html',
  styleUrls: ['./emergency-appointment.page.scss'],
})
export class EmergencyAppointmentPage implements OnInit {

  emergency: any = {
    status: 'pending',
    priority: 'emergency',
    reason: '',
    notes: '',
    date: new Date().toISOString()
  };
  
  allPets: Adopcion[] = [];
  filteredPets: Adopcion[] = [];
  searchTerm = '';
  isLoading = false;
  minDate = new Date().toISOString();

  emergencyReasons = [
    'Accidente de tráfico',
    'Intoxicación',
    'Fractura visible',
    'Dificultad respiratoria',
    'Convulsiones',
    'Sangrado abundante',
    'Vómitos persistentes',
    'No puede caminar',
    'Dolor extremo',
    'Otro (especificar)'
  ];

  constructor(
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private userService: UserService,
    private petsService: PetsService,
    private toastService: ToastService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) { }

  async ngOnInit() {
    await this.loadInitialData();
  }

  async loadInitialData() {
    this.isLoading = true;
    
    try {
      // Cargar todas las mascotas
      this.petsService.getAllPets().subscribe(pets => {
        this.allPets = pets;
        this.filteredPets = pets;
      });

      // Establecer fecha y hora actual como mínimo
      const now = new Date();
      this.emergency.date = now.toISOString();
      
    } catch (error) {
      console.error('Error loading data:', error);
      this.toastService.presentToast('Error al cargar datos', 'danger', 'alert-circle-outline');
    } finally {
      this.isLoading = false;
    }
  }

  // Filtrar mascotas por búsqueda
  filterPets() {
    if (!this.searchTerm.trim()) {
      this.filteredPets = this.allPets;
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredPets = this.allPets.filter(pet =>
      pet.nombre?.toLowerCase().includes(term) ||
      pet.tipoMascota?.toLowerCase().includes(term) ||
      pet.raza?.toLowerCase().includes(term)
    );
  }

  // Seleccionar mascota
  selectPet(pet: Adopcion) {
    this.emergency.petId = pet.id;
    this.emergency.petName = pet.nombre;
    this.emergency.ownerId = pet.creadorId;
  }

  // Seleccionar motivo predefinido
  selectReason(reason: string) {
    this.emergency.reason = reason;
  }

  // Validar formulario
  isFormValid(): boolean {
    return !!(
      this.emergency.petId &&
      this.emergency.vetId &&
      this.emergency.reason &&
      this.emergency.date
    );
  }

  // Registrar emergencia
  async registerEmergency() {
    if (!this.isFormValid()) {
      this.toastService.presentToast('Por favor complete todos los campos requeridos', 'warning', 'alert-circle-outline');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Registrando emergencia...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const user = await this.authService.getCurrentUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Preparar datos de la emergencia
      const emergencyData = {
        ...this.emergency,
        userId: this.emergency.ownerId || user.uid,
        date: new Date(this.emergency.date),
        createdAt: new Date(),
        priority: 'emergency',
        status: 'pending'
      };

      // Registrar en Firebase
      await this.appointmentService.addAppointment(emergencyData);

      await loading.dismiss();
      
      // Mostrar confirmación
      await this.showSuccessAlert();
      
      // Volver al dashboard
      this.router.navigate(['/home']);
      
    } catch (error) {
      await loading.dismiss();
      console.error('Error registering emergency:', error);
      this.toastService.presentToast('Error al registrar la emergencia', 'danger', 'alert-circle-outline');
    }
  }

  // Mostrar alerta de éxito
  async showSuccessAlert() {
    const alert = await this.alertController.create({
      header: '¡Emergencia Registrada!',
      message: 'La emergencia ha sido registrada exitosamente. El veterinario será notificado inmediatamente.',
      buttons: [{
        text: 'Entendido',
        role: 'cancel'
      }]
    });

    await alert.present();
  }

  getFormattedDate(dateString: string): string {
    if (!dateString) return 'Fecha no especificada';
    return new Date(dateString).toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  // Obtener mascota seleccionada
  getSelectedPet() {
    return this.allPets.find(pet => pet.id === this.emergency.petId);
  }

  // Cancelar y volver
  goBack() {
    this.router.navigate(['/home']);
  }
}