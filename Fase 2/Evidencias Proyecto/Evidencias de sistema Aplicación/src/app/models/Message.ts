
import { GeoPoint } from '@angular/fire/firestore';

export type MessageType = 'text' | 'image' | 'location' | 'date_proposal' | 'system' | 'file' | 'checklist';

export interface MessageMetadata {
  proposedDate?: Date;
  location?: GeoPoint;
  imageUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  checklistItems?: { text: string; checked: boolean }[];
}

export interface Message {
  id: string;
  conversationId: string;
  petId!: string;         // ID del animal en adopción
  senderId: string;
  content: string;
  type: MessageType;
  createdAt: Date;
  isRead: boolean;
  readAt?: Date;
  metadata?: MessageMetadata;
  isEdited?: boolean;
  editedAt?: Date;
  replyTo?: string;     // ID del mensaje al que responde
  reactions?: { [userId: string]: string }; // emoji reactions
  systemData?: {
    action?: 'date_confirmed' | 'location_shared' | 'checklist_updated' | 'adoption_status_changed' | 'adoption_step_completed';
    adoptionId?: string;
    petId?: string;
    status?: string;
    stepCompleted?: string;
    checklistProgress?: number;
  };
}
