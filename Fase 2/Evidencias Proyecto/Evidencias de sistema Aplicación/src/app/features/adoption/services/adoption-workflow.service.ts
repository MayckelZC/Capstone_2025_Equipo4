import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Observable, firstValueFrom } from 'rxjs';
import { AdoptionRequest } from '@models/AdoptionRequest';
import { AdoptionStatus, AdoptionCompletion } from '@models/AdoptionStatus';
import { Adopcion } from '@models/Adopcion';
import { User } from '@models/user';
import { NotificationService } from '@shared/services/notification.service';
import { AdoptionDocumentService } from './adoption-document.service';
import { HandoverAgreement, HandoverReceipt } from '@models/AdoptionDocument';

/**
 * AdoptionWorkflowService
 * 
 * Servicio dedicado al flujo de trabajo de adopciones.
 * Responsabilidades:
 * - Aprobar/rechazar solicitudes
 * - Completar adopciones
 * - Generar documentos de adopción
 * - Gestionar transiciones de estado
 */
@Injectable({
    providedIn: 'root'
})
export class AdoptionWorkflowService {

    constructor(
        private firestore: AngularFirestore,
        private notificationService: NotificationService,
        private storage: AngularFireStorage,
        private documentService: AdoptionDocumentService
    ) { }

    /**
     * Aprueba una solicitud de adopción
     * Actualiza estados, rechaza otras solicitudes, envía notificaciones y crea acuerdos
     * @param request La solicitud a aprobar
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
                    batch.update(otherRef, {
                        status: 'rejected',
                        reviewedAt: now,
                        adminNotes: 'Auto-rejected: otra solicitud fue aprobada'
                    });
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
                title: 'Solicitud Aprobada',
                body: `¡Felicidades! La solicitud de adopción para ${petName} ha sido aprobada. Contacta a ${request.applicantName} por WhatsApp${applicantData?.telefono ? ' al ' + applicantData.telefono : ''} o email para coordinar la entrega.`,
                type: 'adoption_request',
                read: false,
                actionUrl: `/adoptions/received-requests`
            });

            // Notify the adopter with owner's contact info
            await this.notificationService.create({
                userId: request.applicantId,
                title: 'Solicitud Aprobada',
                body: `¡Felicidades! Tu solicitud de adopción para ${petName} ha sido aprobada. ${creatorName} se pondrá en contacto contigo${creatorData?.telefono ? ' al ' + creatorData.telefono : ''} para coordinar la entrega.`,
                type: 'adoption_request',
                read: false,
                actionUrl: `/adoptions/my-adoptions`
            });

        } catch (error) {
            console.error('Error approving request:', error);
            throw error;
        }
    }

    /**
     * Rechaza una solicitud de adopción
     * @param request La solicitud a rechazar
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
        const petSnap = await firstValueFrom(
            this.firestore.collection<Adopcion>('mascotas').doc(request.petId).get()
        );
        const petName = petSnap.data()?.nombre || 'la mascota que solicitaste';
        await this.notificationService.create({
            userId: request.applicantId,
            title: 'Solicitud Rechazada',
            body: `Tu solicitud para adoptar a ${petName} ha sido rechazada.`,
            type: 'adoption_request',
            read: false,
            actionUrl: '/adoptions/my-adoptions'
        });
    }

    /**
     * Actualiza el estado de una solicitud de adopción
     * @param requestId ID de la solicitud
     * @param status Nuevo estado
     */
    async updateAdoptionRequestStatus(
        requestId: string,
        status: 'pending' | 'approved' | 'rejected'
    ): Promise<void> {
        try {
            await this.firestore.collection('adoption-requests').doc(requestId).update({
                status,
                updatedAt: new Date()
            });

            // Si se aprueba la solicitud, rechazar automáticamente las demás para la misma mascota
            if (status === 'approved') {
                const doc = await firstValueFrom(
                    this.firestore.collection<AdoptionRequest>('adoption-requests').doc(requestId).get()
                );
                const request = doc.data();
                if (request) {
                    await this.rejectOtherRequestsForPet(request.petId, requestId);
                }
            }
        } catch (error) {
            console.error('Error updating adoption request status:', error);
            throw error;
        }
    }

    /**
     * Completa el proceso de adopción
     * @param completion Datos de la completación
     */
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

            // 4. Enviar notificaciones (no crítico)
            try {
                const adopterMessage = receiptPdfUrl
                    ? `¡Felicidades! La adopción de ${petName} se ha completado oficialmente. Ya eres su nuevo dueño. Se ha generado el recibo de entrega.`
                    : `¡Felicidades! La adopción de ${petName} se ha completado oficialmente. Ya eres su nuevo dueño.`;

                await this.notificationService.create({
                    userId: completion.adopterId,
                    title: 'Adopción Completada',
                    body: adopterMessage,
                    type: 'adoption_request',
                    read: false,
                    actionUrl: `/pets/detalle?id=${completion.petId}`
                });
            } catch (notifError) {
                console.error('Error sending notification to adopter:', notifError);
            }

            try {
                if (currentPetData.creadorId) {
                    const ownerMessage = receiptPdfUrl
                        ? `La adopción de ${petName} se ha completado exitosamente. Gracias por ayudar a encontrarle un nuevo hogar. Se ha generado el recibo de entrega.`
                        : `La adopción de ${petName} se ha completado exitosamente. Gracias por ayudar a encontrarle un nuevo hogar.`;

                    await this.notificationService.create({
                        userId: currentPetData.creadorId,
                        title: 'Adopción Completada',
                        body: ownerMessage,
                        type: 'adoption_request',
                        read: false,
                        actionUrl: '/adoptions/adopted-pets'
                    });
                }
            } catch (notifError) {
                console.error('Error sending notification to previous owner:', notifError);
            }

        } catch (error) {
            console.error('Error completing adoption:', error);
            throw error;
        }
    }

    /**
     * Rechaza automáticamente otras solicitudes pendientes para la misma mascota
     */
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

    /**
     * Genera el acuerdo de adopción en PDF
     */
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
     * Genera un número de recibo único
     */
    private generateReceiptNumber(): string {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        return `ADOPT-${year}-${random}`;
    }

    /**
     * Obtiene datos de usuario por ID
     */
    private async getUserById(userId: string): Promise<any> {
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
}
