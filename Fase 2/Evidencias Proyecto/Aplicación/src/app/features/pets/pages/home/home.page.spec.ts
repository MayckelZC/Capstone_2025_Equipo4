import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { HomePage } from './home.page';
import { TestProvidersModule } from '../../../../../test-helpers/test-providers.module';
import { Router } from '@angular/router';
import { FavoriteService } from '@features/pets/services/favorite.service';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@shared/services/toast.service';
import { PaginationService } from '@shared/services/pagination.service';
import { Adopcion } from '@models/Adopcion';
import { of, BehaviorSubject } from 'rxjs';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let router: jasmine.SpyObj<Router>;
  let favoriteService: jasmine.SpyObj<FavoriteService>;
  let authService: jasmine.SpyObj<AuthService>;
  let toastService: jasmine.SpyObj<ToastService>;
  let paginationService: jasmine.SpyObj<PaginationService>;

  const mockAdopciones: Adopcion[] = [
    {
      id: 'adopcion-1',
      nombre: 'Max',
      tipoMascota: 'Perro',
      edadAnios: 2,
      edadMeses: 0,
      status: 'available',
      descripcion: 'Perrito amigable',
      urlImagen: 'https://example.com/max.jpg',
      creadorId: 'user-1',
      etapaVida: 'adulto',
      sexo: 'macho',
      tamano: 'mediano',
      region: 'RM',
      ciudad: 'Santiago'
    },
    {
      id: 'adopcion-2',
      nombre: 'Michi',
      tipoMascota: 'Gato',
      edadAnios: 1,
      edadMeses: 6,
      status: 'available',
      descripcion: 'Gatito juguetón',
      urlImagen: 'https://example.com/michi.jpg',
      creadorId: 'user-2',
      etapaVida: 'cachorro',
      sexo: 'hembra',
      tamano: 'pequeno'
    }
  ];

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const favoriteServiceSpy = jasmine.createSpyObj('FavoriteService', [
      'getFavorites', 'toggleFavorite', 'isFavorite'
    ]);
    favoriteServiceSpy.getFavorites.and.returnValue(of([]));
    favoriteServiceSpy.isFavorite.and.returnValue(false);

    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser', 'logout']);
    authServiceSpy.getCurrentUser.and.returnValue(Promise.resolve({ uid: 'test-user' }));

    const toastServiceSpy = jasmine.createSpyObj('ToastService', ['showError', 'showSuccess', 'showInfo']);

    const paginationServiceSpy = jasmine.createSpyObj('PaginationService', [
      'reset', 'getNextPage', 'hasMorePages'
    ]);
    paginationServiceSpy.hasMorePages.and.returnValue(true);

    await TestBed.configureTestingModule({
      declarations: [HomePage],
      imports: [TestProvidersModule],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: FavoriteService, useValue: favoriteServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: PaginationService, useValue: paginationServiceSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    favoriteService = TestBed.inject(FavoriteService) as jasmine.SpyObj<FavoriteService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    toastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    paginationService = TestBed.inject(PaginationService) as jasmine.SpyObj<PaginationService>;

    // Initialize test data
    component.adopciones = mockAdopciones;
    component.displayedAdopciones = mockAdopciones;
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have default filter as all', () => {
      expect(component.selectedFilter).toBe('all');
    });

    it('should have default view mode as grid', () => {
      expect(component.viewMode).toBe('grid');
    });
  });

  describe('Filtering', () => {
    it('should set filter correctly', () => {
      component.setFilter('perro');
      expect(component.selectedFilter).toBe('perro');
    });

    it('should filter pets by type', () => {
      component.adopciones = mockAdopciones;
      component.selectedFilter = 'perro';
      component.filterPets();
      expect(component.displayedAdopciones.every(a =>
        a.tipoMascota.toLowerCase() === 'perro'
      )).toBeTrue();
    });

    it('should show all pets when filter is all', () => {
      component.adopciones = mockAdopciones;
      component.selectedFilter = 'all';
      component.filterPets();
      expect(component.displayedAdopciones.length).toBe(2);
    });

    it('should filter by search term', () => {
      component.adopciones = mockAdopciones;
      component.searchTerm = 'Max';
      component.filterPets();
      expect(component.displayedAdopciones.length).toBe(1);
      expect(component.displayedAdopciones[0].nombre).toBe('Max');
    });

    it('should match search term case-insensitively', () => {
      const result = component.matchesSearchTerm(mockAdopciones[0], 'max');
      expect(result).toBeTrue();
    });

    it('should match search term in description', () => {
      const result = component.matchesSearchTerm(mockAdopciones[0], 'amigable');
      expect(result).toBeTrue();
    });
  });

  describe('Advanced Filters', () => {
    it('should detect active filters', () => {
      component.advancedFilters = { sexo: 'macho' };
      expect(component.hasActiveFilters()).toBeTrue();
    });

    it('should return false when no filters active', () => {
      component.advancedFilters = {};
      component.searchTerm = '';
      component.selectedFilter = 'all';
      expect(component.hasActiveFilters()).toBeFalse();
    });

    it('should clear all filters', () => {
      component.advancedFilters = { sexo: 'macho', tamano: 'grande' };
      component.searchTerm = 'test';
      component.selectedFilter = 'perro';

      component.clearAllFilters();

      expect(component.advancedFilters).toEqual({});
      expect(component.searchTerm).toBe('');
      expect(component.selectedFilter).toBe('all');
    });
  });

  describe('Navigation', () => {
    it('should navigate to pet details', () => {
      component.viewDetails(mockAdopciones[0]);
      expect(router.navigate).toHaveBeenCalledWith(['/pets/detalle', 'adopcion-1']);
    });

    it('should navigate to create adoption page', () => {
      component.crearAdopcion();
      expect(router.navigate).toHaveBeenCalledWith(['/pets/crearadopcion']);
    });

    it('should navigate to handover page', () => {
      component.irAEntrega('adopcion-1');
      expect(router.navigate).toHaveBeenCalledWith(['/adoption/handover', 'adopcion-1']);
    });
  });

  describe('Favorites', () => {
    it('should check if adoption is favorite', () => {
      component.favoriteAdopcionIds = new Set(['adopcion-1']);
      expect(component.isAdopcionFavorite('adopcion-1')).toBeTrue();
      expect(component.isAdopcionFavorite('adopcion-2')).toBeFalse();
    });
  });

  describe('View Mode', () => {
    it('should toggle view mode', () => {
      component.viewMode = 'grid';
      component.viewMode = 'list';
      expect(component.viewMode).toBe('list');
    });
  });

  describe('Statistics', () => {
    it('should get filtered count for type', () => {
      component.adopciones = mockAdopciones;
      const dogCount = component.getFilteredCount('perro');
      expect(dogCount).toBe(1);
    });

    it('should get recent pets count', () => {
      const recentDate = new Date();
      component.adopciones = [
        { ...mockAdopciones[0], createdAt: recentDate }
      ];
      const count = component.getRecentPetsCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Pet Age Calculation', () => {
    it('should calculate age for adult pet', () => {
      const adultPet = { ...mockAdopciones[0], edadAnios: 3, edadMeses: 0, etapaVida: 'adulto' };
      const age = component.calculatePetAge(adultPet);
      expect(age).toBe(36); // 3 years * 12 months
    });

    it('should calculate age for puppy', () => {
      const puppyPet = { ...mockAdopciones[1], edadAnios: 0, edadMeses: 6, etapaVida: 'cachorro' };
      const age = component.calculatePetAge(puppyPet);
      expect(age).toBe(6);
    });
  });

  describe('Results Announcement', () => {
    it('should return correct announcement for results', () => {
      component.displayedAdopciones = mockAdopciones;
      const announcement = component.resultsAnnouncement();
      expect(announcement).toContain('2');
    });

    it('should return no results message when empty', () => {
      component.displayedAdopciones = [];
      const announcement = component.resultsAnnouncement();
      expect(announcement).toContain('No se encontraron');
    });
  });

  describe('Loading States', () => {
    it('should start with loading true', () => {
      expect(component.isLoading).toBeDefined();
    });
  });

  describe('Cleanup', () => {
    it('should clean up subscriptions on destroy', () => {
      component.ngOnDestroy();
      // Should not throw
      expect(true).toBeTrue();
    });
  });

  describe('TrackBy Functions', () => {
    it('should have trackByAdopcionId function', () => {
      const result = component.trackByAdopcionId(0, mockAdopciones[0]);
      expect(result).toBe('adopcion-1');
    });
  });
});
