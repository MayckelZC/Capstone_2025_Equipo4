import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ConsultationPreconsultPageRoutingModule } from './consultation-preconsult-routing.module';
import { ConsultationPreconsultPage } from './consultation-preconsult.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ConsultationPreconsultPageRoutingModule
  ],
  declarations: [ConsultationPreconsultPage]
})
export class ConsultationPreconsultPageModule {}
