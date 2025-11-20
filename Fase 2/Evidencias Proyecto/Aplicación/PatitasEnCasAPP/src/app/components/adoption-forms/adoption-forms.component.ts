import { Component, Input } from '@angular/core';


@Component({
  selector: 'app-adoption-forms',
  template: `
    <div class="forms-container">
      <h2>Formularios de adopción</h2>

      <div class="form-section">
        <h3>Información del adoptante</h3>
        <ion-list>
          <ion-item>
            <ion-label position="stacked">Nombre completo</ion-label>
            <ion-input [(ngModel)]="adopterInfo.fullName" (ionChange)="updateForms()"></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Documento de identidad</ion-label>
            <ion-input [(ngModel)]="adopterInfo.idNumber" (ionChange)="updateForms()"></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Dirección</ion-label>
            <ion-input [(ngModel)]="adopterInfo.address" (ionChange)="updateForms()"></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Teléfono</ion-label>
            <ion-input type="tel" [(ngModel)]="adopterInfo.phone" (ionChange)="updateForms()"></ion-input>
          </ion-item>
        </ion-list>
      </div>

      <div class="form-section">
        <h3>Evaluación de condiciones</h3>
        <ion-list>
          <ion-item>
            <ion-label>¿Tiene experiencia con mascotas?</ion-label>
            <ion-toggle [(ngModel)]="homeSurvey.hasPetExperience" (ionChange)="updateForms()"></ion-toggle>
          </ion-item>

          <ion-item>
            <ion-label>¿Tiene espacio adecuado?</ion-label>
            <ion-toggle [(ngModel)]="homeSurvey.hasAdequateSpace" (ionChange)="updateForms()"></ion-toggle>
          </ion-item>

          <ion-item>
            <ion-label>¿Todos en casa están de acuerdo?</ion-label>
            <ion-toggle [(ngModel)]="homeSurvey.familyAgreement" (ionChange)="updateForms()"></ion-toggle>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Horas que la mascota estará sola</ion-label>
            <ion-select [(ngModel)]="homeSurvey.hoursAlone" (ionChange)="updateForms()">
              <ion-select-option value="0-2">0-2 horas</ion-select-option>
              <ion-select-option value="2-4">2-4 horas</ion-select-option>
              <ion-select-option value="4-6">4-6 horas</ion-select-option>
              <ion-select-option value="6-8">6-8 horas</ion-select-option>
              <ion-select-option value="8+">Más de 8 horas</ion-select-option>
            </ion-select>
          </ion-item>
        </ion-list>
      </div>

      <div class="form-section">
        <h3>Compromisos</h3>
        <ion-list>
          <ion-item *ngFor="let commitment of commitments">
            <ion-checkbox slot="start" 
                         [(ngModel)]="commitment.agreed"
                         (ionChange)="updateForms()">
            </ion-checkbox>
            <ion-label class="commitment-label">{{ commitment.text }}</ion-label>
          </ion-item>
        </ion-list>
      </div>

      <ion-button expand="block" 
                  color="primary"
                  [disabled]="!isFormValid()"
                  (click)="submitForms()">
        Enviar formularios
      </ion-button>

      <div class="submission-status" *ngIf="submissionStatus">
        <ion-text [color]="submissionStatus.success ? 'success' : 'danger'">
          {{ submissionStatus.message }}
        </ion-text>
      </div>
    </div>
  `,
  styles: [`
    .forms-container {
      padding: 1rem;
    }

    .form-section {
      margin-bottom: 2rem;
    }

    h2 {
      color: var(--ion-color-primary);
      margin-bottom: 1.5rem;
    }

    h3 {
      color: var(--ion-color-medium);
      font-size: 1.1em;
      margin-bottom: 1rem;
    }

    .commitment-label {
      white-space: normal;
      font-size: 0.9em;
    }

    ion-item {
      --padding-start: 0;
      margin-bottom: 0.5rem;
    }

    .submission-status {
      margin-top: 1rem;
      text-align: center;
    }
  `]
})
export class AdoptionFormsComponent {


  adopterInfo = {
    fullName: '',
    idNumber: '',
    address: '',
    phone: ''
  };

  homeSurvey = {
    hasPetExperience: false,
    hasAdequateSpace: false,
    familyAgreement: false,
    hoursAlone: ''
  };

  commitments = [
    { text: 'Me comprometo a esterilizar a la mascota si aún no lo está', agreed: false },
    { text: 'Me comprometo a proporcionar atención veterinaria regular', agreed: false },
    { text: 'Me comprometo a no abandonar ni regalar a la mascota', agreed: false },
    { text: 'Me comprometo a permitir visitas de seguimiento', agreed: false },
    { text: 'Me comprometo a mantener informada a la organización sobre el bienestar de la mascota', agreed: false }
  ];

  submissionStatus: { success: boolean; message: string } | null = null;

  constructor() { }

  isFormValid(): boolean {
    const adopterInfoComplete = Object.values(this.adopterInfo).every(value => value !== '');
    const homeSurveyComplete = Object.values(this.homeSurvey).every(value => value !== '');
    const commitmentsComplete = this.commitments.every(c => c.agreed);

    return adopterInfoComplete && homeSurveyComplete && commitmentsComplete;
  }

  async updateForms() {
    try {
      // Guardar progreso localmente o en la base de datos
    } catch (error) {
      console.error('Error updating forms:', error);
    }
  }

  async submitForms() {
    if (!this.isFormValid()) return;

    try {
      this.submissionStatus = {
        success: true,
        message: '¡Formularios enviados correctamente!'
      };
    } catch (error) {
      console.error('Error submitting forms:', error);
      this.submissionStatus = {
        success: false,
        message: 'Error al enviar los formularios. Por favor, intente nuevamente.'
      };
    }
  }
}