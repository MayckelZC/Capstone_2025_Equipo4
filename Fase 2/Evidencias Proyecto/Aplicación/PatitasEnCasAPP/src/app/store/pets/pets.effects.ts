import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, mergeMap, catchError, withLatestFrom, tap, switchMap, debounceTime } from 'rxjs/operators';

import * as PetActions from './pets.actions';
import { selectCurrentFilters } from './pets.selectors';

// Simulando servicios - en la implementación real, estos serían inyectados
interface PetService {
  searchPets(query: string, filters?: any): Promise<any>;
  loadPets(filters?: any): Promise<any>;
  loadPetDetails(petId: string): Promise<any>;
  createPet(pet: any): Promise<any>;
  updatePet(petId: string, updates: any): Promise<any>;
  deletePet(petId: string): Promise<any>;
  addToFavorites(petId: string): Promise<any>;
  removeFromFavorites(petId: string): Promise<any>;
  loadUserFavorites(): Promise<string[]>;
  uploadImage(petId: string, file: File): Promise<any>;
  loadStatistics(): Promise<any>;
  loadRecommendedPets(userId: string, limit?: number): Promise<any>;
}

@Injectable()
export class PetEffects {

  constructor(
    private actions$: Actions,
    private store: Store,
    // En implementación real: private petService: PetService
  ) {}

