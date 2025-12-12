import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'dashboard',
        loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardPageModule)
    },
    {
        path: 'consultation',
        loadChildren: () => import('./consultation/consultation.module').then(m => m.ConsultationPageModule)
    },
    {
        path: 'consultation-preconsult',
        loadChildren: () => import('./consultation-preconsult/consultation-preconsult.module').then(m => m.ConsultationPreconsultPageModule)
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class VeterinarianPageRoutingModule { }
