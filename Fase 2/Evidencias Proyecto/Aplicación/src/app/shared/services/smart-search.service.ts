import { Injectable } from '@angular/core';
import { AngularFirestore, QueryFn } from '@angular/fire/compat/firestore';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Adopcion } from '@models/Adopcion';

export interface SearchFilters {
  query?: string;
  tipoMascota?: string[];
  tamano?: string[];
  etapaVida?: string[];
  sexo?: string[];
  esterilizado?: boolean;
  vacunado?: boolean;
  microchip?: boolean;
  desparasitado?: boolean;
  location?: {
    lat: number;
    lng: number;
    radius?: number; // en km
  };
  priceRange?: {
    min: number;
    max: number;
  };
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface SearchSuggestion {
  text: string;
  type: 'recent' | 'popular' | 'suggestion';
  count?: number;
}

export interface SavedSearch {
  id?: string;
  name: string;
  filters: SearchFilters;
  userId: string;
  createdAt: Date;
  lastUsed?: Date;
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
  label: string;
}

@Injectable({
  providedIn: 'root'
})
export class SmartSearchService {
  private searchFiltersSubject = new BehaviorSubject<SearchFilters>({});
  private sortOptionSubject = new BehaviorSubject<SortOption>({
    field: 'fechaCreacion',
    direction: 'desc',
    label: 'Más recientes'
  });
  
  public searchFilters$ = this.searchFiltersSubject.asObservable();
  public sortOption$ = this.sortOptionSubject.asObservable();
  
  private recentSearches: string[] = [];
  private searchSuggestions: SearchSuggestion[] = [];

  constructor(private firestore: AngularFirestore) {
    this.loadRecentSearches();
    this.initializeSearchSuggestions();
  }

  // MÉTODOS DE BÚSQUEDA PRINCIPAL
  searchPets(): Observable<Adopcion[]> {
    return combineLatest([
      this.searchFilters$.pipe(debounceTime(300), distinctUntilChanged()),
      this.sortOption$
    ]).pipe(
      switchMap(([filters, sortOption]) => {
        return this.performSearch(filters, sortOption);
      })
    );
  }

  private performSearch(filters: SearchFilters, sortOption: SortOption): Observable<Adopcion[]> {
    // Simplificamos la búsqueda obteniendo todos los registros y aplicando filtros en cliente
    return this.firestore.collection('mascotas').valueChanges({ idField: 'id' }).pipe(
      map(pets => {
        let filteredPets = pets as Adopcion[];
        
        // Aplicar filtros
        filteredPets = this.applyAllFilters(filteredPets, filters);
        
        // Aplicar ordenamiento
        filteredPets = this.applySorting(filteredPets, sortOption);
        
        // Limitar resultados
        return filteredPets.slice(0, 50);
      })
    );
  }

  private applyAllFilters(pets: Adopcion[], filters: SearchFilters): Adopcion[] {
    let filteredPets = pets;

    // Filtros básicos
    if (filters.tipoMascota && filters.tipoMascota.length > 0) {
      filteredPets = filteredPets.filter(pet => filters.tipoMascota!.includes(pet.tipoMascota));
    }

    if (filters.tamano && filters.tamano.length > 0) {
      filteredPets = filteredPets.filter(pet => filters.tamano!.includes(pet.tamano));
    }

    if (filters.etapaVida && filters.etapaVida.length > 0) {
      filteredPets = filteredPets.filter(pet => filters.etapaVida!.includes(pet.etapaVida));
    }

    if (filters.sexo && filters.sexo.length > 0) {
      filteredPets = filteredPets.filter(pet => filters.sexo!.includes(pet.sexo));
    }

    // Filtros booleanos
    if (filters.esterilizado !== undefined) {
      filteredPets = filteredPets.filter(pet => pet.esterilizado === filters.esterilizado);
    }

    if (filters.vacunado !== undefined) {
      filteredPets = filteredPets.filter(pet => pet.vacuna === filters.vacunado);
    }

    if (filters.microchip !== undefined) {
      filteredPets = filteredPets.filter(pet => pet.microchip === filters.microchip);
    }

    if (filters.desparasitado !== undefined) {
      filteredPets = filteredPets.filter(pet => pet.desparasitado === filters.desparasitado);
    }

    return this.applyClientSideFilters(filteredPets, filters);
  }

