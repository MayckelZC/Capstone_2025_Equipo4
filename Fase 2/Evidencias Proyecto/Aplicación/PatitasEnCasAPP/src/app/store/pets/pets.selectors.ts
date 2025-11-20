import { createSelector, createFeatureSelector } from '@ngrx/store';
import { PetState, Pet, PetFilters } from './pets.state';
import { selectIds, selectEntities, selectAll, selectTotal } from './pets.reducer';

// Feature selector
export const selectPetState = createFeatureSelector<PetState>('pets');

// Selectores básicos del Entity Adapter
export const selectAllPets = createSelector(selectPetState, selectAll);
export const selectPetEntities = createSelector(selectPetState, selectEntities);
export const selectPetIds = createSelector(selectPetState, selectIds);
export const selectTotalPets = createSelector(selectPetState, selectTotal);

// Selectores de estado de carga
export const selectPetLoading = createSelector(
  selectPetState,
  (state) => state.loading
);

export const selectPetError = createSelector(
  selectPetState,
  (state) => state.error
);

export const selectIsLoading = createSelector(
  selectPetLoading,
  (loading) => loading === 'LOADING'
);

// Selectores de mascota seleccionada
export const selectSelectedPetId = createSelector(
  selectPetState,
  (state) => state.selectedPetId
);

export const selectSelectedPet = createSelector(
  selectPetEntities,
  selectSelectedPetId,
  (entities, selectedId) => selectedId ? entities[selectedId] : null
);

// Selectores de búsqueda y filtros
export const selectCurrentFilters = createSelector(
  selectPetState,
  (state) => state.currentFilters
);

export const selectSearchResults = createSelector(
  selectPetState,
  (state) => state.searchResults
);

export const selectSearchResultPets = createSelector(
  selectSearchResults,
  selectPetEntities,
  (results, entities) => {
    if (!results) return [];
    return results.data.map(id => entities[id]).filter(Boolean) as Pet[];
  }
);

export const selectRecentSearches = createSelector(
  selectPetState,
  (state) => state.recentSearches
);

export const selectPopularSearches = createSelector(
  selectPetState,
  (state) => state.popularSearches
);

// Selectores de favoritos
export const selectUserFavorites = createSelector(
  selectPetState,
  (state) => state.userFavorites
);

export const selectFavoritePets = createSelector(
  selectUserFavorites,
  selectPetEntities,
  (favoriteIds, entities) => 
    favoriteIds.map(id => entities[id]).filter(Boolean) as Pet[]
);

export const createSelectIsPetFavorite = (petId: string) => createSelector(
  selectUserFavorites,
  (favorites) => favorites.includes(petId)
);

// Selectores de detalles
export const selectPetDetails = createSelector(
  selectPetState,
  (state) => state.petDetails
);

export const createSelectPetDetailsById = (petId: string) => createSelector(
  selectPetDetails,
  (details) => details[petId]
);

// Selectores de estadísticas
export const selectPetStatistics = createSelector(
  selectPetState,
  (state) => state.statistics
);

export const selectTotalAvailablePets = createSelector(
  selectPetStatistics,
  (stats) => stats.availableCount
);

export const selectTotalAdoptedPets = createSelector(
  selectPetStatistics,
  (stats) => stats.adoptedCount
);

export const selectPetsStatsByType = createSelector(
  selectPetStatistics,
  (stats) => stats.byType
);

export const selectPetsStatsByLocation = createSelector(
  selectPetStatistics,
  (stats) => stats.byLocation
);

export const selectMostPopularBreeds = createSelector(
  selectPetStatistics,
  (stats) => stats.mostPopularBreeds
);

// Selectores filtrados
export const selectAvailablePets = createSelector(
  selectAllPets,
  (pets) => pets.filter(pet => pet.status === 'available')
);

export const selectPetsByType = (petType: Pet['type']) => createSelector(
  selectAllPets,
  (pets) => pets.filter(pet => pet.type === petType)
);

export const selectPetsByLocation = (city: string, state: string) => createSelector(
  selectAllPets,
  (pets) => pets.filter(pet => 
    pet.location.city === city && pet.location.state === state
  )
);

export const selectUrgentPets = createSelector(
  selectAvailablePets,
  (pets) => pets.filter(pet => pet.isUrgent)
);

export const selectRecentPets = createSelector(
  selectAvailablePets,
  (pets) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return pets.filter(pet => new Date(pet.createdAt) >= oneWeekAgo);
  }
);

export const selectPetsByOwner = (ownerId: string) => createSelector(
  selectAllPets,
  (pets) => pets.filter(pet => pet.ownerId === ownerId)
);

