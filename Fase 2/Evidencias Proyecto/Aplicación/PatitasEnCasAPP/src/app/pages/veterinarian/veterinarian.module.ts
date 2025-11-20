import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { VeterinarianPageRoutingModule } from './veterinarian-routing.module';
import { VeterinarianDashboardPage } from './veterinarian-dashboard/veterinarian-dashboard.page';
import { PetMedicalHistoryPage } from './pet-medical-history/pet-medical-history.page';
import { AddEditMedicalRecordPage } from './add-edit-medical-record/add-edit-medical-record.page';
import { ConsultationPage } from './consultation/consultation.page';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { AppointmentDetailModalModule } from './components/appointment-detail-modal/appointment-detail-modal.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    VeterinarianPageRoutingModule,
    AppointmentDetailModalModule,
    CalendarModule.forRoot({
      provide: DateAdapter,
      useFactory: adapterFactory
    })
  ],
  declarations: [
    VeterinarianDashboardPage,
    PetMedicalHistoryPage,
    AddEditMedicalRecordPage,
    ConsultationPage
  ]
})
export class VeterinarianModule {}
