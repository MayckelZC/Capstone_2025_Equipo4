import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@core/guards/auth.guard';

const routes: Routes = [
    {
        path: 'create',
        loadChildren: () => import('./pages/report-modal/report-modal.module').then(m => m.ReportModalPageModule),
        canActivate: [AuthGuard]
    },
    {
        path: 'my-reports',
        loadChildren: () => import('./pages/my-reports/my-reports.module').then(m => m.MyReportsPageModule),
        canActivate: [AuthGuard]
    },
    {
        path: 'edit/:id',
        loadChildren: () => import('./pages/edit-report/edit-report.module').then(m => m.EditReportPageModule),
        canActivate: [AuthGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ReportsRoutingModule { }

