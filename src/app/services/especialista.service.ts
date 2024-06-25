import { Injectable } from '@angular/core';
import { CollectionReference, DocumentData, DocumentReference, Firestore, QuerySnapshot, Timestamp, collection, doc, getDoc, getDocs, query, updateDoc, where } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, catchError, from, map, throwError } from 'rxjs';
import { Auth } from '@angular/fire/auth';
import { addDays, format, startOfTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Turno, TurnoDisponible, TurnosService } from '../services/turnos.service';

export interface Horario {
  id: number;
  especialidad: string;
  dias: string[];
  horaInicio: string;
  horaFin: string;
}


@Injectable({
  providedIn: 'root'
})
export class EspecialistaService {
  
  private turnosCollection: CollectionReference<DocumentData>;
  disponibilidadSubject = new BehaviorSubject<Horario[]>([]);
  disponibilidad$ = this.disponibilidadSubject.asObservable();

  private horariosDisponibles: Horario[] = [];


  constructor(private auth: Auth, private firestore: Firestore){

    this.turnosCollection = collection(this.firestore, 'turnos');
    this.cargarDisponibilidad();
  }

  getEspecialistaInfo(especialistaId: string): Observable<{ mail: string, nombre: string, apellido: string }> {
    if (!especialistaId) {
      return throwError(new Error('El ID del especialista es inválido.'));
    }
    const especialistaDocRef = doc(this.firestore, `DatosUsuarios/${especialistaId}`);
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
          const userData: { disponibilidad?: Horario[] } = userDoc.data() as any;
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
    const disponibilidadActual = this.disponibilidadSubject.value;
    const indice = disponibilidadActual.findIndex((h) => h.id === idHorario);

    if (indice !== -1) {
      const nuevaDisponibilidad = [...disponibilidadActual];
      nuevaDisponibilidad[indice] = nuevoHorario;
      this.disponibilidadSubject.next(nuevaDisponibilidad);

      this.actualizarDisponibilidadFirestore(nuevaDisponibilidad);
    }
  }
  

  async actualizarDisponibilidadFirestore(disponibilidad: Horario[]) {
    try {
      const user = this.auth.currentUser;

      if (user) {
        const userDocRef = doc(collection(this.firestore, 'DatosUsuarios'), user.uid);
        await updateDoc(userDocRef, { disponibilidad });

        console.log('Disponibilidad actualizada en Firestore.');
      }
    } catch (error) {
      console.error('Error al actualizar la disponibilidad en Firestore:', error);
    }
  }

  async obtenerDisponibilidadEspecialista(especialistaId: string): Promise<Horario[]> {
    try {
      const especialistaDocRef = doc(this.firestore, 'DatosUsuarios', especialistaId);
      const especialistaDocSnapshot = await getDoc(especialistaDocRef);
      
      if (especialistaDocSnapshot.exists()) {
        const data = especialistaDocSnapshot.data() as any;
        const disponibilidad = data['disponibilidad'] || [];

        return disponibilidad;
      } else {
        console.error('No se encontró el especialista con el ID:', especialistaId);
        return [];
      }
    } catch (error) {
      console.error('Error al obtener la disponibilidad del especialista desde Firestore:', error);
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
  

  generarTurnosDisponibles(horario: Horario): TurnoDisponible[] {
    const turnosDisponibles: TurnoDisponible[] = [];
    const tomorrow = startOfTomorrow();

    for (let i = 0; i < 15; i++) {
      const currentDate = addDays(tomorrow, i);
      let formattedDate = format(currentDate, 'EEEE', { locale: es });

      formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

      if (Array.isArray(horario.dias) && horario.dias.includes(formattedDate)) {
        const [horaInicio, minutoInicio] = horario.horaInicio.split(':').map(Number);
        const [horaFin, minutoFin] = horario.horaFin.split(':').map(Number);

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
            id: (turnosDisponibles.length + 1).toString(),
            dias: [format(currentDate, 'EEEE dd-MM-yyyy', { locale: es })],
            horaInicio: `${horaActual.toString().padStart(2, '0')}:${minutoActual.toString().padStart(2, '0')}`,
            horaFin: `${turnoFin.getHours().toString().padStart(2, '0')}:${turnoFin.getMinutes().toString().padStart(2, '0')}`
          };

          turnosDisponibles.push(turnoDisponible);

          minutoActual += 30;
          if (minutoActual >= 60) {
            minutoActual -= 60;
            horaActual += 1;
          }
        }
      }
    }
    return turnosDisponibles;
  }



  verificarDisponibilidad(horario: string, fecha: Date): Promise<boolean> {
    const turnosCollectionRef = collection(this.firestore, 'turnos');
    const q = query(
      turnosCollectionRef,
      where('fechaHora', '==', Timestamp.fromDate(fecha)),
      where('horario', '==', horario),
      where('estado', 'in', ['pendiente', 'aceptado'])
    );

    return getDocs(q).then((querySnapshot: QuerySnapshot<DocumentData>) => {
      return !querySnapshot.empty;
    });
  }


}
