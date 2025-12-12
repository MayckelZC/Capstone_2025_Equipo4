import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { SocialService, Rating } from '@shared/services/social.service';

@Component({
  selector: 'app-rating-display',
  template: `
    <div class="rating-container">
      <!-- Rating promedio y estadísticas -->
      <div class="rating-summary" *ngIf="showSummary">
        <div class="average-rating">
          <div class="rating-score">
            {{ averageRating | number:'1.1-1' }}
          </div>
          <div class="rating-stars">
            <ion-icon 
              *ngFor="let star of getStarsArray(averageRating)" 
              [name]="star" 
              class="star-icon">
            </ion-icon>
          </div>
          <div class="rating-count">
            {{ totalRatings }} {{ totalRatings === 1 ? 'calificación' : 'calificaciones' }}
          </div>
        </div>
        
        <div *ngIf="showBreakdown" class="rating-breakdown">
          <div *ngFor="let item of breakdownArray" class="breakdown-item">
            <span class="star-number">{{ item.star }}</span>
            <ion-icon name="star" class="breakdown-star"></ion-icon>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                [style.width.%]="item.percentage">
              </div>
            </div>
            <span class="count">{{ item.count }}</span>
          </div>
        </div>
      </div>

      <!-- Lista de ratings individuales -->
      <div *ngIf="showIndividualRatings" class="ratings-list">
        <h4 *ngIf="ratingsTitle">{{ ratingsTitle }}</h4>
        
        <div 
          *ngFor="let rating of displayRatings" 
          class="rating-item animate-slide-up">
          
          <div class="rating-header">
            <ion-avatar class="user-avatar">
              <img [src]="rating.fromUserAvatar || 'assets/imgs/paw.png'" [alt]="rating.fromUserName">
            </ion-avatar>
            
            <div class="rating-info">
              <div class="user-name">{{ rating.fromUserName }}</div>
              <div class="rating-date">{{ formatDate(rating.createdAt) }}</div>
            </div>
            
            <div class="rating-score-container">
              <div class="rating-stars">
                <ion-icon 
                  *ngFor="let star of getStarsArray(rating.score)" 
                  [name]="star" 
                  class="star-icon small">
                </ion-icon>
              </div>
              <div class="score-number">{{ rating.score }}/5</div>
            </div>
          </div>
          
          <div *ngIf="rating.comment" class="rating-comment">
            <p>{{ rating.comment }}</p>
          </div>
        </div>
        
        <!-- Botón para ver más -->
        <div *ngIf="hasMoreRatings" class="load-more-container">
          <ion-button 
            fill="clear" 
            (click)="loadMoreRatings()"
            [disabled]="loadingMore">
            <span *ngIf="!loadingMore">Ver más calificaciones</span>
            <ion-spinner *ngIf="loadingMore"></ion-spinner>
          </ion-button>
        </div>
      </div>

      <!-- Formulario para nueva calificación -->
      <div *ngIf="showRatingForm && canRate" class="rating-form">
        <h4>Califica tu experiencia</h4>
        
        <div class="form-rating-stars">
          <ion-icon 
            *ngFor="let i of [1,2,3,4,5]" 
            [name]="i <= newRating ? 'star' : 'star-outline'" 
            class="star-interactive"
            [class.selected]="i <= newRating"
            (click)="selectRating(i)">
          </ion-icon>
        </div>
        
        <ion-textarea
          [(ngModel)]="newComment"
          placeholder="Comparte tu experiencia (opcional)"
          rows="3"
          class="comment-input">
        </ion-textarea>
        
        <div class="form-actions">
          <ion-button 
            fill="clear" 
            (click)="cancelRating()">
            Cancelar
          </ion-button>
          <ion-button 
            (click)="submitRating()"
            [disabled]="!newRating || submitting">
            <span *ngIf="!submitting">Enviar calificación</span>
            <ion-spinner *ngIf="submitting"></ion-spinner>
          </ion-button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .rating-container {
      background: var(--ion-color-surface);
      border-radius: var(--border-radius-lg);
      padding: var(--spacing-lg);
      margin: var(--spacing-md) 0;
    }
    
    .rating-summary {
      display: flex;
      gap: var(--spacing-xl);
      margin-bottom: var(--spacing-xl);
      padding-bottom: var(--spacing-lg);
      border-bottom: 1px solid var(--ion-color-light-shade);
    }
    
    .average-rating {
      text-align: center;
      flex-shrink: 0;
    }
    
    .rating-score {
      font-size: var(--font-size-4xl);
      font-weight: var(--font-weight-bold);
      color: var(--ion-color-primary);
      margin-bottom: var(--spacing-sm);
    }
    
    .rating-stars {
      display: flex;
      justify-content: center;
      gap: 2px;
      margin-bottom: var(--spacing-sm);
    }
    
    .star-icon {
      font-size: 20px;
      color: #FFD700;
      
      &.small {
        font-size: 16px;
      }
    }
    
    .rating-count {
      font-size: var(--font-size-sm);
      color: var(--ion-text-color-secondary);
    }
    
    .rating-breakdown {
      flex: 1;
    }
    
    .breakdown-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-sm);
    }
    
    .star-number {
      font-weight: var(--font-weight-medium);
      min-width: 8px;
    }
    
    .breakdown-star {
      font-size: 14px;
      color: #FFD700;
    }
    
    .progress-bar {
      flex: 1;
      height: 8px;
      background: var(--ion-color-light-shade);
      border-radius: 4px;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      background: var(--ion-color-primary);
      transition: width 0.3s ease;
    }
    
    .count {
      font-size: var(--font-size-sm);
      color: var(--ion-text-color-secondary);
      min-width: 20px;
      text-align: right;
    }
    
    .ratings-list h4 {
      margin: 0 0 var(--spacing-lg) 0;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--ion-text-color);
    }
    
    .rating-item {
      border: 1px solid var(--ion-color-light-shade);
      border-radius: var(--border-radius-md);
      padding: var(--spacing-lg);
      margin-bottom: var(--spacing-md);
      background: var(--ion-color-surface);
    }
    
    .rating-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-md);
    }
    
    .user-avatar {
      width: 48px;
      height: 48px;
      flex-shrink: 0;
    }
    
    .rating-info {
      flex: 1;
    }
    
    .user-name {
      font-weight: var(--font-weight-semibold);
      color: var(--ion-text-color);
      margin-bottom: 2px;
    }
    
    .rating-date {
      font-size: var(--font-size-sm);
      color: var(--ion-text-color-secondary);
    }
    
    .rating-score-container {
      text-align: center;
    }
    
    .score-number {
      font-size: var(--font-size-sm);
      color: var(--ion-text-color-secondary);
      margin-top: 2px;
    }
    
    .rating-comment p {
      margin: 0;
      color: var(--ion-text-color);
      line-height: 1.5;
    }
    
    .load-more-container {
      text-align: center;
      margin-top: var(--spacing-lg);
    }
    
    .rating-form {
      border-top: 1px solid var(--ion-color-light-shade);
      padding-top: var(--spacing-lg);
      margin-top: var(--spacing-lg);
    }
    
    .rating-form h4 {
      margin: 0 0 var(--spacing-lg) 0;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
    }
    
    .form-rating-stars {
      display: flex;
      justify-content: center;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-lg);
    }
    
    .star-interactive {
      font-size: 32px;
      color: var(--ion-color-medium);
      cursor: pointer;
      transition: all 0.2s ease;
      
      &.selected {
        color: #FFD700;
        transform: scale(1.1);
      }
      
      &:hover {
        transform: scale(1.2);
      }
    }
    
    .comment-input {
      --background: var(--ion-color-light-tint);
      --border-radius: var(--border-radius-md);
      margin-bottom: var(--spacing-lg);
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-md);
    }
  `]
})
export class RatingDisplayComponent implements OnInit {
  @Input() userId!: string;
  @Input() adoptionId?: string;
  @Input() currentUserId?: string;
  @Input() showSummary: boolean = true;
  @Input() showBreakdown: boolean = true;
  @Input() showIndividualRatings: boolean = true;
  @Input() showRatingForm: boolean = false;
  @Input() ratingsTitle: string = 'Calificaciones';
  @Input() maxDisplayRatings: number = 5;

