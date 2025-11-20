import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { PublicGuard } from './guards/public.guard';
import { VeterinarianGuard } from './guards/veterinarian.guard';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then(m => m.HomePageModule),
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then(m => m.LoginPageModule),
    canActivate: [PublicGuard],
  },
  {
    path: 'registro',
    loadChildren: () => import('./pages/registro/registro.module').then(m => m.RegistroPageModule),
    canActivate: [PublicGuard],
  },
  {
    path: 'restablecer',
    loadChildren: () => import('./pages/restablecer/restablecer.module').then(m => m.RestablecerPageModule),
  },
  {
    path: 'crearadopcion',
    loadChildren: () => import('./pages/crearadopcion/crearadopcion.module').then(m => m.CrearadopcionPageModule),
    canActivate: [AuthGuard], // Proteger ruta
  },
  {
    path: 'detalle',
    loadChildren: () => import('./pages/detalle/detalle.module').then(m => m.DetallePageModule),
    canActivate: [AuthGuard], // Proteger ruta
  },

  {
    path: 'adoption-requests/:id',
    loadChildren: () => import('./pages/adoption-requests/adoption-requests.module').then(m => m.AdoptionRequestsPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'modificar',
    loadChildren: () => import('./pages/modificar/modificar.module').then(m => m.ModificarPageModule),
    canActivate: [AuthGuard], // Proteger ruta
  },
  {
    path: 'request-handover/:requestId',
    loadChildren: () => import('./pages/request-handover/request-handover.module').then(m => m.RequestHandoverPageModule)
  },
  {
    path: 'verificacion-pendiente',
    loadChildren: () => import('./pages/verificacion-pendiente/verificacion-pendiente.module').then(m => m.VerificacionPendientePageModule)
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'error404',
    loadChildren: () => import('./pages/error404/error404.module').then(m => m.Error404PageModule),
  },
  {
    path: 'perfil',
    loadChildren: () => import('./pages/perfil/perfil.module').then(m => m.PerfilPageModule)
  },
  {
    path: 'editar-perfil',
    loadChildren: () => import('./pages/editar-perfil/editar-perfil.module').then(m => m.EditarPerfilPageModule)
  },
  {
    path: 'admin',
    loadChildren: () => import('./pages/admin/admin.module').then(m => m.AdminPageModule),
    canActivate: [AdminGuard]
  },
  {
    path: 'report-modal',
    loadChildren: () => import('./pages/report-modal/report-modal.module').then(m => m.ReportModalPageModule)
  },
  {
    path: 'my-adoptions',
    loadChildren: () => import('./pages/my-adoptions/my-adoptions.module').then(m => m.MyAdoptionsPageModule),
    canActivate: [AuthGuard] // Protect this route
  },
  {
    path: 'advanced-search',
    loadChildren: () => import('./pages/advanced-search/advanced-search.module').then(m => m.AdvancedSearchPageModule)
  },
  {
    path: 'favorites',
    loadChildren: () => import('./pages/favorites/favorites.module').then(m => m.FavoritesPageModule)
  },
  {
    path: 'my-reports',
    loadChildren: () => import('./pages/my-reports/my-reports.module').then(m => m.MyReportsPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'vaccines',
    loadChildren: () => import('./pages/vaccines/vaccines.module').then(m => m.VaccinesPageModule),
    canActivate: [AuthGuard]
  },
  // {
  //   path: 'success-stories',
  //   loadChildren: () => import('./pages/success-stories/success-stories.module').then( m => m.SuccessStoriesPageModule)
  // },
  // {
  //   path: 'create-success-story',
  //   loadChildren: () => import('./pages/create-success-story/create-success-story.module').then( m => m.CreateSuccessStoryPageModule)
  // },
  // {
  //   path: 'donate',
  //   loadChildren: () => import('./pages/donate/donate.module').then( m => m.DonatePageModule)
  // },
  {
    path: 'articles',
    loadChildren: () => import('./pages/articles/articles.module').then(m => m.ArticlesPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'emergency-appointment',
    loadChildren: () => import('./pages/emergency-appointment/emergency-appointment.module').then(m => m.EmergencyAppointmentPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'entrega-mascota/:id',
    loadChildren: () => import('./pages/entrega-mascota/entrega-mascota.module').then(m => m.EntregaMascotaPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'mis-mascotas-adoptadas',
    loadChildren: () => import('./pages/mis-mascotas-adoptadas/mis-mascotas-adoptadas.module').then(m => m.MisMascotasAdoptadasPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'received-requests',
    loadChildren: () => import('./pages/received-requests/received-requests.module').then(m => m.ReceivedRequestsPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'veterinarian/dashboard',
    loadChildren: () => import('./pages/veterinarian/dashboard/dashboard.module').then(m => m.DashboardPageModule),
    canActivate: [VeterinarianGuard]
  },
  {
    path: 'veterinarian/preconsult/:id',
    loadChildren: () => import('./pages/veterinarian/consultation-preconsult/consultation-preconsult.module').then(m => m.ConsultationPreconsultPageModule),
    canActivate: [VeterinarianGuard]
  },
  {
    path: 'veterinarian/consultation/:id',
    loadChildren: () => import('./pages/veterinarian/consultation/consultation.module').then(m => m.ConsultationPageModule),
    canActivate: [VeterinarianGuard]
  },
  {
    path: 'mis-citas',
    loadChildren: () => import('./pages/mis-citas/mis-citas.module').then(m => m.MisCitasPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: 'error404',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
})
export class AppRoutingModule { }
