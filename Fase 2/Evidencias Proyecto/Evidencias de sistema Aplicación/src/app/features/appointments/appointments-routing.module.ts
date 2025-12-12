import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@core/guards/auth.guard';

const routes: Routes = [
    {
        path: '',
        redirectTo: 'mis-citas',
        pathMatch: 'full'
    },
    {
        path: 'mis-citas',
        loadChildren: () => import('./pages/mis-citas/mis-citas.module').then(m => m.MisCitasPageModule),
        canActivate: [AuthGuard]
    },
    {
        path: 'agendar',
        loadChildren: () => import('./pages/agendar-cita/agendar-cita.module').then(m => m.AgendarCitaPageModule),
        canActivate: [AuthGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AppointmentsRoutingModule { }

