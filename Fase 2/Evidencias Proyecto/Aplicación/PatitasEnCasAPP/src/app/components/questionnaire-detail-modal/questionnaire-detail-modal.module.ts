import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { QuestionnaireDetailModalComponent } from './questionnaire-detail-modal.component';

@NgModule({
  declarations: [QuestionnaireDetailModalComponent],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [QuestionnaireDetailModalComponent]
})
export class QuestionnaireDetailModalModule { }
