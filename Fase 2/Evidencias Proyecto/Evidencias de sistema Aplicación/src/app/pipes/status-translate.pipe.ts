import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'statusTranslate'
})
export class StatusTranslatePipe implements PipeTransform {

  transform(value: string): string {
    switch (value) {
      case 'pending':
        return 'Pendiente';
      case 'approved':
        return 'Aprobada';
      case 'rejected':
        return 'Rechazada';
      case 'adopted':
        return 'Adoptado';
      case 'available':
        return 'Disponible';
      case 'reserved':
        return 'Reservado';
      default:
        return value;
    }
  }

}
