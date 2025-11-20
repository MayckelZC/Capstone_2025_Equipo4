import { Pipe, PipeTransform } from '@angular/core';
import firebase from 'firebase/compat/app';

@Pipe({
  name: 'firebaseTimestamp'
})
export class FirebaseTimestampPipe implements PipeTransform {
  transform(timestamp: any): Date | null {
    if (!timestamp) {
      return null;
    }

    // Si ya es un Date, devolverlo directamente
    if (timestamp instanceof Date) {
      return timestamp;
    }

    // Si es un Timestamp de Firebase
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }

    // Si es un objeto con seconds y nanoseconds (formato raw de Timestamp)
    if (timestamp && timestamp.seconds && timestamp.nanoseconds) {
      return new firebase.firestore.Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate();
    }

    // Si es un número (timestamp en milisegundos)
    if (typeof timestamp === 'number') {
      return new Date(timestamp);
    }

    return null;
  }
}