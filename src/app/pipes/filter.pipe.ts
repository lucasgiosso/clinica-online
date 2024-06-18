import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  standalone: true
})
export class FilterPipe implements PipeTransform {

  transform(items: any[], searchText: string): any[] {
    if (!items || !searchText) {
      return items;
    }

    searchText = searchText.toLowerCase();

    return items.filter((item) => {
      return (
        (item.nombre && item.nombre.toLowerCase().includes(searchText)) ||
        (item.apellido && item.apellido.toLowerCase().includes(searchText)) ||
        (item.edad && item.edad.toString().toLowerCase().includes(searchText)) ||
        (item.dni && item.dni.toLowerCase().includes(searchText)) ||
        (item.obrasocial && item.obrasocial.toLowerCase().includes(searchText)) ||
        (item.mail && item.mail.toLowerCase().includes(searchText)) ||
        (item.especialidad && item.especialidad.toLowerCase().includes(searchText)) ||
        (item.otraEspecialidad && item.otraEspecialidad.toLowerCase().includes(searchText)) ||
        (item.especialistas && item.especialistas.nombre && item.especialistas.nombre.toLowerCase().includes(searchText)) ||
        (item.especialistas && item.especialistas.apellido && item.especialistas.apellido.toLowerCase().includes(searchText)) ||
        (item.paciente && item.paciente.nombre && item.paciente.nombre.toLowerCase().includes(searchText)) ||
        (item.paciente && item.paciente.apellido && item.paciente.apellido.toLowerCase().includes(searchText))
      );
    });
  }

}
