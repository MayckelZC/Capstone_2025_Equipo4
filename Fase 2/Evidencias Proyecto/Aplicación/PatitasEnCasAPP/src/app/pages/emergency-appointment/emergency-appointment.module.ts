import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EmergencyAppointmentPageRoutingModule } from './emergency-appointment-routing.module';

import { EmergencyAppointmentPage } from './emergency-appointment.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EmergencyAppointmentPageRoutingModule
  ],
  declarations: [EmergencyAppointmentPage]
})
export class EmergencyAppointmentPageModule {}