  @Output() ratingSubmitted = new EventEmitter<Rating>();
  @Output() ratingError = new EventEmitter<string>();

  ratings: Rating[] = [];
  displayRatings: Rating[] = [];
  averageRating: number = 0;
  totalRatings: number = 0;
  breakdownArray: any[] = [];
  
  newRating: number = 0;
  newComment: string = '';
  submitting: boolean = false;
  loadingMore: boolean = false;
  
  get hasMoreRatings(): boolean {
    return this.ratings.length > this.displayRatings.length;
  }

  get canRate(): boolean {
    return !!this.currentUserId && this.currentUserId !== this.userId;
  }

  constructor(private socialService: SocialService) {}

  ngOnInit() {
    this.loadRatings();
  }

  private loadRatings() {
    this.socialService.getUserRatings(this.userId).subscribe(ratings => {
      this.ratings = ratings;
      this.totalRatings = ratings.length;
      this.calculateAverageRating();
      this.calculateBreakdown();
      this.updateDisplayRatings();
    });
  }

  private calculateAverageRating() {
    if (this.ratings.length === 0) {
      this.averageRating = 0;
      return;
    }
    
    const total = this.ratings.reduce((sum, rating) => sum + rating.score, 0);
    this.averageRating = Math.round((total / this.ratings.length) * 10) / 10;
  }

