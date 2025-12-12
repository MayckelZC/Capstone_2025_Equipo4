import { Injectable } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from '@core/services/auth.service';
import { Adopcion } from '@models/Adopcion'; // Import Adopcion interface
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface Report {
  id?: string;
  reporterId: string;
  reportedItemId: string;
  reportedItemType: 'pet' | 'user' | 'adopcion'; // Define types as needed
  reason: string;
  reasonLabel?: string; // Human-readable label (e.g., Spanish) for display
  details?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'rejected';
  createdAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  actionTaken?: string;

  // Snapshot of pet data at the time of reporting
  petSnapshot?: {
    id: string;
    nombre?: string;
    urlImagen?: string;
    creadorId?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService,
    private logger: LoggerService
  ) { }

  async submitReport(reportedItemId: string, reportedItemType: 'pet' | 'user' | 'adopcion', reason: string, details?: string, pet?: Adopcion): Promise<void> {
    const currentUser = await this.authService.getCurrentUser();

    if (!currentUser) {
      throw new Error('User not authenticated. Cannot submit report.');
    }

    // Prevent self-reporting: reporter cannot report their own user account or their own pet
    try {
      if (reportedItemType === 'pet' && pet && pet.creadorId && pet.creadorId === currentUser.uid) {
        throw new Error('No puedes reportar tu propia publicación.');
      }
      if (reportedItemType === 'user' && reportedItemId === currentUser.uid) {
        throw new Error('No puedes reportarte a ti mismo.');
      }
    } catch (err) {
      // rethrow to be handled by caller
      throw err;
    }

    const reasonLabelMap: { [key: string]: string } = {
      'inappropriate_content': 'Contenido inapropiado',
      'false_information': 'Información falsa',
      'spam': 'Spam o publicidad',
      'animal_abuse': 'Maltrato animal',
      'other': 'Otro motivo'
    };

    const report: Report = {
      reporterId: currentUser.uid,
      reportedItemId,
      reportedItemType,
      reason,
      reasonLabel: reasonLabelMap[reason] || reason,
      details,
      status: 'pending',
      createdAt: new Date()
    };

    if (reportedItemType === 'pet' && pet) {
      report.petSnapshot = {
        id: pet.id,
        nombre: pet.nombre,
        urlImagen: pet.urlImagen,
        creadorId: pet.creadorId
      };
    }

    try {
      await this.firestore.collection('reports').add(report);
    } catch (error) {
      this.logger.error('Error submitting report:', error);
      throw new Error('Failed to submit report.');
    }
  }

  getLatestPendingReports(limit: number = 5) {
    return this.firestore.collection<Report>('reports', ref =>
      ref.where('status', '==', 'pending')
        .orderBy('createdAt', 'desc')
        .limit(limit)
    ).valueChanges({ idField: 'id' }).pipe(
      catchError(error => {
        console.warn('Firebase Index missing, falling back to client-side sorting', error);
        return this.firestore.collection<Report>('reports', ref =>
          ref.where('status', '==', 'pending')
        ).valueChanges({ idField: 'id' }).pipe(
          map(reports => reports
            .sort((a, b) => {
              const dateA = (a.createdAt as any)?.toDate ? (a.createdAt as any).toDate() : new Date(a.createdAt);
              const dateB = (b.createdAt as any)?.toDate ? (b.createdAt as any).toDate() : new Date(b.createdAt);
              return dateB.getTime() - dateA.getTime();
            })
            .slice(0, limit)
          )
        );
      })
    );
  }

  getPendingReportsCount(): Observable<number> {
    return this.firestore.collection<Report>('reports', ref =>
      ref.where('status', '==', 'pending')
    ).snapshotChanges().pipe(
      map(snaps => snaps.length)
    );
  }

  getNewPendingReportsCountThisWeek(): Observable<number> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return this.firestore.collection<Report>('reports', ref =>
      ref.where('status', '==', 'pending')
        .where('createdAt', '>=', oneWeekAgo)
    ).snapshotChanges().pipe(
      map(snaps => snaps.length)
    );
  }

  /**
   * Obtener conteo de reportes por tipo de razón
   */
  getReportsByType(): Observable<{ [key: string]: number }> {
    return this.firestore.collection<Report>('reports').valueChanges().pipe(
      map(reports => {
        const counts: { [key: string]: number } = {};

        reports.forEach(report => {
          const reason = report.reasonLabel || report.reason || 'Otro';
          if (counts[reason]) {
            counts[reason]++;
          } else {
            counts[reason] = 1;
          }
        });

        return counts;
      })
    );
  }
}
