import { Pipe, PipeTransform } from '@angular/core';
import { format, isValid, parse } from 'date-fns';

@Pipe({
  name: 'formatoFechaHora',
  standalone: true
})
export class FormatoFechaPipe implements PipeTransform {

  transform(fecha: string): string {
    try {

      const partes = fecha.split(' ');
      if (partes.length > 1) {
        partes.shift();
      }
      const datePart = partes.join(' ');

      const parsedDate = parse(datePart, 'dd-MM-yyyy', new Date());

      if (!isValid(parsedDate)) {
        throw new Error('Fecha inválida');
      }

      return format(parsedDate, 'yyyy-MM-dd');
    } catch (error) {
      console.error('Error al formatear la fecha:', error, fecha);
      return fecha; // Devuelve la fecha original en caso de error
    }
  }

}
