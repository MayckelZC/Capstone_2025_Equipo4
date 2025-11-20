import { Component, Input } from '@angular/core';


@Component({
  selector: 'app-adoption-checklist',
  template: `
    <div class="checklist-container">
      <h2>Lista de verificación para adopción</h2>
      
      <ion-list>
        <ion-item *ngFor="let item of checklistItems; let i = index">
          <ion-checkbox slot="start" 
                       [(ngModel)]="item.checked"
                       (ionChange)="updateChecklist()">
          </ion-checkbox>
          <ion-label>{{ item.text }}</ion-label>
        </ion-item>
      </ion-list>

      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress" [style.width.%]="progressPercentage"></div>
        </div>
        <span class="progress-text">{{ completedItems }}/{{ totalItems }}</span>
      </div>

      <div class="notes-container" *ngIf="isCompleted">
        <ion-text color="success">
          <h3>¡Felicitaciones! Has completado todos los requisitos.</h3>
          <p>Pueden proceder a coordinar la entrega de la mascota.</p>
        </ion-text>
      </div>
    </div>
  `,
  styles: [`
    .checklist-container {
      padding: 1rem;
    }

    .progress-container {
      margin: 1rem 0;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .progress-bar {
      flex: 1;
      height: 8px;
      background: var(--ion-color-light);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress {
      height: 100%;
      background: var(--ion-color-primary);
      transition: width 0.3s ease;
    }

    .progress-text {
      font-size: 0.9em;
      color: var(--ion-color-medium);
    }

    .notes-container {
      margin-top: 1rem;
      padding: 1rem;
      background: var(--ion-color-success-light);
      border-radius: 0.5rem;
      text-align: center;
    }
  `]
})
export class AdoptionChecklistComponent {


  checklistItems = [
    { text: 'Verificar identidad del adoptante', checked: false },
    { text: 'Revisar condiciones del hogar', checked: false },
    { text: 'Acordar compromiso de esterilización', checked: false },
    { text: 'Explicar necesidades médicas/específicas', checked: false },
    { text: 'Confirmar disponibilidad de tiempo', checked: false },
    { text: 'Revisar experiencia previa con mascotas', checked: false },
    { text: 'Acordar seguimiento post-adopción', checked: false },
    { text: 'Explicar proceso de adaptación', checked: false },
    { text: 'Entregar cartilla de vacunación', checked: false },
    { text: 'Firmar acuerdo de adopción', checked: false }
  ];



  get completedItems(): number {
    return this.checklistItems.filter(item => item.checked).length;
  }

  get totalItems(): number {
    return this.checklistItems.length;
  }

  get progressPercentage(): number {
    return (this.completedItems / this.totalItems) * 100;
    import { Component, Input } from '@angular/core';


    @Component({
      selector: 'app-adoption-checklist',
      template: `
    <div class="checklist-container">
      <h2>Lista de verificación para adopción</h2>
      
      <ion-list>
        <ion-item *ngFor="let item of checklistItems; let i = index">
          <ion-checkbox slot="start" 
                       [(ngModel)]="item.checked"
                       (ionChange)="updateChecklist()">
          </ion-checkbox>
          <ion-label>{{ item.text }}</ion-label>
        </ion-item>
      </ion-list>

      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress" [style.width.%]="progressPercentage"></div>
        </div>
        <span class="progress-text">{{ completedItems }}/{{ totalItems }}</span>
      </div>

      <div class="notes-container" *ngIf="isCompleted">
        <ion-text color="success">
          <h3>¡Felicitaciones! Has completado todos los requisitos.</h3>
          <p>Pueden proceder a coordinar la entrega de la mascota.</p>
        </ion-text>
      </div>
    </div>
  `,
      styles: [`
    .checklist-container {
      padding: 1rem;
    }

    .progress-container {
      margin: 1rem 0;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .progress-bar {
      flex: 1;
      height: 8px;
      background: var(--ion-color-light);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress {
      height: 100%;
      background: var(--ion-color-primary);
      transition: width 0.3s ease;
    }

    .progress-text {
      font-size: 0.9em;
      color: var(--ion-color-medium);
    }

    .notes-container {
      margin-top: 1rem;
      padding: 1rem;
      background: var(--ion-color-success-light);
      border-radius: 0.5rem;
      text-align: center;
    }
  `]
    })
    export class AdoptionChecklistComponent {


      checklistItems = [
        { text: 'Verificar identidad del adoptante', checked: false },
        { text: 'Revisar condiciones del hogar', checked: false },
        { text: 'Acordar compromiso de esterilización', checked: false },
        { text: 'Explicar necesidades médicas/específicas', checked: false },
        { text: 'Confirmar disponibilidad de tiempo', checked: false },
        { text: 'Revisar experiencia previa con mascotas', checked: false },
        { text: 'Acordar seguimiento post-adopción', checked: false },
        { text: 'Explicar proceso de adaptación', checked: false },
        { text: 'Entregar cartilla de vacunación', checked: false },
        { text: 'Firmar acuerdo de adopción', checked: false }
      ];



      get completedItems(): number {
        return this.checklistItems.filter(item => item.checked).length;
      }

      get totalItems(): number {
        return this.checklistItems.length;
      }

      get progressPercentage(): number {
        return (this.completedItems / this.totalItems) * 100;
      }

      get isCompleted(): boolean {
        return this.completedItems === this.totalItems;
      }


    }