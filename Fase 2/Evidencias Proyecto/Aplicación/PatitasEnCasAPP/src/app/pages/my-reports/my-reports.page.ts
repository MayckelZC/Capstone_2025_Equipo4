import { Component, OnDestroy, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.service';

export interface User {
  uid: string;
  email: string;
  nombre?: string; // Added nombre
  nombreCompleto?: string;
  photoURL?: string;
  // Add other user properties as needed
}

interface ReportListItem {
  id?: string;
  reporterId: string;
  reportedItemId: string;
  reportedItemType: 'pet' | 'user' | 'adopcion';
  reason: string;
  reasonLabel?: string;
  details?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'rejected';
  createdAt: any;
  petSnapshot?: {
    id: string;
    nombre?: string;
    urlImagen?: string;
    raza?: string;
    edad?: string;
    creadorId?: string;
  };
  publisherSnapshot?: {
    id: string;
    nombre?: string;
    nombreCompleto?: string;
    email?: string;
    photoURL?: string;
  };
  reportedItemImage?: string;
  description?: string;
}

@Component({
  selector: 'app-my-reports',
  templateUrl: './my-reports.page.html',
  styleUrls: ['./my-reports.page.scss'],
})
export class MyReportsPage implements OnInit, OnDestroy {
  reports: ReportListItem[] = [];
  loading = true;
  private sub: Subscription | null = null;
  currentUid: string | null = null;

  constructor(
    private afs: AngularFirestore,
    private authService: AuthService,
    private alertController: AlertController,
    private router: Router,
    private toastService: ToastService
  ) {}

  async ngOnInit() {
    const currentUser = await this.authService.getCurrentUser();
    if (!currentUser) {
      this.reports = [];
      this.loading = false;
      return;
    }

    const uid = currentUser.uid;
    this.currentUid = uid;
    console.log('Searching for reports with reporterId:', uid);
    // First try a simple query without ordering while index builds
    this.sub = this.afs.collection('reports', ref => ref.where('reporterId', '==', uid))
      .snapshotChanges()
      .subscribe(snaps => {
        console.log('Found reports:', snaps.length);
        // Sort the results client-side temporarily
        snaps.sort((a, b) => {
          const dateA = (a.payload.doc.data() as any).createdAt?.toDate?.() || new Date(0);
          const dateB = (b.payload.doc.data() as any).createdAt?.toDate?.() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });
        try {
          const list = snaps.map(s => {
            const doc = s.payload.doc;
            const data: any = doc.data();
            return { doc, data };
          }).map(({ doc, data }) => this.normalizeDoc(doc.id, data));

          if (list.length > 0) {
            console.log('Reports found with direct query:', list);
            this.reports = list;
            // Ensure publisher names are populated when only an id is stored
            this.fillPublishersForReports(this.reports).catch(e => console.debug('fillPublishers error', e));
            this.loading = false;
            return;
          }

          console.log('No reports found with direct query, trying fallback...');
          // If no results, fallback to a broader fetch and client-side filter
          console.debug('No reports found by reporterId. Running fallback fetch...');
          this.afs.collection('reports', ref => ref.orderBy('createdAt', 'desc').limit(200)).snapshotChanges().pipe().subscribe(allSnaps => {
            try {
              const candidates: ReportListItem[] = allSnaps.map(s => {
                const doc = s.payload.doc;
                const data: any = doc.data();
                return this.normalizeDoc(doc.id, data);
              }).filter(r => this.matchesReporter(r, currentUser));

              console.debug('Fallback fetched reports count:', candidates.length);
              this.reports = candidates;
              // Fill missing publisher info if necessary
              this.fillPublishersForReports(this.reports).catch(e => console.debug('fillPublishers error', e));
            } catch (e) {
              console.error('Error processing fallback snapshots:', e);
              this.reports = [];
            }

            this.loading = false;
          }, fallbackErr => {
            console.error('Error during fallback fetch of reports:', fallbackErr);
            this.loading = false;
          });
        } catch (e) {
          console.error('Error processing report snapshots:', e);
          this.reports = [];
          this.loading = false;
        }
      }, err => {
        console.error('Error loading user reports (snapshot):', err);
        this.loading = false;
      });
  }

  /**
   * For reports that have only a publisher id (no nombre), fetch the user doc
   * and populate publisherSnapshot.nombre / nombreCompleto / photoURL.
   */
  private async fillPublishersForReports(reports: ReportListItem[]) {
    if (!reports || reports.length === 0) {
      return;
    }

    const ids = new Set<string>();
    for (const r of reports) {
      const pub = r.publisherSnapshot as any;
      // prefer explicit publisherSnapshot.id, fallbacks to common field names
      const possiblePubId = pub?.id || (r as any).publisherId || (r as any).creadorId || (r as any).publisher || (r as any).ownerId;
      const petCreatorId = (r.petSnapshot as any)?.creadorId;
      const hasName = pub && (pub.nombre || pub.nombreCompleto);

      if (!hasName) {
        if (possiblePubId) ids.add(possiblePubId);
        if (petCreatorId) ids.add(petCreatorId);
      }
    }

    if (ids.size === 0) return;

    try {
      const idArray = Array.from(ids);
      const userPromises = idArray.map(id =>
        // use the underlying firestore ref to get a promise-based snapshot
        this.afs.doc(`users/${id}`).ref.get().then(ds => ({ id, data: ds.exists ? ds.data() : null }))
      );

      const results = await Promise.all(userPromises);
      const userMap = new Map<string, any>();
      for (const r of results) {
        if (r.data) userMap.set(r.id, r.data);
      }

      // update reports in place so the binding updates the UI
      for (const rep of reports) {
        const pub = rep.publisherSnapshot as any;
        const candidateIds = [pub?.id, (rep as any).publisherId, (rep as any).creadorId, (rep.petSnapshot as any)?.creadorId].filter(Boolean) as string[];
        let foundId: string | undefined;
        for (const id of candidateIds) {
          if (userMap.has(id)) { foundId = id; break; }
        }
        if (foundId) {
          const user = userMap.get(foundId);
          rep.publisherSnapshot = {
            id: foundId,
            nombre: user.nombre || user.displayName || user.nombreCompleto || (user.email ? user.email.split('@')[0] : undefined),
            nombreCompleto: user.nombreCompleto || user.displayName || user.nombre,
            email: user.email || pub?.email,
            photoURL: user.photoURL || pub?.photoURL
          } as any;
        }
      }
    } catch (e) {
      console.debug('Error fetching publisher users', e);
    }
  }

  private normalizeDoc(id: string, data: any): ReportListItem {
    let createdAt: any = null;
    if (data && data.createdAt) {
      if (data.createdAt.toDate) {
        createdAt = data.createdAt.toDate();
      } else if (data.createdAt instanceof Date) {
        createdAt = data.createdAt;
      } else if (typeof data.createdAt === 'number') {
        createdAt = new Date(data.createdAt);
      } else {
        createdAt = data.createdAt;
      }
    }

    const item: ReportListItem = {
      id,
      reporterId: data.reporterId || data.reporter || data.reporterUid || data.userId || data.authorId || null,
      reportedItemId: data.reportedItemId || data.petId || data.reportedId,
      reportedItemType: data.reportedItemType || data.type || 'adopcion',
      reason: data.reason,
      reasonLabel: data.reasonLabel,
      details: data.details,
      status: data.status || 'pending',
      createdAt,
      petSnapshot: data.petSnapshot ? {
        ...data.petSnapshot,
        nombre: data.petSnapshot.nombre || 'Mascota sin nombre',
        raza: data.petSnapshot.raza || 'No especificada',
        edad: data.petSnapshot.edad || 'No especificada'
      } : undefined,
      publisherSnapshot: {
        id: data.publisherSnapshot?.id || data.creadorId || data.publisherId || data.ownerId,
        nombre: data.publisherSnapshot?.nombreCompleto || data.publisherSnapshot?.nombre || data.publisherName || data.creadorNombre,
        nombreCompleto: data.publisherSnapshot?.nombreCompleto || data.publisherSnapshot?.nombre || data.publisherName || data.creadorNombre,
        email: data.publisherSnapshot?.email || data.creadorEmail,
        photoURL: data.publisherSnapshot?.photoURL || data.creadorPhotoURL
      }
    } as ReportListItem;

    console.debug('Loaded report doc (normalized):', id, data);
    return item;
  }

  private matchesReporter(report: ReportListItem, currentUser: any): boolean {
    const uid = currentUser?.uid;
    const email = currentUser?.email;
    const possibleReporterFields = [report.reporterId, (report as any).reporter, (report as any).reporterUid, (report as any).userId, (report as any).authorId, (report as any).reporterEmail];
    return possibleReporterFields.some(f => f && (f === uid || f === email));
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  trackById(i: number, item: ReportListItem) {
    return item.id;
  }

  async refreshReports(event: any) {
    const currentUser = await this.authService.getCurrentUser();
    if (currentUser) {
      this.loading = true;
      // La suscripción existente se actualizará automáticamente
      setTimeout(() => {
        event.target.complete();
        this.loading = false;
      }, 1000);
    } else {
      event.target.complete();
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'reviewed':
        return 'primary';
      case 'resolved':
        return 'success';
      case 'rejected':
        return 'danger';
      default:
        return 'medium';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'reviewed':
        return 'En revisión';
      case 'resolved':
        return 'Resuelto';
      case 'rejected':
        return 'Rechazado';
      default:
        return 'Desconocido';
    }
  }

  async viewReportDetails(report: ReportListItem) {
    const alert = await this.alertController.create({
      header: 'Detalles del Reporte',
      cssClass: 'custom-alert report-details-alert',
      message: `
        <div class="report-details">
          ${report.reportedItemType === 'pet' && report.petSnapshot ? `
            <div class="section">
              <h3>Mascota Reportada</h3>
              <p><strong>Nombre:</strong> ${report.petSnapshot.nombre}</p>
              ${report.petSnapshot.raza ? `<p><strong>Raza:</strong> ${report.petSnapshot.raza}</p>` : ''}
              ${report.petSnapshot.edad ? `<p><strong>Edad:</strong> ${report.petSnapshot.edad}</p>` : ''}
            </div>
          ` : ''}

          ${report.publisherSnapshot ? `
            <div class="section">
              <h3>Publicador</h3>
              <p><strong>Nombre:</strong> ${report.publisherSnapshot.nombre}</p>
              ${report.publisherSnapshot.email ? `<p><strong>Email:</strong> ${report.publisherSnapshot.email}</p>` : ''}
            </div>
          ` : ''}

          <div class="section">
            <h3>Detalles del Reporte</h3>
            <p><strong>Razón:</strong> ${report.reasonLabel || report.reason}</p>
            <p><strong>Descripción:</strong> ${report.details || 'No hay descripción'}</p>
            <p><strong>Estado:</strong> <span class="status ${report.status}">${this.getStatusLabel(report.status)}</span></p>
            <p><strong>Fecha de Reporte:</strong> ${report.createdAt?.toDate().toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) || 'N/A'}</p>
          </div>
        </div>
      `,
      buttons: [{
        text: 'Cerrar',
        role: 'cancel'
      }]
    });
    await alert.present();
  }

  async viewReportedItem(report: ReportListItem) {
    if (report.reportedItemType === 'pet') {
      this.router.navigate(['/detalle'], {
        queryParams: { id: report.reportedItemId }
      });
    }
  }

  async deleteReport(report: ReportListItem) {
    const alert = await this.alertController.create({
      header: '¿Eliminar reporte?',
      message: '¿Estás seguro de que deseas eliminar este reporte? Esta acción no se puede deshacer.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.afs.doc(`reports/${report.id}`).delete();
              this.toastService.presentToast('Reporte eliminado correctamente', 'success', 'checkmark-circle-outline');
            } catch (error) {
              console.error('Error al eliminar reporte:', error);
              this.toastService.presentToast('Error al eliminar el reporte', 'danger', 'alert-circle-outline');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  getPendingReports(): number {
    return this.reports.filter(report => 
      report.status === 'pending' || report.status === 'reviewed'
    ).length;
  }

  getResolvedReports(): number {
    return this.reports.filter(report => 
      report.status === 'resolved'
    ).length;
  }

  getRejectedReports(): number {
    return this.reports.filter(report => 
      report.status === 'rejected'
    ).length;
  }

  async editReport(report: ReportListItem) {
    if (report.id) {
      this.router.navigate(['/edit-report', report.id]);
    } else {
      this.toastService.presentToast('No se pudo encontrar el ID del reporte para editar.', 'danger', 'alert-circle-outline');
    }
  }
}