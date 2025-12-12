import { EntityState } from '@ngrx/entity';
import { BaseState, LoadingState, CommonFilters } from '../app.state';
import { Pet } from '../pets/pets.state';
import { User } from '../users/users.state';

// Interface principal para solicitudes de adopción
export interface AdoptionRequest {
  id: string;
  petId: string;
  adopterId: string;
  ownerId: string;

  // Información de la solicitud
  message: string;
  adoptionReason: string;
  housingDetails: {
    type: 'apartment' | 'house' | 'farm' | 'other';
    hasYard: boolean;
    yardSize?: string;
    hasOtherPets: boolean;
    otherPetsDetails?: string;
    hasChildren: boolean;
    childrenAges?: number[];
  };

  // Experiencia con mascotas
  petExperience: string;
  previousPets?: PreviousPet[];

  // Preguntas adicionales
  longTermCommitment: string;
  unexpectedExpenses?: boolean;
  veterinaryAccess?: boolean;
  petFood?: string;

  // Información de contacto
  contactPreference: 'phone' | 'email' | 'message';
  availability: {
    days: string[];
    timeRanges: string[];
    timezone: string;
  };

  // Referencias
  references?: ContactReference[];

  // Estado y fechas
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  submittedAt: Date;
  reviewedAt?: Date;
  respondedAt?: Date;
  completedAt?: Date;

  // Seguimiento
  timeline: AdoptionTimelineEvent[];
  notes: AdoptionNote[];

  // Documentación
  documents: AdoptionDocument[];

  updatedAt: Date;
}

export interface PreviousPet {
  type: string;
  breed?: string;
  yearsOwned: number;
  whatHappened: string; // qué pasó con esa mascota
}

export interface ContactReference {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  contacted: boolean;
  response?: string;
  contactedAt?: Date;
}

export interface AdoptionTimelineEvent {
  id: string;
  type: 'submitted' | 'reviewed' | 'contacted' | 'meet_scheduled' | 'meet_completed' | 'approved' | 'rejected' | 'completed';
  title: string;
  description: string;
  timestamp: Date;
  userId: string; // quién realizó la acción
  metadata?: any; // información adicional específica del evento
}

export interface AdoptionNote {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  isPrivate: boolean; // solo visible para el dueño/admin
  timestamp: Date;
}

export interface AdoptionDocument {
  id: string;
  name: string;
  type: 'id_copy' | 'address_proof' | 'income_proof' | 'vet_reference' | 'rental_agreement' | 'other';
  url: string;
  uploadedAt: Date;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
}

// Interface para encuentros entre adoptante y mascota
export interface AdoptionMeeting {
  id: string;
  adoptionRequestId: string;
  scheduledAt: Date;
  location: {
    type: 'owner_home' | 'adopter_home' | 'neutral_location' | 'virtual';
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    notes?: string;
  };

  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';

  // Resultados del encuentro
  outcome?: {
    adopteeComfort: number; // 1-5 scale
    petComfort: number; // 1-5 scale
    overallCompatibility: number; // 1-5 scale
    notes: string;
    photos?: string[];
    nextSteps: string;
  };

  // Información de los participantes
  participants: {
    adopterId: string;
    ownerId: string;
    otherParticipants?: string[]; // familiares, etc.
  };

  createdAt: Date;
  updatedAt: Date;
}

// Interface para el proceso de adopción completo
export interface AdoptionProcess {
  id: string;
  adoptionRequestId: string;
  petId: string;
  adopterId: string;
  ownerId: string;

  // Fases del proceso
  phases: {
    application: { completed: boolean; completedAt?: Date };
    review: { completed: boolean; completedAt?: Date };
    meeting: { completed: boolean; completedAt?: Date };
    trial: { completed: boolean; completedAt?: Date; duration?: number };
    finalization: { completed: boolean; completedAt?: Date };
  };

  // Documentación legal
  adoptionAgreement?: {
    url: string;
    signedByAdopter: boolean;
    signedByOwner: boolean;
    signedAt?: Date;
  };

  // Seguimiento post-adopción
  followUps: FollowUpSchedule[];

  status: 'in_progress' | 'completed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
}

export interface FollowUpSchedule {
  id: string;
  scheduledDate: Date;
  type: '1_week' | '1_month' | '3_months' | '6_months' | '1_year';
  completed: boolean;
  completedAt?: Date;
  notes?: string;
  photos?: string[];
  petWellbeing: number; // 1-5 scale
  adopterSatisfaction: number; // 1-5 scale
}

// Filtros para adopciones
export interface AdoptionFilters extends CommonFilters {
  status?: AdoptionRequest['status'][];
  petType?: string[];
  dateSubmitted?: {
    from: Date;
    to: Date;
  };
  adopterId?: string;
  ownerId?: string;
}

// Estado de adopciones
export interface AdoptionState extends EntityState<AdoptionRequest>, BaseState {
  // Solicitudes
  selectedRequestId: string | null;
  currentFilters: AdoptionFilters;

  // Encuentros
  meetings: { [requestId: string]: AdoptionMeeting[] };
  upcomingMeetings: AdoptionMeeting[];

  // Procesos completos
  processes: { [requestId: string]: AdoptionProcess };

  // Para el usuario actual
  userRequests: {
    asAdopter: string[]; // IDs de solicitudes como adoptante
    asOwner: string[]; // IDs de solicitudes como dueño
  };

  // Estadísticas
  statistics: AdoptionStatistics;
}

export interface AdoptionStatistics {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  completedAdoptions: number;
  averageProcessingTime: number; // en días
  successRate: number;
  byPetType: { [type: string]: number };
  byMonth: { month: string; requests: number; completions: number }[];
  topReasons: { reason: string; count: number }[];
}

// Estado inicial
export const initialAdoptionState: AdoptionState = {
  // EntityState
  ids: [],
  entities: {},

  // BaseState
  loading: LoadingState.INIT,
  error: null,

  // AdoptionState específico
  selectedRequestId: null,
  currentFilters: {},
  meetings: {},
  upcomingMeetings: [],
  processes: {},
  userRequests: {
    asAdopter: [],
    asOwner: []
  },
  statistics: {
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    completedAdoptions: 0,
    averageProcessingTime: 0,
    successRate: 0,
    byPetType: {},
    byMonth: [],
    topReasons: []
  }
};