import { createAction, props } from '@ngrx/store';
import { 
  AdoptionRequest, 
  AdoptionMeeting, 
  AdoptionProcess, 
  AdoptionFilters,
  AdoptionStatistics,
  ContactReference,
  AdoptionDocument,
  AdoptionNote,
  FollowUpSchedule
} from './adoptions.state';

// Acciones de carga de solicitudes
export const loadAdoptionRequests = createAction(
  '[Adoption] Load Adoption Requests',
  props<{ filters?: AdoptionFilters }>()
);

export const loadAdoptionRequestsSuccess = createAction(
  '[Adoption] Load Adoption Requests Success',
  props<{ requests: AdoptionRequest[] }>()
);

export const loadAdoptionRequestsFailure = createAction(
  '[Adoption] Load Adoption Requests Failure',
  props<{ error: string }>()
);

// Acciones de creación de solicitudes
export const createAdoptionRequest = createAction(
  '[Adoption] Create Adoption Request',
  props<{ 
    request: Omit<AdoptionRequest, 'id' | 'submittedAt' | 'updatedAt' | 'timeline' | 'notes' | 'documents'> 
  }>()
);

export const createAdoptionRequestSuccess = createAction(
  '[Adoption] Create Adoption Request Success',
  props<{ request: AdoptionRequest }>()
);

export const createAdoptionRequestFailure = createAction(
  '[Adoption] Create Adoption Request Failure',
  props<{ error: string }>()
);

// Acciones de actualización de solicitudes
export const updateAdoptionRequest = createAction(
  '[Adoption] Update Adoption Request',
  props<{ requestId: string; updates: Partial<AdoptionRequest> }>()
);

export const updateAdoptionRequestSuccess = createAction(
  '[Adoption] Update Adoption Request Success',
  props<{ request: AdoptionRequest }>()
);

export const updateAdoptionRequestFailure = createAction(
  '[Adoption] Update Adoption Request Failure',
  props<{ error: string }>()
);

// Acciones de estado de solicitudes
export const approveAdoptionRequest = createAction(
  '[Adoption] Approve Adoption Request',
  props<{ requestId: string; notes?: string }>()
);

export const rejectAdoptionRequest = createAction(
  '[Adoption] Reject Adoption Request',
  props<{ requestId: string; reason: string; notes?: string }>()
);

export const cancelAdoptionRequest = createAction(
  '[Adoption] Cancel Adoption Request',
  props<{ requestId: string; reason: string }>()
);

export const completeAdoptionRequest = createAction(
  '[Adoption] Complete Adoption Request',
  props<{ requestId: string; completionNotes?: string }>()
);

// Acciones de selección
export const selectAdoptionRequest = createAction(
  '[Adoption] Select Adoption Request',
  props<{ requestId: string }>()
);

export const clearSelectedAdoptionRequest = createAction(
  '[Adoption] Clear Selected Adoption Request'
);

// Acciones de filtros
export const setAdoptionFilters = createAction(
  '[Adoption] Set Adoption Filters',
  props<{ filters: AdoptionFilters }>()
);

export const clearAdoptionFilters = createAction('[Adoption] Clear Adoption Filters');

// Acciones de encuentros (meetings)
export const scheduleMeeting = createAction(
  '[Adoption] Schedule Meeting',
  props<{ 
    meeting: Omit<AdoptionMeeting, 'id' | 'createdAt' | 'updatedAt'> 
  }>()
);

export const scheduleMeetingSuccess = createAction(
  '[Adoption] Schedule Meeting Success',
  props<{ meeting: AdoptionMeeting }>()
);

export const scheduleMeetingFailure = createAction(
  '[Adoption] Schedule Meeting Failure',
  props<{ error: string }>()
);

export const rescheduleMeeting = createAction(
  '[Adoption] Reschedule Meeting',
  props<{ meetingId: string; newDateTime: Date; reason: string }>()
);

export const cancelMeeting = createAction(
  '[Adoption] Cancel Meeting',
  props<{ meetingId: string; reason: string }>()
);

export const completeMeeting = createAction(
  '[Adoption] Complete Meeting',
  props<{ 
    meetingId: string; 
    outcome: AdoptionMeeting['outcome'];
  }>()
);

export const completeMeetingSuccess = createAction(
  '[Adoption] Complete Meeting Success',
  props<{ meeting: AdoptionMeeting }>()
);

export const completeMeetingFailure = createAction(
  '[Adoption] Complete Meeting Failure',
  props<{ error: string }>()
);

export const loadUpcomingMeetings = createAction('[Adoption] Load Upcoming Meetings');

export const loadUpcomingMeetingsSuccess = createAction(
  '[Adoption] Load Upcoming Meetings Success',
  props<{ meetings: AdoptionMeeting[] }>()
);

export const loadUpcomingMeetingsFailure = createAction(
  '[Adoption] Load Upcoming Meetings Failure',
  props<{ error: string }>()
);

// Acciones de documentos
export const uploadDocument = createAction(
  '[Adoption] Upload Document',
  props<{ 
    requestId: string; 
    file: File; 
    documentType: AdoptionDocument['type'];
    name?: string;
  }>()
);

export const uploadDocumentSuccess = createAction(
  '[Adoption] Upload Document Success',
  props<{ requestId: string; document: AdoptionDocument }>()
);

export const uploadDocumentFailure = createAction(
  '[Adoption] Upload Document Failure',
  props<{ error: string }>()
);

export const verifyDocument = createAction(
  '[Adoption] Verify Document',
  props<{ documentId: string; verified: boolean; notes?: string }>()
);

export const deleteDocument = createAction(
  '[Adoption] Delete Document',
  props<{ requestId: string; documentId: string }>()
);

