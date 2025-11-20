import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { Handover } from '../models/Handover';
import { AdoptionRequest } from '../models/AdoptionRequest';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { DocumentSnapshot } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class HandoverService {

  private handoverCollection = this.firestore.collection<Handover>('handovers');

  constructor(private firestore: AngularFirestore) { }

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
    return this.handoverCollection.doc<Handover>(handoverId).get().pipe(map(doc => doc as unknown as DocumentSnapshot<Handover>));
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
}
