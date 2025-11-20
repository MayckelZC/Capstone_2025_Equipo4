import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AlertController } from '@ionic/angular';
import { AuthService } from '../../../services/auth.service';
import { Report } from '../reports/reports.page';
import { User } from '../../../models/user';

@Component({
  selector: 'app-report-details',
  templateUrl: './report-details.page.html',
  styleUrls: ['./report-details.page.scss'],
})
export class ReportDetailsPage implements OnInit {
  report: Report | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firestore: AngularFirestore,
    private alertController: AlertController,
    private authService: AuthService
  ) { }

  ngOnInit() {
    const reportId = this.route.snapshot.paramMap.get('id');
    if (reportId) {
      this.firestore.collection<Report>('reports').doc(reportId).valueChanges({ idField: 'id' }).subscribe(report => {
        this.report = report;
        if (this.report && !this.report.reporter && this.report.reporterId) {
          this.firestore.collection<User>('users').doc(this.report.reporterId).valueChanges().subscribe(user => {
            if (this.report)
              this.report.reporter = user;
          });
        }
        if (this.report && !this.report.publisher && this.report.petSnapshot?.creadorId) {
          this.firestore.collection<User>('users').doc(this.report.petSnapshot.creadorId).valueChanges().subscribe(user => {
            if (this.report)
              this.report.publisher = user;
          });
        }
      });
    }
  }

  async markAsReviewed() {
    if (this.report) {
      await this.firestore.collection('reports').doc(this.report.id).update({ status: 'reviewed' });
    }
  }

  async banUser(userId: string) {
    const alert = await this.alertController.create({
      header: 'Confirmar Bloqueo',
      message: '¿Estás seguro de que deseas bloquear a este usuario? Esta acción impedirá que el usuario inicie sesión.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Bloquear',
          handler: async () => {
            await this.authService.updateUserProfile(userId, { isBlocked: true });
            if (this.report) {
              await this.firestore.collection('reports').doc(this.report.id).update({ status: 'resolved', actionTaken: 'User banned' });
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async deleteReport() {
    if (this.report) {
      const alert = await this.alertController.create({
        header: 'Confirmar Eliminación',
        message: '¿Estás seguro de que deseas eliminar este reporte? Esta acción no se puede deshacer.',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
            cssClass: 'secondary',
          },
          {
            text: 'Eliminar',
            handler: async () => {
              await this.firestore.collection('reports').doc(this.report?.id).delete();
              this.router.navigate(['/admin/reports']);
            }
          }
        ]
      });
      await alert.present();
    }
  }

  async deletePet() {
    if (this.report?.petId) {
      const alert = await this.alertController.create({
        header: 'Confirmar Eliminación',
        message: '¿Estás seguro de que deseas eliminar este animal? Esta acción no se puede deshacer.',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
            cssClass: 'secondary',
          },
          {
            text: 'Eliminar',
            handler: async () => {
              await this.firestore.collection('mascotas').doc(this.report?.petId).delete();
            }
          }
        ]
      });
      await alert.present();
    }
  }

  async updateReportStatus(newStatus: 'pending' | 'reviewed' | 'resolved' | 'rejected') {
    if (this.report) {
      await this.firestore.collection('reports').doc(this.report.id).update({ status: newStatus });
      if (newStatus === 'resolved' || newStatus === 'rejected') {
        this.sendResolutionEmail(newStatus);
      }
    }
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

  sendResolutionEmail(status: string) {
    if (this.report && this.report.reporter) {
      const spanishStatus = this.getSpanishStatus(status);
      const email = {
        to: this.report.reporter.email,
        subject: `Resolución de tu reporte sobre ${this.report.petSnapshot?.nombre}`,
        body: `Hola ${this.report.reporter.nombreCompleto},\n\nTu reporte sobre la publicación de "${this.report.petSnapshot?.nombre}" ha sido marcado como **${spanishStatus}**.\n\nGracias por ayudarnos a mantener nuestra comunidad segura.\n\nAtentamente,\nEl equipo de PatitasEnCasAPP`
      };

      // Simulate sending email
      console.log('Sending email:', email);
    }
  }
}