  private calculateBreakdown() {
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    this.ratings.forEach(rating => {
      breakdown[rating.score as keyof typeof breakdown]++;
    });

    this.breakdownArray = Object.entries(breakdown)
      .map(([star, count]) => ({
        star: parseInt(star),
        count,
        percentage: this.totalRatings > 0 ? (count / this.totalRatings) * 100 : 0
      }))
      .reverse();
  }

  private updateDisplayRatings() {
    this.displayRatings = this.ratings.slice(0, this.maxDisplayRatings);
  }

  loadMoreRatings() {
    this.loadingMore = true;
    setTimeout(() => {
      const currentLength = this.displayRatings.length;
      const nextBatch = this.ratings.slice(currentLength, currentLength + this.maxDisplayRatings);
      this.displayRatings = [...this.displayRatings, ...nextBatch];
      this.loadingMore = false;
    }, 500);
  }

  getStarsArray(rating: number): string[] {
    const stars: string[] = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push('star');
    }
    
    if (hasHalfStar) {
      stars.push('star-half');
    }
    
    while (stars.length < 5) {
      stars.push('star-outline');
    }
    
    return stars;
  }

  selectRating(rating: number) {
    this.newRating = rating;
  }

  async submitRating() {
    if (!this.newRating || !this.currentUserId) return;

    this.submitting = true;
    try {
      await this.socialService.submitRating({
        fromUserId: this.currentUserId,
        toUserId: this.userId,
        adoptionId: this.adoptionId,
        score: this.newRating,
        comment: this.newComment.trim() || undefined
      });

      this.ratingSubmitted.emit({
        fromUserId: this.currentUserId,
        toUserId: this.userId,
        adoptionId: this.adoptionId,
        score: this.newRating,
        comment: this.newComment.trim() || undefined,
        createdAt: new Date()
      });

      this.resetForm();
    } catch (error: any) {
      this.ratingError.emit(error.message || 'Error al enviar la calificación');
    } finally {
      this.submitting = false;
    }
  }

  cancelRating() {
    this.resetForm();
  }

  private resetForm() {
    this.newRating = 0;
    this.newComment = '';
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Hace 1 día';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semana(s)`;
    if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} mes(es)`;
    return `Hace ${Math.floor(diffDays / 365)} año(s)`;
  }
}