import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'timeAgo'
})
export class TimeAgoPipe implements PipeTransform {
    transform(value: any): string {
        if (!value) return '';

        let date: Date;

        // Handle Firestore Timestamp
        if (value.seconds) {
            date = new Date(value.seconds * 1000);
        } else if (value instanceof Date) {
            date = value;
        } else {
            date = new Date(value);
        }

        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) {
            return 'Justo ahora';
        }

        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) {
            return minutes === 1 ? 'Hace 1 minuto' : `Hace ${minutes} minutos`;
        }

        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
            return hours === 1 ? 'Hace 1 hora' : `Hace ${hours} horas`;
        }

        const days = Math.floor(hours / 24);
        if (days < 7) {
            return days === 1 ? 'Hace 1 día' : `Hace ${days} días`;
        }

        const weeks = Math.floor(days / 7);
        if (weeks < 4) {
            return weeks === 1 ? 'Hace 1 semana' : `Hace ${weeks} semanas`;
        }

        const months = Math.floor(days / 30);
        if (months < 12) {
            return months === 1 ? 'Hace 1 mes' : `Hace ${months} meses`;
        }

        const years = Math.floor(days / 365);
        return years === 1 ? 'Hace 1 año' : `Hace ${years} años`;
    }
}
