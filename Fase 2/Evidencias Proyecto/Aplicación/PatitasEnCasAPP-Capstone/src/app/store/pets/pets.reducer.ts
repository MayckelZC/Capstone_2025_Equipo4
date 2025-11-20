import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { Pet, PetState, initialPetState } from './pets.state';
import { LoadingState } from '../app.state';
import * as PetActions from './pets.actions';

// Entity adapter para manejo eficiente de mascotas
export const petAdapter: EntityAdapter<Pet> = createEntityAdapter<Pet>({
  selectId: (pet: Pet) => pet.id,
  sortComparer: (a: Pet, b: Pet) => {
    // Ordenar por fecha de creación (más recientes primero)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }
});

// Reducer de mascotas
export const petReducer = createReducer(
  initialPetState,

  // Acciones de carga
  on(PetActions.loadPets, (state) => ({
    ...state,
    loading: LoadingState.LOADING,
    error: null
  })),

  on(PetActions.loadPetsSuccess, (state, { pets, pagination }) => {
    const searchResults = pagination ? {
      ...pagination,
      data: pets.map(pet => pet.id) // Convertir a IDs
    } : state.searchResults;
    
    return petAdapter.setAll(pets, {
      ...state,
      loading: LoadingState.LOADED,
      error: null,
      searchResults
    });
  }),

  on(PetActions.loadPetsFailure, (state, { error }) => ({
    ...state,
    loading: LoadingState.ERROR,
    error
  })),

  // Acciones de búsqueda
  on(PetActions.searchPets, (state, { query }) => ({
    ...state,
    loading: LoadingState.LOADING,
    error: null,
    recentSearches: state.recentSearches.includes(query) 
      ? state.recentSearches 
      : [query, ...state.recentSearches.slice(0, 9)]
  })),

  on(PetActions.searchPetsSuccess, (state, { results, pets }) => {
    return petAdapter.upsertMany(pets, {
      ...state,
      loading: LoadingState.LOADED,
      error: null,
      searchResults: results
    });
  }),

  on(PetActions.searchPetsFailure, (state, { error }) => ({
    ...state,
    loading: LoadingState.ERROR,
    error
  })),

  on(PetActions.clearSearch, (state) => ({
    ...state,
    searchResults: null,
    currentFilters: {}
  })),

  // Acciones de filtros
  on(PetActions.setFilters, (state, { filters }) => ({
    ...state,
    currentFilters: filters
  })),

  on(PetActions.clearFilters, (state) => ({
    ...state,
    currentFilters: {}
  })),

  // Acciones de selección
  on(PetActions.selectPet, (state, { petId }) => ({
    ...state,
    selectedPetId: petId
  })),

  on(PetActions.clearSelectedPet, (state) => ({
    ...state,
    selectedPetId: null
  })),

  // Acciones de detalles
  on(PetActions.loadPetDetails, (state, { petId }) => ({
    ...state,
    loading: LoadingState.LOADING,
    error: null
  })),

  on(PetActions.loadPetDetailsSuccess, (state, { petId, details }) => ({
    ...state,
    loading: LoadingState.LOADED,
    error: null,
    petDetails: {
      ...state.petDetails,
      [petId]: details
    }
  })),

  on(PetActions.loadPetDetailsFailure, (state, { error }) => ({
    ...state,
    loading: LoadingState.ERROR,
    error
  })),

  // Acciones de creación
  on(PetActions.createPet, (state) => ({
    ...state,
    loading: LoadingState.LOADING,
    error: null
  })),

  on(PetActions.createPetSuccess, (state, { pet }) => {
    return petAdapter.addOne(pet, {
      ...state,
      loading: LoadingState.LOADED,
      error: null,
      statistics: {
        ...state.statistics,
        totalCount: state.statistics.totalCount + 1,
        availableCount: pet.status === 'available' 
          ? state.statistics.availableCount + 1 
          : state.statistics.availableCount
      }
    });
  }),

  on(PetActions.createPetFailure, (state, { error }) => ({
    ...state,
    loading: LoadingState.ERROR,
    error
  })),

  // Acciones de actualización
  on(PetActions.updatePet, (state) => ({
    ...state,
    loading: LoadingState.LOADING,
    error: null
  })),

  on(PetActions.updatePetSuccess, (state, { pet }) => {
    return petAdapter.updateOne(
      { id: pet.id, changes: pet },
      {
        ...state,
        loading: LoadingState.LOADED,
        error: null
      }
    );
  }),

  on(PetActions.updatePetFailure, (state, { error }) => ({
    ...state,
    loading: LoadingState.ERROR,
    error
  })),

  // Acciones de eliminación
  on(PetActions.deletePet, (state) => ({
    ...state,
    loading: LoadingState.LOADING,
    error: null
  })),

  on(PetActions.deletePetSuccess, (state, { petId }) => {
    return petAdapter.removeOne(petId, {
      ...state,
      loading: LoadingState.LOADED,
      error: null,
      selectedPetId: state.selectedPetId === petId ? null : state.selectedPetId,
      statistics: {
        ...state.statistics,
        totalCount: Math.max(0, state.statistics.totalCount - 1)
      }
    });
  }),

  on(PetActions.deletePetFailure, (state, { error }) => ({
    ...state,
    loading: LoadingState.ERROR,
    error
  })),

  // Acciones de favoritos
  on(PetActions.addToFavorites, (state, { petId }) => ({
    ...state,
    userFavorites: state.userFavorites.includes(petId)
      ? state.userFavorites
      : [...state.userFavorites, petId]
  })),

  on(PetActions.removeFromFavorites, (state, { petId }) => ({
    ...state,
    userFavorites: state.userFavorites.filter(id => id !== petId)
  })),

  on(PetActions.loadUserFavoritesSuccess, (state, { favoriteIds }) => ({
    ...state,
    userFavorites: favoriteIds
  })),

  on(PetActions.loadUserFavoritesFailure, (state, { error }) => ({
    ...state,
    error
  })),

  // Acciones de imágenes
  on(PetActions.uploadPetImageSuccess, (state, { petId, image }) => {
    const pet = state.entities[petId];
    if (pet) {
      return petAdapter.updateOne(
        {
          id: petId,
          changes: {
            images: [...pet.images, image],
            updatedAt: new Date()
          }
        },
        state
      );
    }
    return state;
  }),

  on(PetActions.deletePetImage, (state, { petId, imageId }) => {
    const pet = state.entities[petId];
    if (pet) {
      return petAdapter.updateOne(
        {
          id: petId,
          changes: {
            images: pet.images.filter(img => img.id !== imageId),
            updatedAt: new Date()
          }
        },
        state
      );
    }
    return state;
  }),

  on(PetActions.setPrimaryImage, (state, { petId, imageId }) => {
    const pet = state.entities[petId];
    if (pet) {
      return petAdapter.updateOne(
        {
          id: petId,
          changes: {
            images: pet.images.map(img => ({
              ...img,
              isPrimary: img.id === imageId
            })),
            updatedAt: new Date()
          }
        },
        state
      );
    }
    return state;
  }),

  // Acciones de estadísticas
  on(PetActions.loadPetStatisticsSuccess, (state, { statistics }) => ({
    ...state,
    statistics
  })),

  on(PetActions.loadPetStatisticsFailure, (state, { error }) => ({
    ...state,
    error
  })),

  // Acciones de interacción
  on(PetActions.recordPetView, (state, { petId }) => {
    const pet = state.entities[petId];
    if (pet) {
      return petAdapter.updateOne(
        {
          id: petId,
          changes: {
            views: pet.views + 1
          }
        },
        state
      );
    }
    return state;
  }),

  on(PetActions.recordPetInquiry, (state, { petId }) => {
    const pet = state.entities[petId];
    if (pet) {
      return petAdapter.updateOne(
        {
          id: petId,
          changes: {
            inquiries: pet.inquiries + 1
          }
        },
        state
      );
    }
    return state;
  }),

  // Acciones de recomendaciones
  on(PetActions.loadRecommendedPetsSuccess, (state, { pets }) => {
    return petAdapter.upsertMany(pets, state);
  }),

  on(PetActions.loadRecommendedPetsFailure, (state, { error }) => ({
    ...state,
    error
  })),

  // Acciones de estado de conexión
  on(PetActions.setOnlineStatus, (state, { isOnline }) => ({
    ...state,
    // Aquí se podría manejar el estado offline si fuera necesario
  })),

  // Acciones de paginación
  on(PetActions.setPage, (state, { page }) => ({
    ...state,
    searchResults: state.searchResults ? {
      ...state.searchResults,
      currentPage: page
    } : null
  })),

  // Limpiar cache
  on(PetActions.clearCache, (state) => 
    petAdapter.removeAll({
      ...state,
      petDetails: {},
      searchResults: null,
      statistics: {
        totalCount: 0,
        availableCount: 0,
        adoptedCount: 0,
        byType: {},
        byLocation: {},
        averageAdoptionTime: 0,
        mostPopularBreeds: [],
        adoptionTrends: []
      }
    })
  )
);

// Selectores del entity adapter
export const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal,
} = petAdapter.getSelectors();