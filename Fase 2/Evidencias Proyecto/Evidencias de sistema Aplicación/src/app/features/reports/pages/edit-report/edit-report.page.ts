import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastService } from '@shared/services/toast.service';

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
  selector: 'app-edit-report',
  templateUrl: './edit-report.page.html',
  styleUrls: ['./edit-report.page.scss'],
})
export class EditReportPage implements OnInit {
  reportId: string | null = null;
  report: ReportListItem | null = null;
  loading = true;
  reportForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private afs: AngularFirestore,
    private fb: FormBuilder,
    private toastService: ToastService
  ) {
    this.reportForm = this.fb.group({
      reason: ['', Validators.required],
      details: [''],
    });
    
  }

  ngOnInit() {
    
    // Accept the report id either as a route param (/edit-report/:id)
    // or as a query param (/edit-report?id=...).
    const paramId = this.route.snapshot.paramMap.get('id');
    const queryId = this.route.snapshot.queryParamMap.get('id');
    this.reportId = paramId || queryId;
    

    if (this.reportId) {
      this.afs.collection('reports').doc<ReportListItem>(this.reportId).valueChanges().subscribe(
        (reportData) => {
          
          if (reportData) {
            this.report = { ...reportData, id: this.reportId! };
            this.reportForm.patchValue({
              reason: this.report!.reason,
              details: this.report!.details,
            });
          } else {
            console.warn('Report not found for ID:', this.reportId); // Debug log
            this.toastService.presentToast('Reporte no encontrado.', 'danger', 'alert-circle-outline');
            this.router.navigate(['/reports/my-reports']);
          }
          this.loading = false;
        },
        (error) => {
          console.error('Error fetching report:', error); // Debug log
          this.toastService.presentToast('Error al cargar el reporte.', 'danger', 'alert-circle-outline');
          this.router.navigate(['/my-reports']);
          this.loading = false;
        }
      );
    } else {
      console.error('Report ID not provided in route.'); // Debug log
      this.toastService.presentToast('ID de reporte no proporcionado.', 'danger', 'alert-circle-outline');
      this.router.navigate(['/my-reports']);
      this.loading = false;
    }
  }

  async saveReport() {
    if (this.reportForm.valid && this.reportId) {
      this.loading = true;
      try {
        await this.afs.collection('reports').doc(this.reportId).update(this.reportForm.value);
        this.toastService.presentToast('Reporte actualizado correctamente.', 'success', 'checkmark-circle-outline');
        this.router.navigate(['/my-reports']);
      } catch (error) {
        console.error('Error updating report:', error);
        this.toastService.presentToast('Error al actualizar el reporte.', 'danger', 'alert-circle-outline');
      } finally {
        this.loading = false;
      }
    }
  }

  cancel() {
    this.router.navigate(['/my-reports']);
  }
}

