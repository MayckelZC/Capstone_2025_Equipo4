import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { Handover } from '@models/Handover';
import { AdoptionRequest } from '@models/AdoptionRequest';
import { Adopcion } from '@models/Adopcion';
import { map } from 'rxjs/operators';
import { Observable, firstValueFrom } from 'rxjs';
import { DocumentSnapshot } from 'firebase/firestore';
import { NotificationService } from '@shared/services/notification.service';

/**
 * HandoverService (AdoptionHandoverService)
 * 
 * Servicio dedicado a la gestión de entregas de mascotas.
 * Responsabilidades:
 * - Crear y gestionar handovers
 * - Confirmar entregas (owner y adopter)
 * - Transferir propiedad de mascotas
 * - Finalizar adopciones tras confirmación mutua
 */
@Injectable({
  providedIn: 'root'
})
export class HandoverService {

  private handoverCollection = this.firestore.collection<Handover>('handovers');

  constructor(
    private firestore: AngularFirestore,
    private notificationService: NotificationService
  ) { }

  // ==================== MÉTODOS ORIGINALES ====================

  async createHandover(request: AdoptionRequest, proposedDate: Date): Promise<DocumentReference<Handover>> {
    if (!request.id || !request.petId || !request.applicantId || !request.creatorId) {
      throw new Error("Invalid adoption request data for handover creation.");
    }
    const handover: Handover = {
      adoptionRequestId: request.id,
      petId: request.petId,
      adopterId: request.applicantId,
      ownerId: request.creatorId,
      proposedDate: proposedDate,
      status: 'requested',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return this.handoverCollection.add(handover);
  }

  getHandover(handoverId: string): Observable<DocumentSnapshot<Handover>> {
    return this.handoverCollection.doc<Handover>(handoverId).get().pipe(
      map(doc => doc as unknown as DocumentSnapshot<Handover>)
    );
  }

  async confirmHandover(handoverId: string, confirmedDate: Date, location: string) {
    return this.handoverCollection.doc(handoverId).update({
      confirmedDate: confirmedDate,
      location: location,
      status: 'confirmed',
      updatedAt: new Date()
    });
  }

  async completeHandover(handoverId: string) {
    return this.handoverCollection.doc(handoverId).update({
      status: 'completed',
      updatedAt: new Date()
    });
  }

  async cancelHandover(handoverId: string) {
    return this.handoverCollection.doc(handoverId).update({
      status: 'cancelled',
      updatedAt: new Date()
    });
  }

  // ==================== MÉTODOS MIGRADOS DESDE ADOPTION SERVICE ====================

  /**
   * Inicia el proceso de entrega tras aprobar una solicitud
   */
  async initiateHandover(
    requestId: string,
    petId: string,
    applicantId: string,
    applicantName: string
  ): Promise<void> {
    const batch = this.firestore.firestore.batch();
    const now = new Date();

    // 1. Update pet status to start handover process
    const petRef = this.firestore.collection('mascotas').doc(petId).ref;
    batch.update(petRef, {
      status: 'handover_pending',
      selectedAdopterId: applicantId,
      giverConfirmedHandover: false,
      adopterConfirmedReceipt: false,
    });

    // 2. Update the approved request
    const requestRef = this.firestore.collection('adoption-requests').doc(requestId).ref;
    batch.update(requestRef, { status: 'approved', reviewedAt: now });

    // 3. Reject other pending requests for the same pet
    const pendingSnapshot = await firstValueFrom(
      this.firestore.collection('adoption-requests', ref =>
        ref.where('petId', '==', petId).where('status', '==', 'pending')
      ).get()
    );

    pendingSnapshot.forEach(docSnap => {
      if (docSnap.id !== requestId) {
        const otherRef = this.firestore.collection('adoption-requests').doc(docSnap.id).ref;
        batch.update(otherRef, {
          status: 'rejected',
          reviewedAt: now,
          adminNotes: 'Auto-rejected: another request was approved.'
        });
      }
    });

    await batch.commit();

    // 4. Send notifications
    const petSnap = await firstValueFrom(
      this.firestore.collection<Adopcion>('mascotas').doc(petId).get()
    );
    const petData = petSnap.data();
    if (!petData) return;

    // Notify adopter
    await this.notificationService.create({
      userId: applicantId,
      title: 'Solicitud Aprobada',
      body: `¡Tu solicitud para ${petData.nombre} fue aprobada! Confirma la recepción cuando recibas la mascota.`,
      type: 'adoption_request',
      read: false,
      actionUrl: `/pets/detalle?id=${petId}`
    });

    // Notify giver
    await this.notificationService.create({
      userId: petData.creadorId,
      title: 'Solicitud Aprobada',
      body: `Aprobaste la solicitud para ${petData.nombre}. Confirma la entrega cuando hayas entregado la mascota.`,
      type: 'adoption_request',
      read: false,
      actionUrl: `/detalle?id=${petId}`
    });
  }

  /**
   * Confirma la entrega por parte del propietario (giver)
   */
  async confirmHandoverByGiver(petId: string, giverId: string): Promise<void> {
    const petRef = this.firestore.collection('mascotas').doc(petId);
    const petSnap = await petRef.ref.get();
    const petData = petSnap.data() as Adopcion;

    if (petData.creadorId !== giverId) {
      throw new Error("Only the owner can confirm the handover.");
    }

    await petRef.update({ giverConfirmedHandover: true });
    await this._tryFinalizeAdoption(petId);
  }

  /**
   * Confirma la recepción por parte del adoptante
   */
  async confirmReceipt(petId: string, adopterId: string): Promise<void> {
    const petRef = this.firestore.collection('mascotas').doc(petId);
    const petSnap = await petRef.ref.get();
    const petData = petSnap.data() as Adopcion;

    if (petData.selectedAdopterId !== adopterId) {
      throw new Error("Only the selected adopter can confirm the receipt.");
    }

    await petRef.update({ adopterConfirmedReceipt: true });
    await this._tryFinalizeAdoption(petId);
  }

  /**
   * Confirma la entrega como propietario (nueva versión con request)
   */
  async confirmDeliveryAsOwner(requestId: string, petId: string): Promise<void> {
    try {
      const now = new Date();
      const requestRef = this.firestore.collection('adoption-requests').doc(requestId);

      // Obtener la solicitud actual
      const requestSnap = await requestRef.ref.get();
      const request = requestSnap.data() as AdoptionRequest;

      // Actualizar con la confirmación del propietario
      await requestRef.update({
        ownerDeliveryConfirmedAt: now
      });

      // Si el adoptante ya confirmó, completar la adopción
      if (request.adopterDeliveryConfirmedAt) {
        await this.finalizeDelivery(requestId, petId, request);
      } else {
        // Notificar al adoptante que el propietario ya confirmó
        await this.notificationService.create({
          userId: request.applicantId,
          title: 'Entrega Confirmada',
          body: `El publicador confirmó la entrega de ${request.petName}. Por favor, confirma tu recepción.`,
          type: 'adoption_request',
          read: false,
          actionUrl: `/adoptions/my-adoptions`
        });
      }
    } catch (error) {
      console.error('Error confirming delivery as owner:', error);
      throw error;
    }
  }

  /**
   * Confirma la entrega como adoptante
   */
  async confirmDeliveryAsAdopter(requestId: string, petId: string): Promise<void> {
    try {
      const now = new Date();
      const requestRef = this.firestore.collection('adoption-requests').doc(requestId);

      // Obtener la solicitud actual
      const requestSnap = await requestRef.ref.get();
      const request = requestSnap.data() as AdoptionRequest;

      // Actualizar con la confirmación del adoptante
      await requestRef.update({
        adopterDeliveryConfirmedAt: now
      });

      // Si el propietario ya confirmó, completar la adopción
      if (request.ownerDeliveryConfirmedAt) {
        await this.finalizeDelivery(requestId, petId, request);
      } else {
        // Notificar al propietario que el adoptante ya confirmó
        await this.notificationService.create({
          userId: request.creatorId,
          title: 'Recepción Confirmada',
          body: `${request.applicantName} confirmó la recepción de ${request.petName}. Por favor, confirma la entrega.`,
          type: 'adoption_request',
          read: false,
          actionUrl: `/received-requests?petId=${petId}`
        });
      }
    } catch (error) {
      console.error('Error confirming delivery as adopter:', error);
      throw error;
    }
  }

  /**
   * Actualiza la propiedad de una mascota
   */
  async updatePetOwnership(petId: string, data: any): Promise<void> {
    return this.firestore.collection('mascotas').doc(petId).update(data);
  }

  /**
   * Obtiene las mascotas adoptadas por un usuario
   */
  getMascotasAdoptadas(userId: string): Observable<Adopcion[]> {
    return this.firestore.collection<Adopcion>('mascotas', ref =>
      ref.where('currentOwnerId', '==', userId)
        .where('status', '==', 'adopted')
    ).valueChanges({ idField: 'id' });
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Intenta finalizar la adopción si ambas partes confirmaron
   */
  private async _tryFinalizeAdoption(petId: string): Promise<void> {
    const petRef = this.firestore.collection('mascotas').doc(petId);
    const petSnap = await petRef.ref.get();
    const petData = petSnap.data() as Adopcion;

    if (petData.giverConfirmedHandover && petData.adopterConfirmedReceipt) {
      const batch = this.firestore.firestore.batch();

      batch.update(petRef.ref, {
        status: 'adopted',
        creadorId: petData.selectedAdopterId, // Transfer ownership
        adoptedAt: new Date(),
        // Clear handover fields
        selectedAdopterId: null,
        giverConfirmedHandover: null,
        adopterConfirmedReceipt: null,
      });

      await batch.commit();

      // Send final notifications
      await this.notificationService.create({
        userId: petData.selectedAdopterId!,
        title: 'Adopción Finalizada',
        body: `¡Felicidades! La adopción de ${petData.nombre} está completa. ¡Ahora es oficialmente tuya!`,
        type: 'adoption_request',
        read: false,
        actionUrl: `/mis-mascotas-adoptadas`
      });
      await this.notificationService.create({
        userId: petData.creadorId,
        title: 'Adopción Finalizada',
        body: `¡La adopción de ${petData.nombre} se ha completado con éxito!`,
        type: 'adoption_request',
        read: false,
        actionUrl: `/pets/home`
      });
    }
  }

  /**
   * Finaliza la entrega cuando ambas partes confirman
   */
  private async finalizeDelivery(
    requestId: string,
    petId: string,
    request: AdoptionRequest
  ): Promise<void> {
    const now = new Date();
    const batch = this.firestore.firestore.batch();

    // Update request status
    const requestRef = this.firestore.collection('adoption-requests').doc(requestId).ref;
    batch.update(requestRef, {
      status: 'completed',
      completedAt: now,
      deliveryDate: now
    });

    // Update pet ownership
    const petRef = this.firestore.collection('mascotas').doc(petId).ref;
    batch.update(petRef, {
      status: 'adopted',
      adoptedAt: now,
      currentOwnerId: request.applicantId,
      previousOwnerId: request.creatorId
    });

    // Create history record
    const historyRef = this.firestore.collection('adoption-history').doc().ref;
    batch.set(historyRef, {
      adoptionId: requestId,
      petId: petId,
      adopterId: request.applicantId,
      previousOwnerId: request.creatorId,
      deliveryDate: now,
      completedAt: now
    });

    await batch.commit();

    // Notify both parties
    await this.notificationService.create({
      userId: request.applicantId,
      title: 'Adopción Completada',
      body: `¡Adopción completada! La mascota ${request.petName} ahora es oficialmente tuya.`,
      type: 'adoption_request',
      read: false,
      actionUrl: `/my-adoptions`
    });

    await this.notificationService.create({
      userId: request.creatorId,
      title: 'Adopción Completada',
      body: `¡Adopción completada! Has entregado exitosamente a ${request.petName}.`,
      type: 'adoption_request',
      read: false,
      actionUrl: `/adoptions/received-requests`
    });
  }
}
