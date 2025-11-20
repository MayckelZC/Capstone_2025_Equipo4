import { Injectable } from '@angular/core';
import { PetService } from './pet.service';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class PetActionGuardService {
  constructor(
    private petService: PetService,
    private alertController: AlertController
  ) { }

  /**
   * Verifica si una mascota puede ser modificada y muestra una alerta si no es posible
   * @param petId ID de la mascota
   * @returns Promise<boolean>
   */
  async canModifyPet(petId: string): Promise<boolean> {
    try {
      const canModify = await this.petService.canModifyPet(petId);
      
      if (!canModify) {
        const alert = await this.alertController.create({
          header: 'No se puede modificar',
          message: 'Esta mascota está en proceso de adopción y no puede ser modificada en este momento.',
          buttons: ['Entendido']
        });
        await alert.present();
      }

      return canModify;
    } catch (error) {
      console.error('Error checking if pet can be modified:', error);
      return false;
    }
  }

  /**
   * Verifica si una mascota puede ser eliminada y muestra una alerta si no es posible
   * @param petId ID de la mascota
   * @returns Promise<boolean>
   */
  async canDeletePet(petId: string): Promise<boolean> {
    try {
      const canDelete = await this.petService.canDeletePet(petId);
      
      if (!canDelete) {
        const alert = await this.alertController.create({
          header: 'No se puede eliminar',
          message: 'Esta mascota está en proceso de adopción y no puede ser eliminada en este momento.',
          buttons: ['Entendido']
        });
        await alert.present();
      }

      return canDelete;
    } catch (error) {
      console.error('Error checking if pet can be deleted:', error);
      return false;
    }
  }

  /**
   * Verifica si hay solicitudes pendientes antes de permitir una acción
   * @param petId ID de la mascota
   * @returns Promise<boolean>
   */
  async checkPendingRequests(petId: string): Promise<boolean> {
    try {
      const hasPending = await this.petService.hasPendingRequests(petId);
      
      if (hasPending) {
        const alert = await this.alertController.create({
          header: 'Solicitudes pendientes',
          message: 'Esta mascota tiene solicitudes de adopción pendientes. Por favor, revísalas antes de realizar cambios.',
          buttons: ['Entendido']
        });
        await alert.present();
      }

      return !hasPending;
    } catch (error) {
      console.error('Error checking pending requests:', error);
      return false;
    }
  }
}