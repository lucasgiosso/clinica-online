import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, where, CollectionReference, DocumentData, doc, getDoc, QuerySnapshot, DocumentReference, collectionData, setDoc, docData, updateDoc, collectionGroup, Timestamp, DocumentSnapshot } from '@angular/fire/firestore';
import { Observable, catchError, combineLatest, forkJoin, from, map, mergeMap, of, switchMap } from 'rxjs';
import { PacienteService } from '../services/paciente.service';

export interface Turno {
  id: string; 
  especialidad: string;
  especialista: string;
  fechaHora: Date;
  horario: string;
  estado: 'pendiente' | 'cancelado' | 'realizado';
  especialistas: {
    mail: string;
    nombre: string;
    apellido: string;
  }
  paciente: {
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
  calificacionCompletada?: boolean;
  comentarioCalificacion?: string;
}


@Injectable({
  providedIn: 'root'
})
export class TurnosService {

  private turnos: any[] = [];
  private turnosCollection: CollectionReference<DocumentData>;

  constructor(private firestore: Firestore, private pacienteService: PacienteService) {
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

  obtenerTurnosPorEspecialista(especialistaMail: string): Observable<Turno[]> {
    console.log('Iniciando consulta para el especialista:', especialistaMail);
    const pacientesCollection = collection(this.firestore, 'turnos');
    return from(getDocs(pacientesCollection)).pipe(
      map(snapshot => snapshot.docs),
      switchMap(patientDocs => {
        const turnosObservables = patientDocs.map(patientDoc => {
          const subCollectionRef = collection(this.firestore, `turnos/${patientDoc.id}/turnos`);
          return from(getDocs(subCollectionRef)).pipe(
            map(subCollectionSnapshot => {
              const turnos: Turno[] = [];
              subCollectionSnapshot.forEach(turnoDoc => {
                const turnoData = turnoDoc.data() as Turno;
                turnoData.id = turnoDoc.id;
                if (turnoData.fechaHora instanceof Timestamp) {
                  turnoData.fechaHora = turnoData.fechaHora.toDate();
                }
                if (turnoData.especialistas?.mail === especialistaMail) {
                  turnos.push(turnoData);
                }
              });
              return turnos;
            })
          );
        });
        return forkJoin(turnosObservables).pipe(
          map(turnosArrays => turnosArrays.flat())
        );
      }),
      catchError(error => {
        console.error('Error al obtener turnos:', error);
        return of([]);
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
    especialista: string,
    fechaHora: Date,
    horaInicio: string,
    horaFin: string,
    pacienteMail: string,
    pacienteNombre: string,
    pacienteApellido: string,
    especialistaMail: string,
    especialistaNombre: string,
    especialistaApellido: string
  ): Promise<Turno> {

    try {

      const nuevoTurno: Turno = {
        id: '',
        paciente: {
          mail: pacienteMail.toLocaleLowerCase(),
          nombre: pacienteNombre,
          apellido: pacienteApellido,
        },
        especialistas: {
          mail: especialistaMail.toLocaleLowerCase(),
          nombre: especialistaNombre,
          apellido: especialistaApellido,
        },
        especialidad,
        especialista,
        fechaHora,
        horario: `${horaInicio} - ${horaFin}`,
        estado: 'pendiente',
      };
  
      const turnosCollectionRef = collection(this.firestore, `turnos/${pacienteMail.toLocaleLowerCase()}/turnos`);
      const docRef = await addDoc(turnosCollectionRef, nuevoTurno);

      // Actualizar el documento con su ID generado
      await updateDoc(docRef, { id: docRef.id });
      nuevoTurno.id = docRef.id;

      return nuevoTurno;

    } catch (error) {
      console.error('Error al registrar el turno:', error);
      throw new Error('Error al registrar el turno en Firestore.');
    }
  }

  async verificarDisponibilidad(
    especialista: string,
    fecha: Date,
    horario: string
  ): Promise<boolean> {
    try {
      const disponibilidadQuery = query(
        this.turnosCollection,
        where('especialista', '==', especialista),
        where('fecha', '==', fecha),
        where('horario', '==', horario)
      );

      const disponibilidades = await getDocs(disponibilidadQuery);

      return disponibilidades.empty;
    } catch (error) {
      console.error('Error al verificar la disponibilidad:', error);
      throw new Error('Error al verificar la disponibilidad en Firestore.');
    }
  }

  cancelarTurno(turnoId: string, pacienteMail: string, motivo: string): Promise<void> {
    const turnoDocRef = doc(this.firestore, `turnos/${pacienteMail.toLocaleLowerCase()}/turnos/${turnoId}`);
    return updateDoc(turnoDocRef, { estado: 'cancelado', motivoCancelacion: motivo });
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

  obtenerResena(turnoId: string, pacienteMail: string): Observable<string> {
    const turnoDocRef = doc(this.firestore, `turnos/${pacienteMail.toLocaleLowerCase()}/turnos/${turnoId}`);
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

  completarEncuesta(turnoId: string, pacienteMail: string, encuesta: any): Promise<void> {
    const turnoDocRef = doc(this.firestore, `turnos/${pacienteMail.toLocaleLowerCase()}/turnos/${turnoId}`);
    return updateDoc(turnoDocRef, {
      encuesta,
      encuestaCompletada: true
    });
  }

  calificarAtencion(turnoId: string, pacienteMail: string, comentarioCalificacion: string): Promise<void> {
    const turnoDocRef = doc(this.firestore, `turnos/${pacienteMail.toLocaleLowerCase()}/turnos/${turnoId}`);
    return updateDoc(turnoDocRef, { comentarioCalificacion, calificacionCompletada: true });
  }

  async obtenerTurnosDisponiblesPorEspecialistaYFecha(especialista: string, fecha: Date): Promise<string[]> {
    try {
      const turnosQuery = query(
        this.turnosCollection,
        where('especialista', '==', especialista),
        where('fecha', '==', fecha),
        where('estado', '==', 'pendiente')
      );
  
      const querySnapshot: QuerySnapshot<any> = await getDocs(turnosQuery);
  
      const turnosDisponibles: string[] = [];
      querySnapshot.forEach((doc) => {
        const turno = doc.data() as Turno;
        turnosDisponibles.push(turno.horario);
      });
  
      return turnosDisponibles;
    } catch (error) {
      console.error('Error al obtener turnos disponibles:', error);
      throw new Error('Error al obtener turnos disponibles en Firestore.');
    }
  }

  async obtenerTurnosOcupadosPorEspecialistaYFecha(especialista: string, fecha: Date): Promise<string[]> {
    try {
      const turnosQuery = query(
        this.turnosCollection,
        where('especialista', '==', especialista),
        where('fecha', '==', fecha),
        where('estado', '!=', 'pendiente')
      );
  
      const querySnapshot: QuerySnapshot<any> = await getDocs(turnosQuery);
  
      const turnosOcupados: string[] = [];
      querySnapshot.forEach((doc) => {
        const turno = doc.data() as Turno;
        turnosOcupados.push(turno.horario);
      });
  
      return turnosOcupados;
    } catch (error) {
      console.error('Error al obtener turnos ocupados:', error);
      throw new Error('Error al obtener turnos ocupados en Firestore.');
    }
  }

  async obtenerTurnosPorEspecialistaYFecha(especialistaId: string, fecha: Date): Promise<{ disponibles: string[], ocupados: string[] }> {
    try {
      // Obtener los turnos disponibles para el especialista en la fecha especificada
      const turnosDisponibles = await this.obtenerTurnosDisponiblesPorEspecialistaYFecha(especialistaId, fecha);
  
      // Obtener los turnos ocupados para el especialista en la fecha especificada
      const turnosOcupados = await this.obtenerTurnosOcupadosPorEspecialistaYFecha(especialistaId, fecha);
  
      return { disponibles: turnosDisponibles, ocupados: turnosOcupados };
    } catch (error) {
      console.error('Error al obtener los turnos disponibles y ocupados:', error);
      throw new Error('Error al obtener los turnos disponibles y ocupados desde Firestore.');
    }
  }

  async obtenerHorariosDisponiblesEspecialista(especialista: string): Promise<string[]> {
    try {
      const turnosQuery = query(
        this.turnosCollection,
        where('especialista', '==', especialista),
        where('estado', '==', 'pendiente')
      );

      const querySnapshot: QuerySnapshot<any> = await getDocs(turnosQuery);

      const horariosDisponibles: string[] = [];
      querySnapshot.forEach((doc) => {
        const turno = doc.data() as Turno;
        horariosDisponibles.push(turno.horario);
      });

      return horariosDisponibles;
    } catch (error) {
      console.error('Error al obtener los horarios disponibles para el especialista:', error);
      throw new Error('Error al obtener los horarios disponibles para el especialista desde Firestore.');
    }
  }

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