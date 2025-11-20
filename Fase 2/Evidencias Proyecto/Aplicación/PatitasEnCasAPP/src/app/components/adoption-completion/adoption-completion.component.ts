import { Component, Input, Output, EventEmitter } from '@angular/core';

import { AdoptionService } from '../../services/adoption.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-adoption-completion',
  template: `
    <div class="completion-container">
      <ion-card *ngIf="!adoptionCompleted">
        <ion-card-header>
          <ion-card-title>Completar Adopción</ion-card-title>
          <ion-card-subtitle>Confirmar la entrega de la mascota</ion-card-subtitle>
        </ion-card-header>

        <ion-card-content>
          <ion-list>
            <ion-item>
              <ion-label position="stacked">Fecha de entrega</ion-label>
              <ion-datetime
                presentation="date"
                [(ngModel)]="deliveryDate"
                [max]="maxDate"
                cancelText="Cancelar"
                doneText="Confirmar">
              </ion-datetime>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Comentarios adicionales</ion-label>
              <ion-textarea
                [(ngModel)]="comments"
                placeholder="Agregar notas o recomendaciones finales">
              </ion-textarea>
            </ion-item>

            <ion-item lines="none">
              <ion-checkbox
                [(ngModel)]="termsAccepted"
                slot="start">
              </ion-checkbox>
              <ion-label class="ion-text-wrap">
                Confirmo que la mascota ha sido entregada y que el adoptante ha firmado todos los documentos necesarios
              </ion-label>
            </ion-item>
          </ion-list>

          <div class="button-container">
            <ion-button
              expand="block"
              color="primary"
              [disabled]="!isValid()"
              (click)="confirmAdoption()">
              <ion-icon name="paw" slot="start"></ion-icon>
              Confirmar Adopción
            </ion-button>
          </div>
        </ion-card-content>
      </ion-card>

      <ion-card *ngIf="adoptionCompleted" class="success-card">
        <ion-card-header>
          <ion-card-title>¡Adopción Completada!</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="success-content">
            <ion-icon name="checkmark-circle" color="success" class="success-icon"></ion-icon>
            <p>La adopción se ha completado exitosamente.</p>
            <p>Fecha de entrega: {{ deliveryDate | date:'shortDate' }}</p>
          </div>
        </ion-card-content>
      </ion-card>
    </div>
  `,
  styles: [`
    .completion-container {
      padding: 1rem;
    }

    .button-container {
      margin-top: 1.5rem;
    }

    .success-card {
      text-align: center;
      background: var(--ion-color-success-light);
    }

    .success-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .success-icon {
      font-size: 4rem;
    }

    ion-checkbox {
      margin-right: 1rem;
    }

    ion-textarea {
      min-height: 100px;
    }
  `]
})
export class AdoptionCompletionComponent {

  @Input() adoptionId: string;
  @Input() petId: string;
  @Input() adopterId: string;
  @Output() completed = new EventEmitter<void>();

  deliveryDate: string = new Date().toISOString();
  comments: string = '';
  termsAccepted: boolean = false;
  adoptionCompleted: boolean = false;
  maxDate: string = new Date().toISOString();

  constructor(

    private adoptionService: AdoptionService,
    private alertController: AlertController
  ) { }

  isValid(): boolean {
    return this.deliveryDate && this.termsAccepted;
  }

  async confirmAdoption() {
    const alert = await this.alertController.create({
      header: 'Confirmar Adopción',
      message: '¿Estás seguro de que deseas completar el proceso de adopción? Esta acción no se puede deshacer.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          role: 'confirm',
          handler: () => this.processAdoptionCompletion()
        }
      ]
    });

    await alert.present();
  }

  private async processAdoptionCompletion() {
    try {
      // 1. Actualizar estado de la adopción
      await this.adoptionService.completeAdoption({
        adoptionId: this.adoptionId,
        console.error('Error completing adoption:', error);
        const errorAlert = await this.alertController.create({
          header: 'Error',
          message: 'Ha ocurrido un error al completar la adopción. Por favor, intenta nuevamente.',
          buttons: ['OK']
        });
        await errorAlert.present();
      }
  }
}