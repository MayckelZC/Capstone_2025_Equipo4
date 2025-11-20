import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-image-gallery',
  template: `
    <div class="gallery-container">
      <!-- Imagen principal -->
      <div class="main-image-container">
        <img 
          [src]="currentImage" 
          [alt]="'Imagen ' + (currentIndex + 1)"
          class="main-image"
          (click)="openFullscreen()"
          [class.zoomed]="isZoomed"
          (load)="onImageLoad()"
          (error)="onImageError()">
        
        <ion-skeleton-text 
          *ngIf="!imageLoaded" 
          animated 
          class="image-skeleton">
        </ion-skeleton-text>
        
        <!-- Controles de navegación -->
        <div *ngIf="images.length > 1" class="navigation-controls">
          <ion-button 
            fill="clear" 
            class="nav-button nav-prev"
            (click)="previousImage()"
            [disabled]="currentIndex === 0">
            <ion-icon name="chevron-back-outline"></ion-icon>
          </ion-button>
          
          <ion-button 
            fill="clear" 
            class="nav-button nav-next"
            (click)="nextImage()"
            [disabled]="currentIndex === images.length - 1">
            <ion-icon name="chevron-forward-outline"></ion-icon>
          </ion-button>
        </div>
        
        <!-- Indicador de posición -->
        <div *ngIf="images.length > 1" class="position-indicator">
          {{ currentIndex + 1 }} / {{ images.length }}
        </div>
        
        <!-- Botones de acción -->
        <div class="action-buttons">
          <ion-button 
            fill="clear" 
            class="action-button"
            (click)="toggleZoom()">
            <ion-icon [name]="isZoomed ? 'contract-outline' : 'expand-outline'"></ion-icon>
          </ion-button>
          
          <ion-button 
            fill="clear" 
            class="action-button"
            (click)="shareImage()">
            <ion-icon name="share-outline"></ion-icon>
          </ion-button>
          
          <ion-button 
            fill="clear" 
            class="action-button"
            (click)="downloadImage()">
            <ion-icon name="download-outline"></ion-icon>
          </ion-button>
        </div>
      </div>
      
      <!-- Miniaturas -->
      <div *ngIf="images.length > 1 && showThumbnails" class="thumbnails-container">
        <div class="thumbnails-scroll">
          <div 
            *ngFor="let image of images; let i = index" 
            class="thumbnail"
            [class.active]="i === currentIndex"
            (click)="selectImage(i)">
            <img [src]="image" [alt]="'Miniatura ' + (i + 1)">
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .gallery-container {
      width: 100%;
      background: var(--ion-color-surface);
      border-radius: var(--border-radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-md);
    }
    
    .main-image-container {
      position: relative;
      width: 100%;
      height: 300px;
      background: var(--ion-color-light);
      overflow: hidden;
      cursor: zoom-in;
      
      &:has(.zoomed) {
        cursor: zoom-out;
      }
    }
    
    .main-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
      
      &.zoomed {
        transform: scale(1.5);
        cursor: move;
      }
    }
    
    .image-skeleton {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 0;
    }
    
    .navigation-controls {
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      pointer-events: none;
      transform: translateY(-50%);
    }
    
    .nav-button {
      --background: rgba(0, 0, 0, 0.5);
      --color: white;
      --border-radius: 50%;
      width: 48px;
      height: 48px;
      margin: 0 var(--spacing-md);
      pointer-events: auto;
      backdrop-filter: blur(8px);
      
      &:hover {
        --background: rgba(0, 0, 0, 0.7);
        transform: scale(1.1);
      }
      
      &:disabled {
        --background: rgba(0, 0, 0, 0.2);
        --color: rgba(255, 255, 255, 0.5);
      }
    }
    
    .position-indicator {
      position: absolute;
      bottom: var(--spacing-md);
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: var(--spacing-xs) var(--spacing-md);
      border-radius: var(--border-radius-lg);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      backdrop-filter: blur(8px);
    }
    
    .action-buttons {
      position: absolute;
      top: var(--spacing-md);
      right: var(--spacing-md);
      display: flex;
      gap: var(--spacing-xs);
    }
    
    .action-button {
      --background: rgba(0, 0, 0, 0.5);
      --color: white;
      --border-radius: 50%;
      width: 40px;
      height: 40px;
      backdrop-filter: blur(8px);
      
      &:hover {
        --background: rgba(0, 0, 0, 0.7);
        transform: scale(1.1);
      }
    }
    
    .thumbnails-container {
      padding: var(--spacing-md);
      background: var(--ion-color-light-tint);
    }
    
    .thumbnails-scroll {
      display: flex;
      gap: var(--spacing-sm);
      overflow-x: auto;
      padding-bottom: var(--spacing-xs);
      
      &::-webkit-scrollbar {
        height: 4px;
      }
      
      &::-webkit-scrollbar-track {
        background: var(--ion-color-light-shade);
        border-radius: 2px;
      }
      
      &::-webkit-scrollbar-thumb {
        background: var(--ion-color-medium);
        border-radius: 2px;
      }
    }
    
    .thumbnail {
      flex-shrink: 0;
      width: 60px;
      height: 60px;
      border-radius: var(--border-radius-md);
      overflow: hidden;
      cursor: pointer;
      border: 2px solid transparent;
      transition: all 0.2s ease;
      
      &.active {
        border-color: var(--ion-color-primary);
        transform: scale(1.05);
      }
      
      &:hover {
        transform: scale(1.1);
        box-shadow: var(--shadow-sm);
      }
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
    
    /* Responsive */
    @media (min-width: 768px) {
      .main-image-container {
        height: 400px;
      }
      
      .thumbnail {
        width: 80px;
        height: 80px;
      }
    }
  `]
})
export class ImageGalleryComponent {
  @Input() images: string[] = [];
  @Input() showThumbnails: boolean = true;
  @Input() allowZoom: boolean = true;
  @Input() allowShare: boolean = true;
  @Input() allowDownload: boolean = true;
  
  @Output() imageChange = new EventEmitter<{ index: number; url: string }>();
  @Output() fullscreenOpen = new EventEmitter<{ index: number; url: string }>();

  currentIndex = 0;
  isZoomed = false;
  imageLoaded = false;

  get currentImage(): string {
    return this.images[this.currentIndex] || '';
  }

  selectImage(index: number) {
    this.currentIndex = index;
    this.isZoomed = false;
    this.imageLoaded = false;
    this.imageChange.emit({ index, url: this.currentImage });
  }

  previousImage() {
    if (this.currentIndex > 0) {
      this.selectImage(this.currentIndex - 1);
    }
  }

  nextImage() {
    if (this.currentIndex < this.images.length - 1) {
      this.selectImage(this.currentIndex + 1);
    }
  }

  toggleZoom() {
    if (this.allowZoom) {
      this.isZoomed = !this.isZoomed;
    }
  }

  openFullscreen() {
    this.fullscreenOpen.emit({ index: this.currentIndex, url: this.currentImage });
  }

  shareImage() {
    if (this.allowShare && navigator.share) {
      navigator.share({
        title: `Imagen ${this.currentIndex + 1}`,
        url: this.currentImage
      }).catch(console.error);
    }
  }

  downloadImage() {
    if (this.allowDownload) {
      const link = document.createElement('a');
      link.href = this.currentImage;
      link.download = `imagen_${this.currentIndex + 1}.jpg`;
      link.click();
    }
  }

  onImageLoad() {
    this.imageLoaded = true;
  }

  onImageError() {
    console.error('Error loading image:', this.currentImage);
  }
}