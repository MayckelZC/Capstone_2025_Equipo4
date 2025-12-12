import { Injectable } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, from, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { Adopcion } from '@models/Adopcion';
import firebase from 'firebase/compat/app';
import { PetImageService } from './pet-image.service';

@Injectable({
  providedIn: 'root'
})
export class PetsService {

  constructor(
    private firestore: AngularFirestore,
    private petImageService: PetImageService,
    private logger: LoggerService
  ) { }



  /**
   * Verifica si una mascota puede ser modificada basándose en su estado actual
   * @param petId ID de la mascota
   * @returns Promise<boolean>
   */
  async canModifyPet(petId: string): Promise<boolean> {
    const petDoc = await this.firestore.collection('mascotas').doc(petId).get().toPromise();
    if (!petDoc) throw new Error('Pet not found');
    const petData = petDoc.data() as Adopcion;

    if (!petData) {
      throw new Error('Mascota no encontrada');
    }

    // Solo se puede modificar si está disponible o si fue rechazada
    const modifiableStatuses: string[] = ['available', 'rejected'];
    return modifiableStatuses.includes(petData.status);
  }

  /**
   * Verifica si una mascota puede ser eliminada basándose en su estado actual
   * @param petId ID de la mascota
   * @returns Promise<boolean>
   */
  async canDeletePet(petId: string): Promise<boolean> {
    const petDoc = await this.firestore.collection('mascotas').doc(petId).get().toPromise();
    if (!petDoc) throw new Error('Pet not found');
    const petData = petDoc.data() as Adopcion;

    if (!petData) {
      throw new Error('Mascota no encontrada');
    }

    // Solo se puede eliminar si está disponible o si fue rechazada
    const deletableStatuses: string[] = ['available', 'rejected'];
    return deletableStatuses.includes(petData.status);
  }

  /**
   * Actualiza una mascota solo si su estado lo permite (Método seguro)
   * @param petId ID de la mascota
   * @param updateData Datos a actualizar
   */
  async updatePetSafe(petId: string, updateData: any): Promise<void> {
    const canModify = await this.canModifyPet(petId);

    if (!canModify) {
      throw new Error('No se puede modificar esta mascota porque está en proceso de adopción');
    }

    await this.firestore.collection('mascotas').doc(petId).update(updateData);
  }

  /**
   * Elimina una mascota solo si su estado lo permite (Método seguro)
   * @param petId ID de la mascota
   */
  async deletePetSafe(petId: string): Promise<void> {
    const canDelete = await this.canDeletePet(petId);

    if (!canDelete) {
      throw new Error('No se puede eliminar esta mascota porque está en proceso de adopción');
    }

    await this.firestore.collection('mascotas').doc(petId).delete();
  }

  /**
   * Obtiene el estado actual de una mascota
   * @param petId ID de la mascota
   */
  async getPetStatus(petId: string): Promise<string> {
    const petDoc = await this.firestore.collection('mascotas').doc(petId).get().toPromise();
    if (!petDoc) throw new Error('Pet not found');
    const petData = petDoc.data() as Adopcion;

    if (!petData) {
      throw new Error('Mascota no encontrada');
    }

    return petData.status!;
  }

  /**
   * Verifica si hay solicitudes pendientes para una mascota
   * @param petId ID de la mascota
   */
  async hasPendingRequests(petId: string): Promise<boolean> {
    const requests = await this.firestore.collection('adoption-requests', ref =>
      ref.where('petId', '==', petId)
        .where('status', '==', 'pending')
    ).get().toPromise();

    return requests ? !requests.empty : false;
  }



  private async validateAndRefreshImageUrls(pet: Adopcion): Promise<Adopcion> {
    // CORS fix: Skip validation to avoid errors
    return pet;
    /*
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
      this.logger.error('Error validando imágenes:', error);
      return pet;
    }
    */
  }

  getAllPets(): Observable<Adopcion[]> {
    return this.firestore.collection<Adopcion>('mascotas').snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as Adopcion;
        const id = a.payload.doc.id;
        return { ...data, id };
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
          return { ...data, id: docId };
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
        return { ...data, id };
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
        return { ...data, id };
      }))
    );
  }

  async getPetById(petId: string): Promise<Adopcion | null> {
    try {
      const petDoc = await this.firestore.collection('mascotas').doc(petId).get().toPromise();

      if (petDoc && petDoc.exists) {
        const data = petDoc.data() as Adopcion;
        const pet = { ...data, id: petDoc.id };

        // Validar y actualizar URLs de imágenes si es necesario
        return await this.validateAndRefreshImageUrls(pet);
      }

      return null;
    } catch (error) {
      this.logger.error('Error getting pet by ID:', error);
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
      this.logger.error('Error getting user pets:', error);
      return [];
    }
  }

  /**
   * Obtener cantidad de mascotas por especie
   */
  getCountBySpecies(species: string): Observable<number> {
    return this.firestore.collection<Adopcion>('mascotas', ref =>
      ref.where('tipoMascota', '==', species)
    ).get().pipe(
      map(snapshot => snapshot.size)
    );
  }

  /**
   * Obtener todas las especies con su cantidad
   */
  getPetsBySpeciesCount(): Observable<{ dogs: number; cats: number; others: number }> {
    return this.firestore.collection<Adopcion>('mascotas').valueChanges().pipe(
      map(pets => {
        const counts = {
          dogs: 0,
          cats: 0,
          others: 0
        };

        pets.forEach(pet => {
          const tipo = pet.tipoMascota?.toLowerCase() || '';
          if (tipo.includes('perro')) {
            counts.dogs++;
          } else if (tipo.includes('gato')) {
            counts.cats++;
          } else {
            counts.others++;
          }
        });

        return counts;
      })
    );
  }
}
