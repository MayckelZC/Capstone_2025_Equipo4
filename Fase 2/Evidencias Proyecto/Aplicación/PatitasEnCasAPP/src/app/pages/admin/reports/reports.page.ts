import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { Observable, of, forkJoin, BehaviorSubject, from, combineLatest } from 'rxjs';
import { switchMap, map, take } from 'rxjs/operators';
import { Adopcion } from '../../../models/Adopcion';
import { User } from '../../../models/user';
import { AlertController } from '@ionic/angular';
import { AuthService } from '../../../services/auth.service'; // Import AuthService

export interface Report {
  id: string;
  petId: string;
  reporterId: string;
  createdAt: Date;
  reason: string;
  details?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'rejected'; // Add status to interface
  reporter?: User;
  publisher?: User; // New field for the owner of the reported pet
  petSnapshot?: {
    id: string;
    nombre?: string;
    urlImagen?: string;
    creadorId?: string;
  };
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
})
export class ReportsPage {
  reports$: Observable<Report[]>;
  filterStatus: BehaviorSubject<string> = new BehaviorSubject<string>('all'); // Default to all reports

  constructor(private firestore: AngularFirestore, private router: Router, private alertController: AlertController, private authService: AuthService) {
    this.reports$ = combineLatest([
      this.firestore.collection<Report>('reports').valueChanges({ idField: 'id' }),
      this.filterStatus
    ]).pipe(
      switchMap(([reports, filterValue]) => {
        if (reports.length === 0) {
          return of([]); // Return an empty observable if no reports
        }
        const reportsWithData$ = reports.map(report => {
          const reporter$ = report.reporterId ? this.firestore.collection<User>('users').doc(report.reporterId).snapshotChanges().pipe(
            take(1),
            map(doc => {
              if (doc.payload.exists) {
                return { uid: doc.payload.id, ...doc.payload.data() } as User;
              } else {
                console.warn(`Reporter with ID ${report.reporterId} not found for report ${report.id}.`);
                return null; // Reporter not found
              }
            })
          ) : of(null);

          // Fetch publisher data if petSnapshot.creadorId exists
          const publisher$ = report.petSnapshot?.creadorId ? this.firestore.collection<User>('users').doc(report.petSnapshot.creadorId).snapshotChanges().pipe(
            take(1),
            map(doc => {
              if (doc.payload.exists) {
                return { uid: doc.payload.id, ...doc.payload.data() } as User;
              } else {
                console.warn(`Publisher with ID ${report.petSnapshot?.creadorId} not found for report ${report.id}.`);
                return null; // Publisher not found
              }
            })
          ) : of(null);

          return combineLatest([reporter$, publisher$]).pipe(
            map(([reporter, publisher]) => {
              return {
                ...report,
                reporter,
                publisher,
                filterValue // Include filter value to trigger re-evaluation
              };
            })
          );
        });
        return forkJoin(reportsWithData$);
      }),
      map(finalReports => {
        const filterValue = this.filterStatus.getValue();
        let processedReports = finalReports.map(report => ({
          ...report,
          createdAt: (report.createdAt as any)?.toDate ? (report.createdAt as any).toDate() : report.createdAt // Ensure it's a Date object
        }));
        let filteredReports = processedReports;

        // Client-side filtering
        if (filterValue !== 'all') {
          filteredReports = filteredReports.filter(report => report.status === filterValue);
        }

        // Client-side ordering
        filteredReports.sort((a, b) => (b.createdAt as Date).getTime() - (a.createdAt as Date).getTime());

        return filteredReports;
      })
    );
  }

  // Initialization handled in constructor observables

  onFilterChange(event: any) {
    this.filterStatus.next(event.detail.value);
  }

  viewPet(petId: string) {
    this.router.navigate(['/detalle'], { queryParams: { id: petId } });
  }

  viewReport(reportId: string) {
    this.router.navigate(['/admin/reports', reportId]);
  }

  public getSpanishStatus(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'reviewed':
        return 'Revisado';
      case 'resolved':
        return 'Resuelto';
      case 'rejected':
        return 'Rechazado';
      default:
        return status;
    }
  }



}
