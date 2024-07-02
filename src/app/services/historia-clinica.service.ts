import { Injectable } from '@angular/core';
import { HistoriaClinica } from './turnos.service';
import { Observable, from, map, switchMap } from 'rxjs';
import { DocumentData, DocumentSnapshot, Firestore, collection, collectionData, collectionGroup, doc, getDoc, query, setDoc, where, Timestamp, getDocs, writeBatch, docData } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class HistoriaClinicaService {

  constructor(private firestore: Firestore) { }

  // addMedicalHistory(pacienteId: string, turnoId: string, historiaClinica: HistoriaClinica, fechaTurno: Date): Promise<void> {
  //   const id = doc(collection(this.firestore, `pacientes/${pacienteId}/historiaClinica`)).id;
  //   const fecha = Timestamp.fromDate(fechaTurno);
  //   return setDoc(doc(this.firestore, `pacientes/${pacienteId}/historiaClinica/${id}`), { ...historiaClinica, id, fecha, turnoId });
  // }

  addMedicalHistory(pacienteId: string, turnoId: string, historiaClinica: HistoriaClinica, fechaTurno: Date): Promise<void> {
    const id = doc(collection(this.firestore, `pacientes/${pacienteId}/historiaClinica`)).id;
    const fecha = Timestamp.fromDate(fechaTurno);
  
    const pacienteHistoriaClinicaDocRef = doc(this.firestore, `pacientes/${pacienteId}/historiaClinica/${id}`);
    const turnosHistoriaClinicaDocRef = doc(this.firestore, `turnos/${turnoId}/historiaClinica/${id}`);
  
    const historiaClinicaData = { ...historiaClinica, id, fecha, turnoId };
  
    return Promise.all([
      setDoc(pacienteHistoriaClinicaDocRef, historiaClinicaData),
      setDoc(turnosHistoriaClinicaDocRef, historiaClinicaData)
    ]).then(() => {
      console.log('Historia clínica agregada en ambas colecciones.');
    }).catch(error => {
      console.error('Error agregando la historia clínica:', error);
      throw error;
    });
  }

  

  getMedicalHistory(pacienteId: string): Observable<HistoriaClinica[]> {
    const collectionRef = collection(this.firestore, `pacientes/${pacienteId}/historiaClinica`);
    return collectionData(collectionRef, { idField: 'id' }) as Observable<HistoriaClinica[]>;
  }

  getAllMedicalHistories(): Observable<HistoriaClinica[]> {
    const collectionGroupRef = collectionGroup(this.firestore, 'historiaClinica');
    return collectionData(collectionGroupRef, { idField: 'id' }) as Observable<HistoriaClinica[]>;
  }

  getHistoriaClinicaByPacienteId(pacienteId: string): Observable<HistoriaClinica[]> {
    const collectionRef = collection(this.firestore, `pacientes/${pacienteId}/historiaClinica`);
    return collectionData(collectionRef, { idField: 'id' }).pipe(
      map((data) => data.map((historia: any) => ({
          ...historia,
          fecha: historia.fecha ? (historia.fecha as Timestamp).toDate() : null
      })) as HistoriaClinica[])
    );
}

getResenaByTurnoId(turnoId: string): Observable<any> {
  const resenaDocRef = doc(this.firestore, `turnos/${turnoId}/historiaClinica/comentario`);
  return docData(resenaDocRef);
}

getHistoriaClinicaByPacienteId1(pacienteId: string): Observable<HistoriaClinica[]> {
  const historiasClinicasCollection = collection(this.firestore, `pacientes/${pacienteId}/historiaClinica`);
  const historiasClinicasQuery = query(historiasClinicasCollection);

  return from(getDocs(historiasClinicasQuery)).pipe(
    switchMap(snapshot => {
      const historias = snapshot.docs.map(doc => {
        const data = doc.data() as HistoriaClinica;
        return {
          id: doc.id,
          ...data,
          pacienteId
        };
      });
      console.log('Historias Clínicas:', historias); 
      return this.getEspecialistas(historias);
    })
  );
}

getHistoriaClinicaByPacienteId3(pacienteId: string): Observable<any[]> {
  const historiaClinicaRef = collection(this.firestore, `pacientes/${pacienteId}/historiaClinica`);
  console.log(`Consultando la colección: pacientes/${pacienteId}/historiaClinica`);
  
  return collectionData(historiaClinicaRef, { idField: 'id' }).pipe(
    map(data => {
      console.log('Datos obtenidos de historia clínica:', data);
      return data;
    })
  ) as Observable<any[]>;
}

getHistoriaClinicaByPacienteId2(pacienteId: string): Observable<any[]> {
  const historiaClinicaRef = collection(this.firestore, `pacientes/${pacienteId}/historiaClinica`);
  return collectionData(historiaClinicaRef, { idField: 'id' }) as Observable<any[]>;
}


getEspecialistas(historias: HistoriaClinica[]): Observable<HistoriaClinica[]> {
  const turnosCollection = collection(this.firestore, 'turnos');
  const turnosQuery = query(turnosCollection);

  return from(getDocs(turnosQuery)).pipe(
    switchMap(snapshot => {
      const turnos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as any
      }));
      console.log('Turnos:', turnos); // Verificar turnos

      const batch = writeBatch(this.firestore);

      historias.forEach(historia => {
        const turno = turnos.find(t => t.id === historia.turnoId);
        console.log('Turno Encontrado:', turno); // Verificar turno encontrado
        if (turno) {
          historia.especialistaId = turno.especialistaId || 'Desconocido';
          historia.especialistaNombre = turno.especialista.nombre || 'Desconocido';
          historia.especialistaApellido = turno.especialista.apellido || 'Desconocido';
        } else {
          historia.especialistaId = 'Desconocido';
          historia.especialistaNombre = 'Desconocido';
          historia.especialistaApellido = 'Desconocido';
        }

        const historiaRef = doc(this.firestore, `pacientes/${historia.pacienteId}/historiaClinica/${historia.id}`);
        batch.update(historiaRef, {
          especialistaId: historia.especialistaId,
          especialistaNombre: historia.especialistaNombre,
          especialistaApellido: historia.especialistaApellido
        });

        console.log('Historia con Especialista:', historia); // Verificar la historia clínica con el especialista
      });

      return from(batch.commit()).pipe(
        map(() => historias)
      );
    })
  );
}

  getPacienteInfo(pacienteId: string): Observable<any> {
    const docRef = doc(this.firestore, `pacientes/${pacienteId}`);
    return from(getDoc(docRef)).pipe(
      map((snapshot: DocumentSnapshot<DocumentData>) => {
        return snapshot.data();
      })
    );
  }

  getHistoriaClinicaByTurnoId(pacienteId: string, turnoId: string): Observable<HistoriaClinica[]> {
    const collectionRef = collection(this.firestore, `pacientes/${pacienteId}/historiaClinica`);
    const q = query(collectionRef, where('turnoId', '==', turnoId));
    return collectionData(q, { idField: 'id' }).pipe(
      map((data) => data as HistoriaClinica[])
    );
  }

}
