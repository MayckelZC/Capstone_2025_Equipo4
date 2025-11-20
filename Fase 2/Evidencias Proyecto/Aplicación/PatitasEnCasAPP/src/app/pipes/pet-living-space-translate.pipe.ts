import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'petLivingSpaceTranslate'
})
export class PetLivingSpaceTranslatePipe implements PipeTransform {

  transform(value: string): string {
    switch (value) {
      case 'indoor':
        return 'Interior';
      case 'indoor_with_garden':
        return 'Interior con jardín';
      case 'outdoor':
        return 'Exterior';
      case 'other':
        return 'Otro';
      default:
        return value;
    }
  }

}
