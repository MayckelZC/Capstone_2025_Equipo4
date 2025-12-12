import { Pipe, PipeTransform } from '@angular/core';
import { Timestamp } from 'firebase/firestore';

@Pipe({
    name: 'timestampToDate'
})
export class TimestampToDatePipe implements PipeTransform {

    transform(value: any): Date | null {
        if (!value) {
            return null;
        }

        // Si ya es una fecha, devolverla
        if (value instanceof Date) {
            return value;
        }

        // Si es un Timestamp de Firebase (tiene método toDate)
        if (value && typeof value.toDate === 'function') {
            return value.toDate();
        }

        // Si es un objeto con seconds y nanoseconds (serializado)
        if (value && typeof value.seconds === 'number') {
            return new Date(value.seconds * 1000);
        }

        return null;
    }

}
