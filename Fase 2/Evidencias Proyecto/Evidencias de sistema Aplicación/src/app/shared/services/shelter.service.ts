import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { Shelter } from '@models/Shelter';

@Injectable({
  providedIn: 'root'
})
export class ShelterService {

  constructor(private firestore: AngularFirestore) { }

  getShelters(): Observable<Shelter[]> {
    return this.firestore.collection<Shelter>('shelters').valueChanges({ idField: 'id' });
  }

  addShelter(shelter: Omit<Shelter, 'id'>): Promise<any> {
    return this.firestore.collection('shelters').add(shelter);
  }

  getShelter(id: string): Observable<Shelter | undefined> {
    return this.firestore.collection<Shelter>('shelters').doc(id).valueChanges();
  }

  updateShelter(id: string, shelter: Partial<Shelter>): Promise<void> {
    return this.firestore.collection('shelters').doc(id).update(shelter);
  }

  deleteShelter(id: string): Promise<void> {
    return this.firestore.collection('shelters').doc(id).delete();
  }
}
