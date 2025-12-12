import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@core/guards/auth.guard';

const routes: Routes = [
    {
        path: 'requests/:id',
        loadChildren: () => import('./pages/adoption-requests/adoption-requests.module').then(m => m.AdoptionRequestsPageModule),
        canActivate: [AuthGuard]
    },
    {
        path: 'my-adoptions',
        loadChildren: () => import('./pages/my-adoptions/my-adoptions.module').then(m => m.MyAdoptionsPageModule),
        canActivate: [AuthGuard]
    },
    {
        path: 'received-requests',
        loadChildren: () => import('./pages/received-requests/received-requests.module').then(m => m.ReceivedRequestsPageModule),
        canActivate: [AuthGuard]
    },
    {
        path: 'handover/:id',
        loadChildren: () => import('./pages/entrega-mascota/entrega-mascota.module').then(m => m.EntregaMascotaPageModule),
        canActivate: [AuthGuard]
    },
    {
        path: 'adopted-pets',
        loadChildren: () => import('./pages/mis-mascotas-adoptadas/mis-mascotas-adoptadas.module').then(m => m.MisMascotasAdoptadasPageModule),
        canActivate: [AuthGuard]
    },
    {
        path: 'request-handover/:requestId',
        loadChildren: () => import('./pages/request-handover/request-handover.module').then(m => m.RequestHandoverPageModule),
        canActivate: [AuthGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AdoptionRoutingModule { }

