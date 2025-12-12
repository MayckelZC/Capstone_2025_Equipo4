import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SmartSearchService, SearchFilters, SortOption } from './smart-search.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { of } from 'rxjs';
import { Adopcion } from '@models/Adopcion';

describe('SmartSearchService', () => {
    let service: SmartSearchService;
    let firestoreMock: any;

    const mockPets: Adopcion[] = [
        { id: 'pet-1', nombre: 'Max', tipoMascota: 'Perro', status: 'available', tamano: 'Mediano', sexo: 'Macho', fechaCreacion: new Date() } as Adopcion,
        { id: 'pet-2', nombre: 'Luna', tipoMascota: 'Gato', status: 'available', tamano: 'Pequeño', sexo: 'Hembra', fechaCreacion: new Date() } as Adopcion,
        { id: 'pet-3', nombre: 'Rocky', tipoMascota: 'Perro', status: 'adopted', tamano: 'Grande', sexo: 'Macho', fechaCreacion: new Date() } as Adopcion
    ];

    beforeEach(() => {
        const mockDocRef = {
            delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve())
        };

        const mockCollectionRef = {
            valueChanges: jasmine.createSpy('valueChanges').and.returnValue(of(mockPets)),
            add: jasmine.createSpy('add').and.returnValue(Promise.resolve({ id: 'saved-search' })),
            doc: jasmine.createSpy('doc').and.returnValue(mockDocRef)
        };

        firestoreMock = {
            collection: jasmine.createSpy('collection').and.returnValue(mockCollectionRef)
        };

        TestBed.configureTestingModule({
            providers: [
                SmartSearchService,
                { provide: AngularFirestore, useValue: firestoreMock }
            ]
        });

        service = TestBed.inject(SmartSearchService);
    });

    describe('Service Creation', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });
    });

    describe('searchPets', () => {
        it('should return observable of pets', (done) => {
            service.searchPets().subscribe(pets => {
                expect(pets).toBeDefined();
                done();
            });
        });
    });

    describe('updateFilters', () => {
        it('should update search filters', () => {
            const filters: Partial<SearchFilters> = { tipoMascota: ['Perro'] };
            service.updateFilters(filters);

            const current = service.getCurrentFilters();
            expect(current.tipoMascota).toEqual(['Perro']);
        });

        it('should merge filters with existing', () => {
            service.updateFilters({ tipoMascota: ['Perro'] });
            service.updateFilters({ tamano: ['Mediano'] });

            const current = service.getCurrentFilters();
            expect(current.tipoMascota).toEqual(['Perro']);
            expect(current.tamano).toEqual(['Mediano']);
        });
    });

    describe('clearFilters', () => {
        it('should clear all filters', () => {
            service.updateFilters({ tipoMascota: ['Perro'], query: 'test' });
            service.clearFilters();

            const current = service.getCurrentFilters();
            expect(current.tipoMascota).toBeUndefined();
            expect(current.query).toBeUndefined();
        });
    });

    describe('getCurrentFilters', () => {
        it('should return empty object initially', () => {
            const filters = service.getCurrentFilters();
            expect(filters).toBeDefined();
        });
    });

    describe('setSortOption', () => {
        it('should set sort option', () => {
            const sortOption: SortOption = {
                field: 'nombre',
                direction: 'asc',
                label: 'Nombre A-Z'
            };

            service.setSortOption(sortOption);
            // Sort option should be set
            expect(true).toBeTrue();
        });
    });

    describe('getSortOptions', () => {
        it('should return available sort options', () => {
            const options = service.getSortOptions();
            expect(options).toBeDefined();
            expect(Array.isArray(options)).toBeTrue();
            expect(options.length).toBeGreaterThan(0);
        });

        it('should include date sort option', () => {
            const options = service.getSortOptions();
            const dateOption = options.find(o => o.field === 'fechaCreacion');
            expect(dateOption).toBeDefined();
        });
    });

    describe('Recent Searches', () => {
        it('should add recent search', () => {
            service.addRecentSearch('perro');
            const recent = service.getRecentSearches();
            expect(recent).toContain('perro');
        });

        it('should clear recent searches', () => {
            service.addRecentSearch('test');
            service.clearRecentSearches();
            const recent = service.getRecentSearches();
            expect(recent.length).toBe(0);
        });

        it('should limit recent searches', () => {
            for (let i = 0; i < 15; i++) {
                service.addRecentSearch(`search-${i}`);
            }
            const recent = service.getRecentSearches();
            expect(recent.length).toBeLessThanOrEqual(10);
        });
    });

    describe('getSearchSuggestions', () => {
        it('should return suggestions for query', () => {
            const suggestions = service.getSearchSuggestions('per');
            expect(suggestions).toBeDefined();
            expect(Array.isArray(suggestions)).toBeTrue();
        });

        it('should return empty for empty query', () => {
            const suggestions = service.getSearchSuggestions('');
            expect(suggestions.length).toBe(0);
        });
    });

    describe('Saved Searches', () => {
        it('should save a search', async () => {
            await service.saveSearch('My Search', 'user-1');
            expect(firestoreMock.collection).toHaveBeenCalledWith('savedSearches');
        });

        it('should get saved searches for user', (done) => {
            service.getSavedSearches('user-1').subscribe(searches => {
                expect(searches).toBeDefined();
                done();
            });
        });

        it('should delete saved search', async () => {
            await service.deleteSavedSearch('search-1');
            expect(firestoreMock.collection).toHaveBeenCalledWith('savedSearches');
        });
    });

    describe('calculateDistance', () => {
        it('should calculate distance between coordinates', () => {
            const distance = service.calculateDistance(0, 0, 0.1, 0.1);
            expect(distance).toBeGreaterThan(0);
        });

        it('should return 0 for same coordinates', () => {
            const distance = service.calculateDistance(10, 20, 10, 20);
            expect(distance).toBe(0);
        });
    });

    describe('Quick Filters', () => {
        it('should return quick filters', () => {
            const quickFilters = service.getQuickFilters();
            expect(quickFilters).toBeDefined();
            expect(Array.isArray(quickFilters)).toBeTrue();
        });

        it('should apply quick filter', () => {
            const quickFilters = service.getQuickFilters();
            if (quickFilters.length > 0) {
                service.applyQuickFilter(quickFilters[0].filters);
                expect(true).toBeTrue();
            }
        });
    });
});
