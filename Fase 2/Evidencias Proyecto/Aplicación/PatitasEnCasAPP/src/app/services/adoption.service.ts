import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AdoptionRequest } from '../models/AdoptionRequest';
import { map } from 'rxjs/operators';
import { Observable, firstValueFrom } from 'rxjs';
import { NotificationService } from './notification.service';
import { Adopcion } from '../models/Adopcion';

import { AdoptionStatus, AdoptionCompletion } from '../models/adoptionStatus';
import { User } from '../models/user';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { AdoptionDocumentService } from './adoption-document.service';
import { HandoverAgreement, HandoverReceipt } from '../models/AdoptionDocument';

@Injectable({
  providedIn: 'root'
})
export class AdoptionService {

  constructor(
    private firestore: AngularFirestore,
    private notificationService: NotificationService,
    private storage: AngularFireStorage,
    private documentService: AdoptionDocumentService
  ) { }

  async createRequest(request: AdoptionRequest): Promise<void> {
    // Defensive checks client-side: ensure pet exists and is available, and applicant is not the owner
    const petSnap = await firstValueFrom(
      this.firestore.collection('mascotas').doc(request.petId).get()
    );
    if (!petSnap.exists) {
      throw new Error('La mascota no existe.');
    }
    const petData = petSnap.data() as any;
    if (petData && petData.creadorId && petData.creadorId === request.applicantId) {
      throw new Error('No puedes solicitar la adopción de tu propia mascota.');
    }
    if (petData && petData.status && petData.status !== 'available') {
      throw new Error('Esta mascota no está disponible para adopción.');
    }

    // TODO: Trigger Cloud Function to send email to pet owner.
    // The function should be triggered on create of a document in 'adoption-requests'.
    // It should get the pet owner's email from the 'users' collection using petData.creadorId.

    // Use deterministic id to avoid duplicate requests from same user for same pet
    const id = `${request.petId}_${request.applicantId}`;
    return this.firestore.collection('adoption-requests').doc(id).set({ ...request, id, creatorId: petData.creadorId });
  }

  /**
   * Checks if a user already has a pending request for a specific pet.
   * @param userId The user's ID.
   * @param petId The pet's ID.
   * @returns A boolean observable, true if a pending request exists.
   */
  hasPendingRequest(userId: string, petId: string): Observable<boolean> {
    return this.firestore.collection<AdoptionRequest>('adoption-requests', ref =>
      ref.where('applicantId', '==', userId)
        .where('petId', '==', petId)
        .where('status', '==', 'pending')
    ).valueChanges().pipe(
      map(requests => requests.length > 0)
    );
  }

  /**
   * Gets all adoption requests for a specific user.
   * @param userId The user's ID.
   */
  getRequestsForUser(userId: string) {
    return this.firestore.collection<AdoptionRequest>('adoption-requests', ref =>
      ref.where('applicantId', '==', userId)
    ).valueChanges();
  }

  /**
   * Obtiene el número de solicitudes pendientes donde el usuario es el creador de la mascota
   * @param ownerId ID del publicador de la mascota
   */
  getPendingRequestsForOwner(ownerId: string): Observable<number> {
    return this.firestore.collection<AdoptionRequest>('adoption-requests', ref =>
      ref.where('creatorId', '==', ownerId)
        .where('status', '==', 'pending')
    ).valueChanges().pipe(map(requests => requests.length));
  }

  /**
   * Obtiene el número de solicitudes pendientes enviadas por el usuario actual
   * @param applicantId ID del solicitante
   */
  getPendingRequestsForApplicant(applicantId: string): Observable<number> {
    return this.firestore.collection<AdoptionRequest>('adoption-requests', ref =>
      ref.where('applicantId', '==', applicantId)
        .where('status', '==', 'pending')
    ).valueChanges().pipe(map(requests => requests.length));
  }

