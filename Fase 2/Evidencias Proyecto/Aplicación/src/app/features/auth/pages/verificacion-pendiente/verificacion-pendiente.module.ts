import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { VerificacionPendientePageRoutingModule } from './verificacion-pendiente-routing.module';

import { VerificacionPendientePage } from './verificacion-pendiente.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VerificacionPendientePageRoutingModule
  ],
  declarations: [VerificacionPendientePage]
})
export class VerificacionPendientePageModule {}

