import { createAction, props } from '@ngrx/store';
import { Pet, PetFilters, PetDetails, PetStatistics } from './pets.state';
import { PaginatedResponse } from '../app.state';

// Acciones de carga de mascotas
export const loadPets = createAction(
  '[Pet] Load Pets',
  props<{ filters?: PetFilters; refresh?: boolean }>()
);

export const loadPetsSuccess = createAction(
  '[Pet] Load Pets Success',
  props<{ pets: Pet[]; pagination?: PaginatedResponse<Pet> }>()
);

export const loadPetsFailure = createAction(
  '[Pet] Load Pets Failure',
  props<{ error: string }>()
);

// Acciones de búsqueda
export const searchPets = createAction(
  '[Pet] Search Pets',
  props<{ query: string; filters?: PetFilters }>()
);

export const searchPetsSuccess = createAction(
  '[Pet] Search Pets Success',
  props<{ results: PaginatedResponse<string>; pets: Pet[] }>()
);

export const searchPetsFailure = createAction(
  '[Pet] Search Pets Failure',
  props<{ error: string }>()
);

export const clearSearch = createAction('[Pet] Clear Search');

// Acciones de filtros
export const setFilters = createAction(
  '[Pet] Set Filters',
  props<{ filters: PetFilters }>()
);

export const clearFilters = createAction('[Pet] Clear Filters');

// Acciones de selección
export const selectPet = createAction(
  '[Pet] Select Pet',
  props<{ petId: string }>()
);

export const clearSelectedPet = createAction('[Pet] Clear Selected Pet');

// Acciones de detalles de mascota
export const loadPetDetails = createAction(
  '[Pet] Load Pet Details',
  props<{ petId: string }>()
);

export const loadPetDetailsSuccess = createAction(
  '[Pet] Load Pet Details Success',
  props<{ petId: string; details: PetDetails }>()
);

export const loadPetDetailsFailure = createAction(
  '[Pet] Load Pet Details Failure',
  props<{ petId: string; error: string }>()
);

// Acciones de creación y edición
export const createPet = createAction(
  '[Pet] Create Pet',
  props<{ pet: Omit<Pet, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'favorites' | 'inquiries'> }>()
);

export const createPetSuccess = createAction(
  '[Pet] Create Pet Success',
  props<{ pet: Pet }>()
);

export const createPetFailure = createAction(
  '[Pet] Create Pet Failure',
  props<{ error: string }>()
);

export const updatePet = createAction(
  '[Pet] Update Pet',
  props<{ petId: string; updates: Partial<Pet> }>()
);

export const updatePetSuccess = createAction(
  '[Pet] Update Pet Success',
  props<{ pet: Pet }>()
);

export const updatePetFailure = createAction(
  '[Pet] Update Pet Failure',
  props<{ error: string }>()
);

export const deletePet = createAction(
  '[Pet] Delete Pet',
  props<{ petId: string }>()
);

export const deletePetSuccess = createAction(
  '[Pet] Delete Pet Success',
  props<{ petId: string }>()
);

export const deletePetFailure = createAction(
  '[Pet] Delete Pet Failure',
  props<{ error: string }>()
);

// Acciones de favoritos
export const addToFavorites = createAction(
  '[Pet] Add to Favorites',
  props<{ petId: string }>()
);

export const removeFromFavorites = createAction(
  '[Pet] Remove from Favorites',
  props<{ petId: string }>()
);

export const loadUserFavorites = createAction('[Pet] Load User Favorites');

export const loadUserFavoritesSuccess = createAction(
  '[Pet] Load User Favorites Success',
  props<{ favoriteIds: string[] }>()
);

export const loadUserFavoritesFailure = createAction(
  '[Pet] Load User Favorites Failure',
  props<{ error: string }>()
);

// Acciones de imágenes
export const uploadPetImage = createAction(
  '[Pet] Upload Pet Image',
  props<{ petId: string; file: File; isPrimary?: boolean }>()
);

export const uploadPetImageSuccess = createAction(
  '[Pet] Upload Pet Image Success',
  props<{ petId: string; image: any }>()
);

export const uploadPetImageFailure = createAction(
  '[Pet] Upload Pet Image Failure',
  props<{ error: string }>()
);

export const deletePetImage = createAction(
  '[Pet] Delete Pet Image',
  props<{ petId: string; imageId: string }>()
);

export const setPrimaryImage = createAction(
  '[Pet] Set Primary Image',
  props<{ petId: string; imageId: string }>()
);

// Acciones de estadísticas
export const loadPetStatistics = createAction('[Pet] Load Pet Statistics');

export const loadPetStatisticsSuccess = createAction(
  '[Pet] Load Pet Statistics Success',
  props<{ statistics: PetStatistics }>()
);

export const loadPetStatisticsFailure = createAction(
  '[Pet] Load Pet Statistics Failure',
  props<{ error: string }>()
);

// Acciones de interacción
export const recordPetView = createAction(
  '[Pet] Record Pet View',
  props<{ petId: string; source?: string }>()
);

export const recordPetInquiry = createAction(
  '[Pet] Record Pet Inquiry',
  props<{ petId: string }>()
);

// Acciones de búsquedas guardadas
export const saveSearch = createAction(
  '[Pet] Save Search',
  props<{ query: string; filters: PetFilters; name?: string }>()
);

export const loadSavedSearches = createAction('[Pet] Load Saved Searches');

export const deleteSavedSearch = createAction(
  '[Pet] Delete Saved Search',
  props<{ searchId: string }>()
);

// Acciones de recomendaciones
export const loadRecommendedPets = createAction(
  '[Pet] Load Recommended Pets',
  props<{ userId: string; limit?: number }>()
);

export const loadRecommendedPetsSuccess = createAction(
  '[Pet] Load Recommended Pets Success',
  props<{ pets: Pet[] }>()
);

export const loadRecommendedPetsFailure = createAction(
  '[Pet] Load Recommended Pets Failure',
  props<{ error: string }>()
);

// Acciones de cache y sincronización
export const syncOfflineData = createAction('[Pet] Sync Offline Data');

export const clearCache = createAction('[Pet] Clear Cache');

// Acciones de estado de conexión
export const setOnlineStatus = createAction(
  '[Pet] Set Online Status',
  props<{ isOnline: boolean }>()
);

// Acciones de paginación
export const loadNextPage = createAction('[Pet] Load Next Page');

export const loadPreviousPage = createAction('[Pet] Load Previous Page');

export const setPage = createAction(
  '[Pet] Set Page',
  props<{ page: number }>()
);