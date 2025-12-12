import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SheltersPage } from './shelters.page';

const routes: Routes = [
  {
    path: '',
    component: SheltersPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SheltersPageRoutingModule {}
