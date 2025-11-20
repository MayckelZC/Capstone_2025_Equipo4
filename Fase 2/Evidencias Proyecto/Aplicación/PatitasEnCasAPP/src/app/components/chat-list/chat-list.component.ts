import { Component, Input } from '@angular/core';
import { Conversation } from '../../models/Conversation';

@Component({
  selector: 'app-chat-list',
  template: `
    <ion-list>
      <ion-item *ngFor="let conversation of conversations" 
                [routerLink]="['/chat', conversation.id]"
                detail="false"
                class="conversation-item"
                [class.unread]="conversation.unreadCount?.[currentUserId] > 0">
        <!-- Avatar/Imagen -->
        <ion-avatar slot="start">
          <img [src]="conversation.metadata?.petImageUrl || 'assets/default-avatar.png'"
               [alt]="conversation.metadata?.petName || 'Chat avatar'">
        </ion-avatar>

        <!-- Información principal -->
        <ion-label>
          <h2>{{ conversation.metadata?.petName || 'Chat de adopción' }}</h2>
          <p class="last-message" [class.typing]="conversation.isTyping?.[getOtherParticipantId(conversation)]">
            <ng-container *ngIf="!conversation.isTyping?.[getOtherParticipantId(conversation)]">
              {{ formatLastMessage(conversation.lastMessage) }}
            </ng-container>
            <ng-container *ngIf="conversation.isTyping?.[getOtherParticipantId(conversation)]">
              Escribiendo...
            </ng-container>
          </p>
        </ion-label>

        <!-- Metadata (tiempo y no leídos) -->
        <div slot="end" class="conversation-meta">
          <ion-text color="medium" class="time">
            {{ conversation.lastMessage?.timestamp | date:'short' }}
          </ion-text>
          <ion-badge *ngIf="conversation.unreadCount?.[currentUserId] > 0" color="primary">
            {{ conversation.unreadCount[currentUserId] }}
          </ion-badge>
        </div>
      </ion-item>
    </ion-list>
  `,
  styles: [`
    .conversation-item {
      --padding-start: 1rem;
      --padding-end: 1rem;
      --padding-top: 0.75rem;
      --padding-bottom: 0.75rem;
    }

    .conversation-item.unread {
      --background: var(--ion-color-light-tint);
      font-weight: 500;
    }

    .last-message {
      color: var(--ion-color-medium);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 250px;
    }

    .last-message.typing {
      color: var(--ion-color-primary);
      font-style: italic;
    }

    .conversation-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
      min-width: 4rem;
    }

    .time {
      font-size: 0.8rem;
    }

    ion-badge {
      --padding-start: 0.5rem;
      --padding-end: 0.5rem;
      --padding-top: 0.25rem;
      --padding-bottom: 0.25rem;
    }
  `]
})
export class ChatListComponent {
  @Input() conversations: Conversation[];
  @Input() currentUserId: string;

  getOtherParticipantId(conversation: Conversation): string {
    return conversation.participants.find(id => id !== this.currentUserId) || '';
  }

  formatLastMessage(lastMessage: any): string {
    if (!lastMessage) return '';

    switch (lastMessage.type) {
      case 'image':
        return '📷 Imagen';
      case 'file':
        return '📎 Archivo';
      case 'date_proposal':
        return '📅 Propuesta de fecha';
      case 'location':
        return '📍 Ubicación';
      case 'system':
        return lastMessage.content;
      default:
        return lastMessage.content;
    }
  }
}