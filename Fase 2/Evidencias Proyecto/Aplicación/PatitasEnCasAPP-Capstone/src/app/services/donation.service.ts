import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Donation } from '../models/Donation';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DonationService {

  constructor(private firestore: AngularFirestore) { }

  addDonation(donation: Omit<Donation, 'id' | 'createdAt'>): Promise<any> {
    const newDonation = { ...donation, createdAt: new Date() };
    return this.firestore.collection('donations').add(newDonation);
  }

  getCount(): Observable<number> {
    return this.firestore.collection('donations').get().pipe(
      map(snapshot => snapshot.size)
    );
  }

  getNewDonationsCountThisWeek(): Observable<number> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return this.firestore.collection<Donation>('donations', ref =>
      ref.where('createdAt', '>=', oneWeekAgo)
    ).snapshotChanges().pipe(
      map(snaps => snaps.length)
    );
  }
}
