import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '@models/user';

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

  /**
   * Obtener crecimiento de usuarios por mes (últimos N meses)
   */
  getUserGrowthByMonth(months: number = 6): Observable<number[]> {
    return this.firestore.collection<User>('users').valueChanges().pipe(
      map(users => {
        const now = new Date();
        const monthlyData: number[] = [];

        // Inicializar array con ceros
        for (let i = 0; i < months; i++) {
          monthlyData.push(0);
        }

        // Contar usuarios por mes
        users.forEach(user => {
          if (user.createdAt) {
            const createdDate = (user.createdAt as any).toDate ? (user.createdAt as any).toDate() : new Date(user.createdAt);
            const monthsDiff = this.getMonthsDifference(createdDate, now);

            if (monthsDiff >= 0 && monthsDiff < months) {
              const index = months - 1 - monthsDiff;
              monthlyData[index]++;
            }
          }
        });

        return monthlyData;
      })
    );
  }

  /**
   * Calcular diferencia en meses entre dos fechas
   */
  private getMonthsDifference(date1: Date, date2: Date): number {
    return (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth());
  }
}