  /**
   * Gets all adoption requests for a specific pet.
   * @param petId The pet's ID.
   */
  getRequestsForPet(petId: string): Observable<AdoptionRequest[]> {
    return this.firestore.collection<AdoptionRequest>('adoption-requests', ref =>
      ref.where('petId', '==', petId)
    ).valueChanges({ idField: 'id' }).pipe(
      map(requests => requests.map(request => {
        return {
          ...request,
          requestDate: (request.requestDate as any).toDate ? (request.requestDate as any).toDate() : request.requestDate,
          reviewedAt: (request.reviewedAt as any)?.toDate ? (request.reviewedAt as any).toDate() : request.reviewedAt
        };
      }))
    );
  }

  /**
   * Gets all pending adoption requests for the admin.
   */
  getPendingRequests() {
    return this.firestore.collection<AdoptionRequest>('adoption-requests', ref =>
      ref.where('status', '==', 'pending')
    ).valueChanges();
  }

  getLatestPendingRequests(limit: number = 5) {
    return this.firestore.collection<AdoptionRequest>('adoption-requests', ref =>
      ref.where('status', '==', 'pending')
        .orderBy('requestDate', 'desc')
        .limit(limit)
    ).valueChanges({ idField: 'id' });
  }

  /**
   * Gets a specific adoption request by ID
   * @param requestId The request's ID
   */
  getRequestById(requestId: string): Observable<AdoptionRequest | undefined> {
    return this.firestore.collection<AdoptionRequest>('adoption-requests')
      .doc(requestId)
      .valueChanges({ idField: 'id' })
      .pipe(
        map(request => {
          if (!request) return undefined;
          return {
            ...request,
            requestDate: (request.requestDate as any).toDate ? (request.requestDate as any).toDate() : request.requestDate,
            reviewedAt: (request.reviewedAt as any)?.toDate ? (request.reviewedAt as any).toDate() : request.reviewedAt
          };
        })
      );
  }

  /**
   * Approves an adoption request. This updates the request status, the pet's status,
   * rejects other pending requests, sends notifications, and creates a conversation channel.
   * @param request The adoption request to approve.
   */
  async approveRequest(request: AdoptionRequest): Promise<void> {
    const batch = this.firestore.firestore.batch();
    const now = new Date();

    try {
      // 0. Get Pet data
      const petSnap = await firstValueFrom(
        this.firestore.collection<Adopcion>('mascotas').doc(request.petId).get()
      );
      const petData = petSnap.data();
      if (!petData) {
        throw new Error("Pet not found, cannot approve request.");
      }
      const petName = petData.nombre || 'la mascota que solicitaste';

      // Fetch user data for notifications
      const creatorSnap = await firstValueFrom(
        this.firestore.collection<User>('users').doc(petData.creadorId).get()
      );
      const creatorData = creatorSnap.data();
      const creatorName = creatorData?.nombreCompleto || 'El dueño de la mascota';

      const applicantSnap = await firstValueFrom(
        this.firestore.collection<User>('users').doc(request.applicantId).get()
      );
      const applicantData = applicantSnap.data();

      // 1. Update the chosen request to 'approved'
      const requestRef = this.firestore.collection('adoption-requests').doc(request.id).ref;
      batch.update(requestRef, { status: 'approved', reviewedAt: now });

      // 2. Update the pet's status to 'reserved'
      const petRef = this.firestore.collection('mascotas').doc(request.petId).ref;
      batch.update(petRef, {
        status: 'reserved',
        lastAdoptionUpdateStatus: 'approved',
        lastAdoptionUpdateDate: now,
        lastAdoptionUpdateApplicantName: request.applicantName,
        lastAdoptionUpdateApplicantId: request.applicantId
      });

      // 3. Find and reject other pending requests
      const pendingSnapshot = await firstValueFrom(
        this.firestore.collection('adoption-requests', ref =>
          ref.where('petId', '==', request.petId).where('status', '==', 'pending')
        ).get()
      );

      pendingSnapshot.forEach(docSnap => {
        if (docSnap.id !== request.id) {
          const otherRef = this.firestore.collection('adoption-requests').doc(docSnap.id).ref;
          batch.update(otherRef, { status: 'rejected', reviewedAt: now, adminNotes: 'Auto-rejected: otra solicitud fue aprobada' });
        }
      });

      // Commit the main batch changes
      await batch.commit();

      // 4. Generate and upload the adoption agreement PDF
      try {
        await this.generateAdoptionAgreement(request, petData);
      } catch (error) {
        console.error('Error generating adoption agreement PDF:', error);
        // Non-critical error, so we continue without the PDF link.
      }

      // Notify the publisher with adopter's contact info
      await this.notificationService.create({
        userId: petData.creadorId,
        message: `¡Felicidades! La solicitud de adopción para ${petName} ha sido aprobada. Contacta a ${request.applicantName} por WhatsApp${applicantData?.telefono ? ' al ' + applicantData.telefono : ''} o email para coordinar la entrega.`,
        link: `/solicitudes-recibidas`
      });

      // Notify the adopter with owner's contact info
      await this.notificationService.create({
        userId: request.applicantId,
        message: `¡Felicidades! Tu solicitud de adopción para ${petName} ha sido aprobada. ${creatorName} se pondrá en contacto contigo${creatorData?.telefono ? ' al ' + creatorData.telefono : ''} para coordinar la entrega. También puedes contactar directamente desde Mis Adopciones.`,
        link: `/misadopciones`
      });

    } catch (error) {
      console.error('Error approving request:', error);
      throw error;
    }
  }

