import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RequestHandoverPage } from './request-handover.page';

const routes: Routes = [
  {
    path: '',
    component: RequestHandoverPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RequestHandoverPageRoutingModule {}


