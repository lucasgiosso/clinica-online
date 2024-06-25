import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, where, CollectionReference, DocumentData, doc, getDoc, QuerySnapshot, DocumentReference, collectionData, setDoc, docData, updateDoc, collectionGroup, Timestamp, DocumentSnapshot } from '@angular/fire/firestore';
import { Observable, catchError, combineLatest, forkJoin, from, map, mergeMap, of, switchMap } from 'rxjs';
import { PacienteService } from '../services/paciente.service';
import { EspecialistaService, Horario } from './especialista.service';


export interface Turno {
  id: string; 
  especialidad: string;
  especialistaId: string;
  fechaHora: Timestamp | Date;
  fecha?: Date;
  horario?: string;
  horaInicio?: string;
  horaFin?: string;
  estado: 'pendiente' | 'cancelado' | 'realizado' | 'aceptado' | 'rechazado';
  ocupado?: boolean;
  paciente: {
    mail: string;
    nombre: string;
    apellido: string;
  }
  especialista: {
    mail: string;
    nombre: string;
    apellido: string;
  }
  comentario?: string;
  resena?: string;
  encuestaCompletada?: boolean;
  encuesta?: {
    calificacionAtencion: number;
    tiempoEspera: number;
    satisfaccionGeneral: number;
  };
  motivoCancelacion?: string;
  motivoRechazo?: string;
  calificacionCompletada?: boolean;
  comentarioCalificacion?: string;
}

export interface TurnoDisponible {
  id: string;
  dias: string[];
  horaInicio: string;
  horaFin: string;
  ocupado?: boolean; 
  
}

export interface Paciente {
  email: string;
  nombre: string;
  apellido: string;
}

export interface HistoriaClinica {
  id?: string;
  altura: number;
  peso: number;
  temperatura: number;
  presion: string;
  datosDinamicos?: Array<{ clave: string, valor: string }>;
  fecha: Date;
  especialistaId: string;
}


@Injectable({
  providedIn: 'root'
})
export class TurnosService {

  private turnos: any[] = [];
  private turnosCollection: CollectionReference<DocumentData>;

  constructor(private firestore: Firestore, private pacienteService: PacienteService, private especialistaService: EspecialistaService) {
    this.turnosCollection = collection(this.firestore, 'turnos');
   }


  obtenerTurnosPorPaciente(pacienteMail: string): Observable<any[]> {
    const turnosCollectionRef = collection(this.firestore, `turnos/${pacienteMail.toLocaleLowerCase()}/turnos`);
    return collectionData(turnosCollectionRef, { idField: 'id' }).pipe(
      map(turnos => turnos.map(turno => ({
        ...turno,
        fechaHora: turno['fechaHora'].seconds 
          ? new Date(turno['fechaHora'].seconds * 1000 + turno['fechaHora'].nanoseconds / 1000000)
          : turno['fechaHora']
      }))),
      catchError(error => {
        console.error(`Error al obtener los turnos:`, error);
        return of([]);
      })
    );
  }

  obtenerTurnoPorId(turnoId: string): Observable<Turno> {
    const turnoDocRef = doc(this.firestore, `turnos/${turnoId}`);
    return from(getDoc(turnoDocRef)).pipe(
      map((turnoDoc: DocumentSnapshot) => {
        const turnoData = turnoDoc.data() as Turno;
        return {
          ...turnoData,
          id: turnoDoc.id
        };
      }),
      catchError(error => {
        console.error('Error al obtener el turno por ID:', error);
        throw error; // Lanza el error para ser manejado por el componente
      })
    );
  }



  getTurnosUsuarioLogueado(): Observable<any[]> {
    return this.pacienteService.getPacienteInfo().pipe(
      switchMap(paciente => {
        console.log('Obteniendo turnos para el usuario:', paciente.mail);
        return this.obtenerTurnosPorPaciente(paciente.mail);
      }),
      catchError(error => {
        console.error('Error al obtener la información del paciente:', error);
        return of([]);
      })
    );
  }