  private async generateAdoptionAgreement(request: AdoptionRequest, pet: Adopcion): Promise<string> {
    // Fetch user data for both parties
    const applicantSnap = await firstValueFrom(
      this.firestore.collection<User>('users').doc(request.applicantId).get()
    );
    const ownerSnap = await firstValueFrom(
      this.firestore.collection<User>('users').doc(pet.creadorId).get()
    );
    const applicant = applicantSnap.data();
    const owner = ownerSnap.data();

    if (!applicant || !owner) {
      throw new Error('Could not fetch user data for adoption agreement');
    }

    // Create handover agreement document
    const agreement: HandoverAgreement = {
      adoptionRequestId: request.id!,
      ownerId: pet.creadorId,
      ownerName: owner.nombreCompleto,
      petId: pet.id!,
      petName: pet.nombre,
      petInformation: {
        healthStatus: 'Buen estado de salud',
        medicalHistory: pet.descripcion || 'Sin historial médico específico',
        vaccinationsUpToDate: true,
        behavior: 'Comportamiento saludable',
        specialNeeds: pet.descripcion || '',
        medication: '',
        diet: 'Alimentación balanceada'
      },
      ownerCommitments: {
        deliverInGoodCondition: true,
        ownershipTransfer: true,
        postAdoptionContact: true
      },
      signature: {
        accepted: true,
        timestamp: new Date()
      },
      createdAt: new Date()
    };

    // Generate PDF
    const pdfBlob = await this.documentService.generateHandoverAgreementPDF(agreement);

    // Upload to Firebase Storage
    const pdfPath = `adoption-documents/handover-agreements/${request.id}_${Date.now()}.pdf`;
    const pdfUrl = await this.documentService.uploadDocument(pdfBlob, pdfPath);

    // Save agreement document to Firestore
    const agreementId = await this.documentService.saveHandoverAgreement(agreement, pdfUrl);

    // Update adoption request with agreement info
    await this.firestore.collection('adoption-requests').doc(request.id).update({
      handoverAgreementId: agreementId,
      handoverAgreementPdfUrl: pdfUrl
    });

    return pdfUrl;
  }

  /**
   * Rejects an adoption request. This updates the request status and sends a notification.
   * @param request The adoption request to reject.
   */
  async rejectRequest(request: AdoptionRequest): Promise<void> {
    const batch = this.firestore.firestore.batch();
    const now = new Date();

    // 1. Update the request status to 'rejected'
    const requestRef = this.firestore.collection('adoption-requests').doc(request.id).ref;
    batch.update(requestRef, { status: 'rejected', reviewedAt: now });

    // 2. Add notification details to the pet (optional)
    const petRef = this.firestore.collection('mascotas').doc(request.petId).ref;
    batch.update(petRef, {
      lastAdoptionUpdateStatus: 'rejected',
      lastAdoptionUpdateDate: now,
      lastAdoptionUpdateApplicantName: request.applicantName,
      lastAdoptionUpdateApplicantId: request.applicantId
    });

    // Commit changes
    await batch.commit();

    // 3. Notify rejected user
    // TODO: Trigger Cloud Function to send rejection email to request.applicantId
    const petSnap = await firstValueFrom(
      this.firestore.collection<Adopcion>('mascotas').doc(request.petId).get()
    );
    const petName = petSnap.data()?.nombre || 'la mascota que solicitaste';
    await this.notificationService.create({
      userId: request.applicantId,
      message: `Tu solicitud para adoptar a ${petName} ha sido rechazada.`,
      link: '/my-adoptions'
    });
  }

  getCount(): Observable<number> {
    return this.firestore.collection('adoption-requests', ref => ref.where('status', '==', 'approved')).get().pipe(
      map(snapshot => snapshot.size)
    );
  }

