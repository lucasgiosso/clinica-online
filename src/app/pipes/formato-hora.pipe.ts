import { Pipe, PipeTransform } from '@angular/core';
import { format, parse } from 'date-fns';

@Pipe({
  name: 'formatoHora',
  standalone: true
})
export class FormatoHoraPipe implements PipeTransform {

  transform(hora: string): string {
    try {
      const parsedTime = parse(hora, 'HH:mm', new Date());

      if (isNaN(parsedTime.getTime())) {
        throw new Error('Hora inválida');
      }

      return format(parsedTime, 'h:mm a');
    } catch (error) {
      console.error('Error al formatear la hora:', error, hora);
      return hora;
    }
  }

}
