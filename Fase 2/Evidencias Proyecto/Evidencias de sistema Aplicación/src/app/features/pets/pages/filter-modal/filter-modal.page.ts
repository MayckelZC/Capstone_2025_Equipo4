
import { Component, Input, OnInit } from '@angular/core';
import { ModalController, AlertController, ToastController } from '@ionic/angular';
import { Preferences } from '@capacitor/preferences';
import { Geolocation } from '@capacitor/geolocation';

interface SavedFilter {
  id: string;
  name: string;
  filters: any;
  createdAt: Date;
}

@Component({
  selector: 'app-filter-modal',
  templateUrl: './filter-modal.page.html',
  styleUrls: ['./filter-modal.page.scss'],
})
export class FilterModalPage implements OnInit {
  @Input() filters: any = {};
  @Input() totalPets: number = 0;

  // Estado de la UI
  showCustomAge: boolean = false;
  loadingLocation: boolean = false;
  estimatedResults: number = 0;
  
  // Controles de edad
  ageRange = { lower: 0, upper: 15 };
  
  // Filtros guardados
  savedFilters: SavedFilter[] = [];

  constructor(
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    // Inicializar filtros si están vacíos
    if (!this.filters) {
      this.filters = {};
    }
    
    // Cargar filtros guardados
    await this.loadSavedFilters();
    
    // Inicializar valores
    this.initializeFilters();
    
    // Calcular resultados estimados
    this.updateEstimatedResults();
  }

  initializeFilters() {
    // Asegurar que arrays existen
    if (!this.filters.tamano) this.filters.tamano = [];
    if (!this.filters.personalityTraits) this.filters.personalityTraits = [];
  }





  // ==========================================
  // TAMAÑO SELECTOR
  // ==========================================

  isSizeSelected(size: string): boolean {
    return this.filters.tamano?.includes(size) || false;
  }

  toggleSize(size: string) {
    if (!this.filters.tamano) this.filters.tamano = [];
    
    const index = this.filters.tamano.indexOf(size);
    if (index > -1) {
      this.filters.tamano.splice(index, 1);
    } else {
      this.filters.tamano.push(size);
    }
    
    this.updateEstimatedResults();
  }

  // ==========================================
  // EDAD
  // ==========================================

  setAgeStage(stage: string) {
    if (this.filters.etapaVida === stage) {
      delete this.filters.etapaVida;
    } else {
      this.filters.etapaVida = stage;
    }
    
    this.updateEstimatedResults();
  }

  toggleCustomAge() {
    this.showCustomAge = !this.showCustomAge;
    if (!this.showCustomAge) {
      delete this.filters.ageRange;
    }
  }

  onAgeRangeChange(event: any) {
    this.ageRange = event.detail.value;
    this.filters.ageRange = this.ageRange;
    this.updateEstimatedResults();
  }

  // ==========================================
  // GÉNERO
  // ==========================================

  setGender(gender: string) {
    if (this.filters.sexo === gender) {
      delete this.filters.sexo;
    } else {
      this.filters.sexo = gender;
    }
    
    this.updateEstimatedResults();
  }

  // ==========================================
  // CUIDADO MÉDICO
  // ==========================================

  toggleMedical(type: string) {
    if (this.filters[type] === true) {
      // Si ya está activo, lo desactivamos eliminando la propiedad
      delete this.filters[type];
    } else {
      // Si no está activo o es false/undefined, lo activamos
      this.filters[type] = true;
    }
    
    console.log(`🏥 Medical filter ${type} updated:`, this.filters[type]);
    this.updateEstimatedResults();
  }

  // ==========================================
  // PERSONALIDAD
  // ==========================================

  isPersonalitySelected(trait: string): boolean {
    if (!this.filters.personalityTraits) return false;
    return this.filters.personalityTraits.includes(trait);
  }

  togglePersonality(trait: string) {
    if (!this.filters.personalityTraits) {
      this.filters.personalityTraits = [];
    }
    
    const index = this.filters.personalityTraits.indexOf(trait);
    if (index > -1) {
      this.filters.personalityTraits.splice(index, 1);
    } else {
      this.filters.personalityTraits.push(trait);
    }
    
    // Si no hay traits seleccionados, eliminar el array
    if (this.filters.personalityTraits.length === 0) {
      delete this.filters.personalityTraits;
    }
    
    console.log('🐾 Personality traits updated:', this.filters.personalityTraits);
    this.updateEstimatedResults();
  }

