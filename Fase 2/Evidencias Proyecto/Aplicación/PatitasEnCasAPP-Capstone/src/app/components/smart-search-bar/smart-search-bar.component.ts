import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ModalController, PopoverController } from '@ionic/angular';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SmartSearchService, SearchFilters, SearchSuggestion, SavedSearch } from '../../services/smart-search.service';

@Component({
  selector: 'app-smart-search-bar',
  template: `
    <div class="search-container">
      <!-- Barra de búsqueda principal -->
      <div class="search-input-container">
        <ion-searchbar
          [formControl]="searchControl"
          placeholder="Buscar mascotas..."
          [debounce]="300"
          [showCancelButton]="'focus'"
          (ionFocus)="onSearchFocus()"
          (ionCancel)="onSearchCancel()"
          class="search-bar-enhanced">
          
          <ion-buttons slot="end">
            <!-- Botón de filtros -->
            <ion-button 
              fill="clear" 
              (click)="openFiltersModal()"
              [class.filters-active]="hasActiveFilters">
              <ion-icon name="options-outline" slot="icon-only"></ion-icon>
              <ion-badge 
                *ngIf="activeFiltersCount > 0" 
                class="filter-badge">
                {{ activeFiltersCount }}
              </ion-badge>
            </ion-button>
            
            <!-- Botón de búsquedas guardadas -->
            <ion-button 
              fill="clear" 
              (click)="openSavedSearches()">
              <ion-icon name="bookmark-outline" slot="icon-only"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-searchbar>
      </div>

      <!-- Sugerencias de búsqueda -->
      <div 
        *ngIf="showSuggestions && suggestions.length > 0" 
        class="suggestions-container animate-slide-down">
        
        <ion-list class="suggestions-list">
          <ion-list-header>
            <ion-label>{{ getSuggestionsTitle() }}</ion-label>
            <ion-button 
              *ngIf="hasRecentSearches" 
              fill="clear" 
              size="small"
              (click)="clearRecentSearches()">
              <ion-icon name="trash-outline" slot="start"></ion-icon>
              Limpiar
            </ion-button>
          </ion-list-header>
          
          <ion-item 
            *ngFor="let suggestion of suggestions.slice(0, 8)" 
            button 
            (click)="selectSuggestion(suggestion)"
            class="suggestion-item">
            
            <ion-icon 
              [name]="getSuggestionIcon(suggestion.type)" 
              slot="start"
              [color]="getSuggestionColor(suggestion.type)">
            </ion-icon>
            
            <ion-label>
              <h3>{{ suggestion.text }}</h3>
              <p *ngIf="suggestion.count">{{ suggestion.count }} resultados</p>
            </ion-label>
            
            <ion-button 
              fill="clear" 
              slot="end" 
              (click)="insertSuggestion(suggestion, $event)">
              <ion-icon name="arrow-up-outline" slot="icon-only"></ion-icon>
            </ion-button>
          </ion-item>
        </ion-list>
      </div>

      <!-- Filtros rápidos -->
      <div *ngIf="showQuickFilters" class="quick-filters animate-slide-down">
        <div class="filters-header">
          <h4>Filtros rápidos</h4>
        </div>
        <div class="filters-chips">
          <ion-chip 
            *ngFor="let filter of quickFilters" 
            (click)="applyQuickFilter(filter)"
            [class.chip-active]="isQuickFilterActive(filter)"
            class="filter-chip">
            <ion-label>{{ filter.label }}</ion-label>
          </ion-chip>
        </div>
      </div>

      <!-- Ordenamiento -->
      <div *ngIf="showSortOptions" class="sort-container">
        <ion-select 
          [value]="currentSortOption" 
          (ionChange)="onSortChange($event)"
          interface="popover"
          placeholder="Ordenar por">
          <ion-select-option 
            *ngFor="let option of sortOptions" 
            [value]="option">
            {{ option.label }}
          </ion-select-option>
        </ion-select>
      </div>
    </div>
  `,
  styles: [`
    .search-container {
      position: relative;
      z-index: 100;
    }
    
    .search-input-container {
      position: relative;
      margin-bottom: var(--spacing-md);
    }
    
    .search-bar-enhanced {
      --background: var(--ion-color-surface);
      --border-radius: var(--border-radius-xl);
      --box-shadow: var(--shadow-md);
      --color: var(--ion-text-color);
      --placeholder-color: var(--ion-text-color-secondary);
      --icon-color: var(--ion-color-primary);
      margin: 0;
      padding: var(--spacing-sm);
      
      &.searchbar-has-focus {
        --box-shadow: var(--shadow-lg);
        transform: translateY(-2px);
      }
    }
    
    .filters-active {
      --color: var(--ion-color-primary);
    }
    
    .filter-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      --background: var(--ion-color-danger);
      --color: var(--ion-color-danger-contrast);
      font-size: 10px;
      min-width: 16px;
      height: 16px;
    }
    
    .suggestions-container {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--ion-color-surface);
      border-radius: var(--border-radius-lg);
      box-shadow: var(--shadow-xl);
      z-index: 1000;
      max-height: 300px;
      overflow-y: auto;
    }
    
    .suggestions-list {
      margin: 0;
      padding: 0;
    }
    
    .suggestion-item {
      --background: transparent;
      --padding-start: var(--spacing-lg);
      --padding-end: var(--spacing-lg);
      
      &:hover {
        --background: var(--ion-color-light-tint);
      }
    }
    
    .quick-filters {
      margin-bottom: var(--spacing-lg);
    }
    
    .filters-header {
      padding: 0 var(--spacing-lg);
      margin-bottom: var(--spacing-md);
      
      h4 {
        margin: 0;
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--ion-text-color-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }
    
    .filters-chips {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
      padding: 0 var(--spacing-lg);
    }
    
    .filter-chip {
      --background: var(--ion-color-light);
      --color: var(--ion-text-color);
      transition: all 0.2s ease;
      
      &.chip-active {
        --background: var(--ion-color-primary);
        --color: var(--ion-color-primary-contrast);
      }
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: var(--shadow-sm);
      }
    }
    
    .sort-container {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 var(--spacing-lg);
      margin-bottom: var(--spacing-lg);
      
      ion-select {
        --background: var(--ion-color-surface);
        --border-radius: var(--border-radius-md);
        --padding-start: var(--spacing-md);
        --padding-end: var(--spacing-md);
        border: 1px solid var(--ion-color-light-shade);
        max-width: 200px;
      }
    }
  `]
})
export class SmartSearchBarComponent implements OnInit, OnDestroy {
  @Input() placeholder: string = 'Buscar mascotas...';
  @Input() showQuickFilters: boolean = true;
  @Input() showSortOptions: boolean = true;
  @Input() userId?: string;
  
