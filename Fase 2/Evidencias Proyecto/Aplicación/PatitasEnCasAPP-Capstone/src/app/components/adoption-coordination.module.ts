import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

import { AdoptionChecklistComponent } from './adoption-checklist/adoption-checklist.component';
import { AdoptionSchedulerComponent } from './adoption-scheduler/adoption-scheduler.component';
import { AdoptionFormsComponent } from './adoption-forms/adoption-forms.component';
import { LocationSharingComponent } from './location-sharing/location-sharing.component';
import { AdoptionCompletionComponent } from './adoption-completion/adoption-completion.component';

@NgModule({
  declarations: [
    AdoptionChecklistComponent,
    AdoptionSchedulerComponent,
    AdoptionFormsComponent,
    LocationSharingComponent,
    AdoptionCompletionComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule
  ],
  exports: [
    AdoptionChecklistComponent,
    AdoptionSchedulerComponent,
    AdoptionFormsComponent,
    LocationSharingComponent,
    AdoptionCompletionComponent
  ]
})
export class AdoptionCoordinationModule { }