import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Componentes personalizados
import { CustomHeaderComponent } from './custom-header/custom-header.component';
import { CustomButtonComponent } from './custom-button/custom-button.component';
import { CustomCardComponent } from './custom-card/custom-card.component';
import { CustomLoadingComponent } from './custom-loading/custom-loading.component';
import { CustomInputComponent } from './custom-input/custom-input.component';
import { FormGroupComponent } from './form-group/form-group.component';
import { SmartSearchBarComponent } from './smart-search-bar/smart-search-bar.component';
import { ImageGalleryComponent } from './image-gallery/image-gallery.component';
import { RatingDisplayComponent } from './rating-display/rating-display.component';
import { ThemeToggleComponent } from './theme-toggle/theme-toggle.component';
import { PetSkeletonCardComponent } from './skeleton-screens/pet-skeleton-card.component';
import { NotificationsBellComponent } from './notifications-bell/notifications-bell.component';

@NgModule({
  declarations: [
    CustomHeaderComponent,
    CustomButtonComponent,
    CustomCardComponent,
    CustomLoadingComponent,
    CustomInputComponent,
    FormGroupComponent,
    SmartSearchBarComponent,
    ImageGalleryComponent,
    RatingDisplayComponent,
    ThemeToggleComponent,
    PetSkeletonCardComponent,
    NotificationsBellComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    CustomHeaderComponent,
    CustomButtonComponent,
    CustomCardComponent,
    CustomLoadingComponent,
    CustomInputComponent,
    FormGroupComponent,
    SmartSearchBarComponent,
    ImageGalleryComponent,
    RatingDisplayComponent,
    ThemeToggleComponent,
    PetSkeletonCardComponent,
    NotificationsBellComponent,
    // Exportamos también los módulos comunes para facilitar el uso
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class SharedComponentsModule { }