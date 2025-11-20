import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { environment } from '../../environments/environment';

import { AppState } from './app.state';
import { petReducer } from './pets/pets.reducer';
import { userReducer } from './users/users.reducer';
import { adoptionReducer } from './adoptions/adoptions.reducer';

// Root reducer map
export const reducers: ActionReducerMap<AppState> = {
  pets: petReducer,
  users: userReducer,
  adoptions: adoptionReducer
};

// Logger meta-reducer para desarrollo
export function logger(reducer: any): any {
  return function(state: any, action: any): any {
    console.log('state', state);
    console.log('action', action);
    return reducer(state, action);
  };
}

// Meta-reducers
export const metaReducers: MetaReducer<AppState>[] = !environment.production 
  ? [logger] 
  : [];

// Exportar selectores de forma explícita para evitar conflictos
// Pet selectors (mantenemos selectSearchResults como selectPetSearchResults)
export {
  selectPetState,
  selectAllPets,
  selectPetEntities,
  selectPetIds,
  selectTotalPets,
  selectPetLoading,
  selectPetError,
  selectIsLoading,
  selectSelectedPetId,
  selectSelectedPet,
  selectCurrentFilters,
  selectSearchResults as selectPetSearchResults, // Renombrado para evitar conflicto
  selectSearchResultPets,
  selectRecentSearches,
  selectPopularSearches,
  selectUserFavorites,
  selectFavoritePets,
  createSelectIsPetFavorite,
  selectPetDetails,
  createSelectPetDetailsById,
  selectPetStatistics,
  selectTotalAvailablePets,
  selectTotalAdoptedPets,
  selectPetsStatsByType,
  selectPetsStatsByLocation,
  selectMostPopularBreeds,
  selectAvailablePets,
  selectPetsByType,
  selectPetsByLocation,
  selectUrgentPets,
  selectRecentPets,
  selectPetsByOwner,
  selectFilteredPets,
  selectFilteredPetCount,
  selectSortedPets,
  selectPetsPage,
  selectHasNextPage,
  selectHasPreviousPage,
  selectTotalPages,
  selectHasActiveFilters
} from './pets/pets.selectors';

// User selectors
export {
  selectUserState,
  selectCurrentUserState,
  selectCurrentUser,
  selectIsAuthenticated,
  selectCurrentUserLoading,
  selectCurrentUserError,
  selectNotifications,
  selectUnreadNotificationCount,
  selectUnreadNotifications,
  selectUserStatistics,
  selectUsersState,
  selectAllUsers,
  selectUserEntities,
  selectUserIds,
  selectTotalUsers,
  selectUsersLoading,
  selectUsersError,
  selectSelectedUserId,
  selectSelectedUser,
  selectUserSearchResults,
  selectSearchQuery,
  selectCurrentUserId,
  selectCurrentUserDisplayName,
  selectCurrentUserAvatar,
  selectIsUserVerified,
  selectUserPreferences
} from './users/users.selectors';

// Adoption selectors - exportación directa sin conflictos
export {
  selectAdoptionState,
  selectAllAdoptionRequests,
  selectAdoptionEntities,
  selectAdoptionIds,
  selectTotalAdoptionRequests,
  selectAdoptionLoading,
  selectAdoptionError,
  selectIsAdoptionLoading,
  selectSelectedAdoptionRequestId,
  selectSelectedAdoptionRequest,
  selectAdoptionFilters,
  selectMeetings,
  selectUpcomingMeetings,
  createSelectMeetingsByRequestId,
  selectProcesses,
  createSelectProcessByRequestId,
  selectUserRequests,
  selectUserRequestsAsAdopter,
  selectUserRequestsAsOwner,
  selectAdoptionStatistics,
  selectTotalRequests,
  selectPendingRequests,
  selectCompletedAdoptions,
  selectAdoptionSuccessRate,
  selectPendingAdoptionRequests,
  selectApprovedAdoptionRequests,
  selectRejectedAdoptionRequests,
  selectCompletedAdoptionRequests,
  selectAdoptionRequestsByPet,
  selectAdoptionRequestsByAdopter,
  selectAdoptionRequestsByOwner,
  selectFilteredAdoptionRequests,
  selectHasActiveAdoptionFilters
} from './adoptions/adoptions.selectors';