import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MisMascotasAdoptadasPageRoutingModule } from './mis-mascotas-adoptadas-routing.module';

import { MisMascotasAdoptadasPage } from './mis-mascotas-adoptadas.page';
import { ScheduleAppointmentModalModule } from '../../../../components/schedule-appointment-modal/schedule-appointment-modal.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MisMascotasAdoptadasPageRoutingModule,
    ScheduleAppointmentModalModule
  ],
  declarations: [MisMascotasAdoptadasPage]
})
export class MisMascotasAdoptadasPageModule {}


