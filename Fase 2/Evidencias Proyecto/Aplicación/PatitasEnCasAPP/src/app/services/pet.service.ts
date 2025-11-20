import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { NotificationService } from './notification.service';
import { PetStatus } from '../models/petStatus';
import { Adopcion } from '../models/Adopcion';

@Injectable({
  providedIn: 'root'
})
export class PetService {
  constructor(
    private firestore: AngularFirestore,
    private notificationService: NotificationService
  ) { }

  /**
   * Verifica si una mascota puede ser modificada basándose en su estado actual
   * @param petId ID de la mascota
   * @returns Promise<boolean>
   */
  async canModifyPet(petId: string): Promise<boolean> {
    const petDoc = await this.firestore.collection('mascotas').doc(petId).get().toPromise();
    const petData = petDoc.data() as Adopcion;

    if (!petData) {
      throw new Error('Mascota no encontrada');
    }

    // Solo se puede modificar si está disponible o si fue rechazada
    const modifiableStatuses: PetStatus[] = ['available', 'rejected'];
    return modifiableStatuses.includes(petData.status as PetStatus);
  }

  /**
   * Verifica si una mascota puede ser eliminada basándose en su estado actual
   * @param petId ID de la mascota
   * @returns Promise<boolean>
   */
  async canDeletePet(petId: string): Promise<boolean> {
    const petDoc = await this.firestore.collection('mascotas').doc(petId).get().toPromise();
    const petData = petDoc.data() as Adopcion;

    if (!petData) {
      throw new Error('Mascota no encontrada');
    }

    // Solo se puede eliminar si está disponible o si fue rechazada
    const deletableStatuses: PetStatus[] = ['available', 'rejected'];
    return deletableStatuses.includes(petData.status as PetStatus);
  }

  /**
   * Actualiza una mascota solo si su estado lo permite
   * @param petId ID de la mascota
   * @param updateData Datos a actualizar
   */
  async updatePet(petId: string, updateData: any): Promise<void> {
    const canModify = await this.canModifyPet(petId);
    
    if (!canModify) {
      throw new Error('No se puede modificar esta mascota porque está en proceso de adopción');
    }

    await this.firestore.collection('mascotas').doc(petId).update(updateData);
  }

  /**
   * Elimina una mascota solo si su estado lo permite
   * @param petId ID de la mascota
   */
  async deletePet(petId: string): Promise<void> {
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
  async getPetStatus(petId: string): Promise<PetStatus> {
    const petDoc = await this.firestore.collection('mascotas').doc(petId).get().toPromise();
    const petData = petDoc.data() as Adopcion;

    if (!petData) {
      throw new Error('Mascota no encontrada');
    }

    return petData.status as PetStatus;
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

    return !requests.empty;
  }

  /**
   * Obtiene los datos de una mascota por su ID
   * @param petId ID de la mascota
   * @returns Promise<Adopcion | null>
   */
  async getPetById(petId: string): Promise<Adopcion | null> {
    try {
      const petDoc = await this.firestore.collection('mascotas').doc(petId).get().toPromise();
      if (!petDoc.exists) {
        return null;
      }
      const petData = petDoc.data() as Adopcion;
      return {
        ...petData,
        id: petDoc.id
      };
    } catch (error) {
      console.error('Error al obtener mascota:', error);
      return null;
    }
  }
}