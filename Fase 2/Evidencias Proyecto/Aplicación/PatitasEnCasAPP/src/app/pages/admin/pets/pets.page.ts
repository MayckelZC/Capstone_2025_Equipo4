import { Component, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { Adopcion } from '../../../models/Adopcion';
import { AlertController } from '@ionic/angular';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-pets',
  templateUrl: './pets.page.html',
  styleUrls: ['./pets.page.scss'],
})
export class PetsPage implements OnDestroy {
  pets: Adopcion[] = [];
  filteredPets: Adopcion[] = [];
  searchTerm: string = '';
  currentFilter: string = 'all'; // all, visible, hidden
  currentSort: string = 'dateDesc'; // dateDesc, dateAsc, nameAsc, nameDesc
  limit: number = 15;
  lastPetDoc: any = null;

  private petsSubscription: Subscription;

  constructor(private firestore: AngularFirestore, private router: Router, private alertController: AlertController, private toastService: ToastService) {
    this.fetchPets();
  }

  fetchPets(infiniteScroll?: any) {
    const query = this.firestore.collection<Adopcion>('mascotas', ref => {
      let q: any = ref;

      if (this.lastPetDoc) {
        q = q.startAfter(this.lastPetDoc);
      }

      return q.limit(this.limit);
    });

    this.petsSubscription = query.get().pipe(
      map(snapshot => {
        this.lastPetDoc = snapshot.docs[snapshot.docs.length - 1];
        return snapshot.docs.map(doc => {
          const data = doc.data() as Adopcion;
          const id = doc.id;
          return { id, ...data, createdAt: (data.createdAt as any).toDate() };
        });
      })
    ).subscribe(pets => {
      const petsWithCreator = pets.map(pet => {
        return this.firestore.collection('users').doc(pet.creadorId).get().pipe(
          map(userDoc => {
            return { ...pet, creador: userDoc.data() as any };
          })
        );
      });

      forkJoin(petsWithCreator).subscribe(newPets => {
        let filtered = newPets;

        if (this.currentFilter === 'visible') {
          filtered = filtered.filter(pet => !pet.isHidden);
        } else if (this.currentFilter === 'hidden') {
          filtered = filtered.filter(pet => pet.isHidden);
        }

        if (this.searchTerm) {
          filtered = filtered.filter(pet =>
            pet.nombre.toLowerCase().includes(this.searchTerm.toLowerCase())
          );
        }

        switch (this.currentSort) {
          case 'nameAsc':
            filtered.sort((a, b) => a.nombre.localeCompare(b.nombre));
            break;
          case 'nameDesc':
            filtered.sort((a, b) => b.nombre.localeCompare(a.nombre));
            break;
          case 'dateAsc':
            filtered.sort((a, b) => (a.createdAt as any) - (b.createdAt as any));
            break;
          default:
            filtered.sort((a, b) => (b.createdAt as any) - (a.createdAt as any));
            break;
        }

        if (infiniteScroll) {
          this.filteredPets = [...this.filteredPets, ...filtered];
          infiniteScroll.target.complete();
          if (newPets.length < this.limit) {
            infiniteScroll.target.disabled = true;
          }
        } else {
          this.filteredPets = filtered;
        }
      });
    });
  }

  applyFiltersAndSort() {
    this.filteredPets = [];
    this.lastPetDoc = null;
    this.fetchPets();
  }

  loadMore(event: any) {
    this.fetchPets(event);
  }

  editPet(pet: Adopcion) {
    this.router.navigate(['/modificar'], { queryParams: { id: pet.id } });
  }

  async deletePet(petId: string) {
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: '¿Estás seguro de que deseas eliminar esta mascota? Esta acción no se puede deshacer.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Eliminación de mascota cancelada');
          }
        },
        {
          text: 'Eliminar',
          handler: () => {
            this.firestore.collection('mascotas').doc(petId).delete();
          }
        }
      ]
    });

    await alert.present();
  }

  async togglePetVisibility(pet: Adopcion) {
    const newVisibility = !pet.isHidden;
    try {
      await this.firestore.collection('mascotas').doc(pet.id).update({ isHidden: newVisibility });
      const message = newVisibility ? 'Mascota oculta con éxito.' : 'Mascota visible con éxito.';
      this.toastService.presentToast(message, 'success', 'checkmark-circle-outline');
    } catch (error: any) {
      console.error('Error al cambiar la visibilidad de la mascota:', error);
      this.toastService.presentToast('Error al cambiar la visibilidad de la mascota.', 'danger', 'alert-circle-outline');
    }
  }

  ngOnDestroy() {
    if (this.petsSubscription) {
      this.petsSubscription.unsubscribe();
    }
  }
}