  // ==========================================
  // UBICACIÓN
  // ==========================================

  async getCurrentLocation() {
    this.loadingLocation = true;
    
    try {
      const position = await Geolocation.getCurrentPosition();
      this.filters.userLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      
      const toast = await this.toastController.create({
        message: '📍 Ubicación obtenida correctamente',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
      
    } catch (error) {
      const toast = await this.toastController.create({
        message: 'No se pudo obtener la ubicación',
        duration: 2000,
        color: 'warning'
      });
      await toast.present();
    } finally {
      this.loadingLocation = false;
    }
  }

  // ==========================================
  // FILTROS GUARDADOS
  // ==========================================

  async loadSavedFilters() {
    try {
      const { value } = await Preferences.get({ key: 'saved_filters' });
      if (value) {
        this.savedFilters = JSON.parse(value);
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
  }

  async saveCurrentFilters() {
    const alert = await this.alertController.create({
      header: 'Guardar Filtros',
      message: 'Dale un nombre a esta combinación de filtros:',
      inputs: [
        {
          name: 'filterName',
          type: 'text',
          placeholder: 'Ej: Cachorros pequeños',
          attributes: {
            maxlength: 30
          }
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Guardar',
          handler: async (data) => {
            if (data.filterName && data.filterName.trim()) {
              await this.saveFilter(data.filterName.trim());
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private async saveFilter(name: string) {
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name,
      filters: { ...this.filters },
      createdAt: new Date()
    };

    this.savedFilters.push(newFilter);
    
    try {
      await Preferences.set({
        key: 'saved_filters',
        value: JSON.stringify(this.savedFilters)
      });
      
      const toast = await this.toastController.create({
        message: `💾 Filtros guardados como "${name}"`,
        duration: 2000,
        color: 'success'
      });
      await toast.present();
      
    } catch (error) {
      console.error('Error saving filters:', error);
    }
  }

  loadSavedFilter(saved: SavedFilter) {
    this.filters = { ...saved.filters };
    this.initializeFilters();
    this.updateEstimatedResults();
    
    this.toastController.create({
      message: `📋 Filtros "${saved.name}" aplicados`,
      duration: 1500,
      color: 'primary'
    }).then(toast => toast.present());
  }

  async deleteSavedFilter(id: string) {
    this.savedFilters = this.savedFilters.filter(f => f.id !== id);
    
    try {
      await Preferences.set({
        key: 'saved_filters',
        value: JSON.stringify(this.savedFilters)
      });
    } catch (error) {
      console.error('Error deleting saved filter:', error);
    }
  }

  // ==========================================
  // UTILIDADES
  // ==========================================

  hasActiveFilters(): boolean {
    if (!this.filters || Object.keys(this.filters).length === 0) {
      return false;
    }
    
    return Object.entries(this.filters).some(([key, value]) => {
      // Arrays deben tener elementos
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      
      // Objetos deben tener propiedades
      if (typeof value === 'object' && value !== null) {
        return Object.keys(value).length > 0;
      }
      
      // Booleans deben ser true
      if (typeof value === 'boolean') {
        return value === true;
      }
      
      // Strings deben tener contenido
      if (typeof value === 'string') {
        return value.trim() !== '';
      }
      
      // Numbers deben ser válidos
      if (typeof value === 'number') {
        return !isNaN(value);
      }
      
      return value !== undefined && value !== null;
    });
  }

  getFilterProgress(): number {
    const maxFilters = 8; // Número máximo de tipos de filtros
    const activeFilters = Object.keys(this.filters).filter(key => {
      const value = this.filters[key];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
      return value !== undefined && value !== null && value !== '';
    }).length;
    
    return Math.min((activeFilters / maxFilters) * 100, 100);
  }

  updateEstimatedResults() {
    console.log('🔢 Updating estimated results with filters:', this.filters);
    
    // Cálculo real basado en el total de mascotas disponibles
    let results = this.totalPets || 0;
    const originalResults = results;
    
    // Si no hay filtros activos, mostrar el total
    if (!this.hasActiveFilters()) {
      this.estimatedResults = results;
      console.log('📊 No active filters, showing all:', results);
      return;
    }
    
    console.log('📊 Starting with total pets:', results);
    
    // Estimar reducción basada en filtros activos (usando heurística realista)
    if (this.filters.tamano?.length > 0) {
      // Cada tamaño representa aproximadamente 1/3 de las mascotas
      const factor = this.filters.tamano.length / 3;
      results = Math.floor(results * factor);
      console.log(`📏 Size filter applied (${this.filters.tamano.join(', ')}):`, results);
    }
    
    if (this.filters.etapaVida) {
      // Cachorros ~30%, Joven ~25%, Adulto ~35%, Senior ~10%
      const ageDistribution = {
        'cachorro': 0.3,
        'joven': 0.25,
        'adulto': 0.35,
        'senior': 0.1
      };
      const factor = ageDistribution[this.filters.etapaVida as keyof typeof ageDistribution] || 0.25;
      results = Math.floor(results * factor);
      console.log(`🕒 Age stage filter applied (${this.filters.etapaVida}):`, results);
    }
    
    if (this.filters.sexo) {
      // Aproximadamente 50/50 distribución de género
      results = Math.floor(results * 0.5);
      console.log(`♂♀ Gender filter applied (${this.filters.sexo}):`, results);
    }
    
    if (this.filters.personalityTraits?.length > 0) {
      // Cada trait reduce el pool en ~20%
      const reductionFactor = Math.pow(0.8, this.filters.personalityTraits.length);
      results = Math.floor(results * reductionFactor);
      console.log(`😊 Personality filter applied (${this.filters.personalityTraits.join(', ')}):`, results);
    }
    
    // Contar filtros médicos activos
    const medicalFiltersCount = [
      this.filters.esterilizado,
      this.filters.vacuna,
      this.filters.desparasitado
    ].filter(Boolean).length;
    
    if (medicalFiltersCount > 0) {
      // Mascotas con cuidados médicos son ~70% del total
      const factor = 0.7 + (medicalFiltersCount * 0.1); // Más específico = menos resultados
      results = Math.floor(results * Math.min(factor, 0.9));
      console.log(`🏥 Medical filters applied (${medicalFiltersCount} filters):`, results);
    }
    
    if (this.filters.distance) {
      // Filtro de distancia reduce según el rango seleccionado
      const distanceFactors = { '5': 0.2, '10': 0.4, '25': 0.6, '50': 0.8, '100': 0.9 };
      const factor = distanceFactors[this.filters.distance as keyof typeof distanceFactors] || 0.5;
      results = Math.floor(results * factor);
      console.log(`📍 Distance filter applied (${this.filters.distance}km):`, results);
    }
    
    if (this.filters.ageRange) {
      // Rango de edad personalizado puede ser muy específico
      results = Math.floor(results * 0.6);
      console.log(`📅 Custom age range applied (${this.filters.ageRange.lower}-${this.filters.ageRange.upper}):`, results);
    }
    
    // Asegurar que siempre hay al menos 0 resultados
    this.estimatedResults = Math.max(0, results);
    
    console.log(`📈 Final estimated results: ${this.estimatedResults} (reduced from ${originalResults})`);
  }

  // ==========================================
  // ACCIONES
  // ==========================================

  applyFilters() {
    // Limpiar filtros vacíos antes de aplicar
    const cleanFilters = this.cleanEmptyFilters(this.filters);
    
    console.log('✅ Applying clean filters:', cleanFilters);
    console.log('📊 Estimated results:', this.estimatedResults);
    
    this.modalController.dismiss(cleanFilters, 'apply');
  }

  private cleanEmptyFilters(filters: any): any {
    const clean: any = {};
    
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        clean[key] = value;
      } else if (typeof value === 'boolean' && value === true) {
        clean[key] = value;
      } else if (typeof value === 'string' && value.trim() !== '') {
        clean[key] = value;
      } else if (typeof value === 'object' && value !== null && Object.keys(value).length > 0) {
        clean[key] = value;
      } else if (typeof value === 'number' && !isNaN(value)) {
        clean[key] = value;
      }
    });
    
    return clean;
  }

  dismiss() {
    this.modalController.dismiss(null, 'cancel');
  }

  clearFilters() {
    // Limpiar completamente todos los filtros
    this.filters = {};
    this.showCustomAge = false;
    this.ageRange = { lower: 0, upper: 15 };
    
    // Reinicializar arrays vacíos
    this.initializeFilters();
    this.updateEstimatedResults();
    
    console.log('🗑️ All filters cleared');
    
    this.toastController.create({
      message: '🗑️ Todos los filtros eliminados',
      duration: 1500,
      color: 'medium'
    }).then(toast => toast.present());
  }
}