  getNewApprovedAdoptionsCountThisWeek(): Observable<number> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return this.firestore.collection<AdoptionRequest>('adoption-requests', ref =>
      ref.where('status', '==', 'approved')
        .where('reviewedAt', '>=', oneWeekAgo)
    ).snapshotChanges().pipe(
      map(snaps => snaps.length)
    );
  }

  /**
   * Completa el proceso de adopción y transfiere la mascota al nuevo dueño
   * @param completion Datos de la completación de la adopción
   */
  async updatePetOwnership(petId: string, data: any): Promise<void> {
    return this.firestore.collection('mascotas').doc(petId).update(data);
  }

  async updateRequest(requestId: string, data: any): Promise<void> {
    return this.firestore.collection('adoption-requests').doc(requestId).update(data);
  }

  async completeAdoption(completion: AdoptionCompletion): Promise<void> {
    const batch = this.firestore.firestore.batch();
    const now = new Date();

    try {
      // Get adoption request data first
      const requestSnapshot = await firstValueFrom(
        this.firestore.collection('adoption-requests').doc(completion.adoptionId).get()
      );
      const requestData = requestSnapshot.data() as AdoptionRequest;

      // Get pet data
      const petRef = this.firestore.collection('mascotas').doc(completion.petId).ref;
      const petSnapshot = await petRef.get();
      const currentPetData = petSnapshot.data() as Adopcion;
      const petName = currentPetData.nombre;

      // Get owner and adopter data
      const [ownerData, adopterData] = await Promise.all([
        this.getUserById(currentPetData.creadorId),
        this.getUserById(completion.adopterId)
      ]);

      // Construct age string
      let age = '';
      if (currentPetData.etapaVida === 'Cachorro' && currentPetData.edadMeses) {
        age = `${currentPetData.edadMeses} meses`;
      } else if (currentPetData.edadAnios) {
        age = `${currentPetData.edadAnios} años`;
      } else {
        age = currentPetData.etapaVida || 'No especificada';
      }

      // Generate PDF delivery receipt
      let receiptPdfUrl = '';
      let receiptId = '';
      try {
        const receipt: Partial<HandoverReceipt> = {
          adoptionRequestId: completion.adoptionId,
          petId: completion.petId,
          petName: petName,
          petDetails: {
            breed: currentPetData.raza || 'Mestizo',
            age: age,
            color: currentPetData.color || 'No especificado',
            sex: currentPetData.sexo || 'No especificado'
          },
          owner: {
            id: currentPetData.creadorId,
            name: ownerData?.nombre || 'Propietario',
            confirmed: true,
            confirmationDate: requestData.ownerDeliveryConfirmedAt,
            signature: true
          },
          adopter: {
            id: completion.adopterId,
            name: adopterData?.nombre || requestData.applicantName || 'Adoptante',
            confirmed: true,
            confirmationDate: requestData.adopterDeliveryConfirmedAt,
            signature: true
          },
          delivery: {
            date: now,
            location: requestData.deliveryLocation || 'No especificado',
            checklist: requestData.deliveryChecklist || {
              pet: true,
              vaccinationCard: false,
              medicalDocuments: false,
              food: false,
              accessories: false
            },
            photos: requestData.deliveryPhotos || [],
            additionalNotes: requestData.deliveryNotes || completion.comments || ''
          },
          status: 'completed' as const,
          completedAt: now,
          receiptNumber: this.generateReceiptNumber(),
          createdAt: now,
          updatedAt: now
        };

        const pdfBlob = await this.documentService.generateHandoverReceiptPDF(receipt);
        const pdfPath = `adoption-receipts/${completion.petId}/${completion.adoptionId}.pdf`;
        receiptPdfUrl = await this.documentService.uploadDocument(pdfBlob, pdfPath);

        // Save receipt to Firestore
        receiptId = await this.documentService.saveHandoverReceipt(receipt as HandoverReceipt, receiptPdfUrl);

        console.log('Delivery receipt generated:', receiptId);
      } catch (pdfError) {
        console.error('Error generating PDF receipt:', pdfError);
        // Continue even if PDF generation fails
      }

      // 1. Actualizar el estado de la solicitud de adopción
      const requestRef = this.firestore.collection('adoption-requests').doc(completion.adoptionId).ref;
      batch.update(requestRef, {
        status: 'completed' as AdoptionStatus,
        completedAt: now,
        deliveryDate: now,
        comments: completion.comments,
        receiptId: receiptId || null,
        receiptPdfUrl: receiptPdfUrl || null
      });

      // 2. Actualizar la mascota con el nuevo dueño
      batch.update(petRef, {
        status: 'adopted',
        adoptedAt: now,
        currentOwnerId: completion.adopterId,
        previousOwnerId: currentPetData?.creadorId,
        adoptionCompletionData: {
          adoptionId: completion.adoptionId,
          deliveryDate: now,
          completedAt: now,
          receiptPdfUrl: receiptPdfUrl || null
        }
      });

      // 3. Crear registro histórico de la adopción
      const historyRef = this.firestore.collection('adoption-history').doc().ref;
      batch.set(historyRef, {
        adoptionId: completion.adoptionId,
        petId: completion.petId,
        adopterId: completion.adopterId,
        previousOwnerId: currentPetData?.creadorId,
        deliveryDate: now,
        completedAt: now,
        comments: completion.comments,
        documents: {
          ...completion.documents,
          receiptId: receiptId || null,
          receiptPdfUrl: receiptPdfUrl || null
        }
      });

      // Commit all updates in the batch
      await batch.commit();
      console.log('Adoption batch committed successfully');

      // 4. Enviar notificaciones a las partes involucradas (no crítico, no debe fallar la operación)
      try {
        // Notificar al adoptante
        const adopterMessage = receiptPdfUrl
          ? `¡Felicidades! La adopción de ${petName} se ha completado oficialmente. Ya eres su nuevo dueño. Se ha generado el recibo de entrega.`
          : `¡Felicidades! La adopción de ${petName} se ha completado oficialmente. Ya eres su nuevo dueño.`;

        await this.notificationService.create({
          userId: completion.adopterId,
          message: adopterMessage,
          link: `/pets/${completion.petId}`
        });
      } catch (notifError) {
        console.error('Error sending notification to adopter:', notifError);
        // No lanzar error, las notificaciones no son críticas
      }

      try {
        // Notificar al dueño anterior
        if (currentPetData.creadorId) {
          const ownerMessage = receiptPdfUrl
            ? `La adopción de ${petName} se ha completado exitosamente. Gracias por ayudar a encontrarle un nuevo hogar. Se ha generado el recibo de entrega.`
            : `La adopción de ${petName} se ha completado exitosamente. Gracias por ayudar a encontrarle un nuevo hogar.`;

          await this.notificationService.create({
            userId: currentPetData.creadorId,
            message: ownerMessage,
            link: '/my-pets'
          });
        }
      } catch (notifError) {
        console.error('Error sending notification to previous owner:', notifError);
        // No lanzar error, las notificaciones no son críticas
      }

      // TODO: Trigger Cloud Function para enviar emails de confirmación
    } catch (error) {
      console.error('Error completing adoption:', error);
      throw error;
    }
  }

  // Helper method to generate receipt number
  private generateReceiptNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `ADOPT-${year}-${random}`;
  }

  async getAdoptionRequest(id: string): Promise<AdoptionRequest> {
    const doc = await firstValueFrom(
      this.firestore.collection<AdoptionRequest>('adoption-requests').doc(id).get()
    );
    return doc.data() as AdoptionRequest;
  }

  getMascotasAdoptadas(userId: string) {
    return this.firestore.collection<Adopcion>('mascotas', ref =>
      ref.where('currentOwnerId', '==', userId)
        .where('status', '==', 'adopted')
    ).valueChanges({ idField: 'id' });
  }

  linkHandoverToRequest(requestId: string, handoverId: string) {
    return this.firestore.collection('adoption-requests').doc(requestId).update({ handoverId });
  }

  // Métodos para el dashboard de solicitudes recibidas
  async getAdoptionRequestsForPet(petId: string): Promise<AdoptionRequest[]> {
    try {
      console.log('Getting adoption requests for pet:', petId);

      // Primero intentamos sin ordenamiento para evitar problemas de índice
      const snapshot = await firstValueFrom(
        this.firestore.collection<AdoptionRequest>('adoption-requests', ref =>
          ref.where('petId', '==', petId)
        ).get()
      );

      console.log(`Found ${snapshot.docs.length} requests for pet ${petId}`);

      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Ordenamos manualmente por fecha
      return requests.sort((a, b) => {
        const dateA = a.requestDate ? new Date(a.requestDate).getTime() : 0;
        const dateB = b.requestDate ? new Date(b.requestDate).getTime() : 0;
        return dateB - dateA; // Más recientes primero
      });

    } catch (error) {
      console.error('Error getting adoption requests for pet:', error);
      console.error('Error details:', error.message);
      return [];
    }
  }

  async initiateHandover(requestId: string, petId: string, applicantId: string, applicantName: string): Promise<void> {
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
        batch.update(otherRef, { status: 'rejected', reviewedAt: now, adminNotes: 'Auto-rejected: another request was approved.' });
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
      message: `¡Tu solicitud para ${petData.nombre} fue aprobada! Confirma la recepción cuando recibas la mascota.`,
      link: `/detalle?id=${petId}`
    });

    // Notify giver
    await this.notificationService.create({
      userId: petData.creadorId,
      message: `Aprobaste la solicitud para ${petData.nombre}. Confirma la entrega cuando hayas entregado la mascota.`,
      link: `/detalle?id=${petId}`
    });
  }

  async confirmHandover(petId: string, giverId: string): Promise<void> {
    const petRef = this.firestore.collection('mascotas').doc(petId);
    const petSnap = await petRef.ref.get();
    const petData = petSnap.data() as Adopcion;

    if (petData.creadorId !== giverId) {
      throw new Error("Only the owner can confirm the handover.");
    }

    await petRef.update({ giverConfirmedHandover: true });
    await this._tryFinalizeAdoption(petId);
  }

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
        selectedAdopterId: firebase.firestore.FieldValue.delete(),
        giverConfirmedHandover: firebase.firestore.FieldValue.delete(),
        adopterConfirmedReceipt: firebase.firestore.FieldValue.delete(),
      });

      await batch.commit();

      // Send final notifications
      await this.notificationService.create({
        userId: petData.selectedAdopterId!,
        message: `¡Felicidades! La adopción de ${petData.nombre} está completa. ¡Ahora es oficialmente tuya!`,
        link: `/mis-mascotas-adoptadas`
      });
      await this.notificationService.create({
        userId: petData.creadorId,
        message: `¡La adopción de ${petData.nombre} se ha completado con éxito!`,
        link: `/home`
      });
    }
  }

  async updateAdoptionRequestStatus(requestId: string, status: 'pending' | 'approved' | 'rejected'): Promise<void> {
    try {
      await this.firestore.collection('adoption-requests').doc(requestId).update({
        status,
        updatedAt: new Date()
      });

      // Si se aprueba la solicitud, rechazar automáticamente las demás para la misma mascota
      if (status === 'approved') {
        const request = await this.getAdoptionRequest(requestId);
        if (request) {
          await this.rejectOtherRequestsForPet(request.petId, requestId);
        }
      }
    } catch (error) {
      console.error('Error updating adoption request status:', error);
      throw error;
    }
  }

  private async rejectOtherRequestsForPet(petId: string, approvedRequestId: string): Promise<void> {
    try {
      const snapshot = await firstValueFrom(
        this.firestore.collection('adoption-requests', ref =>
          ref.where('petId', '==', petId)
            .where('status', '==', 'pending')
        ).get()
      );

      const batch = this.firestore.firestore.batch();

      snapshot.docs.forEach(doc => {
        if (doc.id !== approvedRequestId) {
          batch.update(doc.ref, {
            status: 'rejected',
            updatedAt: new Date(),
            rejectionReason: 'Otra solicitud fue aprobada'
          });
        }
      });

      await batch.commit();
    } catch (error) {
      console.error('Error rejecting other requests:', error);
    }
  }

  // Método auxiliar para obtener información del usuario
  async getUserById(userId: string): Promise<any> {
    try {
      const userDoc = await firstValueFrom(
        this.firestore.collection('users').doc(userId).get()
      );
      return userDoc.exists ? userDoc.data() : null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  // Confirmar entrega como propietario (publicador)
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
        await this.completeAdoption({
          adoptionId: requestId,
          petId: petId,
          adopterId: request.applicantId,
          deliveryDate: now,
          comments: 'Entrega confirmada por ambas partes'
        });

        // Notificar a ambas partes que la adopción está completa
        await this.notificationService.create({
          userId: request.applicantId,
          message: `¡Adopción completada! La mascota ${request.petName} ahora es oficialmente tuya.`,
          link: `/my-adoptions`
        });

        await this.notificationService.create({
          userId: request.creatorId,
          message: `¡Adopción completada! Has entregado exitosamente a ${request.petName}.`,
          link: `/solicitudes-recibidas?petId=${petId}`
        });
      } else {
        // Notificar al adoptante que el propietario ya confirmó
        await this.notificationService.create({
          userId: request.applicantId,
          message: `El publicador confirmó la entrega de ${request.petName}. Por favor, confirma tu recepción.`,
          link: `/my-adoptions`
        });
      }
    } catch (error) {
      console.error('Error confirming delivery as owner:', error);
      throw error;
    }
  }

  // Confirmar entrega como adoptante
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
        await this.completeAdoption({
          adoptionId: requestId,
          petId: petId,
          adopterId: request.applicantId,
          deliveryDate: now,
          comments: 'Entrega confirmada por ambas partes'
        });

        // Notificar a ambas partes que la adopción está completa
        await this.notificationService.create({
          userId: request.applicantId,
          message: `¡Adopción completada! La mascota ${request.petName} ahora es oficialmente tuya.`,
          link: `/my-adoptions`
        });

        await this.notificationService.create({
          userId: request.creatorId,
          message: `¡Adopción completada! Has entregado exitosamente a ${request.petName}.`,
          link: `/solicitudes-recibidas?petId=${petId}`
        });
      } else {
        // Notificar al propietario que el adoptante ya confirmó
        await this.notificationService.create({
          userId: request.creatorId,
          message: `${request.applicantName} confirmó la recepción de ${request.petName}. Por favor, confirma la entrega.`,
          link: `/solicitudes-recibidas?petId=${petId}`
        });
      }
    } catch (error) {
      console.error('Error confirming delivery as adopter:', error);
      throw error;
    }
  }
}
