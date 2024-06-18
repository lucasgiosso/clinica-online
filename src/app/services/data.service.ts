import { Injectable } from '@angular/core';
import { Firestore, collection, getDocs, setDoc, doc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private firestore: Firestore) {}

  async cargarLogin() {
    const firebaseCollection = 'userLogin';
    const collectionRef = collection(this.firestore, firebaseCollection);
  
    const querySnapshot = await getDocs(collectionRef);
    
    const userData: any[] = [];
  
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      userData.push(data);
    });
  
    console.log(userData);
    
    return userData;
  }
  
  guardarLogin(email: string | null, role: string | null) {
  
    const firebaseCollection = 'userLogin';
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };
    const loginDate = new Date().toLocaleDateString('es-ES', options);
    const loginData = {
      Usuario: email,
      Role: role,
      FechaIngreso: loginDate,
    };
  
    const collectionRef = collection(this.firestore, firebaseCollection);
  
    setDoc(doc(collectionRef), loginData)
      .then(() => {
        // console.log('Inicio de sesión guardado en Firestore');
        // console.log(loginData);
      })
      .catch((error: any) => {
        // console.error('Error al guardar en Firestore: ', error);
      });
    }
}
