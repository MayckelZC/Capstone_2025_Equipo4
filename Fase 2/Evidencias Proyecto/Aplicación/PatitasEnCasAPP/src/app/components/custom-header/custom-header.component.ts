import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-custom-header',
  template: `
    <ion-header class="header-enhanced">
      <ion-toolbar>
        <ion-buttons slot="start" *ngIf="showBackButton">
          <ion-back-button 
            [defaultHref]="backUrl" 
            (click)="onBackClick()">
          </ion-back-button>
        </ion-buttons>
        
        <ion-buttons slot="start" *ngIf="startButtons.length > 0">
          <ion-button 
            *ngFor="let button of startButtons" 
            [fill]="button.fill || 'clear'"
            (click)="button.handler()">
            <ion-icon 
              slot="icon-only" 
              [name]="button.icon">
            </ion-icon>
          </ion-button>
        </ion-buttons>

        <ion-title 
          [class]="titleClass"
          class="animate-fade-in">
          {{ title }}
          <div *ngIf="subtitle" class="header-subtitle">
            {{ subtitle }}
          </div>
        </ion-title>

        <ion-buttons slot="end" *ngIf="endButtons.length > 0">
          <ion-button 
            *ngFor="let button of endButtons" 
            [fill]="button.fill || 'clear'"
            [color]="button.color || 'light'"
            (click)="button.handler()">
            <ion-icon 
              *ngIf="button.icon" 
              slot="icon-only" 
              [name]="button.icon">
            </ion-icon>
            <span *ngIf="button.text">{{ button.text }}</span>
          </ion-button>
        </ion-buttons>

        <ion-buttons slot="end" *ngIf="showMenuButton">
          <ion-button (click)="onMenuClick()">
            <ion-icon slot="icon-only" name="menu-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
  `,
  styles: [`
    .header-subtitle {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-normal);
      opacity: 0.9;
      margin-top: 2px;
    }
    
    ion-toolbar {
      --padding-start: var(--spacing-md);
      --padding-end: var(--spacing-md);
    }
    
    ion-title {
      text-align: center;
    }
    
    .title-left {
      text-align: left !important;
    }
    
    .title-right {
      text-align: right !important;
    }
  `]
})
export class CustomHeaderComponent {
  @Input() title: string = '';
  @Input() subtitle?: string;
  @Input() titleClass: string = '';
  @Input() showBackButton: boolean = false;
  @Input() backUrl: string = '/';
  @Input() showMenuButton: boolean = false;
  @Input() startButtons: HeaderButton[] = [];
  @Input() endButtons: HeaderButton[] = [];
  
  @Output() backClick = new EventEmitter<void>();
  @Output() menuClick = new EventEmitter<void>();

  onBackClick() {
    this.backClick.emit();
  }

  onMenuClick() {
    this.menuClick.emit();
  }
}

export interface HeaderButton {
  icon?: string;
  text?: string;
  handler: () => void;
  fill?: string;
  color?: string;
}