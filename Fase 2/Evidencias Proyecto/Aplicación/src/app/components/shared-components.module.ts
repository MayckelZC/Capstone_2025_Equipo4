import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PipesModule } from '../pipes/pipes.module';

// Componentes personalizados
import { CustomHeaderComponent } from './custom-header/custom-header.component';
import { CustomButtonComponent } from './custom-button/custom-button.component';
import { CustomLoadingComponent } from './custom-loading/custom-loading.component';
import { FormGroupComponent } from './form-group/form-group.component';
import { SmartSearchBarComponent } from './smart-search-bar/smart-search-bar.component';
import { ImageGalleryComponent } from './image-gallery/image-gallery.component';
import { RatingDisplayComponent } from './rating-display/rating-display.component';
import { ThemeToggleComponent } from './theme-toggle/theme-toggle.component';
import { PetSkeletonCardComponent } from './skeleton-screens/pet-skeleton-card.component';
import { NotificationsBellComponent } from './notifications-bell/notifications-bell.component';

// Components moved from AppModule
import { AdoptionQuestionnaireComponent } from './adoption-questionnaire/adoption-questionnaire.component';
import { QuestionnaireViewComponent } from './questionnaire-view/questionnaire-view.component';
import { AdoptionDocumentsViewerComponent } from './adoption-documents-viewer/adoption-documents-viewer.component';

@NgModule({
  declarations: [
    CustomHeaderComponent,
    CustomButtonComponent,
    CustomLoadingComponent,
    FormGroupComponent,
    SmartSearchBarComponent,
    ImageGalleryComponent,
    RatingDisplayComponent,
    ThemeToggleComponent,
    PetSkeletonCardComponent,
    NotificationsBellComponent,
    AdoptionQuestionnaireComponent,
    QuestionnaireViewComponent,
    AdoptionDocumentsViewerComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    PipesModule
  ],
  exports: [
    CustomHeaderComponent,
    CustomButtonComponent,
    CustomLoadingComponent,
    FormGroupComponent,
    SmartSearchBarComponent,
    ImageGalleryComponent,
    RatingDisplayComponent,
    ThemeToggleComponent,
    PetSkeletonCardComponent,
    NotificationsBellComponent,
    AdoptionQuestionnaireComponent,
    QuestionnaireViewComponent,
    AdoptionDocumentsViewerComponent,
    // Exportamos también los módulos comunes para facilitar el uso
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class SharedComponentsModule { }