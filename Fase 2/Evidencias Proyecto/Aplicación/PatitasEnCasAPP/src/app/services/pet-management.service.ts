import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Adopcion } from '../models/Adopcion';

@Injectable({
  providedIn: 'root'
})
export class PetManagementService {

  constructor(private firestore: AngularFirestore) { }

  updatePetMedicalStatus(petId: string, data: Partial<Adopcion>): Promise<void> {
    return this.firestore.collection('mascotas').doc(petId).update(data);
  }
}
