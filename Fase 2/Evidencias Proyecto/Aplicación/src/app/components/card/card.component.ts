import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
})
export class CardComponent implements OnInit, OnChanges {
  @Input() nombre!: string;
  @Input() tipoMascota!: string;
  @Input() etapaVida!: string;
  @Input() edadMeses?: number;
  @Input() edadAnios?: number;
  @Input() sexo: string;
  @Input() tamano: string;
  @Input() esterilizado: boolean;
  @Input() location: string;
  @Input() descripcion!: string;
  @Input() urlImagen!: string;
  
  @Input() adopcionId!: string;
  @Input() creadorId?: string;
  isOwner: boolean = false;
  @Input() isFavorite: boolean = false;
  @Input() isVerified: boolean = false;
  @Input() isFavoriteInFlight: boolean = false;
  @Input() status: string; // available, in_process, adopted

  @Output() detailsClicked = new EventEmitter<void>();
  @Output() toggleFavoriteEvent = new EventEmitter<string>();
  @Output() reportEvent = new EventEmitter<string>();
  @Output() confirmHandoverEvent = new EventEmitter<string>();
  
  imageLoading: boolean = true;

  constructor(private authService: AuthService) {}

  async ngOnInit() {
    await this.checkOwner();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['creadorId']) {
      await this.checkOwner();
    }
    if (changes['urlImagen'] && !changes['urlImagen'].firstChange) {
      this.imageLoading = true;
    }
  }

  private async checkOwner() {
    try {
      const currentUser = await this.authService.getCurrentUser();
      this.isOwner = !!(currentUser && this.creadorId && currentUser.uid === this.creadorId);
    } catch (err) {
      this.isOwner = false;
    }
  }

  onDetailsClick() {
    this.detailsClicked.emit();
  }

  onToggleFavorite() {
    this.toggleFavoriteEvent.emit(this.adopcionId);
  }
  
  onReport() {
    this.reportEvent.emit(this.adopcionId);
  }

  onConfirmHandover() {
    this.confirmHandoverEvent.emit(this.adopcionId);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'available':
        return 'success';
      case 'in_process':
        return 'warning';
      case 'adopted':
        return 'medium';
      default:
        return 'light';
    }
  }

  getTranslatedStatus(status: string): string {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'in_process':
        return 'En Proceso';
      case 'adopted':
        return 'Adoptado';
      default:
        return 'Desconocido';
    }
  }

  onImageLoad() {
    this.imageLoading = false;
  }

  handleImageError(event: any) {
    this.imageLoading = false;
    const placeholder = this.tipoMascota === 'gato' 
      ? 'assets/imgs/pixelart-cat.png' 
      : 'assets/imgs/pixelart-dog.png';
    event.target.src = placeholder;
  }
}
