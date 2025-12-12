import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { AdoptionRequest, AdoptionState, initialAdoptionState } from './adoptions.state';
import { LoadingState } from '../app.state';
import * as AdoptionActions from './adoptions.actions';

// Entity adapter para manejo de solicitudes de adopción
export const adoptionAdapter: EntityAdapter<AdoptionRequest> = createEntityAdapter<AdoptionRequest>({
  selectId: (request: AdoptionRequest) => request.id,
  sortComparer: (a: AdoptionRequest, b: AdoptionRequest) => 
    new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
});

// Reducer de adopciones
export const adoptionReducer = createReducer(
  initialAdoptionState,

  // Carga de solicitudes
  on(AdoptionActions.loadAdoptionRequests, (state) => ({
    ...state,
    loading: LoadingState.LOADING,
    error: null
  })),

  on(AdoptionActions.loadAdoptionRequestsSuccess, (state, { requests }) => 
    adoptionAdapter.setAll(requests, {
      ...state,
      loading: LoadingState.LOADED,
      error: null
    })
  ),

  on(AdoptionActions.loadAdoptionRequestsFailure, (state, { error }) => ({
    ...state,
    loading: LoadingState.ERROR,
    error
  })),

  // Creación de solicitudes
  on(AdoptionActions.createAdoptionRequest, (state) => ({
    ...state,
    loading: LoadingState.LOADING,
    error: null
  })),

  on(AdoptionActions.createAdoptionRequestSuccess, (state, { request }) => 
    adoptionAdapter.addOne(request, {
      ...state,
      loading: LoadingState.LOADED,
      error: null,
      statistics: {
        ...state.statistics,
        totalRequests: state.statistics.totalRequests + 1,
        pendingRequests: state.statistics.pendingRequests + 1
      }
    })
  ),

  on(AdoptionActions.createAdoptionRequestFailure, (state, { error }) => ({
    ...state,
    loading: LoadingState.ERROR,
    error
  })),

  // Actualización de solicitudes
  on(AdoptionActions.updateAdoptionRequestSuccess, (state, { request }) => 
    adoptionAdapter.updateOne(
      { id: request.id, changes: request },
      state
    )
  ),

  // Selección
  on(AdoptionActions.selectAdoptionRequest, (state, { requestId }) => ({
    ...state,
    selectedRequestId: requestId
  })),

  on(AdoptionActions.clearSelectedAdoptionRequest, (state) => ({
    ...state,
    selectedRequestId: null
  })),

  // Filtros
  on(AdoptionActions.setAdoptionFilters, (state, { filters }) => ({
    ...state,
    currentFilters: filters
  })),

  on(AdoptionActions.clearAdoptionFilters, (state) => ({
    ...state,
    currentFilters: {}
  })),

  // Encuentros
  on(AdoptionActions.scheduleMeetingSuccess, (state, { meeting }) => ({
    ...state,
    meetings: {
      ...state.meetings,
      [meeting.adoptionRequestId]: [
        ...(state.meetings[meeting.adoptionRequestId] || []),
        meeting
      ]
    }
  })),

  on(AdoptionActions.loadUpcomingMeetingsSuccess, (state, { meetings }) => ({
    ...state,
    upcomingMeetings: meetings
  })),

  // Documentos
  on(AdoptionActions.uploadDocumentSuccess, (state, { requestId, document }) => {
    const request = state.entities[requestId];
    if (request) {
      return adoptionAdapter.updateOne(
        {
          id: requestId,
          changes: {
            documents: [...request.documents, document]
          }
        },
        state
      );
    }
    return state;
  }),

  // Notas
  on(AdoptionActions.addNoteSuccess, (state, { requestId, note }) => {
    const request = state.entities[requestId];
    if (request) {
      return adoptionAdapter.updateOne(
        {
          id: requestId,
          changes: {
            notes: [...request.notes, note]
          }
        },
        state
      );
    }
    return state;
  }),

  // Estadísticas
  on(AdoptionActions.loadAdoptionStatisticsSuccess, (state, { statistics }) => ({
    ...state,
    statistics
  })),

  // Dashboard del usuario
  on(AdoptionActions.loadUserAdoptionDashboardSuccess, (state, { asAdopter, asOwner, upcomingMeetings, activeProcesses }) => ({
    ...state,
    userRequests: {
      asAdopter: asAdopter.map(r => r.id),
      asOwner: asOwner.map(r => r.id)
    },
    upcomingMeetings,
    processes: activeProcesses.reduce((acc, process) => ({
      ...acc,
      [process.adoptionRequestId]: process
    }), {})
  }))
);

// Selectores del entity adapter
export const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal,
} = adoptionAdapter.getSelectors();