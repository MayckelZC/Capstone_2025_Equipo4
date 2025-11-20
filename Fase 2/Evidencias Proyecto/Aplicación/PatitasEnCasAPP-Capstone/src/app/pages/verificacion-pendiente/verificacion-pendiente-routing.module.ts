import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VerificacionPendientePage } from './verificacion-pendiente.page';

const routes: Routes = [
  {
    path: '',
    component: VerificacionPendientePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VerificacionPendientePageRoutingModule {}
