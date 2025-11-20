import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private firestore: AngularFirestore) { }

  getUsers(): Observable<User[]> {
    return this.firestore.collection<User>('users').valueChanges({ idField: 'uid' });
  }

  getUsersByRole(role: string): Observable<User[]> {
    return this.firestore.collection<User>('users', ref => ref.where(role, '==', true)).valueChanges({ idField: 'uid' });
  }

  getUserData(uid: string): Observable<User | undefined> {
    return this.firestore.collection<User>('users').doc(uid).valueChanges();
  }

  getNewUsersCountThisWeek(): Observable<number> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return this.firestore.collection<User>('users', ref =>
      ref.where('createdAt', '>=', oneWeekAgo)
    ).snapshotChanges().pipe(
      map(snaps => snaps.length)
    );
  }
}
