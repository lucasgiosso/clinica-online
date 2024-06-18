import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterEsp',
  standalone: true
})
export class FilterEspPipe implements PipeTransform {

  transform(items: any[], searchText: string): any[] {
    if (!items || !searchText) {
      return items;
    }

    searchText = searchText.toLowerCase();

    return items.filter((item) => {
      return (
        (item.nombre && item.nombre.toLowerCase().includes(searchText)) ||
        (item.apellido && item.apellido.toLowerCase().includes(searchText)) ||
        (item.especialidad && item.especialidad.toLowerCase().includes(searchText)) ||
        (item.otraEspecialidad && item.otraEspecialidad.toLowerCase().includes(searchText))
      );
    });
  }

}
