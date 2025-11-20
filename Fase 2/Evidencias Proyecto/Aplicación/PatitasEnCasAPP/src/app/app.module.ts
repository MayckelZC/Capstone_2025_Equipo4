import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import { environment } from '../environments/environment';
import { CommonModule } from '@angular/common';
import 'firebase/compat/firestore'; // Ensure Firestore compat is loaded globally

// NgRx imports
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { reducers, metaReducers } from './store';
import { PetEffects } from './store/pets/pets.effects';

import { AdoptionQuestionnaireComponent } from './components/adoption-questionnaire/adoption-questionnaire.component';
import { QuestionnaireViewComponent } from './components/questionnaire-view/questionnaire-view.component';
import { AdoptionDocumentsViewerComponent } from './components/adoption-documents-viewer/adoption-documents-viewer.component';
import { DeliveryConfirmationModalComponent } from './components/delivery-confirmation-modal/delivery-confirmation-modal.component';
// PetLivingSpaceTranslatePipe moved to PipesModule
import { PipesModule } from './pipes/pipes.module';
import { SharedComponentsModule } from './components/shared-components.module';

// Register Spanish locale
registerLocaleData(localeEs, 'es');

@NgModule({
  declarations: [AppComponent, AdoptionQuestionnaireComponent, QuestionnaireViewComponent, AdoptionDocumentsViewerComponent, DeliveryConfirmationModalComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFireStorageModule,
    PipesModule,
    SharedComponentsModule,

    // NgRx configuration
    StoreModule.forRoot(reducers, {
      metaReducers,
      runtimeChecks: {
        strictStateImmutability: true,
        strictActionImmutability: true,
        strictStateSerializability: true,
        strictActionSerializability: true,
      }
    }),
    EffectsModule.forRoot([PetEffects]),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: environment.production,
      autoPause: true,
      features: {
        pause: false,
        lock: true,
        persist: true
      }
    })
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: LOCALE_ID, useValue: 'es' }
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
