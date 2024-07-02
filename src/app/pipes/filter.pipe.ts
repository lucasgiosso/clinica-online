// import { Pipe, PipeTransform } from '@angular/core';

// @Pipe({
//   name: 'filter',
//   standalone: true
// })
// export class FilterPipe implements PipeTransform {

//   transform(items: any[], searchText: string): any[] {
//     if (!items || !searchText) {
//       return items;
//     }

//     searchText = searchText.toLowerCase();

//     return items.filter((item) => {
//       return (
//         (item.nombre && item.nombre.toLowerCase().includes(searchText)) ||
//         (item.apellido && item.apellido.toLowerCase().includes(searchText)) ||
//         (item.edad && item.edad.toString().toLowerCase().includes(searchText)) ||
//         (item.dni && item.dni.toLowerCase().includes(searchText)) ||
//         (item.obrasocial && item.obrasocial.toLowerCase().includes(searchText)) ||
//         (item.role && item.role.toLowerCase().includes(searchText)) ||
//         (item.mail && item.mail.toLowerCase().includes(searchText)) ||
//         (item.especialidad && item.especialidad.toLowerCase().includes(searchText)) ||
//         (item.otraEspecialidad && item.otraEspecialidad.toLowerCase().includes(searchText)) ||
//         (item.especialistas && item.especialistas.nombre && item.especialistas.nombre.toLowerCase().includes(searchText)) ||
//         (item.especialistas && item.especialistas.apellido && item.especialistas.apellido.toLowerCase().includes(searchText)) ||
//         (item.paciente && item.paciente.nombre && item.paciente.nombre.toLowerCase().includes(searchText)) ||
//         (item.paciente && item.paciente.apellido && item.paciente.apellido.toLowerCase().includes(searchText)) ||
//         (item.pacientes && item.pacientes.altura && item.pacientes.altura.toLowerCase().includes(searchText)) ||
//         (item.pacientes && item.pacientes.peso && item.pacientes.peso.toLowerCase().includes(searchText)) ||
//         (item.pacientes && item.pacientes.temperatura && item.pacientes.temperatura.toLowerCase().includes(searchText)) ||
//         (item.pacientes && item.pacientes.presion && item.pacientes.presion.toLowerCase().includes(searchText)) ||
//         (item.pacientes && item.pacientes.clave && item.pacientes.clave.toLowerCase().includes(searchText)) ||
//         (item.pacientes && item.pacientes.valor && item.pacientes.valor.toLowerCase().includes(searchText))
//       );
//     });
//   }

// }


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
      // Check the top-level fields
      const matchTopLevel = (field: any) => field && field.toString().toLowerCase().includes(searchText);

      // Check the nested fields within 'pacientes'
      const matchPacienteFields = (paciente: any) => {
        return paciente && (
          matchTopLevel(paciente.altura) ||
          matchTopLevel(paciente.peso) ||
          matchTopLevel(paciente.temperatura) ||
          matchTopLevel(paciente.presion) ||
          (paciente.datosDinamicos && paciente.datosDinamicos.some((data: any) => matchTopLevel(data.clave) || matchTopLevel(data.valor)))
        );
      };

      return (
        matchTopLevel(item.nombre) ||
        matchTopLevel(item.apellido) ||
        matchTopLevel(item.edad) ||
        matchTopLevel(item.dni) ||
        matchTopLevel(item.obrasocial) ||
        matchTopLevel(item.role) ||
        matchTopLevel(item.mail) ||
        matchTopLevel(item.especialidad) ||
        matchTopLevel(item.otraEspecialidad) ||
        (item.especialistas && (matchTopLevel(item.especialistas.nombre) || matchTopLevel(item.especialistas.apellido))) ||
        (item.paciente && (matchTopLevel(item.paciente.nombre) || matchTopLevel(item.paciente.apellido))) ||
        (item.pacientes && matchPacienteFields(item.pacientes))
      );
    });
  }
}