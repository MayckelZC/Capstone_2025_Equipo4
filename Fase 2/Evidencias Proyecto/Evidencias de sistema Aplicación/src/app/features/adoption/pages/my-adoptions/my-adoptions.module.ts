import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MyAdoptionsPageRoutingModule } from './my-adoptions-routing.module';
import { MyAdoptionsPage } from './my-adoptions.page';
import { PipesModule } from '@pipes/pipes.module';
import { QuestionnaireDetailModalModule } from '@components/questionnaire-detail-modal/questionnaire-detail-modal.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MyAdoptionsPageRoutingModule,
    PipesModule,
    QuestionnaireDetailModalModule
  ],
  declarations: [MyAdoptionsPage]
})
export class MyAdoptionsPageModule { }
