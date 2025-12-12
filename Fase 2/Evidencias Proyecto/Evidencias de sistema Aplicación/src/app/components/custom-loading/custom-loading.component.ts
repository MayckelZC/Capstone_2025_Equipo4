import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-custom-loading',
  template: `
    <div [class]="getLoadingClass()" *ngIf="show">
      <div class="loading-content">
        <!-- Spinner personalizado -->
        <div *ngIf="type === 'spinner'" class="spinner-container">
          <ion-spinner 
            [name]="spinnerType" 
            class="spinner-enhanced"
            [style.width.px]="size"
            [style.height.px]="size">
          </ion-spinner>
        </div>
        
        <!-- Loading con puntos animados -->
        <div *ngIf="type === 'dots'" class="dots-container">
          <div class="dot" [style.animation-delay]="'0s'"></div>
          <div class="dot" [style.animation-delay]="'0.2s'"></div>
          <div class="dot" [style.animation-delay]="'0.4s'"></div>
        </div>
        
        <!-- Loading con ondas -->
        <div *ngIf="type === 'waves'" class="waves-container">
          <div class="wave" [style.animation-delay]="'0s'"></div>
          <div class="wave" [style.animation-delay]="'0.1s'"></div>
          <div class="wave" [style.animation-delay]="'0.2s'"></div>
          <div class="wave" [style.animation-delay]="'0.3s'"></div>
          <div class="wave" [style.animation-delay]="'0.4s'"></div>
        </div>
        
        <!-- Loading con paw prints -->
        <div *ngIf="type === 'paws'" class="paws-container">
          <ion-icon name="paw" class="paw-print" [style.animation-delay]="'0s'"></ion-icon>
          <ion-icon name="paw" class="paw-print" [style.animation-delay]="'0.2s'"></ion-icon>
          <ion-icon name="paw" class="paw-print" [style.animation-delay]="'0.4s'"></ion-icon>
        </div>
        
        <!-- Mensaje de loading -->
        <div *ngIf="message" class="loading-message">
          {{ message }}
        </div>
        
        <!-- Submensaje -->
        <div *ngIf="subMessage" class="loading-submessage">
          {{ subMessage }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      backdrop-filter: blur(4px);
    }
    
    .loading-inline {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-xl);
    }
    
    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: var(--spacing-lg);
    }
    
    .spinner-container {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .spinner-enhanced {
      --color: var(--ion-color-primary);
    }
    
    /* Animación de puntos */
    .dots-container {
      display: flex;
      gap: var(--spacing-sm);
    }
    
    .dot {
      width: 12px;
      height: 12px;
      background-color: var(--ion-color-primary);
      border-radius: 50%;
      animation: dotPulse 1.4s infinite ease-in-out;
    }
    
    @keyframes dotPulse {
      0%, 80%, 100% {
        transform: scale(0);
        opacity: 0.5;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }
    
    /* Animación de ondas */
    .waves-container {
      display: flex;
      gap: 4px;
      align-items: flex-end;
      height: 40px;
    }
    
    .wave {
      width: 6px;
      background-color: var(--ion-color-primary);
      border-radius: 3px;
      animation: waveStretch 1.2s infinite ease-in-out;
    }
    
    @keyframes waveStretch {
      0%, 40%, 100% {
        transform: scaleY(0.4);
      }
      20% {
        transform: scaleY(1);
      }
    }
    
    /* Animación de paw prints */
    .paws-container {
      display: flex;
      gap: var(--spacing-md);
    }
    
    .paw-print {
      font-size: 24px;
      color: var(--ion-color-primary);
      animation: pawBounce 1.4s infinite ease-in-out;
    }
    
    @keyframes pawBounce {
      0%, 80%, 100% {
        transform: scale(0) rotate(0deg);
        opacity: 0.5;
      }
      40% {
        transform: scale(1) rotate(20deg);
        opacity: 1;
      }
    }
    
    .loading-message {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--ion-text-color);
      margin-top: var(--spacing-lg);
    }
    
    .loading-submessage {
      font-size: var(--font-size-sm);
      color: var(--ion-text-color-secondary);
      opacity: 0.8;
    }
    
    /* Variantes de tamaño */
    .size-small .spinner-enhanced { width: 24px; height: 24px; }
    .size-small .dot { width: 8px; height: 8px; }
    .size-small .wave { width: 4px; }
    .size-small .paw-print { font-size: 18px; }
    
    .size-large .spinner-enhanced { width: 48px; height: 48px; }
    .size-large .dot { width: 16px; height: 16px; }
    .size-large .wave { width: 8px; }
    .size-large .paw-print { font-size: 32px; }
    
    /* Modo oscuro */
    @media (prefers-color-scheme: dark) {
      .loading-overlay {
        background: rgba(26, 26, 26, 0.95);
      }
    }
  `]
})
export class CustomLoadingComponent {
  @Input() show: boolean = true;
  @Input() type: 'spinner' | 'dots' | 'waves' | 'paws' = 'spinner';
  @Input() spinnerType: 'lines' | 'lines-small' | 'dots' | 'bubbles' | 'circles' | 'crescent' = 'crescent';
  @Input() overlay: boolean = true;
  @Input() size: number = 32;
  @Input() sizeVariant: 'small' | 'default' | 'large' = 'default';
  @Input() message?: string;
  @Input() subMessage?: string;

  getLoadingClass(): string {
    let classes = [];
    
    if (this.overlay) {
      classes.push('loading-overlay');
    } else {
      classes.push('loading-inline');
    }
    
    classes.push(`size-${this.sizeVariant}`);
    
    return classes.join(' ');
  }
}