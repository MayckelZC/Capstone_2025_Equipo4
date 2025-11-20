import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'reportReasonTranslate'
})
export class ReportReasonTranslatePipe implements PipeTransform {

  transform(value: string): string {
    switch (value) {
      case 'inappropriate_content':
        return 'Contenido inapropiado';
      case 'false_information':
        return 'Información falsa';
      case 'spam':
        return 'Spam o publicidad';
      case 'animal_abuse':
        return 'Maltrato animal';
      case 'other':
        return 'Otro motivo';
      default:
        return value;
    }
  }

}
