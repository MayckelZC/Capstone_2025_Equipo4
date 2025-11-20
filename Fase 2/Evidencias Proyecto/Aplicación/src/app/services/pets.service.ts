import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, from, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { Adopcion } from '../models/Adopcion';
import firebase from 'firebase/compat/app';
import { PetImageService } from './pet-image.service';

@Injectable({
  providedIn: 'root'
})
export class PetsService {

  constructor(
    private firestore: AngularFirestore,
    private petImageService: PetImageService
  ) { }

  private async validateAndRefreshImageUrls(pet: Adopcion): Promise<Adopcion> {
    if (!pet.urlImagen && !pet.gallery?.length) {
      return pet;
    }

    try {
      // Validar y actualizar imagen principal
      if (pet.urlImagen) {
        const isMainValid = await this.petImageService.validateImageUrl(pet.urlImagen).toPromise();
        if (!isMainValid) {
          try {
            pet.urlImagen = await this.petImageService.refreshImageUrl(pet.urlImagen).toPromise();
          } catch {
            pet.urlImagen = null;
          }
        }
      }

      // Validar y actualizar galería
      if (pet.gallery?.length) {
        const validatedGallery = await Promise.all(
          pet.gallery.map(async url => {
            try {
              const isValid = await this.petImageService.validateImageUrl(url).toPromise();
              if (isValid) return url;
              return await this.petImageService.refreshImageUrl(url).toPromise();
            } catch {
              return null;
            }
          })
        );
        pet.gallery = validatedGallery.filter(url => url !== null);
      }

      return pet;
    } catch (error) {
      console.error('Error validando imágenes:', error);
      return pet;
    }
  }

  getAllPets(): Observable<Adopcion[]> {
    return this.firestore.collection<Adopcion>('mascotas').snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as Adopcion;
        const id = a.payload.doc.id;
        return { id, ...data };
      })),
      switchMap(async pets => {
        const validatedPets = await Promise.all(
          pets.map(pet => this.validateAndRefreshImageUrls(pet))
        );
        return validatedPets;
      })
    );
  }

  getPet(id: string): Observable<Adopcion | undefined> {
    return this.firestore.collection<Adopcion>('mascotas').doc(id).snapshotChanges().pipe(
      map(action => {
        if (action.payload.exists) {
          const data = action.payload.data() as Adopcion;
          const docId = action.payload.id;
          return { id: docId, ...data };
        } else {
          return undefined;
        }
      })
    );
  }

  createPet(petData: Adopcion): Promise<any> {
    return this.firestore.collection('mascotas').add(petData);
  }

  getFilteredPets(filters: any): Observable<Adopcion[]> {
    return this.firestore.collection<Adopcion>('mascotas', ref => {
      let query: firebase.firestore.CollectionReference | firebase.firestore.Query = ref;
      for (const key in filters) {
        if (filters[key]) {
          if (key === 'personalityTraits') {
            query = query.where(key, 'array-contains', filters[key]);
          } else {
            query = query.where(key, '==', filters[key]);
          }
        }
      }
      return query;
    }).snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as Adopcion;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
  }

  getCount(): Observable<number> {
    return this.firestore.collection('mascotas').get().pipe(
      map(snapshot => snapshot.size)
    );
  }

  updatePet(id: string, data: Partial<Adopcion>): Promise<void> {
    return this.firestore.collection('mascotas').doc(id).update(data);
  }

  getNewPetsCountThisWeek(): Observable<number> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return this.firestore.collection<Adopcion>('mascotas', ref =>
      ref.where('createdAt', '>=', oneWeekAgo)
    ).snapshotChanges().pipe(
      map(snaps => snaps.length)
    );
  }

  getPetsForUser(userId: string): Observable<Adopcion[]> {
    return this.firestore.collection<Adopcion>('mascotas', ref =>
      ref.where('creadorId', '==', userId)
    ).snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as Adopcion;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
  }

  async getPetById(petId: string): Promise<Adopcion | null> {
    try {
      const petDoc = await this.firestore.collection('mascotas').doc(petId).get().toPromise();
      
      if (petDoc && petDoc.exists) {
        const data = petDoc.data() as Adopcion;
        const pet = { id: petDoc.id, ...data };
        
        // Validar y actualizar URLs de imágenes si es necesario
        return await this.validateAndRefreshImageUrls(pet);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting pet by ID:', error);
      return null;
    }
  }

  // Método para obtener todas las mascotas de un usuario
  async getUserPets(userId: string): Promise<Adopcion[]> {
    try {
      const snapshot = await this.firestore.collection<Adopcion>('mascotas', ref =>
        ref.where('creadorId', '==', userId)
      ).get().toPromise();

      const pets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Validar URLs de imágenes para cada mascota
      const validatedPets = await Promise.all(
        pets.map(pet => this.validateAndRefreshImageUrls(pet))
      );

      return validatedPets;
    } catch (error) {
      console.error('Error getting user pets:', error);
      return [];
    }
  }
}
