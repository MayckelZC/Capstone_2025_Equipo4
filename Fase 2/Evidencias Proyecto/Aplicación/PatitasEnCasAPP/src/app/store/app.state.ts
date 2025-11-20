import { PetState } from './pets/pets.state';
import { UserState } from './users/users.state';
import { AdoptionState } from './adoptions/adoptions.state';

// Estado global de la aplicación
export interface AppState {
  pets: PetState;
  users: UserState;
  adoptions: AdoptionState;
}

// Estados de carga comunes
export enum LoadingState {
  INIT = 'INIT',
  LOADING = 'LOADING', 
  LOADED = 'LOADED',
  ERROR = 'ERROR'
}

// Interface base para estados con loading
export interface BaseState {
  loading: LoadingState;
  error: string | null;
}

// Interface para respuestas paginadas
export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Filtros comunes
export interface CommonFilters {
  search?: string;
  category?: string;
  location?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Interface para notificaciones
export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: string;
  style?: 'primary' | 'secondary' | 'danger';
}

// Interface para configuración de usuario
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'es' | 'en';
  notifications: {
    push: boolean;
    email: boolean;
    adoptionUpdates: boolean;
    newPets: boolean;
    messages: boolean;
  };
  privacy: {
    showProfile: boolean;
    showLocation: boolean;
    showContactInfo: boolean;
  };
}

// Interface para métricas de la aplicación
export interface AppMetrics {
  totalPets: number;
  totalAdoptions: number;
  totalUsers: number;
  activeUsers: number;
  pendingAdoptions: number;
  adoptionRate: number;
  averageAdoptionTime: number;
  topCategories: { category: string; count: number }[];
  topLocations: { location: string; count: number }[];
}

// Estados de conexión
export interface ConnectionState {
  isOnline: boolean;
  lastSync: Date | null;
  pendingSync: number;
  syncInProgress: boolean;
}