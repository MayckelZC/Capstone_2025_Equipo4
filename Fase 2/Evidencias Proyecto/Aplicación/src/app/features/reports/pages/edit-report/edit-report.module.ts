import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // Import ReactiveFormsModule here

import { IonicModule } from '@ionic/angular';

import { EditReportPageRoutingModule } from './edit-report-routing.module';

import { EditReportPage } from './edit-report.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule, // Now correctly imported
    IonicModule,
    EditReportPageRoutingModule
  ],
  declarations: [EditReportPage]
})
export class EditReportPageModule {}
