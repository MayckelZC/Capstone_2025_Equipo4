import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { Share } from '@capacitor/share';

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
  @Input() sexo!: string;
  @Input() tamano!: string;
  @Input() esterilizado!: boolean;
  @Input() vacuna!: boolean;
  @Input() desparasitado!: boolean;
  @Input() location!: string;
  @Input() descripcion!: string;
  @Input() urlImagen!: string;
  @Input() raza?: string;
  @Input() createdAt?: Date;
  @Input() favoriteCount: number = 0;
  @Input() publisherRating: number = 0;
  @Input() profileMatchPercentage?: number;

  @Input() adopcionId!: string;
  @Input() creadorId?: string;
  isOwner: boolean = false;
  @Input() isFavorite: boolean = false;
  @Input() isVerified: boolean = false;
  @Input() isFavoriteInFlight: boolean = false;
  @Input() status!: string; // available, in_process, adopted, handover_pending, reserved

  @Output() detailsClicked = new EventEmitter<void>();
  @Output() toggleFavoriteEvent = new EventEmitter<string>();
  @Output() reportEvent = new EventEmitter<string>();
  @Output() confirmHandoverEvent = new EventEmitter<string>();
  @Output() shareEvent = new EventEmitter<string>();

  imageLoading: boolean = true;
  daysAgo: number = 0;

  constructor(private authService: AuthService) { }

  async ngOnInit() {
    await this.checkOwner();
    this.calculateDaysAgo();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['creadorId']) {
      await this.checkOwner();
    }
    if (changes['urlImagen'] && !changes['urlImagen'].firstChange) {
      this.imageLoading = true;
    }
    if (changes['createdAt']) {
      this.calculateDaysAgo();
    }
  }

  private calculateDaysAgo() {
    if (this.createdAt) {
      const now = new Date();
      const created = new Date(this.createdAt);
      const diffTime = Math.abs(now.getTime() - created.getTime());
      this.daysAgo = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

  async onShare() {
    try {
      await Share.share({
        title: `${this.nombre} - ${this.tipoMascota}`,
        text: `Mira esta mascota disponible para adopción: ${this.nombre}`,
        url: window.location.href,
        dialogTitle: 'Compartir mascota'
      });
      this.shareEvent.emit(this.adopcionId);
    } catch (error) {
      console.log('Error sharing:', error);
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'available':
        return 'success';
      case 'in_process':
        return 'warning';
      case 'adopted':
        return 'medium';
      case 'handover_pending':
        return 'tertiary';
      case 'reserved':
        return 'primary';
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
      case 'handover_pending':
        return 'Entrega Pendiente';
      case 'reserved':
        return 'Reservado';
      default:
        return 'Desconocido';
    }
  }

  getDaysAgoText(): string {
    if (!this.createdAt) return '';

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    // Manejar tanto Date como Timestamp de Firebase
    let date: Date;
    if (typeof (this.createdAt as any).toDate === 'function') {
      date = (this.createdAt as any).toDate();
    } else {
      date = new Date(this.createdAt);
    }

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
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