  private applySorting(pets: Adopcion[], sortOption: SortOption): Adopcion[] {
    return pets.sort((a, b) => {
      let valueA: any = this.getNestedProperty(a, sortOption.field);
      let valueB: any = this.getNestedProperty(b, sortOption.field);
      
      // Manejar valores undefined/null
      if (valueA == null) valueA = '';
      if (valueB == null) valueB = '';
      
      if (sortOption.direction === 'asc') {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    });
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  private applyClientSideFilters(pets: Adopcion[], filters: SearchFilters): Adopcion[] {
    let filteredPets = pets;

    // Búsqueda por texto
    if (filters.query && filters.query.trim()) {
      const searchTerms = filters.query.toLowerCase().trim().split(' ');
      filteredPets = filteredPets.filter(pet => {
        const searchableText = [
          pet.nombre,
          pet.descripcion,
          pet.color,
          pet.condicionesSalud
        ].join(' ').toLowerCase();

        return searchTerms.every(term => 
          searchableText.includes(term)
        );
      });
    }

    // Filtro de ubicación (si está disponible)
    if (filters.location && filters.location.radius) {
      filteredPets = filteredPets.filter(pet => {
        if (pet.location && typeof pet.location === 'object') {
          try {
            const locationObj = typeof pet.location === 'string' ? JSON.parse(pet.location) : pet.location;
            if (locationObj.lat && locationObj.lng) {
              const distance = this.calculateDistance(
                filters.location!.lat,
                filters.location!.lng,
                locationObj.lat,
                locationObj.lng
              );
              return distance <= filters.location!.radius!;
            }
          } catch (error) {
            console.warn('Error parsing location:', error);
          }
        }
        return false;
      });
    }

    return filteredPets;
  }

  // MÉTODOS DE GESTIÓN DE FILTROS
  updateFilters(filters: Partial<SearchFilters>) {
    const currentFilters = this.searchFiltersSubject.value;
    const newFilters = { ...currentFilters, ...filters };
    this.searchFiltersSubject.next(newFilters);

    // Guardar búsqueda reciente si hay query
    if (filters.query && filters.query.trim()) {
      this.addRecentSearch(filters.query.trim());
    }
  }

  clearFilters() {
    this.searchFiltersSubject.next({});
  }

  getCurrentFilters(): SearchFilters {
    return this.searchFiltersSubject.value;
  }

  // MÉTODOS DE ORDENAMIENTO
  setSortOption(sortOption: SortOption) {
    this.sortOptionSubject.next(sortOption);
  }

  getSortOptions(): SortOption[] {
    return [
      { field: 'fechaCreacion', direction: 'desc', label: 'Más recientes' },
      { field: 'fechaCreacion', direction: 'asc', label: 'Más antiguos' },
      { field: 'nombre', direction: 'asc', label: 'Nombre A-Z' },
      { field: 'nombre', direction: 'desc', label: 'Nombre Z-A' },
      { field: 'edadMeses', direction: 'asc', label: 'Más jóvenes' },
      { field: 'edadAnios', direction: 'asc', label: 'Más jóvenes' }
    ];
  }

  // BÚSQUEDAS RECIENTES Y SUGERENCIAS
  getRecentSearches(): string[] {
    return this.recentSearches;
  }

  private addRecentSearch(query: string) {
    const index = this.recentSearches.indexOf(query);
    if (index > -1) {
      this.recentSearches.splice(index, 1);
    }
    this.recentSearches.unshift(query);
    this.recentSearches = this.recentSearches.slice(0, 10); // Mantener solo 10
    this.saveRecentSearches();
  }

  clearRecentSearches() {
    this.recentSearches = [];
    this.saveRecentSearches();
  }

  private loadRecentSearches() {
    const saved = localStorage.getItem('patitas_recent_searches');
    if (saved) {
      this.recentSearches = JSON.parse(saved);
    }
  }

  private saveRecentSearches() {
    localStorage.setItem('patitas_recent_searches', JSON.stringify(this.recentSearches));
  }

  // SUGERENCIAS INTELIGENTES
  getSearchSuggestions(query: string): SearchSuggestion[] {
    if (!query.trim()) {
      return this.recentSearches.map(search => ({
        text: search,
        type: 'recent' as const
      }));
    }

    const lowerQuery = query.toLowerCase();
    return this.searchSuggestions.filter(suggestion =>
      suggestion.text.toLowerCase().includes(lowerQuery)
    );
  }

  private initializeSearchSuggestions() {
    this.searchSuggestions = [
      { text: 'perro pequeño', type: 'popular', count: 245 },
      { text: 'gato cachorro', type: 'popular', count: 189 },
      { text: 'mascota esterilizada', type: 'popular', count: 156 },
      { text: 'perro grande', type: 'popular', count: 134 },
      { text: 'gato adulto', type: 'popular', count: 123 },
      { text: 'mascota vacunada', type: 'popular', count: 98 },
      { text: 'perro mediano', type: 'popular', count: 87 },
      { text: 'mascota con microchip', type: 'popular', count: 76 }
    ];
  }

  // BÚSQUEDAS GUARDADAS
  async saveSearch(name: string, userId: string): Promise<void> {
    const savedSearch: SavedSearch = {
      name,
      filters: this.getCurrentFilters(),
      userId,
      createdAt: new Date()
    };

    await this.firestore.collection('saved_searches').add(savedSearch);
  }

  getSavedSearches(userId: string): Observable<SavedSearch[]> {
    return this.firestore.collection<SavedSearch>('saved_searches', ref =>
      ref.where('userId', '==', userId)
         .orderBy('createdAt', 'desc')
    ).valueChanges({ idField: 'id' });
  }

  async loadSavedSearch(savedSearch: SavedSearch): Promise<void> {
    this.searchFiltersSubject.next(savedSearch.filters);
    
    // Actualizar última vez usada
    if (savedSearch.id) {
      await this.firestore.collection('saved_searches').doc(savedSearch.id).update({
        lastUsed: new Date()
      });
    }
  }

  async deleteSavedSearch(searchId: string): Promise<void> {
    await this.firestore.collection('saved_searches').doc(searchId).delete();
  }

  // UTILIDADES
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // FILTROS PREDEFINIDOS
  getQuickFilters(): { label: string; filters: SearchFilters }[] {
    return [
      {
        label: 'Cachorros',
        filters: { etapaVida: ['cachorro'] }
      },
      {
        label: 'Perros pequeños',
        filters: { tipoMascota: ['perro'], tamano: ['pequeño'] }
      },
      {
        label: 'Gatos adultos',
        filters: { tipoMascota: ['gato'], etapaVida: ['adulto'] }
      },
      {
        label: 'Mascotas esterilizadas',
        filters: { esterilizado: true }
      },
      {
        label: 'Con todas las vacunas',
        filters: { vacunado: true, desparasitado: true }
      },
      {
        label: 'Machos',
        filters: { sexo: ['macho'] }
      },
      {
        label: 'Hembras',
        filters: { sexo: ['hembra'] }
      }
    ];
  }

  applyQuickFilter(filters: SearchFilters) {
    this.updateFilters(filters);
  }
}