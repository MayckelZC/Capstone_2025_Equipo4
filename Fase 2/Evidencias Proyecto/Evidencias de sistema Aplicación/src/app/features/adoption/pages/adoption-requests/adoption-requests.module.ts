import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AdoptionRequestsPageRoutingModule } from './adoption-requests-routing.module';
import { AdoptionRequestsPage } from './adoption-requests.page';
import { PipesModule } from '@pipes/pipes.module';
import { QuestionnaireDetailModalModule } from '@components/questionnaire-detail-modal/questionnaire-detail-modal.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdoptionRequestsPageRoutingModule,
    PipesModule,
    QuestionnaireDetailModalModule
  ],
  declarations: [AdoptionRequestsPage]
})
export class AdoptionRequestsPageModule { }

