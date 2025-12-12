import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PublicGuard } from '@core/guards/public.guard';

const routes: Routes = [
    {
        path: 'login',
        loadChildren: () => import('./pages/login/login.module').then(m => m.LoginPageModule),
        canActivate: [PublicGuard]
    },
    {
        path: 'registro',
        loadChildren: () => import('./pages/registro/registro.module').then(m => m.RegistroPageModule),
        canActivate: [PublicGuard]
    },
    {
        path: 'restablecer',
        loadChildren: () => import('./pages/restablecer/restablecer.module').then(m => m.RestablecerPageModule)
    },
    {
        path: 'verificacion-pendiente',
        loadChildren: () => import('./pages/verificacion-pendiente/verificacion-pendiente.module').then(m => m.VerificacionPendientePageModule)
    },
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AuthRoutingModule { }

