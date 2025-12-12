import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { VeterinarianPageRoutingModule } from './veterinarian-routing.module';

// import { PetMedicalHistoryPage } from './pet-medical-history/pet-medical-history.page'; // Doesn't exist
// import { AddEditMedicalRecordPage } from './add-edit-medical-record/add-edit-medical-record.page'; // Doesn't exist
// import { ConsultationPage } from './consultation/consultation.page';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
// import { AppointmentDetailModalModule } from './components/appointment-detail-modal/appointment-detail-modal.module'; // Doesn't exist

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    VeterinarianPageRoutingModule,
    // AppointmentDetailModalModule, // Commented out - doesn't exist
    CalendarModule.forRoot({
      provide: DateAdapter,
      useFactory: adapterFactory
    })
  ],
  declarations: [
    // PetMedicalHistoryPage, // Commented out - doesn't exist
    // AddEditMedicalRecordPage, // Commented out - doesn't exist
    // ConsultationPage // Commented out - already declared in ConsultationPageModule
  ]
})
export class VeterinarianModule { }
