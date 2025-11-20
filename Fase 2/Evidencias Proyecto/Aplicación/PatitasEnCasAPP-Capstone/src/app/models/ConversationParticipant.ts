export type ParticipantRole = 'publisher' | 'adopter' | 'admin';
export type ParticipantStatus = 'active' | 'blocked' | 'left';

export interface ConversationParticipant {
  userId: string;
  conversationId: string;
  role: ParticipantRole;
  status: ParticipantStatus;
  joinedAt: Date;
  lastSeen?: Date;
  isTyping?: boolean;
  deviceToken?: string; // Para notificaciones push
  mutedUntil?: Date;
  preferences?: {
    notifications: boolean;
    soundEnabled: boolean;
    desktopNotifications: boolean;
  };
  metadata?: {
    adopter?: {
      applicationId: string;
      applicationStatus: string;
    };
    publisher?: {
      petId: string;
      petName: string;
    };
  };
}