  @Output() searchChange = new EventEmitter<string>();
  @Output() filtersChange = new EventEmitter<SearchFilters>();

  searchControl = new FormControl('');
  showSuggestions = false;
  suggestions: SearchSuggestion[] = [];
  currentFilters: SearchFilters = {};
  quickFilters: { label: string; filters: SearchFilters }[] = [];
  sortOptions: any[] = [];
  currentSortOption: any;
  
  private subscriptions: Subscription[] = [];
  private searchSubject = new Subject<string>();

  constructor(
    private smartSearchService: SmartSearchService,
    private modalController: ModalController,
    private popoverController: PopoverController
  ) {}

  ngOnInit() {
    this.initializeComponent();
    this.setupSearchSubscription();
    this.loadQuickFilters();
    this.loadSortOptions();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.searchSubject.complete();
  }

  private initializeComponent() {
    // Escuchar cambios en los filtros del servicio
    const filtersSubscription = this.smartSearchService.searchFilters$.subscribe(filters => {
      this.currentFilters = filters;
      this.filtersChange.emit(filters);
    });
    
    // Escuchar cambios en el ordenamiento
    const sortSubscription = this.smartSearchService.sortOption$.subscribe(sortOption => {
      this.currentSortOption = sortOption;
    });
    
    this.subscriptions.push(filtersSubscription, sortSubscription);
  }

