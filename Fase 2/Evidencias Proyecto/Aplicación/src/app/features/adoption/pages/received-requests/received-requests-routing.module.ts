import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ReceivedRequestsPage } from './received-requests.page';

const routes: Routes = [
  {
    path: '',
    component: ReceivedRequestsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReceivedRequestsPageRoutingModule {}

