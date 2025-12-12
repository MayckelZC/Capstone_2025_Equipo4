import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'userRoleTranslate'
})
export class UserRoleTranslatePipe implements PipeTransform {

  transform(value: string): string {
    switch (value) {
      case 'individual':
        return 'Individual';
      case 'organization':
        return 'Organización';
      case 'veterinarian':
        return 'Veterinario';
      case 'admin':
        return 'Administrador';
      case 'blocked':
        return 'Bloqueado';
      default:
        return value;
    }
  }

}