// Selectores con filtros aplicados
export const selectFilteredPets = createSelector(
  selectAllPets,
  selectCurrentFilters,
  (pets, filters) => {
    if (!filters || Object.keys(filters).length === 0) {
      return pets.filter(pet => pet.status === 'available');
    }

    return pets.filter(pet => {
      // Filtro por estado (siempre disponible a menos que se especifique otro)
      if (!filters.search && pet.status !== 'available') return false;

      // Filtro por tipo
      if (filters.type && filters.type.length > 0 && !filters.type.includes(pet.type)) {
        return false;
      }

      // Filtro por género
      if (filters.gender && filters.gender.length > 0 && !filters.gender.includes(pet.gender)) {
        return false;
      }

      // Filtro por tamaño
      if (filters.size && filters.size.length > 0 && !filters.size.includes(pet.size)) {
        return false;
      }

      // Filtro por edad
      if (filters.ageMin !== undefined && pet.age < filters.ageMin) {
        return false;
      }
      if (filters.ageMax !== undefined && pet.age > filters.ageMax) {
        return false;
      }

      // Filtro por vacunación
      if (filters.vaccinated !== undefined && pet.healthInfo.vaccinated !== filters.vaccinated) {
        return false;
      }

      // Filtro por esterilización
      if (filters.sterilized !== undefined && pet.healthInfo.sterilized !== filters.sterilized) {
        return false;
      }

      // Filtro por necesidades especiales
      if (filters.hasSpecialNeeds !== undefined) {
        const hasSpecialNeeds = !!pet.specialNeeds;
        if (hasSpecialNeeds !== filters.hasSpecialNeeds) {
          return false;
        }
      }

      // Filtro por ubicación
      if (filters.location) {
        const locationMatch = pet.location.city.toLowerCase().includes(filters.location.toLowerCase()) ||
                             pet.location.state.toLowerCase().includes(filters.location.toLowerCase());
        if (!locationMatch) return false;
      }

      // Filtro por búsqueda general
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchMatch = pet.name.toLowerCase().includes(searchTerm) ||
                           pet.breed.toLowerCase().includes(searchTerm) ||
                           pet.description.toLowerCase().includes(searchTerm) ||
                           pet.temperament.some(trait => trait.toLowerCase().includes(searchTerm));
        if (!searchMatch) return false;
      }

      // Filtro por urgencia
      if (filters.urgentOnly && !pet.isUrgent) {
        return false;
      }

      // Filtro por temperamento
      if (filters.temperament && filters.temperament.length > 0) {
        const hasMatchingTemperament = filters.temperament.some(trait =>
          pet.temperament.some(petTrait => 
            petTrait.toLowerCase().includes(trait.toLowerCase())
          )
        );
        if (!hasMatchingTemperament) return false;
      }

      return true;
    });
  }
);

export const selectFilteredPetCount = createSelector(
  selectFilteredPets,
  (pets) => pets.length
);

// Selectores para ordenamiento
export const selectSortedPets = createSelector(
  selectFilteredPets,
  selectCurrentFilters,
  (pets, filters) => {
    if (!filters.sortBy) {
      return pets;
    }

    const sortedPets = [...pets];
    const ascending = filters.sortOrder === 'asc';

    switch (filters.sortBy) {
      case 'name':
        return sortedPets.sort((a, b) => 
          ascending ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
        );
      
      case 'age':
        return sortedPets.sort((a, b) => 
          ascending ? a.age - b.age : b.age - a.age
        );
      
      case 'createdAt':
        return sortedPets.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return ascending ? dateA - dateB : dateB - dateA;
        });
      
      case 'views':
        return sortedPets.sort((a, b) => 
          ascending ? a.views - b.views : b.views - a.views
        );
      
      case 'favorites':
        return sortedPets.sort((a, b) => 
          ascending ? a.favorites - b.favorites : b.favorites - a.favorites
        );
      
      default:
        return sortedPets;
    }
  }
);

// Selectores para paginación
export const selectPetsPage = createSelector(
  selectSortedPets,
  selectCurrentFilters,
  (pets, filters) => {
    if (!filters.page || !filters.limit) {
      return pets;
    }
    
    const startIndex = (filters.page - 1) * filters.limit;
    const endIndex = startIndex + filters.limit;
    
    return pets.slice(startIndex, endIndex);
  }
);

export const selectHasNextPage = createSelector(
  selectSortedPets,
  selectCurrentFilters,
  (pets, filters) => {
    if (!filters.page || !filters.limit) return false;
    const totalPages = Math.ceil(pets.length / filters.limit);
    return filters.page < totalPages;
  }
);

export const selectHasPreviousPage = createSelector(
  selectCurrentFilters,
  (filters) => filters.page ? filters.page > 1 : false
);

export const selectTotalPages = createSelector(
  selectSortedPets,
  selectCurrentFilters,
  (pets, filters) => {
    if (!filters.limit) return 1;
    return Math.ceil(pets.length / filters.limit);
  }
);

// Selector para verificar si hay filtros activos
export const selectHasActiveFilters = createSelector(
  selectCurrentFilters,
  (filters) => {
    if (!filters) return false;
    
    const filterKeys = Object.keys(filters);
    if (filterKeys.length === 0) return false;
    
    // Verificar si hay filtros con valores
    return filterKeys.some(key => {
      const value = filters[key as keyof PetFilters];
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== undefined && value !== null && value !== '';
    });
  }
);