  obtenerTodosLosTurnos(): Observable<Turno[]> {
    const turnosCollectionGroup = collectionGroup(this.firestore, 'turnos');
    return from(getDocs(turnosCollectionGroup)).pipe(
      map(querySnapshot => {
        const allTurnos: Turno[] = [];
        querySnapshot.forEach(turnoDoc => {
          const turnoData = turnoDoc.data() as Turno;
          //console.log('Turno Data:', turnoData); // Log para verificar los datos del turno
          if (turnoData['fechaHora'] instanceof Timestamp) {
            turnoData.fechaHora = turnoData['fechaHora'].toDate();
          }
          allTurnos.push({ ...turnoData, id: turnoDoc.id });
        });
        //console.log('All Turnos:', allTurnos); // Log para verificar todos los turnos obtenidos
        return allTurnos;
      }),
      catchError(error => {
        console.error(`Error al obtener los turnos:`, error);
        return of([]);
      })
    );
  }

  

  async obtenerTurnos(): Promise<any[]> {
    try {
      const turnosQuery = query(
        collection(this.firestore, 'turnos')
      );
  
      const querySnapshot: QuerySnapshot<any> = await getDocs(turnosQuery);
  
      const turnos: any[] = [];
      querySnapshot.forEach((doc) => {
  
        const turnos = {
          id: doc.id,
          ...doc.data(),
        };
        turnos.push(turnos);
      });
  
      return turnos;
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }
  }

  async solicitarTurno(
    especialidad: string,
    especialistaId: string,
    fecha: Date,
    horaInicio: string,
    horaFin: string,
    pacienteMail: string,
    pacienteNombre: string,
    pacienteApellido: string,
    especialistaMail: string,
    especialistaNombre: string,
    especialistaApellido: string
  ): Promise<void> {
    const nuevoTurno: Turno = {
      id: '',
      paciente: {
        mail: pacienteMail.toLocaleLowerCase(),
        nombre: pacienteNombre,
        apellido: pacienteApellido,
      },
      especialista: {
        mail: especialistaMail.toLocaleLowerCase(),
        nombre: especialistaNombre,
        apellido: especialistaApellido,
      },
      especialidad,
      especialistaId,
      fechaHora: fecha,
      horaInicio,
      horaFin,
      estado: 'pendiente',
      ocupado: false,
    };
  
    const docRef = await addDoc(this.turnosCollection, nuevoTurno);
    await updateDoc(docRef, { id: docRef.id });
  }

  obtenerTurnosPorUsuario(userEmail: string, userRole: string): Observable<Turno[]> {
    const field = userRole === 'paciente' ? 'paciente.mail' : 'especialista.mail';
    console.log(`Querying turnos for field: ${field} with userEmail: ${userEmail}`);
    
    const q = query(this.turnosCollection, where(field, '==', userEmail));
    return from(getDocs(q)).pipe(
      map(snapshot => {
        console.log(`Found ${snapshot.size} turnos`);
        return snapshot.docs.map(doc => {
          const data = doc.data() as Turno;
          if (data.fechaHora instanceof Timestamp) {
            data.fechaHora = data.fechaHora.toDate();
          }
          return data;
        });
      }),
      catchError(error => {
        console.error('Error al obtener turnos:', error);
        return of([]);
      })
    );
  }

  async actualizarEstadoTurno(turnoId: string, estado: string): Promise<void> {
    const turnoDocRef = doc(this.firestore, `turnos/${turnoId}`);
    return updateDoc(turnoDocRef, { estado: estado, ocupado: estado === 'aceptado' });
  }

  aceptarTurno(turnoId: string): Promise<void> {
    const turnoDocRef = doc(this.firestore, `turnos/${turnoId}`);
    console.log('Aceptando turno con ID:', turnoId);
    return updateDoc(turnoDocRef, { estado: 'aceptado', ocupado: true });
  }

