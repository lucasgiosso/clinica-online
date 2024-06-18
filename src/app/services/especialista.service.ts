import { Injectable } from '@angular/core';
import { CollectionReference, DocumentData, DocumentReference, Firestore, collection, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, catchError, from, map, throwError } from 'rxjs';
import { Auth } from '@angular/fire/auth';
import { addDays, format, startOfTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';

export interface Horario {
  id: number;
  especialidad: string;
  dias: string;
  horaInicio: string;
  horaFin: string;
}

export interface TurnoDisponible {
  id: number;
  dias: string[];
  horaInicio: string;
  horaFin: string;
  
}


@Injectable({
  providedIn: 'root'
})
export class EspecialistaService {

  disponibilidadSubject = new BehaviorSubject<Horario[]>([]);
  disponibilidad$ = this.disponibilidadSubject.asObservable();

  private horariosDisponibles: Horario[] = [];


  constructor(private auth: Auth, private firestore: Firestore){

    this.cargarDisponibilidad();
  }

  getEspecialistaInfo(especialistaId: string): Observable<{ mail: string, nombre: string, apellido: string }> {
    if (!especialistaId) {
      return throwError(new Error('El ID del especialista es inválido.'));
    }
    const especialistaDocRef = doc(this.firestore, `DatosUsuarios/${especialistaId}`);
    console.log('Referencia al documento del especialista:', especialistaDocRef.path);
    return from(getDoc(especialistaDocRef)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            mail: data['mail'],
            nombre: data['nombre'],
            apellido: data['apellido']
          };
        } else {
          throw new Error(`No se encontró información para el especialista con ID ${especialistaId}`);
        }
      }),
      catchError(error => {
        console.error(`Error al obtener información del especialista:`, error);
        return throwError(error);
      })
    );
  }

  async cargarDisponibilidad() {
    try {
      const user = this.auth.currentUser;

      if (user) {
        const userDocRef = doc(collection(this.firestore, 'DatosUsuarios'), user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData: { disponibilidad?: Horario[] } = userDoc.data();
          const disponibilidad = userData['disponibilidad'] || [];
          this.disponibilidadSubject.next(disponibilidad);
        }
      }
    } catch (error) {
      console.error('Error al cargar la disponibilidad desde Firestore:', error);
    }
  }


  guardarDisponibilidad(nuevoHorario: Horario) {
    const disponibilidadActual = this.disponibilidadSubject.value;
    nuevoHorario.id = disponibilidadActual.length + 1;
    const nuevaDisponibilidad = [...disponibilidadActual, nuevoHorario];
    this.disponibilidadSubject.next(nuevaDisponibilidad);

    this.actualizarDisponibilidadFirestore(nuevaDisponibilidad);
  }

  modificarDisponibilidad(idHorario: number, nuevoHorario: Horario) {
    console.log('Modificando horario con ID:', idHorario);
    const disponibilidadActual = this.disponibilidadSubject.value;
    const indice = disponibilidadActual.findIndex((h) => h.id === idHorario);
  
    if (indice !== -1) {
      const nuevaDisponibilidad = [...disponibilidadActual];
      nuevaDisponibilidad[indice] = nuevoHorario;
      console.log('Nueva disponibilidad emitida:', nuevaDisponibilidad);
      this.disponibilidadSubject.next(nuevaDisponibilidad);
  
      this.actualizarDisponibilidadFirestore(nuevaDisponibilidad);
    }
  }

  private async actualizarDisponibilidadFirestore(disponibilidad: Horario[]) {
    try {
      const user = this.auth.currentUser;

      if (user) {

        const disponibilidadConDiasArray = disponibilidad.map(item => ({ ...item, dias: Array.isArray(item.dias) ? item.dias : [item.dias] }));

        const userDocRef = doc(collection(this.firestore, 'DatosUsuarios'), user.uid);
        await updateDoc(userDocRef, { disponibilidad: disponibilidadConDiasArray });

        const sortedDisponibilidad = disponibilidad.sort((a, b) => {
          const dayComparison = a.dias[0].localeCompare(b.dias[0]);
          return dayComparison === 0 ? a.horaInicio.localeCompare(b.horaInicio) : dayComparison;
        });
        
        this.disponibilidadSubject.next(sortedDisponibilidad);

        console.log('Disponibilidad actualizada en Firestore.');
      }
    } catch (error) {
      console.error('Error al actualizar la disponibilidad en Firestore:', error);
    }
  }


  // async obtenerTurnosDisponiblesParaEspecialista(especialistaId: string): Promise<TurnoDisponible[]> {
  //   try {
  //     console.log('Obteniendo turnos disponibles para el especialista con ID:', especialistaId);

  //     // Referencia a la colección DatosUsuarios
  //     const datosUsuariosCollection = collection(this.firestore, 'DatosUsuarios') as CollectionReference<DocumentData>;
  //     // Referencia al documento específico del especialista
  //     const especialistaDocRef = doc(datosUsuariosCollection, especialistaId);
  //     console.log('Referencia al documento del especialista:', especialistaDocRef.path);

  //     // Obtenemos el documento
  //     const especialistaDoc = await getDoc(especialistaDocRef);
      
  //     if (especialistaDoc.exists()) {
  //       // Convertimos los datos del documento en un arreglo de turnos disponibles
  //       const data = especialistaDoc.data();
  //       console.log('Datos del documento del especialista:', data);
  //       return data['disponibilidad'] as TurnoDisponible[];
  //     } else {
  //       console.error('Especialista no encontrado con ID:', especialistaId);
  //       throw new Error('Especialista no encontrado');
  //     }
  //   } catch (error) {
  //     console.error('Error al obtener turnos disponibles:', error);
  //     throw error;
  //   }
  // }

  async obtenerTurnosDisponiblesParaEspecialista(especialistaId: string): Promise<TurnoDisponible[]> {
    try {
      console.log('Obteniendo turnos disponibles para el especialista con ID:', especialistaId);
  
      const disponibilidadEspecialista = await this.obtenerDisponibilidadEspecialista(especialistaId);
  
      const turnosDisponibles: TurnoDisponible[] = [];
      disponibilidadEspecialista.forEach(horario => {
        const turnosHorario = this.generarTurnosDisponibles(horario);
        turnosDisponibles.push(...turnosHorario);
      });
  
      console.log('Turnos disponibles:', turnosDisponibles);
      return turnosDisponibles;
    } catch (error) {
      console.error('Error al obtener turnos disponibles:', error);
      throw error;
    }
  }


  private async obtenerDisponibilidadEspecialista(especialistaId: string): Promise<Horario[]> {
    try {

      const disponibilidad = await this.obtenerDisponibilidadEspecialistaDesdeFirestore(especialistaId);
      return disponibilidad;
    } catch (error) {
      console.error('Error al obtener la disponibilidad del especialista:', error);
      throw error;
    }
  }
  
  async obtenerDisponibilidadEspecialistaDesdeFirestore(especialistaId: string): Promise<Horario[]> {
    try {
      const especialistaDocRef = doc(this.firestore, 'DatosUsuarios', especialistaId) as DocumentReference<DocumentData>;
      const especialistaDocSnapshot = await getDoc(especialistaDocRef);
      
      if (especialistaDocSnapshot.exists()) {
        const data = especialistaDocSnapshot.data();
        return data['disponibilidad'] || [];
      } else {
        console.error('No se encontró el especialista con el ID:', especialistaId);
        return [];
      }
    } catch (error) {
      console.error('Error al obtener la disponibilidad del especialista desde Firestore:', error);
      throw error;
    }
  }
  
  private generarTurnosDisponibles(horario: Horario): TurnoDisponible[] {
    const turnosDisponibles: TurnoDisponible[] = [];
    const tomorrow = startOfTomorrow();
  
    // console.log('horario.dias:', horario.dias);
  
    for (let i = 0; i < 15; i++) {
      const currentDate = addDays(tomorrow, i);
      let formattedDate = format(currentDate, 'EEEE', { locale: es });
  
      // Capitalize the first letter
      formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  
      // console.log('Checking date:', formattedDate);
  
      if (Array.isArray(horario.dias) && horario.dias.includes(formattedDate)) {
        // console.log('Date matches with horario.dias:', formattedDate);
  
        const [horaInicio, minutoInicio] = horario.horaInicio.split(':').map(Number);
        const [horaFin, minutoFin] = horario.horaFin.split(':').map(Number);
  
        // console.log('horaInicio:', horaInicio, 'minutoInicio:', minutoInicio);
        // console.log('horaFin:', horaFin, 'minutoFin:', minutoFin);
  
        let horaActual = horaInicio;
        let minutoActual = minutoInicio;
  
        while (horaActual < horaFin || (horaActual === horaFin && minutoActual < minutoFin)) {
          const turnoFin = new Date(currentDate);
          turnoFin.setHours(horaActual);
          turnoFin.setMinutes(minutoActual + 30);
  
          if (turnoFin.getHours() > horaFin || (turnoFin.getHours() === horaFin && turnoFin.getMinutes() > minutoFin)) {
            break;
          }
  
          const turnoDisponible: TurnoDisponible = {
            id: turnosDisponibles.length + 1,
            dias: [format(currentDate, 'EEEE dd-MM-yyyy', { locale: es })],
            horaInicio: `${horaActual.toString().padStart(2, '0')}:${minutoActual.toString().padStart(2, '0')}`,
            horaFin: `${turnoFin.getHours().toString().padStart(2, '0')}:${turnoFin.getMinutes().toString().padStart(2, '0')}`
          };
  
          // console.log('Generated Turno:', turnoDisponible);
  
          turnosDisponibles.push(turnoDisponible);
  
          minutoActual += 30;
          if (minutoActual >= 60) {
            minutoActual -= 60;
            horaActual += 1;
          }
        }
      } else {
        // console.log('Date does not match horario.dias:', formattedDate);
      }
    }
    return turnosDisponibles;
  }
}
