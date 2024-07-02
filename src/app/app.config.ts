import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { HttpClientModule } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';


export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), 
    provideFirebaseApp(() => initializeApp({
      "projectId":"clinica-2dd2c",
      "appId":"1:456707267977:web:4528beebb4121304801558",
      "storageBucket":"clinica-2dd2c.appspot.com",
      "apiKey":"AIzaSyBWvfGtVCaNl_j3hIo7mUyQPhUuDDGnaus",
      "authDomain":"clinica-2dd2c.firebaseapp.com",
      "messagingSenderId":"456707267977"})), 
      provideAuth(() => getAuth()), 
      provideFirestore(() => getFirestore()),
      importProvidersFrom(HttpClientModule), provideAnimationsAsync()]
};
