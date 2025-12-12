import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, firstValueFrom } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AdoptionRequest } from '@models/AdoptionRequest';
import { NotificationService } from '@shared/services/notification.service';

/**
 * AdoptionRequestService
 * 
 * Servicio dedicado a la gestión de solicitudes de adopción (CRUD).
 * Responsabilidades:
 * - Crear solicitudes
 * - Consultar solicitudes (por usuario, mascota, estado)
 * - Actualizar solicitudes
 * - Validaciones de negocio para solicitudes
 */
@Injectable({
    providedIn: 'root'
})
export class AdoptionRequestService {

    constructor(
        private firestore: AngularFirestore,
        private notificationService: NotificationService
    ) { }

    /**
     * Crea una nueva solicitud de adopción
     * @param request Datos de la solicitud
     */
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

        // Use deterministic id to avoid duplicate requests from same user for same pet
        const id = `${request.petId}_${request.applicantId}`;
        await this.firestore.collection('adoption-requests').doc(id).set({
            ...request,
            id,
            creatorId: petData.creadorId
        });

        // Send notification to pet owner
        await this.notificationService.sendAdoptionRequestNotification(
            petData.creadorId,
            petData.nombre || 'Mascota',
            request.applicantName,
            id
        );

        // Send confirmation notification to applicant
        await this.notificationService.create({
            userId: request.applicantId,
            title: 'Solicitud Enviada',
            body: `Tu solicitud de adopción para ${petData.nombre} ha sido enviada. El dueño la revisará pronto.`,
            type: 'adoption_request',
            read: false,
            actionUrl: `/pets/detalle?id=${request.petId}`,
            imageUrl: petData.urlImagen || null
        });
    }

    /**
     * Verifica si un usuario ya tiene una solicitud pendiente para una mascota
     * @param userId ID del usuario
     * @param petId ID de la mascota
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
     * Obtiene todas las solicitudes de un usuario
     * @param userId ID del usuario
     */
    getRequestsForUser(userId: string): Observable<AdoptionRequest[]> {
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
     * Obtiene el número de solicitudes pendientes enviadas por el usuario
     * @param applicantId ID del solicitante
     */
    getPendingRequestsForApplicant(applicantId: string): Observable<number> {
        return this.firestore.collection<AdoptionRequest>('adoption-requests', ref =>
            ref.where('applicantId', '==', applicantId)
                .where('status', '==', 'pending')
        ).valueChanges().pipe(map(requests => requests.length));
    }

    /**
     * Obtiene todas las solicitudes para una mascota específica
     * @param petId ID de la mascota
     */
    getRequestsForPet(petId: string): Observable<AdoptionRequest[]> {
        return this.firestore.collection<AdoptionRequest>('adoption-requests', ref =>
            ref.where('petId', '==', petId)
        ).valueChanges({ idField: 'id' }).pipe(
            map(requests => requests.map(request => ({
                ...request,
                requestDate: (request.requestDate as any).toDate ? (request.requestDate as any).toDate() : request.requestDate,
                reviewedAt: (request.reviewedAt as any)?.toDate ? (request.reviewedAt as any).toDate() : request.reviewedAt
            })))
        );
    }

    /**
     * Obtiene todas las solicitudes pendientes (para admin)
     */
    getPendingRequests(): Observable<AdoptionRequest[]> {
        return this.firestore.collection<AdoptionRequest>('adoption-requests', ref =>
            ref.where('status', '==', 'pending')
        ).valueChanges();
    }

    /**
     * Obtiene las últimas solicitudes pendientes ordenadas por fecha
     * @param limit Número máximo de resultados
     */
    getLatestPendingRequests(limit: number = 5): Observable<AdoptionRequest[]> {
        return this.firestore.collection<AdoptionRequest>('adoption-requests', ref =>
            ref.where('status', '==', 'pending')
                .orderBy('requestDate', 'desc')
                .limit(limit)
        ).valueChanges({ idField: 'id' }).pipe(
            catchError(error => {
                console.warn('Firebase Index missing, falling back to client-side sorting', error);
                // Fallback: obtener todos los pendientes y ordenar en cliente
                return this.firestore.collection<AdoptionRequest>('adoption-requests', ref =>
                    ref.where('status', '==', 'pending')
                ).valueChanges({ idField: 'id' }).pipe(
                    map(requests => requests
                        .sort((a, b) => {
                            const dateA = (a.requestDate as any)?.toDate ? (a.requestDate as any).toDate() : new Date(a.requestDate);
                            const dateB = (b.requestDate as any)?.toDate ? (b.requestDate as any).toDate() : new Date(b.requestDate);
                            return dateB.getTime() - dateA.getTime();
                        })
                        .slice(0, limit)
                    )
                );
            })
        );
    }

    /**
     * Obtiene una solicitud específica por ID
     * @param requestId ID de la solicitud
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
     * Obtiene una solicitud por ID (Promise)
     * @param id ID de la solicitud
     */
    async getAdoptionRequest(id: string): Promise<AdoptionRequest> {
        const doc = await firstValueFrom(
            this.firestore.collection<AdoptionRequest>('adoption-requests').doc(id).get()
        );
        return doc.data() as AdoptionRequest;
    }

    /**
     * Obtiene todas las solicitudes para una mascota (Promise)
     * @param petId ID de la mascota
     */
    async getAdoptionRequestsForPet(petId: string): Promise<AdoptionRequest[]> {
        try {
            const snapshot = await firstValueFrom(
                this.firestore.collection<AdoptionRequest>('adoption-requests', ref =>
                    ref.where('petId', '==', petId)
                ).get()
            );

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

        } catch (error: any) {
            console.error('Error getting adoption requests for pet:', error);
            return [];
        }
    }

    /**
     * Actualiza una solicitud
     * @param requestId ID de la solicitud
     * @param data Datos a actualizar
     */
    async updateRequest(requestId: string, data: any): Promise<void> {
        return this.firestore.collection('adoption-requests').doc(requestId).update(data);
    }

    /**
     * Vincula un handover a una solicitud
     * @param requestId ID de la solicitud
     * @param handoverId ID del handover
     */
    linkHandoverToRequest(requestId: string, handoverId: string): Promise<void> {
        return this.firestore.collection('adoption-requests').doc(requestId).update({ handoverId });
    }
}
