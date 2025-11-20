import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ScheduleAppointmentModalComponent } from './schedule-appointment-modal.component';

@NgModule({
  declarations: [ScheduleAppointmentModalComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
  exports: [ScheduleAppointmentModalComponent]
})
export class ScheduleAppointmentModalModule { }