  cancelarTurno(turnoId: string, motivo: string): Promise<void> {
    const turnoDocRef = doc(this.firestore, `turnos/${turnoId}`);
    return updateDoc(turnoDocRef, { estado: 'cancelado', motivoCancelacion: motivo });
  }

  rechazarTurno(turnoId: string, motivo: string): Promise<void> {
    const turnoDocRef = doc(this.firestore, `turnos/${turnoId}`);
    return updateDoc(turnoDocRef, { estado: 'rechazado', motivoRechazo: motivo });
  }

  finalizarTurno(turnoId: string, comentario: string): Promise<void> {

    const turnoDocRef = doc(this.firestore, `turnos/${turnoId}`);
    return updateDoc(turnoDocRef, { estado: 'realizado', comentario  });

  }

  cargarHistoriaClinica(turnoId: string, comentario: string): Promise<void> {

    const turnoDocRef = doc(this.firestore, `turnos/${turnoId}`);
    return updateDoc(turnoDocRef, { estado: 'realizado', comentario  });

  }

  verificarDisponibilidad(especialistaId: string, fecha: Date, horaInicio: string, horaFin: string): Observable<boolean> {
    const turnosRef = collection(this.firestore, 'turnos');
    const q = query(turnosRef, 
      where('especialistaId', '==', especialistaId), 
      where('fechaHora', '==', Timestamp.fromDate(fecha)), 
      where('horaInicio', '==', horaInicio),
      where('horaFin', '==', horaFin),
      where('estado', '==', 'aceptado'),
      where('ocupado', '==', 'true')
    );
  
    return from(getDocs(q).then(snapshot => snapshot.empty));
  }

  cancelarTurnoComoAdmin(turnoId: string, motivo: string): Promise<void> {
    const turnosCollectionGroup = collectionGroup(this.firestore, 'turnos');
    return getDocs(turnosCollectionGroup).then(querySnapshot => {
      const turnoDocRef = querySnapshot.docs.find(doc => doc.id === turnoId)?.ref;
      if (turnoDocRef) {
        return updateDoc(turnoDocRef, { estado: 'cancelado', motivoCancelacion: motivo });
      } else {
        return Promise.reject('No se encontró el turno con el ID proporcionado.');
      }
    }).catch(error => {
      console.error(`Error al cancelar el turno:`, error);
      return Promise.reject('Error al cancelar el turno.');
    });
  }

  obtenerResena(turnoId: string): Observable<string> {
    const turnoDocRef = doc(this.firestore, `turnos/${turnoId}`);
    return from(getDoc(turnoDocRef)).pipe(
      map((turnoDoc: DocumentSnapshot<DocumentData>) => {
        const turnoData = turnoDoc.data() as Turno;
        return turnoData ? turnoData.comentario || '' : '';
      }),
      catchError(error => {
        console.error(`Error al obtener la reseña:`, error);
        return of('');
      })
    );
  }

  completarEncuesta(turnoId: string, encuesta: any): Promise<void> {
    const turnoDocRef = doc(this.firestore, `turnos/${turnoId}`);
    return updateDoc(turnoDocRef, {
      encuesta,
      encuestaCompletada: true
    });
  }

  calificarAtencion(turnoId: string, comentarioCalificacion: string): Promise<void> {
    const turnoDocRef = doc(this.firestore, `turnos/${turnoId}`);
    return updateDoc(turnoDocRef, { comentarioCalificacion, calificacionCompletada: true });
  }

  // async obtenerTurnosDisponiblesPorEspecialistaYFecha(especialista: string, fecha: Date): Promise<string[]> {
  //   try {
  //     const turnosQuery = query(
  //       this.turnosCollection,
  //       where('especialista', '==', especialista),
  //       where('fecha', '==', fecha),
  //       where('estado', '==', 'pendiente')
  //     );
  
  //     const querySnapshot: QuerySnapshot<any> = await getDocs(turnosQuery);
  
  //     const turnosDisponibles: string[] = [];
  //     querySnapshot.forEach((doc) => {
  //       const turno = doc.data() as Turno;
  //       turnosDisponibles.push(turno.horario);
  //     });
  
