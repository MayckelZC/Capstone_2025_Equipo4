import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { Favorite } from '../models/Favorite';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {

  constructor(private firestore: AngularFirestore) { }

  getFavorites(userId: string): Observable<Favorite[]> {
    return this.firestore.collection<Favorite>(`users/${userId}/favorites`).valueChanges({ idField: 'id' });
  }

  /**
   * Adds a favorite in an idempotent way by using petId as the document id.
   * Returns the favorite id (which is the petId) when the write completes.
   */
  addFavorite(userId: string, petId: string): Promise<string> {
    const docRef = this.firestore.collection(`users/${userId}/favorites`).doc(petId);
    // Include a createdAt timestamp for bookkeeping
    return docRef.set({ petId, createdAt: new Date() }).then(() => petId);
  }

  removeFavorite(userId: string, favoriteId: string): Promise<void> {
    return this.firestore.collection(`users/${userId}/favorites`).doc(favoriteId).delete();
  }
}
