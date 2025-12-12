import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ConsultationPreconsultPage } from './consultation-preconsult.page';

const routes: Routes = [
  {
    path: ':id',
    component: ConsultationPreconsultPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConsultationPreconsultPageRoutingModule { }
