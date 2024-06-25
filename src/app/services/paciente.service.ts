import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, getDoc, collectionData, query, where, Timestamp } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, from, map, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class PacienteService {

  constructor(private auth: AuthService, private firestore: Firestore) {}

  async obtenerInformacionPaciente(uid: string): Promise<{ mail: string, nombre: string, apellido: string }> {
    try {
      const userDocRef = doc(this.firestore, 'DatosUsuarios', uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        throw new Error(`No se encontró información para el paciente con UID ${uid}`);
      }

      const userData = userDoc.data();
      return { mail: userData['mail'], nombre: userData['nombre'], apellido: userData['apellido'] };
    } catch (error) {
      console.error('Error al obtener la información del paciente:', error);
      throw new Error('Error al obtener la información del paciente desde Firestore.');
    }
  }

  getPacienteInfo(): Observable<{ mail: string; nombre: string, apellido: string }> {
    return this.auth.getCurrentUser().pipe(
      switchMap(user => {
        if (!user) {
          throw new Error('No se encontró el UID del usuario autenticado');
        }
        return from(this.obtenerInformacionPaciente(user.uid));
      })
    );
  }

  getPacienteInfo1(pacienteId: string): Observable<{ mail: string; nombre: string; apellido: string }> {
    return from(this.obtenerInformacionPaciente(pacienteId));
  }

  getUsuarios(): Observable<any[]> {
    const collectionRef = collection(this.firestore, 'DatosUsuarios');
    return collectionData(collectionRef, { idField: 'id' }).pipe(
      map((data) => data as any[])
    );
  }

  getPacientesAtendidosPorEspecialista(especialistaId: string): Observable<any[]> {
    const collectionRef = collection(this.firestore, 'turnos');
    const q = query(collectionRef, where('especialistaId', '==', especialistaId), where('estado', '==', 'realizado'));
    return collectionData(q, { idField: 'id' }).pipe(
      map(turnos => {
        const pacientesMap = new Map();
        turnos.forEach((turno: any) => {
          const paciente = {
            ...turno.paciente,
            fechaHora: (turno.fechaHora as Timestamp).toDate() // Convierte a Date
          };
          pacientesMap.set(turno.paciente.mail, paciente);
        });
        const pacientes = Array.from(pacientesMap.values());
        console.log('Pacientes obtenidos:', pacientes); // Debug: Verifica los datos de pacientes obtenidos
        return pacientes;
      })
    );
  }
  
}
