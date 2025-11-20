import { Component, Input } from '@angular/core';


@Component({
  selector: 'app-adoption-scheduler',
  template: `
    <div class="scheduler-container">
      <h2>Programar encuentro</h2>

      <ion-item>
        <ion-label position="stacked">Fecha</ion-label>
        <ion-datetime
          presentation="date"
          [min]="minDate"
          [(ngModel)]="selectedDate"
          (ionChange)="updateSchedule()"
          cancelText="Cancelar"
          doneText="Confirmar">
        </ion-datetime>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">Hora</ion-label>
        <ion-datetime
          presentation="time"
          [(ngModel)]="selectedTime"
          (ionChange)="updateSchedule()"
          cancelText="Cancelar"
          doneText="Confirmar">
        </ion-datetime>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">Lugar de encuentro</ion-label>
        <ion-input
          [(ngModel)]="location"
          placeholder="Ingrese la dirección"
          (ionChange)="updateSchedule()">
        </ion-input>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">Notas adicionales</ion-label>
        <ion-textarea
          [(ngModel)]="notes"
          placeholder="Agregue detalles importantes"
          (ionChange)="updateSchedule()">
        </ion-textarea>
      </ion-item>

      <div class="meeting-status" *ngIf="hasSchedule">
        <ion-card>
          <ion-card-header>
            <ion-card-subtitle>Encuentro programado</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <p><ion-icon name="calendar"></ion-icon> {{ formattedDate }}</p>
            <p><ion-icon name="time"></ion-icon> {{ formattedTime }}</p>
            <p><ion-icon name="location"></ion-icon> {{ location }}</p>
            <p *ngIf="notes"><ion-icon name="document-text"></ion-icon> {{ notes }}</p>
          </ion-card-content>
        </ion-card>
      </div>
    </div>
  `,
  styles: [`
    .scheduler-container {
      padding: 1rem;
    }

    ion-item {
      margin-bottom: 1rem;
    }

    .meeting-status {
      margin-top: 1rem;
    }

    ion-card {
      margin: 0;
    }

    ion-card-content p {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0.5rem 0;
    }

    ion-icon {
      color: var(--ion-color-primary);
    }
  `]
})
export class AdoptionSchedulerComponent {


  selectedDate: string;
  selectedTime: string;
  location: string = '';
  notes: string = '';
  minDate: string = new Date().toISOString();



  get hasSchedule(): boolean {
    return !!(this.selectedDate && this.selectedTime && this.location);
  }

  get formattedDate(): string {
    if (!this.selectedDate) return '';
    return new Date(this.selectedDate).toLocaleDateString();
  }

  get formattedTime(): string {
    if (!this.selectedTime) return '';
    import { Component, Input } from '@angular/core';


    @Component({
      selector: 'app-adoption-scheduler',
      template: `
    <div class="scheduler-container">
      <h2>Programar encuentro</h2>

      <ion-item>
        <ion-label position="stacked">Fecha</ion-label>
        <ion-datetime
          presentation="date"
          [min]="minDate"
          [(ngModel)]="selectedDate"
          (ionChange)="updateSchedule()"
          cancelText="Cancelar"
          doneText="Confirmar">
        </ion-datetime>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">Hora</ion-label>
        <ion-datetime
          presentation="time"
          [(ngModel)]="selectedTime"
          (ionChange)="updateSchedule()"
          cancelText="Cancelar"
          doneText="Confirmar">
        </ion-datetime>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">Lugar de encuentro</ion-label>
        <ion-input
          [(ngModel)]="location"
          placeholder="Ingrese la dirección"
          (ionChange)="updateSchedule()">
        </ion-input>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">Notas adicionales</ion-label>
        <ion-textarea
          [(ngModel)]="notes"
          placeholder="Agregue detalles importantes"
          (ionChange)="updateSchedule()">
        </ion-textarea>
      </ion-item>

      <div class="meeting-status" *ngIf="hasSchedule">
        <ion-card>
          <ion-card-header>
            <ion-card-subtitle>Encuentro programado</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <p><ion-icon name="calendar"></ion-icon> {{ formattedDate }}</p>
            <p><ion-icon name="time"></ion-icon> {{ formattedTime }}</p>
            <p><ion-icon name="location"></ion-icon> {{ location }}</p>
            <p *ngIf="notes"><ion-icon name="document-text"></ion-icon> {{ notes }}</p>
          </ion-card-content>
        </ion-card>
      </div>
    </div>
  `,
      styles: [`
    .scheduler-container {
      padding: 1rem;
    }

    ion-item {
      margin-bottom: 1rem;
    }

    .meeting-status {
      margin-top: 1rem;
    }

    ion-card {
      margin: 0;
    }

    ion-card-content p {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0.5rem 0;
    }

    ion-icon {
      color: var(--ion-color-primary);
    }
  `]
    })
    export class AdoptionSchedulerComponent {


      selectedDate: string;
      selectedTime: string;
      location: string = '';
      notes: string = '';
      minDate: string = new Date().toISOString();



      get hasSchedule(): boolean {
        return !!(this.selectedDate && this.selectedTime && this.location);
      }

      get formattedDate(): string {
        if (!this.selectedDate) return '';
        return new Date(this.selectedDate).toLocaleDateString();
      }

      get formattedTime(): string {
        if (!this.selectedTime) return '';
        return new Date(this.selectedTime).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });
      }


    }