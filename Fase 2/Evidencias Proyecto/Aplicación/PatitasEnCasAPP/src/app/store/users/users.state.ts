import { EntityState } from '@ngrx/entity';
import { BaseState, LoadingState, UserPreferences, AppNotification } from '../app.state';

// Interface principal de usuario
export interface User {
  id: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  
  // Información de ubicación
  location: {
    city: string;
    state: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  
  // Información personal
  bio?: string;
  dateOfBirth?: Date;
  occupation?: string;
  housingType: 'apartment' | 'house' | 'farm' | 'other';
  hasYard: boolean;
  hasOtherPets: boolean;
  otherPetsDetails?: string;
  hasChildren: boolean;
  childrenAges?: number[];
  
  // Experiencia con mascotas
  petExperience: {
    dogs: 'none' | 'beginner' | 'intermediate' | 'expert';
    cats: 'none' | 'beginner' | 'intermediate' | 'expert';
    other: 'none' | 'beginner' | 'intermediate' | 'expert';
  };
  
  // Preferencias del usuario
  preferences: UserPreferences;
  
  // Estado de verificación
  verification: {
    email: boolean;
    phone: boolean;
    identity: boolean;
    address: boolean;
    references: UserReference[];
  };
  
  // Actividad del usuario
  activity: {
    joinDate: Date;
    lastLogin: Date;
    totalLogins: number;
    petsPublished: number;
    successfulAdoptions: number;
    adoptedPets: number;
    rating: number;
    totalReviews: number;
  };
  
  // Estado de cuenta
  accountStatus: 'active' | 'suspended' | 'pending' | 'inactive';
  accountType: 'adopter' | 'rescuer' | 'both';
  
  createdAt: Date;
  updatedAt: Date;
}

export interface UserReference {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  verified: boolean;
  verifiedAt?: Date;
}

// Interface para perfil público (información limitada)
export interface PublicUserProfile {
  id: string;
  displayName: string;
  avatar?: string;
  location: {
    city: string;
    state: string;
  };
  bio?: string;
  rating: number;
  totalReviews: number;
  successfulAdoptions: number;
  joinDate: Date;
  accountType: 'adopter' | 'rescuer' | 'both';
  verification: {
    identity: boolean;
    address: boolean;
  };
}

// Interface para estadísticas del usuario
export interface UserStatistics {
  profileViews: number;
  profileViewsThisMonth: number;
  messagesSent: number;
  messagesReceived: number;
  favoritePets: number;
  searchesMade: number;
  averageResponseTime: number; // en horas
  adoptionSuccessRate: number;
}

// Estado del usuario actual
export interface CurrentUserState extends BaseState {
  user: User | null;
  isAuthenticated: boolean;
  
  // Notificaciones
  notifications: AppNotification[];
  unreadNotificationCount: number;
  
  // Estadísticas del usuario
  statistics: UserStatistics | null;
  
  // Estado de configuración
  settingsLoading: boolean;
  settingsError: string | null;
}

// Estado de usuarios (para gestión de otros usuarios)
export interface UsersState extends EntityState<PublicUserProfile>, BaseState {
  // Usuario seleccionado para ver perfil
  selectedUserId: string | null;
  selectedUserDetails: User | null;
  
  // Búsqueda de usuarios
  searchResults: string[]; // IDs de usuarios
  searchQuery: string;
  
  // Cache de interacciones
  userInteractions: { [userId: string]: UserInteraction };
}

export interface UserInteraction {
  lastMessageDate?: Date;
  conversationId?: string;
  blocked: boolean;
  reported: boolean;
  rating?: number;
  review?: string;
}

// Estado combinado de usuarios
export interface UserState {
  current: CurrentUserState;
  users: UsersState;
}

// Estados iniciales
export const initialCurrentUserState: CurrentUserState = {
  loading: LoadingState.INIT,
  error: null,
  user: null,
  isAuthenticated: false,
  notifications: [],
  unreadNotificationCount: 0,
  statistics: null,
  settingsLoading: false,
  settingsError: null
};

export const initialUsersState: UsersState = {
  // EntityState
  ids: [],
  entities: {},
  
  // BaseState
  loading: LoadingState.INIT,
  error: null,
  
  // UsersState específico
  selectedUserId: null,
  selectedUserDetails: null,
  searchResults: [],
  searchQuery: '',
  userInteractions: {}
};

export const initialUserState: UserState = {
  current: initialCurrentUserState,
  users: initialUsersState
};