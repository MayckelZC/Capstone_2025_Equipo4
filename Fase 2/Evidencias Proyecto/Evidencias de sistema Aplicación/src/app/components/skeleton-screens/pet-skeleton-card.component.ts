import { Component, Input } from '@angular/core';

/**
 * Componente reutilizable de Skeleton Screen para tarjetas de mascotas
 * 
 * Uso:
 * <app-pet-skeleton-card></app-pet-skeleton-card>
 * o
 * <app-pet-skeleton-card [count]="5"></app-pet-skeleton-card>
 */
@Component({
    selector: 'app-pet-skeleton-card',
    template: `
    <ion-card *ngFor="let item of skeletonArray" class="animate-fade-in">
      <!-- Imagen skeleton -->
      <div class="skeleton skeleton-thumbnail"></div>
      
      <ion-card-header>
        <!-- Título skeleton -->
        <div class="skeleton skeleton-text skeleton-text-lg" style="width: 70%;"></div>
        <!-- Subtítulo skeleton -->
        <div class="skeleton skeleton-text" style="width: 50%;"></div>
      </ion-card-header>
      
      <ion-card-content>
        <!-- Descripción skeleton -->
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text" style="width: 80%;"></div>
        
        <!-- Metadata skeleton -->
        <div style="display: flex; gap: 12px; margin-top: 16px;">
          <div class="skeleton skeleton-text" style="width: 60px; height: 24px;"></div>
          <div class="skeleton skeleton-text" style="width: 60px; height: 24px;"></div>
          <div class="skeleton skeleton-text" style="width: 60px; height: 24px;"></div>
        </div>
      </ion-card-content>
    </ion-card>
  `,
    styles: [`
    ion-card {
      margin: 16px;
      border-radius: 16px;
      overflow: hidden;
    }
  `]
})
export class PetSkeletonCardComponent {
    @Input() count = 1;

    get skeletonArray(): number[] {
        return Array(this.count).fill(0).map((_, i) => i);
    }
}
