import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ReceivedRequestsPageRoutingModule } from './received-requests-routing.module';
import { ReceivedRequestsPage } from './received-requests.page';
import { QuestionnaireModalComponent } from '../../components/questionnaire-modal/questionnaire-modal.component';
import { QuestionnaireDetailModalModule } from '../../components/questionnaire-detail-modal/questionnaire-detail-modal.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReceivedRequestsPageRoutingModule,
    QuestionnaireDetailModalModule
  ],
  declarations: [
    ReceivedRequestsPage,
    QuestionnaireModalComponent
  ]
})
export class ReceivedRequestsPageModule {}