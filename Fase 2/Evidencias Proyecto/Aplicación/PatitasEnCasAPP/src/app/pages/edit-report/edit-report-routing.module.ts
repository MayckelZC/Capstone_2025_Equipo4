import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EditReportPage } from './edit-report.page';

const routes: Routes = [
  {
    path: '',
    component: EditReportPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EditReportPageRoutingModule {}
