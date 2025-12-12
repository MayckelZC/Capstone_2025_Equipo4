import { Injectable } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { PetsService } from '@features/pets/services/pets.service';
import { AdoptionService } from '@features/adoption/services/adoption.service';
import { ToastService } from '@shared/services/toast.service';
import { switchMap, take } from 'rxjs/operators';
import { Adopcion } from '@models/Adopcion';
import { AdoptionRequest } from '@models/AdoptionRequest';

@Injectable({
  providedIn: 'root'
})
export class RealTimeNotificationService {
  private serviceInitialized = false;
  private notifiedRequestStatuses = new Map<string, string>();
  private notifiedNewRequests = new Set<string>(); // Track already notified requests
  private userPetListeners = new Map<string, any>(); // Track active listeners by pet ID

  constructor(
    private authService: AuthService,
    private petsService: PetsService,
    private adoptionService: AdoptionService,
    private toastService: ToastService
  ) { }

  init() {
    if (this.serviceInitialized) {
      // console.log('🔔 RealTimeNotificationService already initialized, skipping...');
      return;
    }
    this.serviceInitialized = true;
    // console.log('🔔 Initializing RealTimeNotificationService...');

    this.authService.user$.subscribe(user => {
      if (user) {
        // console.log('👤 User authenticated, setting up notification listeners for:', user.uid);

        // Clear previous listeners to avoid duplicates
        this.clearAllListeners();

        // Listen for new adoption requests for the user's pets
        this.petsService.getPetsForUser(user.uid).pipe(
          take(1)
        ).subscribe(pets => {
          // console.log('🐾 Found', pets.length, 'pets for user, setting up listeners...');
          pets.forEach(pet => {
            this.listenForNewAdoptionRequests(pet);
          });
        });

        // Listen for status changes on the user's own adoption requests
        this.listenForAdoptionRequestStatusChanges(user.uid);
      } else {
        // console.log('👤 User not authenticated, clearing all listeners...');
        this.clearAllListeners();
      }
    });
  }

  private clearAllListeners() {
    // Unsubscribe from all pet listeners
    this.userPetListeners.forEach((listener, petId) => {
      if (listener && listener.unsubscribe) {
        listener.unsubscribe();
        // console.log('🔇 Unsubscribed listener for pet:', petId);
      }
    });
    this.userPetListeners.clear();

    // Clear notification tracking
    this.notifiedNewRequests.clear();
    this.notifiedRequestStatuses.clear();
  }

  private listenForNewAdoptionRequests(pet: Adopcion) {
    const serviceInitializationTime = new Date();

    // Check if we already have a listener for this pet
    if (this.userPetListeners.has(pet.id)) {
      // console.log('🔔 Listener already exists for pet:', pet.nombre, 'skipping...');
      return;
    }

    // console.log('🔔 Setting up adoption request listener for pet:', pet.nombre!);

    const subscription = this.adoptionService.getRequestsForPet(pet.id).subscribe(requests => {
      // console.log('📋 Received', requests.length, 'requests for pet:', pet.nombre!);

      requests.forEach(request => {
        const requestDate = request.requestDate as Date;
        const requestKey = `${pet.id}_${request.applicantId}`;

        // Only notify for new pending requests that haven't been notified before
        if (request.status === 'pending' &&
          requestDate > serviceInitializationTime &&
          !this.notifiedNewRequests.has(requestKey)) {

          // console.log('🆕 New adoption request detected for:', pet.nombre, 'from:', request.applicantName);

          this.toastService.presentToast(
            `Nueva solicitud de adopción para ${pet.nombre}`,
            'primary',
            'paw-outline',
            5000
          );

          // Mark as notified to prevent duplicates
          this.notifiedNewRequests.add(requestKey);
        }
      });
    });

    // Store the subscription to be able to unsubscribe later
    this.userPetListeners.set(pet.id, subscription);
  }

  private listenForAdoptionRequestStatusChanges(userId: string) {
    let initialStatusesLoaded = false;
    // console.log('🔔 Setting up status change listener for user:', userId);

    this.adoptionService.getRequestsForUser(userId).subscribe(requests => {
      if (!initialStatusesLoaded) {
        // console.log('📋 Loading initial status for', requests.length, 'user requests...');
        requests.forEach(request => {
          this.notifiedRequestStatuses.set(request.id, request.status);
        });
        initialStatusesLoaded = true;
        return;
      }

      // console.log('🔄 Checking status changes for', requests.length, 'requests...');

      requests.forEach(request => {
        const notifiedStatus = this.notifiedRequestStatuses.get(request.id!);
        if (notifiedStatus && notifiedStatus !== request.status) {
          // console.log('📝 Status changed for request:', request.id, 'from:', notifiedStatus, 'to:', request.status);

          if (request.status === 'approved') {
            this.toastService.presentToast(
              `¡Tu solicitud para adoptar a ${request.petName || 'la mascota'} ha sido aprobada!`,
              'success',
              'checkmark-circle-outline',
              5000
            );
          } else if (request.status === 'rejected') {
            this.toastService.presentToast(
              `Tu solicitud para adoptar a ${request.petName || 'la mascota'} ha sido rechazada.`,
              'danger',
              'close-circle-outline',
              5000
            );
          }

          // Update the tracked status
          this.notifiedRequestStatuses.set(request.id, request.status);
        } else if (!notifiedStatus && request.status !== 'pending') {
          // Handle case where we missed the initial status but now see a changed status
          // console.log('📝 Late status detection for request:', request.id, 'status:', request.status);
          this.notifiedRequestStatuses.set(request.id, request.status);
        }
      });
    });
  }

  // Método público para reinicializar el servicio si es necesario
  reinitialize() {
    console.log('🔄 Reinitializing RealTimeNotificationService...');
    this.serviceInitialized = false;
    this.clearAllListeners();
    this.init();
  }

  // Método público para limpiar completamente el servicio
  destroy() {
    console.log('🔇 Destroying RealTimeNotificationService...');
    this.clearAllListeners();
    this.serviceInitialized = false;
  }
}