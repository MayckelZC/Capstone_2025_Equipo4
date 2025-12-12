import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdminPage } from './admin.page';

const routes: Routes = [
  {
    path: '',
    component: AdminPage,
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardPageModule)
      },
      {
        path: 'users',
        loadChildren: () => import('./users/users.module').then(m => m.UsersPageModule)
      },
      {
        path: 'users/edit/:id',
        loadChildren: () => import('./edit-user/edit-user.module').then(m => m.EditUserPageModule)
      },
      {
        path: 'users/create',
        loadChildren: () => import('./create-user/create-user.module').then(m => m.CreateUserPageModule)
      },
      {
        path: 'pets',
        loadChildren: () => import('./pets/pets.module').then(m => m.PetsPageModule)
      },
      {
        path: 'reports',
        loadChildren: () => import('./reports/reports.module').then(m => m.ReportsPageModule)
      },
      {
        path: 'reports/:id',
        loadChildren: () => import('./report-details/report-details.module').then(m => m.ReportDetailsPageModule)
      },
      {
        path: 'adoption-requests',
        loadChildren: () => import('./adoption-requests/adoption-requests.module').then(m => m.AdoptionRequestsPageModule)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'shelters',
    loadChildren: () => import('./shelters/shelters.module').then(m => m.SheltersPageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminPageRoutingModule { }
