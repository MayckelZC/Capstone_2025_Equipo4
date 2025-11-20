import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EmergencyAppointmentPage } from './emergency-appointment.page';

const routes: Routes = [
  {
    path: '',
    component: EmergencyAppointmentPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EmergencyAppointmentPageRoutingModule {}