  //     return turnosDisponibles;
  //   } catch (error) {
  //     console.error('Error al obtener turnos disponibles:', error);
  //     throw new Error('Error al obtener turnos disponibles en Firestore.');
  //   }
  // }

  obtenerTurnosPorEspecialista(especialistaId: string): Observable<Turno[]> {
    const turnosCollectionRef = collection(this.firestore, 'turnos');
    const q = query(turnosCollectionRef, where('especialistaId', '==', especialistaId));
    return from(getDocs(q)).pipe(
      map((querySnapshot) => {
        const turnos: Turno[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Turno;
          turnos.push(data);
        });
        return turnos;
      })
    );
  }

  async obtenerTurnosAceptadosPorEspecialista(especialistaId: string): Promise<Turno[]> {
    const turnosRef = collection(this.firestore, 'turnos');
    const q = query(turnosRef, where('especialistaId', '==', especialistaId), where('estado', '==', 'aceptado'));
    const querySnapshot = await getDocs(q);

    const turnos: Turno[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      turnos.push({
        id: doc.id,
        especialidad: data['especialidad'],
        especialistaId: data['especialistaId'],
        fechaHora: data['fechaHora'],
        horaInicio: data['horaInicio'],
        horaFin: data['horaFin'],
        estado: data['estado'],
        ocupado: data['ocupado'],
        paciente: {
          mail: data['paciente'].mail,
          nombre: data['paciente'].nombre,
          apellido: data['paciente'].apellido
        },
        especialista: {
          mail: data['especialista'].mail,
          nombre: data['especialista'].nombre,
          apellido: data['especialista'].apellido
        }
      });
    });

    return turnos;
  }


  async obtenerTurnosDisponiblesParaEspecialista(especialistaId: string): Promise<TurnoDisponible[]> {
    const disponibilidadEspecialista = await this.especialistaService.obtenerDisponibilidadEspecialista(especialistaId);
    const turnosAceptados = await this.obtenerTurnosAceptadosPorEspecialista(especialistaId);
    const horariosAceptados = turnosAceptados.map(turno => turno.horario).filter(horario => horario !== undefined) as string[];
  
    const turnosDisponibles: TurnoDisponible[] = disponibilidadEspecialista.flatMap(horario => {
      const turnosHorario = this.especialistaService.generarTurnosDisponibles(horario);
      return turnosHorario.map(turno => {
        const ocupado = horariosAceptados.includes(turno.horaInicio + ' - ' + turno.horaFin);
        return {
          ...turno,
          ocupado
        };
      });
    });
  
    return turnosDisponibles;
  }


  // async obtenerHorariosDisponiblesEspecialista(especialista: string): Promise<string[]> {
  //   try {
  //     const turnosQuery = query(
  //       this.turnosCollection,
  //       where('especialista', '==', especialista),
  //       where('estado', '==', 'pendiente')
  //     );

  //     const querySnapshot: QuerySnapshot<any> = await getDocs(turnosQuery);

  //     const horariosDisponibles: string[] = [];
  //     querySnapshot.forEach((doc) => {
  //       const turno = doc.data() as Turno;
  //       horariosDisponibles.push(turno.horario);
  //     });

  //     return horariosDisponibles;
  //   } catch (error) {
  //     console.error('Error al obtener los horarios disponibles para el especialista:', error);
  //     throw new Error('Error al obtener los horarios disponibles para el especialista desde Firestore.');
  //   }
  // }

  obtenerPacientePorId(pacienteId: number): Observable<any> {
    const docRef = doc(this.firestore, `pacientes/${pacienteId}`);
    return from(getDoc(docRef)).pipe(
      map(doc => {
        if (doc.exists()) {
          return doc.data();
        } else {
          throw new Error(`No se encontró información para el paciente con ID ${pacienteId}`);
        }
      }),
      catchError(error => {
        console.error('Error al obtener la información del paciente:', error);
        return of(null); // Retornar un observable con valor null en caso de error
      })
    );
  }
  
}