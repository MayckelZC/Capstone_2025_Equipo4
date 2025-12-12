import { createSelector, createFeatureSelector } from '@ngrx/store';
import { AdoptionState, AdoptionRequest } from './adoptions.state';
import { selectIds, selectEntities, selectAll, selectTotal } from './adoptions.reducer';

// Feature selector
export const selectAdoptionState = createFeatureSelector<AdoptionState>('adoptions');

// Selectores básicos del Entity Adapter
export const selectAllAdoptionRequests = createSelector(selectAdoptionState, selectAll);
export const selectAdoptionEntities = createSelector(selectAdoptionState, selectEntities);
export const selectAdoptionIds = createSelector(selectAdoptionState, selectIds);
export const selectTotalAdoptionRequests = createSelector(selectAdoptionState, selectTotal);

// Selectores de estado de carga
export const selectAdoptionLoading = createSelector(
  selectAdoptionState,
  (state) => state.loading
);

export const selectAdoptionError = createSelector(
  selectAdoptionState,
  (state) => state.error
);

export const selectIsAdoptionLoading = createSelector(
  selectAdoptionLoading,
  (loading) => loading === 'LOADING'
);

// Selectores de selección
export const selectSelectedAdoptionRequestId = createSelector(
  selectAdoptionState,
  (state) => state.selectedRequestId
);

export const selectSelectedAdoptionRequest = createSelector(
  selectAdoptionEntities,
  selectSelectedAdoptionRequestId,
  (entities, selectedId) => selectedId ? entities[selectedId] : null
);

// Selectores de filtros
export const selectAdoptionFilters = createSelector(
  selectAdoptionState,
  (state) => state.currentFilters
);

// Selectores de encuentros
export const selectMeetings = createSelector(
  selectAdoptionState,
  (state) => state.meetings
);

export const selectUpcomingMeetings = createSelector(
  selectAdoptionState,
  (state) => state.upcomingMeetings
);

export const createSelectMeetingsByRequestId = (requestId: string) => createSelector(
  selectMeetings,
  (meetings) => meetings[requestId] || []
);

// Selectores de procesos
export const selectProcesses = createSelector(
  selectAdoptionState,
  (state) => state.processes
);

export const createSelectProcessByRequestId = (requestId: string) => createSelector(
  selectProcesses,
  (processes) => processes[requestId]
);

// Selectores de usuario
export const selectUserRequests = createSelector(
  selectAdoptionState,
  (state) => state.userRequests
);

export const selectUserRequestsAsAdopter = createSelector(
  selectUserRequests,
  selectAdoptionEntities,
  (userRequests, entities) => 
    userRequests.asAdopter.map(id => entities[id]).filter(Boolean) as AdoptionRequest[]
);

export const selectUserRequestsAsOwner = createSelector(
  selectUserRequests,
  selectAdoptionEntities,
  (userRequests, entities) => 
    userRequests.asOwner.map(id => entities[id]).filter(Boolean) as AdoptionRequest[]
);

// Selectores de estadísticas
export const selectAdoptionStatistics = createSelector(
  selectAdoptionState,
  (state) => state.statistics
);

export const selectTotalRequests = createSelector(
  selectAdoptionStatistics,
  (stats) => stats.totalRequests
);

export const selectPendingRequests = createSelector(
  selectAdoptionStatistics,
  (stats) => stats.pendingRequests
);

export const selectCompletedAdoptions = createSelector(
  selectAdoptionStatistics,
  (stats) => stats.completedAdoptions
);

export const selectAdoptionSuccessRate = createSelector(
  selectAdoptionStatistics,
  (stats) => stats.successRate
);

// Selectores filtrados por estado
export const selectPendingAdoptionRequests = createSelector(
  selectAllAdoptionRequests,
  (requests) => requests.filter(request => request.status === 'pending')
);

export const selectApprovedAdoptionRequests = createSelector(
  selectAllAdoptionRequests,
  (requests) => requests.filter(request => request.status === 'approved')
);

export const selectRejectedAdoptionRequests = createSelector(
  selectAllAdoptionRequests,
  (requests) => requests.filter(request => request.status === 'rejected')
);

export const selectCompletedAdoptionRequests = createSelector(
  selectAllAdoptionRequests,
  (requests) => requests.filter(request => request.status === 'completed')
);

// Selectores por mascota
export const selectAdoptionRequestsByPet = (petId: string) => createSelector(
  selectAllAdoptionRequests,
  (requests) => requests.filter(request => request.petId === petId)
);

// Selectores por usuario
export const selectAdoptionRequestsByAdopter = (adopterId: string) => createSelector(
  selectAllAdoptionRequests,
  (requests) => requests.filter(request => request.adopterId === adopterId)
);

export const selectAdoptionRequestsByOwner = (ownerId: string) => createSelector(
  selectAllAdoptionRequests,
  (requests) => requests.filter(request => request.ownerId === ownerId)
);

// Selectores de filtros aplicados
export const selectFilteredAdoptionRequests = createSelector(
  selectAllAdoptionRequests,
  selectAdoptionFilters,
  (requests, filters) => {
    if (!filters || Object.keys(filters).length === 0) {
      return requests;
    }

    return requests.filter(request => {
      // Filtro por estado
      if (filters.status && filters.status.length > 0 && !filters.status.includes(request.status)) {
        return false;
      }

      // Filtro por fecha de envío
      if (filters.dateSubmitted) {
        const submittedDate = new Date(request.submittedAt);
        if (filters.dateSubmitted.from && submittedDate < filters.dateSubmitted.from) {
          return false;
        }
        if (filters.dateSubmitted.to && submittedDate > filters.dateSubmitted.to) {
          return false;
        }
      }

      // Filtro por adoptante específico
      if (filters.adopterId && request.adopterId !== filters.adopterId) {
        return false;
      }

      // Filtro por dueño específico
      if (filters.ownerId && request.ownerId !== filters.ownerId) {
        return false;
      }

      // Filtro por búsqueda general
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchMatch = request.message.toLowerCase().includes(searchTerm) ||
                           request.adoptionReason.toLowerCase().includes(searchTerm);
        if (!searchMatch) return false;
      }

      return true;
    });
  }
);

// Selector para verificar si hay filtros activos
export const selectHasActiveAdoptionFilters = createSelector(
  selectAdoptionFilters,
  (filters) => {
    if (!filters) return false;
    
    const filterKeys = Object.keys(filters);
    if (filterKeys.length === 0) return false;
    
    return filterKeys.some(key => {
      const value = filters[key as keyof typeof filters];
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== undefined && value !== null && value !== '';
    });
  }
);