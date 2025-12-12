import { EntityState } from '@ngrx/entity';
import { BaseState, LoadingState, CommonFilters, PaginatedResponse } from '../app.state';

// Interface para mascotas
export interface Pet {
  id: string;
  name: string;
  type: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  breed: string;
  age: number;
  ageUnit: 'months' | 'years';
  gender: 'male' | 'female';
  size: 'small' | 'medium' | 'large';
  description: string;
  location: {
    city: string;
    state: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  images: PetImage[];
  healthInfo: {
    vaccinated: boolean;
    sterilized: boolean;
    dewormed: boolean;
    healthNotes?: string;
    veterinaryContact?: string;
  };
  temperament: string[];
  specialNeeds?: string;
  adoptionRequirements?: string[];
  status: 'available' | 'pending' | 'adopted' | 'unavailable';
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Campos adicionales para búsqueda y análisis
  views: number;
  favorites: number;
  inquiries: number;
  isUrgent?: boolean;
  adoptionFee?: number;
  tags?: string[];
}

export interface PetImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  alt: string;
  isPrimary: boolean;
  order: number;
}

// Filtros específicos para mascotas
export interface PetFilters extends CommonFilters {
  type?: Pet['type'][];
  gender?: Pet['gender'][];
  size?: Pet['size'][];
  ageMin?: number;
  ageMax?: number;
  vaccinated?: boolean;
  sterilized?: boolean;
  hasSpecialNeeds?: boolean;
  adoptionFee?: {
    min?: number;
    max?: number;
  };
  temperament?: string[];
  urgentOnly?: boolean;
}

// Estado de mascotas usando Entity State para optimización
export interface PetState extends EntityState<Pet>, BaseState {
  // Lista actual de mascotas
  selectedPetId: string | null;
  
  // Filtros y búsqueda
  currentFilters: PetFilters;
  searchResults: PaginatedResponse<string> | null; // IDs de mascotas
  
  // Favoritos del usuario actual
  userFavorites: string[]; // IDs de mascotas
  
  // Cache de búsquedas recientes
  recentSearches: string[];
  popularSearches: string[];
  
  // Estado de detalles
  petDetails: { [petId: string]: PetDetails };
  
  // Métricas y estadísticas
  statistics: PetStatistics;
}

// Detalles extendidos de una mascota
export interface PetDetails {
  pet: Pet;
  owner: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
    totalAdoptions: number;
  };
  adoptionRequests: AdoptionRequestSummary[];
  similarPets: Pet[];
  viewHistory: PetViewRecord[];
}

export interface AdoptionRequestSummary {
  id: string;
  adopterId: string;
  adopterName: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  message: string;
}

export interface PetViewRecord {
  userId?: string;
  timestamp: Date;
  source: 'search' | 'direct' | 'similar' | 'favorite';
}

// Estadísticas de mascotas
export interface PetStatistics {
  totalCount: number;
  availableCount: number;
  adoptedCount: number;
  byType: { [type: string]: number };
  byLocation: { [location: string]: number };
  averageAdoptionTime: number;
  mostPopularBreeds: { breed: string; count: number }[];
  adoptionTrends: { month: string; adoptions: number }[];
}

// Estado inicial
export const initialPetState: PetState = {
  // EntityState
  ids: [],
  entities: {},
  
  // BaseState
  loading: LoadingState.INIT,
  error: null,
  
  // PetState específico
  selectedPetId: null,
  currentFilters: {},
  searchResults: null,
  userFavorites: [],
  recentSearches: [],
  popularSearches: [],
  petDetails: {},
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
};