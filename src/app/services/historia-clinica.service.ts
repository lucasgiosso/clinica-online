import { Injectable } from '@angular/core';
import { HistoriaClinica } from './turnos.service';
import { Observable, from, map } from 'rxjs';
import { DocumentData, DocumentSnapshot, Firestore, collection, collectionData, collectionGroup, doc, getDoc, query, setDoc, where } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class HistoriaClinicaService {

  constructor(private firestore: Firestore) { }

  addMedicalHistory(pacienteId: string, turnoId: string, historiaClinica: HistoriaClinica): Promise<void> {
    const id = doc(collection(this.firestore, `pacientes/${pacienteId}/historiaClinica`)).id;
    return setDoc(doc(this.firestore, `pacientes/${pacienteId}/historiaClinica/${id}`), { ...historiaClinica, id });
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
      map((data) => data as HistoriaClinica[])
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
}
