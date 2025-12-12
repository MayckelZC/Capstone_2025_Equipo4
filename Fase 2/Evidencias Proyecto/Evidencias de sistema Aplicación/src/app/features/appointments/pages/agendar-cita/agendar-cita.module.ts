import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { AgendarCitaPageRoutingModule } from './agendar-cita-routing.module';
import { AgendarCitaPage } from './agendar-cita.page';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        IonicModule,
        AgendarCitaPageRoutingModule
    ],
    declarations: [AgendarCitaPage]
})
export class AgendarCitaPageModule { }
