import { GeoPoint } from '@angular/fire/firestore';
import { AdoptionStatus } from './petStatus';

export type ConversationStatus = 'active' | 'completed' | 'cancelled' | 'blocked';

export interface ConversationMetadata {
  adoptionAgreementUrl?: string;
  meetingScheduled?: boolean;
  meetingDate?: Date;
  meetingLocation?: GeoPoint;
  meetingNotes?: string;
  checklistCompleted?: boolean;
  lastChecklist?: {
    items: { text: string; checked: boolean }[];
    updatedAt: Date;
  };
  adoptionRequestId: string;  // ID de la solicitud de adopción relacionada
}

export interface LastMessage {
  content: string;
  timestamp: Date;
  senderId: string;
  type: string;
}

export interface Conversation {
  id: string;
  petId: string;            // ID del animal en adopción
  petName: string;          // Nombre del animal
  petImageUrl?: string;     // URL de la imagen del animal
  adopterId: string;        // ID del usuario interesado en adoptar
  ownerId: string;          // ID del dueño actual del animal
  participants: string[];   // Array con los IDs de los participantes
  status: ConversationStatus;
  adoptionStatus?: AdoptionStatus;  // Estado actual del proceso de adopción
  createdAt: Date;
  updatedAt: Date;
  lastMessage: LastMessage;
  metadata: ConversationMetadata;
  unreadCount?: { [userId: string]: number };
  isTyping?: { [userId: string]: boolean };
  blocked?: boolean;
  blockedBy?: string;
  blockedAt?: Date;
  reportCount?: number;
}