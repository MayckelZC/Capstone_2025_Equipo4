import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VaccinesPage } from './vaccines.page';

const routes: Routes = [
  {
    path: '',
    component: VaccinesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VaccinesPageRoutingModule {}
