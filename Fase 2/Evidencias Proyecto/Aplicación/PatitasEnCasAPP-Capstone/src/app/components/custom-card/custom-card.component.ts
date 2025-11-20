import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-custom-card',
  template: `
    <ion-card 
      [class]="getCardClass()"
      (click)="onCardClick()"
      [style.cursor]="clickable ? 'pointer' : 'default'">
      
      <!-- Header de la tarjeta -->
      <div *ngIf="hasHeader" class="card-header">
        <div class="header-content">
          <ion-avatar *ngIf="avatarSrc" class="header-avatar">
            <img [src]="avatarSrc" [alt]="avatarAlt || 'Avatar'">
          </ion-avatar>
          
          <div class="header-text">
            <h3 *ngIf="headerTitle" class="header-title">{{ headerTitle }}</h3>
            <p *ngIf="headerSubtitle" class="header-subtitle">{{ headerSubtitle }}</p>
          </div>
        </div>
        
        <div *ngIf="headerActions.length > 0" class="header-actions">
          <ion-button 
            *ngFor="let action of headerActions"
            fill="clear" 
            size="small"
            (click)="action.handler($event)">
            <ion-icon [name]="action.icon" slot="icon-only"></ion-icon>
          </ion-button>
        </div>
      </div>

      <!-- Imagen destacada -->
      <div *ngIf="imageSrc" class="card-image-container">
        <img 
          [src]="imageSrc" 
          [alt]="imageAlt || 'Imagen'"
          class="card-image"
          [class.image-rounded]="roundedImage"
          (load)="onImageLoad()"
          (error)="onImageError()">
        
        <ion-skeleton-text 
          *ngIf="!imageLoaded && !imageHasError" 
          animated 
          class="image-skeleton">
        </ion-skeleton-text>
        
        <div *ngIf="imageOverlay" class="image-overlay">
          <ng-content select="[slot=image-overlay]"></ng-content>
        </div>
      </div>

      <!-- Contenido principal -->
      <ion-card-content [class]="contentClass">
        <ng-content></ng-content>
      </ion-card-content>

      <!-- Footer de la tarjeta -->
      <div *ngIf="hasFooter" class="card-footer">
        <ng-content select="[slot=footer]"></ng-content>
        
        <div *ngIf="footerActions.length > 0" class="footer-actions">
          <app-custom-button
            *ngFor="let action of footerActions"
            [variant]="action.variant || 'primary'"
            [size]="action.size || 'small'"
            [fill]="action.fill || 'clear'"
            [disabled]="action.disabled"
            [loading]="action.loading"
            [startIcon]="action.icon"
            (buttonClick)="action.handler()">
            {{ action.text }}
          </app-custom-button>
        </div>
      </div>
      
      <!-- Badge flotante -->
      <div *ngIf="badge" class="floating-badge" [class]="'badge-' + (badge.color || 'primary')">
        <ion-icon *ngIf="badge.icon" [name]="badge.icon"></ion-icon>
        <span>{{ badge.text }}</span>
      </div>
    </ion-card>
  `,
  styles: [`
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-lg);
      border-bottom: 1px solid var(--ion-color-light-shade);
    }
    
    .header-content {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }
    
    .header-avatar {
      width: 48px;
      height: 48px;
      flex-shrink: 0;
    }
    
    .header-text {
      flex: 1;
    }
    
    .header-title {
      margin: 0 0 var(--spacing-xs) 0;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--ion-text-color);
    }
    
    .header-subtitle {
      margin: 0;
      font-size: var(--font-size-sm);
      color: var(--ion-text-color-secondary);
    }
    
    .header-actions {
      display: flex;
      gap: var(--spacing-xs);
    }
    
    .card-image-container {
      position: relative;
      width: 100%;
      height: 200px;
      overflow: hidden;
    }
    
    .card-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    
    .image-rounded {
      border-radius: var(--border-radius-lg);
      margin: var(--spacing-md);
      height: calc(100% - 2 * var(--spacing-md));
    }
    
    .card-enhanced:hover .card-image {
      transform: scale(1.05);
    }
    
    .image-skeleton {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
    
    .image-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent, rgba(0,0,0,0.7));
      color: white;
      padding: var(--spacing-lg);
    }
    
    .card-footer {
      padding: var(--spacing-lg);
      border-top: 1px solid var(--ion-color-light-shade);
      background: var(--ion-color-light-tint);
    }
    
    .footer-actions {
      display: flex;
      gap: var(--spacing-md);
      justify-content: flex-end;
      margin-top: var(--spacing-md);
    }
    
    .floating-badge {
      position: absolute;
      top: var(--spacing-md);
      right: var(--spacing-md);
      padding: var(--spacing-xs) var(--spacing-md);
      border-radius: var(--border-radius-lg);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      box-shadow: var(--shadow-md);
      
      &.badge-primary {
        background: var(--ion-color-primary);
        color: var(--ion-color-primary-contrast);
      }
      
      &.badge-success {
        background: var(--ion-color-success);
        color: var(--ion-color-success-contrast);
      }
      
      &.badge-warning {
        background: var(--ion-color-warning);
        color: var(--ion-color-warning-contrast);
      }
      
      &.badge-danger {
        background: var(--ion-color-danger);
        color: var(--ion-color-danger-contrast);
      }
    }
    
    .card-compact ion-card-content {
      padding: var(--spacing-md);
    }
    
    .card-spacious ion-card-content {
      padding: var(--spacing-2xl);
    }
    
    .clickable-card:hover {
      --box-shadow: var(--shadow-xl);
      transform: translateY(-4px);
    }
    
    .clickable-card:active {
      transform: translateY(-2px);
    }
  `]
})
export class CustomCardComponent {
  @Input() variant: 'default' | 'elevated' | 'outlined' = 'default';
  @Input() size: 'compact' | 'default' | 'spacious' = 'default';
  @Input() clickable: boolean = false;
  @Input() loading: boolean = false;
  
