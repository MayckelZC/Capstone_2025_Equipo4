import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { LoadingController, AlertController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { getAppointmentTypeById, AppointmentType } from '../../../models/AppointmentType';

@Component({
  selector: 'app-consultation-preconsult',
  templateUrl: './consultation-preconsult.page.html',
  styleUrls: ['./consultation-preconsult.page.scss'],
})
export class ConsultationPreconsultPage implements OnInit {
  appointmentId: string = '';
  appointment: any = null;
  pet: any = null;
  medicalHistory: any[] = [];
  loading = true;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firestore: AngularFirestore,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) { }

  async ngOnInit() {
    this.appointmentId = this.route.snapshot.paramMap.get('id') || '';
    console.log('Loading preconsult for appointment ID:', this.appointmentId);
    await this.loadPreconsultData();
  }

  async loadPreconsultData() {
    const loading = await this.loadingCtrl.create({
      message: 'Cargando información...'
    });
    await loading.present();

    try {
      // Cargar cita
      console.log('Fetching appointment from veterinaryAppointments collection...');
      const appointmentDoc = await firstValueFrom(
        this.firestore.collection('veterinaryAppointments').doc(this.appointmentId).get()
      );
      
      console.log('Appointment exists?', appointmentDoc.exists);
      
      if (appointmentDoc.exists) {
        const appointmentData: any = appointmentDoc.data();
        this.appointment = { id: appointmentDoc.id, ...appointmentData };
        console.log('Appointment loaded:', this.appointment);
        
        // Cargar mascota
        if (this.appointment.petId) {
          console.log('Fetching pet with ID:', this.appointment.petId);
          const petDoc = await firstValueFrom(
            this.firestore.collection('mascotas').doc(this.appointment.petId).get()
          );
          
          console.log('Pet exists?', petDoc.exists);
          
          if (petDoc.exists) {
            const petData: any = petDoc.data();
            this.pet = { id: petDoc.id, ...petData };
            console.log('Pet loaded:', this.pet);
            
            // Cargar historial médico (últimas 5 consultas)
            try {
              const historySnapshot = await firstValueFrom(
                this.firestore.collection('medical-records', ref =>
                  ref.where('petId', '==', this.appointment.petId)
                    .orderBy('date', 'desc')
                    .limit(5)
                ).get()
              );
              
              this.medicalHistory = historySnapshot.docs.map(doc => {
                const data: any = doc.data();
                return { id: doc.id, ...data };
              });
            } catch (historyError) {
              console.warn('Could not load medical history (might need index):', historyError);
              // Continuar sin historial médico
              this.medicalHistory = [];
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Error loading preconsult data:', error);
      await this.showError('Error al cargar la información: ' + error);
    } finally {
      this.loading = false;
      loading.dismiss();
    }
  }

  // Calcular edad de la mascota
  calculateAge(): string {
    if (!this.pet) return 'Desconocida';
    
    // Si tiene edadAnios
    if (this.pet.edadAnios && this.pet.edadAnios > 0) {
      return `${this.pet.edadAnios} ${this.pet.edadAnios === 1 ? 'año' : 'años'}`;
    }
    
    // Si tiene edadMeses
    if (this.pet.edadMeses && this.pet.edadMeses > 0) {
      return `${this.pet.edadMeses} ${this.pet.edadMeses === 1 ? 'mes' : 'meses'}`;
    }
    
    // Si tiene etapaVida
    if (this.pet.etapaVida) {
      return this.pet.etapaVida;
    }
    
    return 'Edad no especificada';
  }

  // Obtener última visita
  getLastVisit(): string {
    if (this.medicalHistory.length === 0) return 'Sin visitas previas';
    
    const lastRecord = this.medicalHistory[0];
    const lastDate = lastRecord.date?.toDate ? lastRecord.date.toDate() : new Date(lastRecord.date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 30) return `Hace ${diffDays} días`;
    
    const months = Math.floor(diffDays / 30);
    return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
  }

  // Verificar vacunas vencidas
  hasOverdueVaccines(): boolean {
    if (!this.pet?.vacunas || !Array.isArray(this.pet.vacunas)) return false;
    
    const today = new Date();
    return this.pet.vacunas.some((vaccine: any) => {
      if (!vaccine.date || vaccine.applied === false) return false;
      
      try {
        let vaccineDate: Date;
        
        if (vaccine.date.toDate) {
          vaccineDate = vaccine.date.toDate();
        } else if (typeof vaccine.date === 'string') {
          vaccineDate = new Date(vaccine.date);
        } else {
          vaccineDate = vaccine.date;
        }
        
        // Considerar vencida si pasó más de 1 año
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        
        return vaccineDate < oneYearAgo;
      } catch {
        return false;
      }
    });
  }

  // Obtener peso anterior
  getLastWeight(): string {
    if (this.medicalHistory.length === 0 || !this.medicalHistory[0].weight) {
      return 'No registrado';
    }
    return `${this.medicalHistory[0].weight} kg`;
  }

  // Ver historial completo
  async viewFullHistory() {
    // Navegar a página de historial médico
    this.router.navigate(['/veterinarian/medical-history', this.pet.id]);
  }

  // Iniciar consulta
  async startConsultation() {
    this.router.navigate(['/veterinarian/consultation', this.appointmentId]);
  }

  // Cancelar y volver
  cancel() {
    this.router.navigate(['/veterinarian/dashboard']);
  }
  
  // ========== APPOINTMENT TYPE HELPERS ==========
  
  getAppointmentType(): AppointmentType | undefined {
    if (!this.appointment?.appointmentType) return undefined;
    return getAppointmentTypeById(this.appointment.appointmentType);
  }
  
  hasPreparationInstructions(): boolean {
    const type = this.getAppointmentType();
    return !!(type && type.requiresPreparation && type.preparationInstructions);
  }

  async showError(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Error',
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