  private setupSearchSubscription() {
    // Escuchar cambios en el control de búsqueda
    const searchSubscription = this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.onSearchQueryChange(query || '');
    });
    
    this.subscriptions.push(searchSubscription);
  }

  private loadQuickFilters() {
    this.quickFilters = this.smartSearchService.getQuickFilters();
  }

  private loadSortOptions() {
    this.sortOptions = this.smartSearchService.getSortOptions();
    this.currentSortOption = this.sortOptions[0];
  }

  onSearchFocus() {
    this.updateSuggestions(this.searchControl.value || '');
    this.showSuggestions = true;
  }

  onSearchCancel() {
    this.showSuggestions = false;
    this.searchControl.setValue('');
  }

  onSearchQueryChange(query: string) {
    this.smartSearchService.updateFilters({ query });
    this.searchChange.emit(query);
    this.updateSuggestions(query);
  }

  private updateSuggestions(query: string) {
    this.suggestions = this.smartSearchService.getSearchSuggestions(query);
  }

  selectSuggestion(suggestion: SearchSuggestion) {
    this.searchControl.setValue(suggestion.text);
    this.showSuggestions = false;
  }

  insertSuggestion(suggestion: SearchSuggestion, event: Event) {
    event.stopPropagation();
    const currentValue = this.searchControl.value || '';
    const newValue = currentValue ? `${currentValue} ${suggestion.text}` : suggestion.text;
    this.searchControl.setValue(newValue);
  }

  async openFiltersModal() {
    // Aquí iría la implementación del modal de filtros
    console.log('Abrir modal de filtros avanzados');
  }

  async openSavedSearches() {
    if (!this.userId) {
      console.log('Usuario no autenticado');
      return;
    }
    
    // Aquí iría la implementación del modal de búsquedas guardadas
    console.log('Abrir búsquedas guardadas');
  }

  applyQuickFilter(filter: { label: string; filters: SearchFilters }) {
    this.smartSearchService.applyQuickFilter(filter.filters);
  }

  isQuickFilterActive(filter: { label: string; filters: SearchFilters }): boolean {
    // Verificar si el filtro rápido está activo
    const currentFilters = this.currentFilters;
    return Object.keys(filter.filters).every(key => {
      const filterValue = (filter.filters as any)[key];
      const currentValue = (currentFilters as any)[key];
      
      if (Array.isArray(filterValue) && Array.isArray(currentValue)) {
        return filterValue.every(val => currentValue.includes(val));
      }
      
      return currentValue === filterValue;
    });
  }

  onSortChange(event: any) {
    const sortOption = event.detail.value;
    this.smartSearchService.setSortOption(sortOption);
  }

  clearRecentSearches() {
    this.smartSearchService.clearRecentSearches();
    this.updateSuggestions(this.searchControl.value || '');
  }

  get hasActiveFilters(): boolean {
    const filters = this.currentFilters;
    return Object.keys(filters).some(key => {
      if (key === 'query') return false; // No contar query como filtro activo
      const value = (filters as any)[key];
      return value !== undefined && value !== null && 
             (Array.isArray(value) ? value.length > 0 : true);
    });
  }

  get activeFiltersCount(): number {
    const filters = this.currentFilters;
    return Object.keys(filters).filter(key => {
      if (key === 'query') return false;
      const value = (filters as any)[key];
      return value !== undefined && value !== null && 
             (Array.isArray(value) ? value.length > 0 : true);
    }).length;
  }

  get hasRecentSearches(): boolean {
    return this.suggestions.some(s => s.type === 'recent');
  }

  getSuggestionsTitle(): string {
    const hasQuery = this.searchControl.value?.trim();
    if (hasQuery) {
      return 'Sugerencias';
    }
    return this.hasRecentSearches ? 'Búsquedas recientes' : 'Búsquedas populares';
  }

  getSuggestionIcon(type: string): string {
    switch (type) {
      case 'recent': return 'time-outline';
      case 'popular': return 'trending-up-outline';
      default: return 'search-outline';
    }
  }

  getSuggestionColor(type: string): string {
    switch (type) {
      case 'recent': return 'medium';
      case 'popular': return 'success';
      default: return 'primary';
    }
  }
}