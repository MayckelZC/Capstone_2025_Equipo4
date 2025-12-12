import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { AnimationController, AlertController, ModalController } from '@ionic/angular';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';
import { ToastService } from '@shared/services/toast.service';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Adopcion } from 'src/app/models/Adopcion';
import { Subscription, interval, firstValueFrom } from 'rxjs';
import { Geolocation } from '@capacitor/geolocation';
import { Preferences } from '@capacitor/preferences';
import { FavoriteService } from '@features/pets/services/favorite.service';
import { FilterModalPage } from '../filter-modal/filter-modal.page';
import { PaginationService } from '@shared/services/pagination.service';
import { ThemeService } from '@core/services/theme.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  animations: [
    trigger('cardAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(50px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class HomePage implements AfterViewInit, OnDestroy {
  readonly dogImages: string[] = [
    'assets/imgs/pixelart-bird.gif',
    'assets/imgs/pixelart-cat.png',
    'assets/imgs/pixelart-dog.png',
  ];

  selectedFilter: string = 'all';
  viewMode: string = 'grid';
  allAdopciones: Adopcion[] = [];
  filteredAdopciones: Adopcion[] = [];
  favoriteAdopciones: Adopcion[] = [];
  favoriteIds: Set<string> = new Set();
  favoriteInFlight: Set<string> = new Set();
  nombreUsuario: string = '';
  searchTerm: string = '';
  advancedFilters: any = {};

  // Estadísticas reales desde base de datos
  homeStats = {
    totalPets: 0,
    totalAdoptions: 0,
    newThisWeek: 0,
    totalShelters: 0
  };

  animatedStats = {
    totalPets: 0,
    totalAdoptions: 0,
    newThisWeek: 0,
    totalShelters: 0
  };

  private adopcionesSubscription!: Subscription;
  private favoritesSubscription!: Subscription;
  private statsAnimationSubscription!: Subscription;
  private isInitialized: boolean = false;
  private readonly defaultPageSize = 20; // Reducido de 60 a 20 para mejor rendimiento
  private readonly maxItemsLimit = 200; // Límite máximo para evitar carga excesiva
  hasMorePets: boolean = true;
  private readonly filterLabels: Record<string, string> = {
    all: 'Todas las mascotas',
    perro: 'Perros disponibles',
    gato: 'Gatos disponibles',
    favoritos: 'Tus favoritos'
  };

  loadingAdopciones: boolean = true;
  adopcionesError: boolean = false;
  loadingMore: boolean = false;
  isDarkMode: boolean = false;

  constructor(
    private animationCtrl: AnimationController,
    private router: Router,
    private alertCtrl: AlertController,
    private toastService: ToastService,
    private authService: AuthService,
    private firestore: AngularFirestore,
    private favoriteService: FavoriteService,
    private modalController: ModalController,
    private paginationService: PaginationService,
    private themeService: ThemeService
  ) {
    // Subscribe to theme changes
    this.themeService.isDarkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
    });
  }

  async ionViewWillEnter() {
    // Recargar datos cada vez que se entra a la página
    if (this.isInitialized) {
      await this.initializePageData();
    }
  }

  async ngAfterViewInit() {
    // Inicializar la primera vez
    await this.initializePageData();
    this.isInitialized = true;
  }

  private async initializePageData() {
    // Wait for authentication state to be ready
    try {
      const currentUser = await this.authService.getCurrentUser();
      this.nombreUsuario = currentUser ? currentUser.nombreUsuario : 'Invitado';
      await this.loadPreferredViewMode();

      // Load data regardless of authentication status for public viewing
      this.loadAdopciones();

      // Only load user-specific data if authenticated
      if (currentUser) {
        this.loadFavoriteAdopciones();
        this.loadUserSpecificStats();
      }

      // Initialize stats (doesn't require auth)
      this.initializeStats();

    } catch (error) {
      console.error('Error initializing page data:', error);
      // Still try to load public data even if there's an error
      this.loadAdopciones();
      this.initializeStats();
    }
  }

  private async loadPreferredViewMode() {
    const storedView = await Preferences.get({ key: 'preferred-view-mode' });
    if (storedView.value === 'grid' || storedView.value === 'list') {
      this.viewMode = storedView.value;
    }
  }

  async loadAdopciones() {
    this.loadingAdopciones = true;
    this.adopcionesError = false;

    const cachedAdopciones = await Preferences.get({ key: 'adopciones' });
    if (cachedAdopciones.value) {
      try {
        this.allAdopciones = JSON.parse(cachedAdopciones.value);
        this.filterPets();
        // Keep the loading indicator while we refresh from Firestore in the background
        this.loadingAdopciones = false;
      } catch (e) {
        console.error('Error parsing cached adoptions:', e);
      }
    }

    // Ensure we don't create duplicate subscriptions if this is called multiple times
    if (this.adopcionesSubscription) {
      this.adopcionesSubscription.unsubscribe();
    }

    // Always subscribe to Firestore so that new adoptions appear immediately,
    // even if we served a cached version above.
    this.adopcionesSubscription = this.firestore
      .collection<Adopcion>('mascotas', ref => ref.limit(this.defaultPageSize))
      .snapshotChanges()
      .subscribe({
        next: async (snapshot) => {
          this.allAdopciones = snapshot.map((docChange) => {
            const data = docChange.payload.doc.data() as Adopcion;
            const id = docChange.payload.doc.id;
            return { id, ...data };
          }).filter(pet => {
            // Filtrar mascotas ocultas y no disponibles
            const notHidden = pet.isHidden !== true;
            const available = !pet.status || pet.status === 'available';
            return notHidden && available;
          });
          await Preferences.set({ key: 'adopciones', value: JSON.stringify(this.allAdopciones) });
          this.updateHomeStats();
          this.filterPets();
          this.loadingAdopciones = false;
          this.adopcionesError = false; // Reset error on success
        },
        error: (error) => {
          console.error('Error cargando adopciones:', error);
          this.adopcionesError = true;
          this.loadingAdopciones = false;
        }
      });
  }

  loadFavoriteAdopciones() {
    this.authService.getCurrentUser().then(currentUser => {
      if (currentUser) {
        this.favoritesSubscription = this.favoriteService.getFavorites(currentUser.uid)
          .subscribe(favorites => {
            const petIds = favorites.map(fav => fav.petId);
            this.favoriteIds = new Set(petIds);
            // Build favoriteAdopciones from the current allAdopciones snapshot
            this.favoriteAdopciones = this.allAdopciones.filter(pet => this.favoriteIds.has(pet.id));
            this.filterPets();
          });
      } else {
        this.favoriteAdopciones = [];
        this.filterPets();
      }
    });
  }

  filterPets() {
    const term = this.searchTerm.toLowerCase();
    let tempAdopciones: Adopcion[] = [];

    // Filtro base por tipo o favoritos
    if (this.selectedFilter === 'favoritos') {
      tempAdopciones = this.favoriteAdopciones.filter((adopcion) =>
        this.matchesSearchTerm(adopcion, term)
      );
    } else if (this.selectedFilter !== 'all') {
      tempAdopciones = this.allAdopciones.filter(
        (adopcion) => adopcion.tipoMascota === this.selectedFilter &&
          this.matchesSearchTerm(adopcion, term)
      );
    } else {
      tempAdopciones = this.allAdopciones.filter((adopcion) =>
        this.matchesSearchTerm(adopcion, term)
      );
    }


    // Aplicar filtros avanzados
    tempAdopciones = this.applyAdvancedFilters(tempAdopciones);

    this.filteredAdopciones = tempAdopciones;
  }

  private matchesSearchTerm(adopcion: Adopcion, term: string): boolean {
    if (!term) return true;

    return (
      adopcion.nombre?.toLowerCase().includes(term) ||
      adopcion.descripcion?.toLowerCase().includes(term) ||
      adopcion.color?.toLowerCase().includes(term) ||
      adopcion.ciudad?.toLowerCase().includes(term) ||
      adopcion.barrio?.toLowerCase().includes(term) ||
      false
    );
  }

  private applyAdvancedFilters(pets: Adopcion[]): Adopcion[] {
    let filtered = [...pets];

    // Filtro por tamaño
    if (this.advancedFilters.tamano && this.advancedFilters.tamano.length > 0) {
      filtered = filtered.filter(adopcion =>
        adopcion.tamano && this.advancedFilters.tamano.includes(adopcion.tamano)
      );
    }

    // Filtro por etapa de vida
    if (this.advancedFilters.etapaVida) {
      filtered = filtered.filter(adopcion =>
        adopcion.etapaVida === this.advancedFilters.etapaVida
      );
    }

    // Filtro por sexo
    if (this.advancedFilters.sexo) {
      filtered = filtered.filter(adopcion =>
        adopcion.sexo === this.advancedFilters.sexo
      );
    }

    // Filtros médicos (solo si están marcados como true)
    if (this.advancedFilters.esterilizado === true) {
      filtered = filtered.filter(adopcion => adopcion.esterilizado === true);
    }

    if (this.advancedFilters.desparasitado === true) {
      filtered = filtered.filter(adopcion => adopcion.desparasitado === true);
    }

    if (this.advancedFilters.vacuna === true) {
      filtered = filtered.filter(adopcion => adopcion.vacuna === true);
    }

    // Filtros de personalidad - mapear correctamente
    if (this.advancedFilters.personalityTraits && this.advancedFilters.personalityTraits.length > 0) {
      filtered = filtered.filter(adopcion => {
        return this.advancedFilters.personalityTraits.some((trait: string) => {
          switch (trait) {
            case 'bueno con niños':
              return adopcion.buenoConNinos === true;
            case 'bueno con otras mascotas':
              return adopcion.buenoConMascotas === true;
            case 'energético':
              return adopcion.energetico === true;
            case 'tranquilo':
              return adopcion.tranquilo === true;
            case 'entrenado en casa':
              return adopcion.entrenadoEnCasa === true;
            case 'guardián':
              return adopcion.guardian === true;
            default:
              return false;
          }
        });
      });
    }

    // Filtro por rango de edad personalizado
    if (this.advancedFilters.ageRange) {
      filtered = filtered.filter(adopcion => {
        const age = this.calculatePetAge(adopcion);
        return age >= this.advancedFilters.ageRange.lower && age <= this.advancedFilters.ageRange.upper;
      });
    }

    return filtered;
  }

  private calculatePetAge(adopcion: Adopcion): number {
    // Convertir edad a años para comparación
    if (adopcion.etapaVida === 'cachorro' && adopcion.edadMeses !== undefined) {
      return adopcion.edadMeses / 12;
    } else if (adopcion.edadAnios !== undefined) {
      return adopcion.edadAnios;
    }

    // Valores predeterminados por etapa de vida si no hay datos específicos
    switch (adopcion.etapaVida) {
      case 'cachorro': return 0.5;
      case 'joven': return 2;
      case 'adulto': return 5;
      case 'senior': return 10;
      default: return 3;
    }
  }

  async openFilterModal() {
    const modal = await this.modalController.create({
      component: FilterModalPage,
      componentProps: {
        filters: { ...this.advancedFilters },
        totalPets: this.allAdopciones.length
      },
      cssClass: 'smart-filter-modal'
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'apply') {
      this.advancedFilters = data;
      this.filterPets();

      // Mostrar toast con resultados
      this.toastService.presentToast(
        `🎯 Filtros aplicados - ${this.filteredAdopciones.length} mascotas encontradas`,
        'success',
        'checkmark-circle'
      );
    } else if (role === 'clear') {
      this.advancedFilters = {};
      this.filterPets();
    }
  }

  createDogAnimation() {
    const dogElement = document.querySelector('.animated-dog') as HTMLImageElement;

    if (dogElement) {
      const randomImage = this.dogImages[Math.floor(Math.random() * this.dogImages.length)];
      dogElement.src = randomImage;

      dogElement.onerror = () => {
        console.error('No se pudo cargar la imagen:', randomImage);
        dogElement.src = 'assets/imgs/default-dog.png';
      };

      const dogAnimation = this.animationCtrl.create()
        .addElement(dogElement)
        .duration(1500)
        .iterations(Infinity)
        .keyframes([
          { offset: 0, transform: 'translateX(0px)' },
          { offset: 0.5, transform: 'translateX(20px)' },
          { offset: 1, transform: 'translateX(0px)' },
        ]);

      dogAnimation.play();
    } else {
      console.error('El elemento .animated-dog no se encontró en el DOM');
    }
  }

  async logout() {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Cierre de Sesión',
      message: '¿Estás seguro de que deseas cerrar sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Aceptar',
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/auth/login']);
          },
        },
      ],
    });

    await alert.present();
  }

  async toggleTheme() {
    await this.themeService.toggle();
  }

  viewDetails(adopcion: Adopcion) {
    this.router.navigate(['/pets/detalle'], {
      queryParams: {
        id: adopcion.id,
      },
    });
  }

  onDetails(adopcion: Adopcion) {
    this.viewDetails(adopcion);
  }

  async toggleFavorite(adopcion: Adopcion) {
    const currentUser = await this.authService.getCurrentUser();
    if (!currentUser) {
      const alert = await this.alertCtrl.create({
        header: 'No Autenticado',
        message: 'Debes iniciar sesión para añadir favoritos.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    if (this.favoriteInFlight.has(adopcion.id)) return; // avoid duplicate

    const isFav = this.isAdopcionFavorite(adopcion.id);
    this.favoriteInFlight.add(adopcion.id);

    if (isFav) {
      // optimistic UI: remove locally
      this.favoriteIds.delete(adopcion.id);
      try {
        await this.favoriteService.removeFavorite(currentUser.uid, adopcion.id);
        // success: favoritesSubscription will sync; ensure local favorites list updated
        this.favoriteAdopciones = this.allAdopciones.filter(pet => this.favoriteIds.has(pet.id));
        this.filterPets();
      } catch (err) {
        // rollback
        console.error('Error removing favorite:', err);
        this.favoriteIds.add(adopcion.id);
        this.toastService.presentToast('No se pudo eliminar de favoritos.', 'danger', 'alert-circle-outline');
      } finally {
        this.favoriteInFlight.delete(adopcion.id);
      }
    } else {
      // optimistic UI: add locally
      this.favoriteIds.add(adopcion.id);
      try {
        await this.favoriteService.addFavorite(currentUser.uid, adopcion.id);
        // success: favoritesSubscription will sync if needed
        this.favoriteAdopciones = this.allAdopciones.filter(pet => this.favoriteIds.has(pet.id));
        this.filterPets();
      } catch (err) {
        // rollback
        console.error('Error adding favorite:', err);
        this.favoriteIds.delete(adopcion.id);
        this.toastService.presentToast('No se pudo añadir a favoritos.', 'danger', 'alert-circle-outline');
      } finally {
        this.favoriteInFlight.delete(adopcion.id);
      }
    }
  }

  isAdopcionFavorite(adopcionId: string): boolean {
    return this.favoriteIds.has(adopcionId);
  }

  async reportAdopcion(adopcion: Adopcion) {
    const currentUser = await this.authService.getCurrentUser();
    if (!currentUser) {
      // Not logged in: optionally navigate to login or show a toast
      this.toastService.presentToast('Debes iniciar sesión para reportar publicaciones.', 'warning', 'warning');
      return;
    }

    if (!adopcion || !adopcion.id) {
      this.toastService.presentToast('No se puede reportar. Detalles de la mascota no disponibles.', 'danger', 'alert-circle-outline');
      return;
    }

    const modal = await this.modalController.create({
      component: (await import('../../../reports/pages/report-modal/report-modal.page')).ReportModalPage,
      componentProps: {
        reportedItemId: adopcion.id,
        reportedItemType: 'pet',
        reportedItem: adopcion
      },
      cssClass: 'report-modal'
    });

    await modal.present();
  }

  ngOnDestroy() {
    if (this.adopcionesSubscription) {
      this.adopcionesSubscription.unsubscribe();
    }
    if (this.favoritesSubscription) {
      this.favoritesSubscription.unsubscribe();
    }
    if (this.statsAnimationSubscription) {
      this.statsAnimationSubscription.unsubscribe();
    }
  }

  crearAdopcion() {
    this.router.navigate(['/pets/crear']);
  }

  irAEntrega(adopcionId: string) {
    this.router.navigate(['/adoptions/entrega-mascota', adopcionId]);
  }

  async findPetsNearMe() {
    try {
      await Geolocation.requestPermissions();
      const coordinates = await Geolocation.getCurrentPosition();
      // Mocking the reverse geocoding response
      const city = 'Santiago';
      this.router.navigate(['/pets/search'], { queryParams: { location: city, lat: coordinates.coords.latitude, lng: coordinates.coords.longitude } });
    } catch (error) {
      this.toastService.presentToast('No pudimos obtener tu ubicación. Revisa los permisos de geolocalización.', 'warning', 'warning');
    }
  }

  async clearCache() {
    await Preferences.remove({ key: 'adopciones' });
    this.loadAdopciones();
  }

  // ==========================================
  // NUEVOS MÉTODOS PARA MEJORAS
  // ==========================================

  initializeStats() {
    // Calcular estadísticas base
    this.updateHomeStats();
    // Animar números
    this.animateStats();
  }

  updateHomeStats() {
    // Mascotas disponibles (no adoptadas ni ocultas)
    this.homeStats.totalPets = this.allAdopciones.length;

    // Mascotas nuevas (última semana)
    this.homeStats.newThisWeek = this.getRecentPetsCount();

    // Cargar estadísticas adicionales desde Firestore
    this.loadAdditionalStats();
  }

  animateStats() {
    const duration = 2000; // 2 segundos
    const frameRate = 60;
    const totalFrames = (duration / 1000) * frameRate;

    this.statsAnimationSubscription = interval(1000 / frameRate).subscribe((frame) => {
      const progress = Math.min(frame / totalFrames, 1);
      const easeProgress = this.easeOutQuart(progress);

      this.animatedStats.totalPets = Math.round(this.homeStats.totalPets * easeProgress);
      this.animatedStats.totalAdoptions = Math.round(this.homeStats.totalAdoptions * easeProgress);
      this.animatedStats.newThisWeek = Math.round(this.homeStats.newThisWeek * easeProgress);
      this.animatedStats.totalShelters = Math.round(this.homeStats.totalShelters * easeProgress);

      if (progress >= 1) {
        this.statsAnimationSubscription?.unsubscribe();
      }
    });
  }

  private easeOutQuart(t: number): number {
    return 1 - Math.pow(1 - t, 4);
  }

  getFilteredCount(type: string): number {
    if (type === 'all') {
      return this.allAdopciones.length;
    }

    if (type === 'favoritos') {
      return this.favoriteAdopciones.length;
    }

    return this.allAdopciones.filter(pet => pet.tipoMascota === type).length;
  }

  getRecentPetsCount(): number {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return this.allAdopciones.filter(pet => {
      if (!pet.createdAt) return false;

      // Manejar tanto Timestamp de Firestore como Date regular
      let creationDate: Date;
      if (pet.createdAt && typeof (pet.createdAt as any).toDate === 'function') {
        creationDate = (pet.createdAt as any).toDate();
      } else {
        creationDate = new Date(pet.createdAt);
      }

      return creationDate > oneWeekAgo;
    }).length;
  }

  async loadAdditionalStats() {
    try {
      // Contar mascotas adoptadas (con status 'adopted')
      const adoptedPetsSnapshot = await firstValueFrom(
        this.firestore.collection<Adopcion>('mascotas', ref => ref.where('status', '==', 'adopted')).get()
      );

      this.homeStats.totalAdoptions = adoptedPetsSnapshot?.docs.length || 0;
    } catch (error) {
      console.error('Error loading adoption stats:', error);
      this.homeStats.totalAdoptions = 0;
    }

    try {
      // Contar refugios/organizaciones únicas (creadores con rol organization)
      const usersSnapshot = await firstValueFrom(
        this.firestore.collection('users', ref => ref.where('role', '==', 'organization')).get()
      );

      this.homeStats.totalShelters = usersSnapshot?.docs.length || 0;
    } catch (error) {
      console.error('Error loading shelter stats:', error);
      this.homeStats.totalShelters = 0;
    }

    // Re-animar las estadísticas con los nuevos datos
    this.animateStats();
  }

  setFilter(filterValue: string) {
    this.selectedFilter = filterValue;
    this.filterPets();
  }

  hasActiveFilters(): boolean {
    return this.selectedFilter !== 'all' ||
      this.searchTerm.length > 0 ||
      Object.keys(this.advancedFilters).length > 0;
  }

  clearAllFilters() {
    this.selectedFilter = 'all';
    this.searchTerm = '';
    this.advancedFilters = {};
    this.filterPets();
  }

  getResultsTitle(): string {
    switch (this.selectedFilter) {
      case 'perro': return 'Perros Disponibles';
      case 'gato': return 'Gatos Disponibles';
      case 'favoritos': return 'Tus Favoritos';
      default: return 'Todas las Mascotas';
    }
  }

  onViewModeChange() {
    // Aquí se puede agregar lógica adicional para el cambio de vista
    const viewConfig = { key: 'preferred-view-mode', value: this.viewMode };
    Preferences.set(viewConfig);
  }

  trackByAdopcionId(index: number, adopcion: Adopcion): string {
    return adopcion.id;
  }

  viewRecentAdoptions() {
    this.selectedFilter = 'all';
    // Filtrar por mascotas nuevas de la última semana
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    this.filteredAdopciones = this.allAdopciones.filter(pet => {
      if (!pet.createdAt) return false;

      let creationDate: Date;
      if (pet.createdAt && typeof (pet.createdAt as any).toDate === 'function') {
        creationDate = (pet.createdAt as any).toDate();
      } else {
        creationDate = new Date(pet.createdAt);
      }

      return creationDate > oneWeekAgo;
    });
  }

  async loadUserSpecificStats() {
    try {
      const currentUser = await this.authService.getCurrentUser();
      if (currentUser?.isVeterinarian) {
        // Cargar estadísticas específicas para veterinarios
        await this.loadVeterinaryStats();
      }
    } catch (error) {
      console.error('Error loading user specific stats:', error);
    }
  }

  async loadVeterinaryStats() {
    try {
      // Contar citas veterinarias totales
      const appointmentsSnapshot = await firstValueFrom(
        this.firestore.collection('veterinaryAppointments').get()
      );
      const totalAppointments = appointmentsSnapshot?.docs.length || 0;

      // Actualizar las estadísticas del hero si es veterinario
      if (totalAppointments > 0) {
        this.homeStats.totalAdoptions = totalAppointments; // Reutilizar para mostrar citas
      }

    } catch (error) {
      console.error('Error loading veterinary stats:', error);
    }
  }

  getAdoptionsLabel(): string {
    // Determinar la etiqueta basada en el contexto del usuario
    return 'Adoptadas';
  }

  getFilterLabel(filterValue: string): string {
    return this.filterLabels[filterValue] || 'Mascotas disponibles';
  }

  getFilterDescription(filterValue: string): string {
    const count = this.getFilteredCount(filterValue);
    const label = this.getFilterLabel(filterValue);
    const suffix = count === 1 ? 'mascota disponible' : 'mascotas disponibles';
    return `${label}. ${count} ${suffix}.`;
  }

  get heroStatsAnnouncement(): string {
    const { totalPets, totalAdoptions, totalShelters } = this.animatedStats;
    const petsLabel = totalPets === 1 ? 'mascota disponible' : 'mascotas disponibles';
    const adoptionLabel = this.getAdoptionsLabel().toLowerCase();
    const sheltersLabel = totalShelters === 1 ? 'refugio aliado' : 'refugios aliados';
    return `${totalPets} ${petsLabel}, ${totalAdoptions} ${adoptionLabel.toLowerCase()} y ${totalShelters} ${sheltersLabel}`;
  }

  get resultsAnnouncement(): string {
    const count = this.filteredAdopciones.length;
    const resultLabel = count === 1 ? 'resultado' : 'resultados';
    return `${count} ${resultLabel} para ${this.getFilterLabel(this.selectedFilter).toLowerCase()}`;
  }

  /**
   * Carga más mascotas usando infinite scroll
   * @param event Evento de ion-infinite-scroll
   */
  async loadMorePets(event?: any) {
    // Detener si ya alcanzamos el límite máximo
    if (this.allAdopciones.length >= this.maxItemsLimit) {
      this.hasMorePets = false;
      event?.target?.complete();
      return;
    }

    if (this.loadingMore || !this.hasMorePets) {
      event?.target?.complete();
      return;
    }

    this.loadingMore = true;

    try {
      const result = await firstValueFrom(
        this.paginationService.getPaginatedCollection<Adopcion>(
          'mascotas',
          this.defaultPageSize,
          ref => ref.where('isHidden', '!=', true).orderBy('isHidden').orderBy('createdAt', 'desc'),
          'home-pets'
        )
      );

      // Agregar nuevas mascotas evitando duplicados
      const newPets = result.items.filter(newPet =>
        !this.allAdopciones.some(existingPet => existingPet.id === newPet.id)
      );

      this.allAdopciones = [...this.allAdopciones, ...newPets];
      this.hasMorePets = result.hasMore;
      this.filterPets();

      // Actualizar caché
      await Preferences.set({
        key: 'adopciones',
        value: JSON.stringify(this.allAdopciones)
      });

    } catch (error) {
      console.error('Error loading more pets:', error);
      this.toastService.presentToast(
        'Error al cargar más mascotas',
        'danger',
        'alert-circle-outline'
      );
    } finally {
      this.loadingMore = false;
      event?.target?.complete();
    }
  }

  /**
   * Resetea la paginación y recarga desde el inicio
   */
  resetPagination() {
    this.paginationService.resetPagination('home-pets');
    this.hasMorePets = true;
    this.allAdopciones = [];
    this.loadAdopciones();
  }
}
