import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  constructor(private firestore: AngularFirestore) { }

  getTotalUsers(): Observable<number> {
    return this.firestore.collection('users').get().pipe(
      map(snapshot => snapshot.size)
    );
  }

  getTotalPets(): Observable<number> {
    return this.firestore.collection('mascotas').get().pipe(
      map(snapshot => snapshot.size)
    );
  }

  getNewUsersLastMonth(): Observable<number> {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    return this.firestore.collection('users', ref => ref.where('createdAt', '>=', oneMonthAgo)).get().pipe(
      map(snapshot => snapshot.size)
    );
  }

  getNewPetsLastMonth(): Observable<number> {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    return this.firestore.collection('mascotas', ref => ref.where('createdAt', '>=', oneMonthAgo)).get().pipe(
      map(snapshot => snapshot.size)
    );
  }
}
