import { Component, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { User } from 'src/app/models/user';
import { Adopcion } from 'src/app/models/Adopcion';
import { Observable, Subscription } from 'rxjs';

import { AuthService } from 'src/app/services/auth.service';
import firebase from 'firebase/compat/app';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
})
export class PerfilPage {
  userId: string | null = null;
  user: User | null = null;
  pets$: Observable<Adopcion[]> | null = null;
  loading: boolean = true;
  userNotFound: boolean = false;
  isOwnProfile: boolean = false;
  
  // New properties for enhanced features
  userStats: any = {
    petsPublished: 0,
    petsAdopted: 0
  };
  
  selectedPetFilter: string = 'all';
  showContactDetails: boolean = false;
  isUserOnline: boolean = false;
  hasMorePets: boolean = false;
  loadingMore: boolean = false;
  
  private userSubscription: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private firestore: AngularFirestore,
    private authService: AuthService,
    private zone: NgZone,
    private router: Router
  ) { }

  ionViewWillEnter() {
    this.userId = this.route.snapshot.paramMap.get('id');
    if (this.userId) {
      this.fetchUserProfile(this.userId);
      this.fetchUserPets(this.userId);
      this.fetchUserStats(this.userId);
      this.checkIfOwnProfile();
    } else {
      this.loading = false;
      this.userNotFound = true;
    }
  }

  ionViewWillLeave() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  async checkIfOwnProfile() {
    const currentUser = await this.authService.getCurrentUser();
    this.isOwnProfile = currentUser?.uid === this.userId;
  }

  fetchUserProfile(userId: string) {
    this.loading = true;
    this.userSubscription = this.firestore.collection<User>('users').doc(userId).valueChanges()
      .subscribe(user => {
        this.zone.run(() => {
          if (user) {
            this.user = user;
            this.userNotFound = false;
          } else {
            this.userNotFound = true;
          }
          this.loading = false;
        });
      }, error => {
        this.zone.run(() => {
          this.userNotFound = true;
          this.loading = false;
          console.error("Error fetching user profile:", error);
        });
      });
  }

  async cancelPendingEmail() {
    if (!this.user) return;
    try {
      await this.firestore.collection('users').doc(this.user.uid).update({
        pendingEmail: firebase.firestore.FieldValue.delete(),
        pendingEmailRequestedAt: firebase.firestore.FieldValue.delete()
      });
      this.user.pendingEmail = undefined;
      this.toast('Cambio de email cancelado.');
    } catch (e) {
      console.error('Error cancelling pending email:', e);
      this.toast('No se pudo cancelar el cambio de email.');
    }
  }

  // lightweight toast helper to avoid importing ToastService here
  private toast(message: string) {
    // If the app has ToastService available in this page, prefer that; otherwise use alert fallback
    try {
      // @ts-ignore: may not exist
      if ((this as any).toastService) {
        // @ts-ignore
        (this as any).toastService.presentToast(message, 'success', 'information-circle-outline');
        return;
      }
    } catch {}
    alert(message);
  }

  fetchUserPets(userId: string) {
    this.pets$ = this.firestore.collection<Adopcion>('mascotas', ref => ref.where('creadorId', '==', userId)).valueChanges({ idField: 'id' });
  }

  goToPetDetails(petId: string) {
    if (!petId) return;
    // Navigate to detalle page with query param id
    this.zone.run(() => this.router.navigate(['/detalle'], { queryParams: { id: petId } }));
  }

  public getWhatsAppLink(telefono: string): string {
    if (!telefono) {
      return '';
    }
    // Remove non-numeric characters
    const sanitizedPhone = telefono.replace(/\D/g, '');
    return `https://wa.me/${sanitizedPhone}`;
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'veterinarian':
        return 'primary';
      case 'organization':
        return 'secondary';
      default:
        return 'success';
    }
  }

  getRoleIcon(role: string): string {
    switch (role) {
      case 'veterinarian':
        return 'medical';
      case 'organization':
        return 'business';
      default:
        return 'person';
    }
  }

  // Fetch user statistics from Firestore
  async fetchUserStats(userId: string) {
    try {
      // Get pets published count
      const petsSnapshot = await this.firestore.collection('mascotas', ref => 
        ref.where('creadorId', '==', userId)
      ).get().toPromise();
      
      if (petsSnapshot) {
        this.userStats.petsPublished = petsSnapshot.size;
        
        // Count adopted pets (assuming there's an 'adopted' field)
        let adoptedCount = 0;
        
        petsSnapshot.forEach(doc => {
          const pet = doc.data() as any;
          if (pet.adoptedAt || pet.status === 'adopted') {
            adoptedCount++;
          }
        });
        
        this.userStats.petsAdopted = adoptedCount;
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  }

  getJoinDate(createdAt: any): string {
    if (!createdAt) return 'Fecha no disponible';
    
    let date: Date;
    if (createdAt.toDate) {
      date = createdAt.toDate();
    } else if (createdAt instanceof Date) {
      date = createdAt;
    } else {
      return 'Fecha no disponible';
    }
    
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long' 
    });
  }

  getResponseTime(): string {
    // This could be calculated from message response times
    // For now, returning a default
    return 'pocas horas';
  }

  // Contact methods
  openWhatsApp() {
    if (this.user?.telefono) {
      const sanitizedPhone = this.user.telefono.replace(/\D/g, '');
      const message = encodeURIComponent(`¡Hola! Vi tu perfil en PatitasEnCasa y me interesa contactarte.`);
      window.open(`https://wa.me/${sanitizedPhone}?text=${message}`, '_blank');
    }
  }

  sendEmail() {
    if (this.user?.email) {
      const subject = encodeURIComponent('Contacto desde PatitasEnCasa');
      const body = encodeURIComponent(`Hola ${this.user.nombreCompleto},\n\nVi tu perfil en PatitasEnCasa y me gustaría contactarte.\n\nSaludos!`);
      window.open(`mailto:${this.user.email}?subject=${subject}&body=${body}`, '_blank');
    }
  }

  makeCall() {
    if (this.user?.telefono) {
      window.open(`tel:${this.user.telefono}`, '_self');
    }
  }

  toggleContactDetails() {
    this.showContactDetails = !this.showContactDetails;
  }

  // Pet filtering methods
  filterPets(event: any) {
    this.selectedPetFilter = event.detail.value;
  }

  getFilteredPets(pets: Adopcion[]): Adopcion[] {
    if (!pets) return [];
    
    switch (this.selectedPetFilter) {
      case 'available':
        return pets.filter(pet => !pet.adoptedAt && pet.status !== 'adopted');
      case 'adopted':
        return pets.filter(pet => pet.adoptedAt || pet.status === 'adopted');
      default:
        return pets;
    }
  }

  trackPetById(index: number, pet: Adopcion): string {
    return pet.id || index.toString();
  }

  loadMorePets() {
    this.loadingMore = true;
    // Implement pagination logic here
    setTimeout(() => {
      this.loadingMore = false;
      this.hasMorePets = false; // No more pets to load
    }, 1000);
  }

  // Profile actions
  shareProfile() {
    if (navigator.share) {
      navigator.share({
        title: `Perfil de ${this.user?.nombreCompleto}`,
        text: `Conoce el perfil de ${this.user?.nombreCompleto} en PatitasEnCasa`,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      this.toast('Enlace copiado al portapapeles');
    }
  }
}