// Acciones de notas
export const addNote = createAction(
  '[Adoption] Add Note',
  props<{ 
    requestId: string; 
    note: Omit<AdoptionNote, 'id' | 'timestamp'>;
  }>()
);

export const addNoteSuccess = createAction(
  '[Adoption] Add Note Success',
  props<{ requestId: string; note: AdoptionNote }>()
);

export const addNoteFailure = createAction(
  '[Adoption] Add Note Failure',
  props<{ error: string }>()
);

export const updateNote = createAction(
  '[Adoption] Update Note',
  props<{ requestId: string; noteId: string; content: string }>()
);

export const deleteNote = createAction(
  '[Adoption] Delete Note',
  props<{ requestId: string; noteId: string }>()
);

// Acciones de referencias
export const contactReference = createAction(
  '[Adoption] Contact Reference',
  props<{ requestId: string; referenceId: string }>()
);

export const updateReferenceResponse = createAction(
  '[Adoption] Update Reference Response',
  props<{ 
    requestId: string; 
    referenceId: string; 
    response: string;
    contactedAt: Date;
  }>()
);

// Acciones del proceso de adopción
export const startAdoptionProcess = createAction(
  '[Adoption] Start Adoption Process',
  props<{ requestId: string }>()
);

export const startAdoptionProcessSuccess = createAction(
  '[Adoption] Start Adoption Process Success',
  props<{ process: AdoptionProcess }>()
);

export const startAdoptionProcessFailure = createAction(
  '[Adoption] Start Adoption Process Failure',
  props<{ error: string }>()
);

export const completePhase = createAction(
  '[Adoption] Complete Phase',
  props<{ 
    processId: string; 
    phase: keyof AdoptionProcess['phases'];
    notes?: string;
  }>()
);

export const completePhaseSuccess = createAction(
  '[Adoption] Complete Phase Success',
  props<{ process: AdoptionProcess }>()
);

export const completePhaseFailure = createAction(
  '[Adoption] Complete Phase Failure',
  props<{ error: string }>()
);

// Acciones de seguimiento post-adopción
export const scheduleFollowUp = createAction(
  '[Adoption] Schedule Follow Up',
  props<{ 
    processId: string;
    followUp: Omit<FollowUpSchedule, 'id' | 'completed' | 'completedAt'>;
  }>()
);

export const completeFollowUp = createAction(
  '[Adoption] Complete Follow Up',
  props<{ 
    processId: string;
    followUpId: string;
    notes: string;
    photos?: string[];
    petWellbeing: number;
    adopterSatisfaction: number;
  }>()
);

export const completeFollowUpSuccess = createAction(
  '[Adoption] Complete Follow Up Success',
  props<{ processId: string; followUp: FollowUpSchedule }>()
);

export const completeFollowUpFailure = createAction(
  '[Adoption] Complete Follow Up Failure',
  props<{ error: string }>()
);

// Acciones de acuerdos de adopción
export const generateAdoptionAgreement = createAction(
  '[Adoption] Generate Adoption Agreement',
  props<{ processId: string; terms: any }>()
);

export const signAdoptionAgreement = createAction(
  '[Adoption] Sign Adoption Agreement',
  props<{ 
    processId: string; 
    signedBy: 'adopter' | 'owner';
    signature: string;
  }>()
);

export const signAdoptionAgreementSuccess = createAction(
  '[Adoption] Sign Adoption Agreement Success',
  props<{ process: AdoptionProcess }>()
);

export const signAdoptionAgreementFailure = createAction(
  '[Adoption] Sign Adoption Agreement Failure',
  props<{ error: string }>()
);

// Acciones de estadísticas
export const loadAdoptionStatistics = createAction('[Adoption] Load Adoption Statistics');

export const loadAdoptionStatisticsSuccess = createAction(
  '[Adoption] Load Adoption Statistics Success',
  props<{ statistics: AdoptionStatistics }>()
);

export const loadAdoptionStatisticsFailure = createAction(
  '[Adoption] Load Adoption Statistics Failure',
  props<{ error: string }>()
);

// Acciones de notificaciones específicas de adopción
export const notifyStatusChange = createAction(
  '[Adoption] Notify Status Change',
  props<{ 
    requestId: string; 
    newStatus: AdoptionRequest['status'];
    recipientId: string;
    message?: string;
  }>()
);

export const sendAdoptionReminder = createAction(
  '[Adoption] Send Adoption Reminder',
  props<{ requestId: string; reminderType: string }>()
);

// Acciones de búsqueda y filtrado
export const searchAdoptionRequests = createAction(
  '[Adoption] Search Adoption Requests',
  props<{ query: string; filters?: AdoptionFilters }>()
);

export const searchAdoptionRequestsSuccess = createAction(
  '[Adoption] Search Adoption Requests Success',
  props<{ requests: AdoptionRequest[]; query: string }>()
);

export const searchAdoptionRequestsFailure = createAction(
  '[Adoption] Search Adoption Requests Failure',
  props<{ error: string }>()
);

// Acciones para el dashboard del usuario
export const loadUserAdoptionDashboard = createAction(
  '[Adoption] Load User Adoption Dashboard',
  props<{ userId: string }>()
);

export const loadUserAdoptionDashboardSuccess = createAction(
  '[Adoption] Load User Adoption Dashboard Success',
  props<{ 
    asAdopter: AdoptionRequest[];
    asOwner: AdoptionRequest[];
    upcomingMeetings: AdoptionMeeting[];
    activeProcesses: AdoptionProcess[];
  }>()
);

export const loadUserAdoptionDashboardFailure = createAction(
  '[Adoption] Load User Adoption Dashboard Failure',
  props<{ error: string }>()
);