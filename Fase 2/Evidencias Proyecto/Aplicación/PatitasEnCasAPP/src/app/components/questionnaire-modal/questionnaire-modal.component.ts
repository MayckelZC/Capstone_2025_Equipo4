import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AdoptionRequest } from '../../models/AdoptionRequest';
import { trigger, transition, style, animate } from '@angular/animations';

interface AdoptionRequestWithPet extends AdoptionRequest {
  pet: {
    name: string;
    type: string;
    imageUrl: string;
    breed?: string;
  };
  requester: {
    name: string;
    email: string;
  };
  viewedByOwner?: boolean;
}

@Component({
  selector: 'app-questionnaire-modal',
  templateUrl: './questionnaire-modal.component.html',
  styleUrls: ['./questionnaire-modal.component.scss'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class QuestionnaireModalComponent implements OnInit {
  @Input() request!: AdoptionRequestWithPet;

  compatibilityScore: number = 0;
  scoreBreakdown: Array<{ label: string; points: number; icon: string }> = [];
  alerts: Array<{ type: 'critical' | 'warning' | 'info'; title: string; message: string; icon: string }> = [];
  showQuickResponses: boolean = false;
  rejectReasons: string[] = [
    'No cumple requisitos mínimos',
    'Casa alquilada sin autorización',
    'Muchas horas solo',
    'Sin experiencia previa',
    'Miembros con alergias'
  ];

  constructor(private modalController: ModalController) { }

  ngOnInit() {
    this.calculateCompatibilityScore();
    this.generateAlerts();
  }

  closeModal() {
    this.modalController.dismiss();
  }

  async respondToRequest(action: 'approve' | 'reject') {
    this.modalController.dismiss({ action, request: this.request });
  }

  getSpaceText(space: string): string {
    const spaceMap: { [key: string]: string } = {
      'indoor': 'Interior',
      'indoor_with_garden': 'Interior con jardín',
      'outdoor': 'Exterior',
      'other': 'Otro'
    };
    return spaceMap[space] || space;
  }

  getAllergiesText(allergies: string | undefined): string {
    if (allergies === 'yes') return 'Sí';
    if (allergies === 'no') return 'No';
    return 'No especificado';
  }

  getAllergiesColor(allergies: string | undefined): string {
    if (allergies === 'yes') return 'warning';
    if (allergies === 'no') return 'success';
    return 'medium';
  }

  getAllergiesIcon(allergies: string | undefined): string {
    if (allergies === 'yes') return 'alert-circle';
    if (allergies === 'no') return 'checkmark-circle';
    return 'help-circle';
  }

  calculateCompatibilityScore(): void {
    let score = 50; // Base score
    this.scoreBreakdown = [];

    // Positive factors
    if (this.request.previousExperience) {
      score += 10;
      this.scoreBreakdown.push({ label: 'Experiencia previa con mascotas', points: 10, icon: 'checkmark-circle' });
    } else {
      this.scoreBreakdown.push({ label: 'Sin experiencia previa', points: 0, icon: 'help-circle' });
    }

    if (this.request.veterinaryAccess) {
      score += 15;
      this.scoreBreakdown.push({ label: 'Acceso a veterinario', points: 15, icon: 'checkmark-circle' });
    } else {
      score -= 10;
      this.scoreBreakdown.push({ label: 'Sin acceso veterinario', points: -10, icon: 'close-circle' });
    }

    if (this.request.secureFencing) {
      score += 10;
      this.scoreBreakdown.push({ label: 'Jardín/balcón asegurado', points: 10, icon: 'checkmark-circle' });
    }

    if (this.request.housingType === 'own') {
      score += 10;
      this.scoreBreakdown.push({ label: 'Casa propia', points: 10, icon: 'checkmark-circle' });
    } else if (this.request.landlordAllowsPets) {
      score += 5;
      this.scoreBreakdown.push({ label: 'Alquiler con permiso', points: 5, icon: 'checkmark-circle' });
    } else {
      score -= 5;
      this.scoreBreakdown.push({ label: 'Alquiler (verificar permiso)', points: -5, icon: 'alert-circle' });
    }

    // Negative factors
    if (this.request.hoursAlone > 8) {
      score -= 15;
      this.scoreBreakdown.push({ label: 'Muchas horas solo (>8h)', points: -15, icon: 'close-circle' });
    } else if (this.request.hoursAlone > 6) {
      score -= 5;
      this.scoreBreakdown.push({ label: 'Bastantes horas solo (6-8h)', points: -5, icon: 'alert-circle' });
    }

    if (this.request.allergies === 'yes') {
      score -= 10;
      this.scoreBreakdown.push({ label: 'Alergias en el hogar', points: -10, icon: 'close-circle' });
    } else if (this.request.allergies === 'no') {
      score += 5;
      this.scoreBreakdown.push({ label: 'Sin alergias', points: 5, icon: 'checkmark-circle' });
    }

    if (this.request.otherPets) {
      score += 5;
      this.scoreBreakdown.push({ label: 'Tiene otras mascotas', points: 5, icon: 'checkmark-circle' });
    }

    if (this.request.petLivingSpace === 'indoor_with_garden') {
      score += 5;
      this.scoreBreakdown.push({ label: 'Interior con jardín', points: 5, icon: 'checkmark-circle' });
    }

    this.compatibilityScore = Math.max(0, Math.min(100, score));
  }

  generateAlerts(): void {
    this.alerts = [];

    // Critical alerts
    if (!this.request.veterinaryAccess) {
      this.alerts.push({
        type: 'critical',
        title: '🚨 Sin acceso veterinario',
        message: 'El solicitante no tiene acceso a servicios veterinarios',
        icon: 'warning'
      });
    }

    if (this.request.hoursAlone > 8) {
      this.alerts.push({
        type: 'critical',
        title: '🚨 Muchas horas solo',
        message: `La mascota estaría sola más de ${this.request.hoursAlone} horas al día`,
        icon: 'time'
      });
    }

    if (this.request.allergies === 'yes') {
      this.alerts.push({
        type: 'critical',
        title: '🚨 Alergias en el hogar',
        message: 'Hay personas con alergias en el hogar',
        icon: 'medical'
      });
    }

    // Warning alerts
    if (!this.request.previousExperience) {
      this.alerts.push({
        type: 'warning',
        title: '⚠️ Sin experiencia previa',
        message: 'El solicitante no ha tenido mascotas antes',
        icon: 'alert-circle'
      });
    }

    if (this.request.housingType === 'rented' && !this.request.landlordAllowsPets) {
      this.alerts.push({
        type: 'warning',
        title: '⚠️ Casa alquilada',
        message: 'Verificar si el arrendador permite mascotas',
        icon: 'home'
      });
    }

    if (!this.request.secureFencing && this.request.petLivingSpace !== 'indoor') {
      this.alerts.push({
        type: 'warning',
        title: '⚠️ Sin cercado seguro',
        message: 'No hay jardín o balcón asegurado',
        icon: 'leaf'
      });
    }

    // Info alerts
    if (this.compatibilityScore >= 80) {
      this.alerts.push({
        type: 'info',
        title: '✅ Excelente candidato',
        message: 'Cumple con la mayoría de criterios importantes',
        icon: 'checkmark-circle'
      });
    }
  }

  getScoreLabel(): string {
    if (this.compatibilityScore >= 80) return 'Excelente';
    if (this.compatibilityScore >= 60) return 'Bueno';
    if (this.compatibilityScore >= 40) return 'Regular';
    return 'Requiere revisión';
  }

  getScoreDescription(): string {
    if (this.compatibilityScore >= 80) return 'Candidato altamente recomendado';
    if (this.compatibilityScore >= 60) return 'Candidato aceptable con precauciones';
    if (this.compatibilityScore >= 40) return 'Requiere evaluación detallada';
    return 'No cumple criterios mínimos';
  }

  getFormattedDate(date: Date): string {
    if (!date) return 'N/A';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  }

  getTimeAgo(date: Date): string {
    if (!date) return 'N/A';
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return this.getFormattedDate(date);
  }

  showRejectOptions(): void {
    this.showQuickResponses = true;
  }

  async showApprovalConfirmation(): Promise<void> {
    this.modalController.dismiss({ 
      action: 'approve', 
      request: this.request,
      score: this.compatibilityScore 
    });
  }

  async respondWithReason(action: 'approve' | 'reject', reason?: string): Promise<void> {
    this.modalController.dismiss({ 
      action, 
      request: this.request,
      reason,
      score: this.compatibilityScore 
    });
  }

  contactApplicant(): void {
    // TODO: Implement contact functionality
    console.log('Contact applicant:', this.request.applicantName);
  }

  requestMoreInfo(): void {
    // TODO: Implement request more info functionality
    console.log('Request more info from:', this.request.applicantName);
  }

  viewApplicantProfile(): void {
    // TODO: Implement view profile functionality
    console.log('View profile of:', this.request.applicantName);
  }
}