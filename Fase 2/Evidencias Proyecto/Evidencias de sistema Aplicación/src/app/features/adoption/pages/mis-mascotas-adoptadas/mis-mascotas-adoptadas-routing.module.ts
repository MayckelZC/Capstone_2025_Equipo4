import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MisMascotasAdoptadasPage } from './mis-mascotas-adoptadas.page';

const routes: Routes = [
  {
    path: '',
    component: MisMascotasAdoptadasPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MisMascotasAdoptadasPageRoutingModule {}


