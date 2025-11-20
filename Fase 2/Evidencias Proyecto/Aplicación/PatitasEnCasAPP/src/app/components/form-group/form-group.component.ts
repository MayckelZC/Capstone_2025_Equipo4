import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-form-group',
  template: `
    <div class="form-group animate-slide-up">
      <div *ngIf="title" class="form-group-header">
        <div class="form-group-title">
          <ion-icon *ngIf="icon" [name]="icon"></ion-icon>
          {{ title }}
        </div>
        <p *ngIf="description" class="form-group-description">
          {{ description }}
        </p>
      </div>
      
      <div class="form-group-content">
        <ng-content></ng-content>
      </div>
      
      <div *ngIf="hasFooter" class="form-group-footer">
        <ng-content select="[slot=footer]"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .form-group {
      margin-bottom: var(--spacing-2xl);
      padding: var(--spacing-xl);
      background: var(--ion-color-surface);
      border-radius: var(--border-radius-xl);
      border: 1px solid var(--ion-color-light-shade);
      box-shadow: var(--shadow-sm);
    }
    
    .form-group-header {
      margin-bottom: var(--spacing-xl);
      border-bottom: 2px solid var(--ion-color-light-shade);
      padding-bottom: var(--spacing-lg);
    }
    
    .form-group-title {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--ion-color-primary);
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-sm);
      
      ion-icon {
        font-size: 24px;
        color: var(--ion-color-primary);
      }
    }
    
    .form-group-description {
      font-size: var(--font-size-sm);
      color: var(--ion-text-color-secondary);
      margin: 0;
      line-height: 1.5;
    }
    
    .form-group-content {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }
    
    .form-group-footer {
      margin-top: var(--spacing-xl);
      padding-top: var(--spacing-lg);
      border-top: 1px solid var(--ion-color-light-shade);
    }
    
    /* Variantes de estilo */
    .form-group.compact {
      padding: var(--spacing-lg);
      margin-bottom: var(--spacing-xl);
    }
    
    .form-group.elevated {
      box-shadow: var(--shadow-lg);
      border: none;
    }
    
    .form-group.bordered {
      border: 2px solid var(--ion-color-primary);
      border-radius: var(--border-radius-lg);
    }
    
    .form-group.success {
      border-left: 4px solid var(--ion-color-success);
      background: rgba(102, 187, 106, 0.05);
    }
    
    .form-group.warning {
      border-left: 4px solid var(--ion-color-warning);
      background: rgba(255, 183, 77, 0.05);
    }
    
    .form-group.danger {
      border-left: 4px solid var(--ion-color-danger);
      background: rgba(239, 83, 80, 0.05);
    }
  `]
})
export class FormGroupComponent {
  @Input() title?: string;
  @Input() description?: string;
  @Input() icon?: string;
  @Input() variant: 'default' | 'compact' | 'elevated' | 'bordered' = 'default';
  @Input() status?: 'success' | 'warning' | 'danger';
  @Input() hasFooter: boolean = false;

  getGroupClass(): string {
    let classes = ['form-group'];
    
    if (this.variant !== 'default') {
      classes.push(this.variant);
    }
    
    if (this.status) {
      classes.push(this.status);
    }
    
    return classes.join(' ');
  }
}