  // Header
  @Input() headerTitle?: string;
  @Input() headerSubtitle?: string;
  @Input() avatarSrc?: string;
  @Input() avatarAlt?: string;
  @Input() headerActions: CardAction[] = [];
  
  // Imagen
  @Input() imageSrc?: string;
  @Input() imageAlt?: string;
  @Input() roundedImage: boolean = false;
  @Input() imageOverlay: boolean = false;
  
  // Contenido
  @Input() contentClass: string = '';
  
  // Footer
  @Input() footerActions: CardAction[] = [];
  
  // Badge
  @Input() badge?: {
    text: string;
    icon?: string;
    color?: 'primary' | 'success' | 'warning' | 'danger';
  };
  
  @Output() cardClick = new EventEmitter<void>();
  @Output() imageLoad = new EventEmitter<void>();
  @Output() imageErrorEvent = new EventEmitter<void>();

  imageLoaded = false;
  imageHasError = false;

  get hasHeader(): boolean {
    return !!(this.headerTitle || this.headerSubtitle || this.avatarSrc || this.headerActions.length > 0);
  }

  get hasFooter(): boolean {
    return this.footerActions.length > 0;
  }

  onCardClick() {
    if (this.clickable) {
      this.cardClick.emit();
    }
  }

  onImageLoad() {
    this.imageLoaded = true;
    this.imageHasError = false;
    this.imageLoad.emit();
  }

  onImageError() {
    this.imageLoaded = false;
    this.imageHasError = true;
    this.imageErrorEvent.emit();
  }

  getCardClass(): string {
    let classes = ['card-enhanced'];
    
    if (this.variant === 'elevated') {
      classes.push('card-elevated');
    }
    
    if (this.clickable) {
      classes.push('clickable-card');
    }
    
    classes.push(`card-${this.size}`);
    
    return classes.join(' ');
  }
}

export interface CardAction {
  text?: string;
  icon?: string;
  handler: (event?: Event) => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger';
  size?: 'small' | 'default' | 'large';
  fill?: 'clear' | 'outline' | 'solid';
  disabled?: boolean;
  loading?: boolean;
}