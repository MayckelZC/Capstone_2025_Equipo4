import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';
import { PublicGuard } from './core/guards/public.guard';
import { VeterinarianGuard } from './core/guards/veterinarian.guard';
import { SelectivePreloadingStrategy } from './core/strategies/selective-preloading.strategy';


const routes: Routes = [
  // ==================== FEATURE MODULES ====================

  // Auth Feature
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },

  // Pets Feature (HIGH PRIORITY - preload immediately)
  {
    path: 'pets',
    loadChildren: () => import('./features/pets/pets.module').then(m => m.PetsModule),
    data: { preload: true }
  },

  // Adoption Feature (MEDIUM PRIORITY - preload after delay)
  {
    path: 'adoptions',
    loadChildren: () => import('./features/adoption/adoption.module').then(m => m.AdoptionModule)
  },

  // User Feature (HIGH PRIORITY - preload immediately)
  {
    path: 'user',
    loadChildren: () => import('./features/user/user.module').then(m => m.UserModule),
    data: { preload: true }
  },

  // Reports Feature (LOW PRIORITY - load on demand)
  {
    path: 'reports',
    loadChildren: () => import('./features/reports/reports.module').then(m => m.ReportsModule)
  },

  // Appointments Feature (MEDIUM PRIORITY - preload after delay)
  {
    path: 'appointments',
    loadChildren: () => import('./features/appointments/appointments.module').then(m => m.AppointmentsModule)
  },

  // ==================== ADMIN & VETERINARY (LOW PRIORITY) ====================

  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule),
    canActivate: [AdminGuard]
  },
  {
    path: 'veterinarian',
    loadChildren: () => import('./features/veterinarian/veterinarian.module').then(m => m.VeterinarianModule),
    canActivate: [VeterinarianGuard]
  },

  // ==================== SHARED PAGES ====================

  {
    path: 'error404',
    loadChildren: () => import('./shared/pages/error404/error404.module').then(m => m.Error404PageModule)
  },

  // ==================== LEGAL PAGES ====================
  {
    path: 'terminos',
    loadChildren: () => import('./features/legal/pages/terminos/terminos.module').then(m => m.TerminosPageModule)
  },
  {
    path: 'privacidad',
    loadChildren: () => import('./features/legal/pages/privacidad/privacidad.module').then(m => m.PrivacidadPageModule)
  },

  // ==================== DEFAULT ROUTES ====================

  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'error404'
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: SelectivePreloadingStrategy
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }

