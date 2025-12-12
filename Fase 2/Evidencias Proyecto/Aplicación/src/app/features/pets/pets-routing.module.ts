import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@core/guards/auth.guard';

const routes: Routes = [
    {
        path: 'home',
        loadChildren: () => import('./pages/home/home.module').then(m => m.HomePageModule),
        canActivate: [AuthGuard]
    },
    {
        path: 'detalle',
        loadChildren: () => import('./pages/detalle/detalle.module').then(m => m.DetallePageModule),
        canActivate: [AuthGuard]
    },
    {
        path: 'crear',
        loadChildren: () => import('./pages/crearadopcion/crearadopcion.module').then(m => m.CrearadopcionPageModule),
        canActivate: [AuthGuard]
    },
    {
        path: 'modificar',
        loadChildren: () => import('./pages/modificar/modificar.module').then(m => m.ModificarPageModule),
        canActivate: [AuthGuard]
    },
    {
        path: 'favorites',
        loadChildren: () => import('./pages/favorites/favorites.module').then(m => m.FavoritesPageModule),
        canActivate: [AuthGuard]
    },
    {
        path: 'search',
        loadChildren: () => import('./pages/advanced-search/advanced-search.module').then(m => m.AdvancedSearchPageModule)
    },
    {
        path: 'filter',
        loadChildren: () => import('./pages/filter-modal/filter-modal.module').then(m => m.FilterModalPageModule)
    },
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class PetsRoutingModule { }