  // Effect para cargar mascotas
  loadPets$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PetActions.loadPets),
      withLatestFrom(this.store.select(selectCurrentFilters)),
      switchMap(([action, currentFilters]) => {
        const filters = action.filters || currentFilters;
        
        // Simulación del servicio - reemplazar por llamada real
        return this.mockPetService.loadPets(filters).then(
          (response) => PetActions.loadPetsSuccess({ 
            pets: response.pets, 
            pagination: response.pagination 
          }),
          (error) => PetActions.loadPetsFailure({ error: error.message })
        );
      }),
      catchError(error => of(PetActions.loadPetsFailure({ error: error.message })))
    )
  );

  // Effect para búsqueda de mascotas (con debounce)
  searchPets$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PetActions.searchPets),
      debounceTime(300), // Evitar múltiples búsquedas mientras el usuario escribe
      switchMap(({ query, filters }) =>
        this.mockPetService.searchPets(query, filters).then(
          (response) => PetActions.searchPetsSuccess({ 
            results: response.results, 
            pets: response.pets 
          }),
          (error) => PetActions.searchPetsFailure({ error: error.message })
        )
      ),
      catchError(error => of(PetActions.searchPetsFailure({ error: error.message })))
    )
  );

  // Effect para cargar detalles de mascota
  loadPetDetails$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PetActions.loadPetDetails),
      mergeMap(({ petId }) =>
        this.mockPetService.loadPetDetails(petId).then(
          (details) => PetActions.loadPetDetailsSuccess({ petId, details }),
          (error) => PetActions.loadPetDetailsFailure({ petId, error: error.message })
        )
      ),
      catchError(error => of(PetActions.loadPetDetailsFailure({ 
        petId: '', 
        error: error.message 
      })))
    )
  );

  // Effect para crear mascota
  createPet$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PetActions.createPet),
      mergeMap(({ pet }) =>
        this.mockPetService.createPet(pet).then(
          (newPet) => PetActions.createPetSuccess({ pet: newPet }),
          (error) => PetActions.createPetFailure({ error: error.message })
        )
      ),
      catchError(error => of(PetActions.createPetFailure({ error: error.message })))
    )
  );

  // Effect para actualizar mascota
  updatePet$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PetActions.updatePet),
      mergeMap(({ petId, updates }) =>
        this.mockPetService.updatePet(petId, updates).then(
          (pet) => PetActions.updatePetSuccess({ pet }),
          (error) => PetActions.updatePetFailure({ error: error.message })
        )
      ),
      catchError(error => of(PetActions.updatePetFailure({ error: error.message })))
    )
  );

  // Effect para eliminar mascota
  deletePet$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PetActions.deletePet),
      mergeMap(({ petId }) =>
        this.mockPetService.deletePet(petId).then(
          () => PetActions.deletePetSuccess({ petId }),
          (error) => PetActions.deletePetFailure({ error: error.message })
        )
      ),
      catchError(error => of(PetActions.deletePetFailure({ error: error.message })))
    )
  );

  // Effect para agregar a favoritos
  addToFavorites$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PetActions.addToFavorites),
      mergeMap(({ petId }) =>
        this.mockPetService.addToFavorites(petId).then(
          () => of({ type: 'NO_ACTION' }), // Acción no-op
          (error) => PetActions.loadUserFavoritesFailure({ error: error.message })
        )
      ),
      catchError(error => of(PetActions.loadUserFavoritesFailure({ error: error.message })))
    ),
    { dispatch: false }
  );

  // Effect para remover de favoritos
  removeFromFavorites$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PetActions.removeFromFavorites),
      mergeMap(({ petId }) =>
        this.mockPetService.removeFromFavorites(petId).then(
          () => of({ type: 'NO_ACTION' }), // Acción no-op
          (error) => PetActions.loadUserFavoritesFailure({ error: error.message })
        )
      ),
      catchError(error => of(PetActions.loadUserFavoritesFailure({ error: error.message })))
    ),
    { dispatch: false }
  );

  // Effect para cargar favoritos del usuario
  loadUserFavorites$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PetActions.loadUserFavorites),
      mergeMap(() =>
        this.mockPetService.loadUserFavorites().then(
          (favoriteIds) => PetActions.loadUserFavoritesSuccess({ favoriteIds }),
          (error) => PetActions.loadUserFavoritesFailure({ error: error.message })
        )
      ),
      catchError(error => of(PetActions.loadUserFavoritesFailure({ error: error.message })))
    )
  );

  // Effect para subir imagen
  uploadPetImage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PetActions.uploadPetImage),
      mergeMap(({ petId, file, isPrimary }) =>
        this.mockPetService.uploadImage(petId, file).then(
          (image) => PetActions.uploadPetImageSuccess({ petId, image }),
          (error) => PetActions.uploadPetImageFailure({ error: error.message })
        )
      ),
      catchError(error => of(PetActions.uploadPetImageFailure({ error: error.message })))
    )
  );

  // Effect para cargar estadísticas
  loadPetStatistics$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PetActions.loadPetStatistics),
      mergeMap(() =>
        this.mockPetService.loadStatistics().then(
          (statistics) => PetActions.loadPetStatisticsSuccess({ statistics }),
          (error) => PetActions.loadPetStatisticsFailure({ error: error.message })
        )
      ),
      catchError(error => of(PetActions.loadPetStatisticsFailure({ error: error.message })))
    )
  );

  // Effect para cargar mascotas recomendadas
  loadRecommendedPets$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PetActions.loadRecommendedPets),
      mergeMap(({ userId, limit }) =>
        this.mockPetService.loadRecommendedPets(userId, limit).then(
          (pets) => PetActions.loadRecommendedPetsSuccess({ pets }),
          (error) => PetActions.loadRecommendedPetsFailure({ error: error.message })
        )
      ),
      catchError(error => of(PetActions.loadRecommendedPetsFailure({ error: error.message })))
    )
  );

  // Effect para registrar vista de mascota (sin dispatching)
  recordPetView$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PetActions.recordPetView),
      tap(({ petId, source }) => {
        // Registrar vista en analytics o backend
        console.log(`Vista registrada para mascota ${petId} desde ${source}`);
        // En implementación real: this.analyticsService.recordView(petId, source);
      })
    ),
    { dispatch: false }
  );

  // Effect para sincronizar datos offline
  syncOfflineData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PetActions.syncOfflineData),
      mergeMap(() => {
        // Implementar lógica de sincronización offline
        console.log('Sincronizando datos offline...');
        
        // En implementación real:
        // 1. Obtener datos pendientes del localStorage/IndexedDB
        // 2. Enviar al servidor
        // 3. Actualizar estado local
        
        return of(PetActions.loadPets({ refresh: true }));
      })
    )
  );

  // Effect para recargar después de cambios en filtros
  reloadOnFiltersChange$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PetActions.setFilters),
      map(() => PetActions.loadPets({ refresh: false }))
    )
  );

  // Servicio mock (reemplazar por servicio real)
  private mockPetService = {
    async loadPets(filters?: any) {
      // Simulación - reemplazar por llamada HTTP real
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        pets: this.generateMockPets(20),
        pagination: {
          data: [],
          totalCount: 100,
          currentPage: 1,
          totalPages: 5,
          hasNextPage: true,
          hasPreviousPage: false
        }
      };
    },

    async searchPets(query: string, filters?: any) {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockPets = this.generateMockPets(10);
      return {
        results: {
          data: mockPets.map(p => p.id),
          totalCount: mockPets.length,
          currentPage: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false
        },
        pets: mockPets
      };
    },

    async loadPetDetails(petId: string) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        pet: this.generateMockPets(1)[0],
        owner: {
          id: 'owner1',
          name: 'Juan Pérez',
          avatar: '/assets/imgs/default-avatar.png',
          rating: 4.8,
          totalAdoptions: 15
        },
        adoptionRequests: [],
        similarPets: this.generateMockPets(5),
        viewHistory: []
      };
    },

    async createPet(pet: any) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return {
        ...pet,
        id: `pet_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        views: 0,
        favorites: 0,
        inquiries: 0
      };
    },

    async updatePet(petId: string, updates: any) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        ...this.generateMockPets(1)[0],
        id: petId,
        ...updates,
        updatedAt: new Date()
      };
    },

    async deletePet(petId: string) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return true;
    },

    async addToFavorites(petId: string) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return true;
    },

    async removeFromFavorites(petId: string) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return true;
    },

    async loadUserFavorites() {
      await new Promise(resolve => setTimeout(resolve, 500));
      return ['pet1', 'pet2', 'pet3'];
    },

    async uploadImage(petId: string, file: File) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        id: `img_${Date.now()}`,
        url: URL.createObjectURL(file),
        thumbnailUrl: URL.createObjectURL(file),
        alt: file.name,
        isPrimary: false,
        order: Date.now()
      };
    },

    async loadStatistics() {
      await new Promise(resolve => setTimeout(resolve, 600));
      
      return {
        totalCount: 150,
        availableCount: 120,
        adoptedCount: 30,
        byType: { dog: 80, cat: 50, bird: 15, other: 5 },
        byLocation: { 'Ciudad de México': 60, 'Guadalajara': 40, 'Monterrey': 35 },
        averageAdoptionTime: 21,
        mostPopularBreeds: [
          { breed: 'Mestizo', count: 45 },
          { breed: 'Labrador', count: 20 },
          { breed: 'Golden Retriever', count: 15 }
        ],
        adoptionTrends: [
          { month: 'Ene', adoptions: 12 },
          { month: 'Feb', adoptions: 15 },
          { month: 'Mar', adoptions: 18 }
        ]
      };
    },

    async loadRecommendedPets(userId: string, limit = 10) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return this.generateMockPets(limit);
    },

    generateMockPets(count: number) {
      const pets = [];
      const types = ['dog', 'cat', 'bird', 'rabbit'];
      const breeds = ['Mestizo', 'Labrador', 'Persa', 'Canario', 'Holland Lop'];
      const sizes = ['small', 'medium', 'large'];
      const cities = ['Ciudad de México', 'Guadalajara', 'Monterrey'];
      
      for (let i = 0; i < count; i++) {
        pets.push({
          id: `pet_${i}_${Date.now()}`,
          name: `Mascota ${i + 1}`,
          type: types[Math.floor(Math.random() * types.length)],
          breed: breeds[Math.floor(Math.random() * breeds.length)],
          age: Math.floor(Math.random() * 10) + 1,
          ageUnit: Math.random() > 0.7 ? 'months' : 'years',
          gender: Math.random() > 0.5 ? 'male' : 'female',
          size: sizes[Math.floor(Math.random() * sizes.length)],
          description: `Una mascota muy cariñosa y juguetona, perfecta para familias.`,
          location: {
            city: cities[Math.floor(Math.random() * cities.length)],
            state: 'México'
          },
          images: [{
            id: `img_${i}`,
            url: '/assets/imgs/default-pet.png',
            alt: 'Mascota',
            isPrimary: true,
            order: 0
          }],
          healthInfo: {
            vaccinated: Math.random() > 0.3,
            sterilized: Math.random() > 0.5,
            dewormed: Math.random() > 0.2,
            healthNotes: 'En perfecto estado de salud'
          },
          temperament: ['Cariñoso', 'Juguetón', 'Tranquilo'],
          status: 'available',
          ownerId: `owner_${Math.floor(Math.random() * 10)}`,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
          views: Math.floor(Math.random() * 100),
          favorites: Math.floor(Math.random() * 20),
          inquiries: Math.floor(Math.random() * 5),
          isUrgent: Math.random() > 0.8
        });
      }
      
      return pets;
    }
  };
}