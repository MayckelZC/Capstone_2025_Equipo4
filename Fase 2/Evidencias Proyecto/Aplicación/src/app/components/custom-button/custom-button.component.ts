import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-custom-button',
  template: `
    <ion-button 
      [expand]="expand"
      [fill]="fill"
      [shape]="shape"
      [size]="size"
      [disabled]="disabled || loading"
      [class]="getButtonClass()"
      [attr.aria-label]="ariaLabel || null"
      [attr.aria-busy]="loading"
      [attr.aria-disabled]="disabled || loading"
      (click)="onClick()">
      
      <ion-spinner 
        *ngIf="loading" 
        name="crescent" 
        class="spinner-enhanced"
        aria-hidden="true">
      </ion-spinner>
      
      <ion-icon 
        *ngIf="startIcon && !loading" 
        [name]="startIcon" 
        slot="start"
        aria-hidden="true">
      </ion-icon>
      
      <span *ngIf="!loading || showTextWhileLoading">
        <ng-content></ng-content>
      </span>
      
      <ion-icon 
        *ngIf="endIcon && !loading" 
        [name]="endIcon" 
        slot="end"
        aria-hidden="true">
      </ion-icon>
    </ion-button>
  `,
  styles: [`
    .btn-floating {
      --border-radius: 50%;
      --padding-start: 0;
      --padding-end: 0;
      width: 56px;
      height: 56px;
      --box-shadow: var(--shadow-lg);
      
      &:hover {
        --box-shadow: var(--shadow-xl);
        transform: scale(1.05);
      }
    }
    
    .btn-icon-only {
      --padding-start: var(--spacing-md);
      --padding-end: var(--spacing-md);
      min-width: 44px;
      min-height: 44px;
    }
    
    .btn-gradient {
      position: relative;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: left 0.5s;
      }
      
      &:hover::before {
        left: 100%;
      }
    }
    
    .btn-pulse {
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    
    .spinner-enhanced {
      margin-right: var(--spacing-sm);
    }
  `]
})
export class CustomButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'light' | 'dark' = 'primary';
  @Input() size: 'small' | 'default' | 'large' = 'default';
  @Input() expand: 'block' | 'full' | undefined = undefined;
  @Input() fill: 'clear' | 'outline' | 'solid' = 'solid';
  @Input() shape: 'round' | undefined = undefined;
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() showTextWhileLoading: boolean = false;
  @Input() startIcon?: string;
  @Input() endIcon?: string;
  @Input() floating: boolean = false;
  @Input() gradient: boolean = false;
  @Input() pulse: boolean = false;
  @Input() ariaLabel?: string; // Nueva prop para accesibilidad
  
  @Output() buttonClick = new EventEmitter<void>();

  onClick() {
    if (!this.disabled && !this.loading) {
      this.buttonClick.emit();
    }
  }

  getButtonClass(): string {
    let classes = [];
    
    // Variante del botón
    classes.push(`btn-${this.variant}-enhanced`);
    
    // Características especiales
    if (this.floating) {
      classes.push('btn-floating');
    }
    
    if (this.gradient) {
      classes.push('btn-gradient');
    }
    
    if (this.pulse) {
      classes.push('btn-pulse');
    }
    
    // Solo ícono
    if ((this.startIcon || this.endIcon) && !this.hasTextContent()) {
      classes.push('btn-icon-only');
    }
    
    return classes.join(' ');
  }
  
  private hasTextContent(): boolean {
    // Esta función debería verificar si hay contenido de texto
    // Por simplicidad, asumimos que siempre hay texto a menos que sea un botón flotante
    return !this.floating;
  }
}