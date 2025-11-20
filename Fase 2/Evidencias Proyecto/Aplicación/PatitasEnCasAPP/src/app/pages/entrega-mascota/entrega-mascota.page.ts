import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertController, LoadingController, NavController } from '@ionic/angular';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AdoptionService } from '../../services/adoption.service';
import { User } from '../../models/user';
import { Adopcion } from '../../models/Adopcion';
import { AdoptionRequest } from '../../models/AdoptionRequest';

@Component({
  selector: 'app-entrega-mascota',
  templateUrl: './entrega-mascota.page.html',
  styleUrls: ['./entrega-mascota.page.scss'],
})
export class EntregaMascotaPage implements OnInit {
  mascotaId: string;
  mascotaData: Adopcion;
  duenoAnterior: User;
  nuevoDueno: User;
  fechaEntrega: string;

  adoptionId: string;

  constructor(
    private route: ActivatedRoute,
    private firestore: AngularFirestore,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private navCtrl: NavController,
    private adoptionService: AdoptionService
  ) {
    this.fechaEntrega = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es });
  }

  ngOnInit() {
    this.mascotaId = this.route.snapshot.paramMap.get('id');
    this.cargarDatos();
  }

  async cargarDatos() {
    const loading = await this.loadingController.create({
      message: 'Cargando datos...'
    });
    await loading.present();

    try {
      // Cargar datos de la mascota
      const mascotaDoc = await this.firestore.collection('mascotas').doc(this.mascotaId).get().toPromise();
      if (mascotaDoc?.exists) {
        const mascotaData = mascotaDoc.data() as any;
        this.mascotaData = {
          id: mascotaDoc.id,
          nombre: mascotaData.nombre,
          tipoMascota: mascotaData.tipoMascota,
          tamano: mascotaData.tamano,
          etapaVida: mascotaData.etapaVida,
          sexo: mascotaData.sexo,
          creadorId: mascotaData.creadorId,
          status: mascotaData.status
        } as Adopcion;
        
        // Buscar la solicitud de adopción aprobada para esta mascota
        const adoptionSnapshot = await this.firestore.collection('adoption-requests', ref => 
          ref.where('petId', '==', this.mascotaId)
             .where('status', '==', 'approved')
        ).get().toPromise();

        if (!adoptionSnapshot.empty) {
          const adoptionDoc = adoptionSnapshot.docs[0];
          this.adoptionId = adoptionDoc.id;
          const adoptionData = adoptionDoc.data() as AdoptionRequest;
          
          // Cargar datos del dueño anterior
          const duenoAnteriorDoc = await this.firestore.collection('users').doc(this.mascotaData.creadorId).get().toPromise();
          if (duenoAnteriorDoc?.exists) {
            const duenoData = duenoAnteriorDoc.data() as any;
            this.duenoAnterior = {
              uid: duenoAnteriorDoc.id,
              email: duenoData.email,
              nombreCompleto: duenoData.nombreCompleto,
              telefono: duenoData.telefono
            } as User;
          }

          // Cargar datos del nuevo dueño
          const nuevoDuenoDoc = await this.firestore.collection('users').doc(adoptionData.applicantId).get().toPromise();
          if (nuevoDuenoDoc?.exists) {
            const nuevoDuenoData = nuevoDuenoDoc.data() as any;
            this.nuevoDueno = {
              uid: nuevoDuenoDoc.id,
              email: nuevoDuenoData.email,
              nombreCompleto: nuevoDuenoData.nombreCompleto,
              telefono: nuevoDuenoData.telefono
            } as User;
          }
        } else {
          throw new Error('No se encontró una solicitud de adopción aprobada para esta mascota');
        }
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'No se pudieron cargar los datos necesarios. Por favor, inténtalo de nuevo.',
        buttons: [{
          text: 'OK',
          handler: () => {
            this.navCtrl.back();
          }
        }]
      });
      await alert.present();
    } finally {
      loading.dismiss();
    }
  }

  async confirmarEntrega() {
    const alert = await this.alertController.create({
      header: 'Confirmar Entrega',
      message: '¿Ambas partes confirman la entrega de la mascota?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          handler: () => {
            this.completarEntrega();
          }
        }
      ]
    });

    await alert.present();
  }

  async completarEntrega() {
    const loading = await this.loadingController.create({
      message: 'Registrando entrega...'
    });
    await loading.present();

    try {
      // Completar la adopción usando el servicio
      await this.adoptionService.completeAdoption({
        adoptionId: this.adoptionId,
        petId: this.mascotaId,
        adopterId: this.nuevoDueno?.uid,
        deliveryDate: new Date(),
        comments: 'Entrega completada y confirmada por ambas partes'
      });

      const alertExito = await this.alertController.create({
        header: 'Entrega Completada',
        message: '¡La entrega se ha registrado exitosamente!',
        buttons: [{
          text: 'OK',
          handler: () => {
            this.navCtrl.navigateRoot('/home');
          }
        }]
      });
      await alertExito.present();

    } catch (error) {
      console.error('Error al completar la entrega:', error);
      const alertError = await this.alertController.create({
        header: 'Error',
        message: 'Hubo un problema al registrar la entrega. Por favor, inténtalo de nuevo.',
        buttons: ['OK']
      });
      await alertError.present();
    } finally {
      loading.dismiss();
    }
  }
}