import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, from, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class PacienteService {

  constructor(private auth: AuthService, private firestore: Firestore) {}

  private async obtenerInformacionPaciente(uid: string): Promise<{ mail: string, nombre: string, apellido: string }> {
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
  
}
