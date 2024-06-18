import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';
import { especialistaGuard } from './guards/especialista.guard';
import { pacienteAdminGuard } from './guards/paciente-admin.guard';
import { pacienteEspecialistaGuard } from './guards/paciente-especialista.guard';

export const routes: Routes = [

    {
        path: 'home',
        loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
    },
    {
        path: '',
        redirectTo: '/bienvenido',
        pathMatch: 'full',
    },
    {
        path: 'login',
        loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'bienvenido',
        loadComponent: () => import('./bienvenido/bienvenido.component').then((m) => m.BienvenidoComponent),
    },
    {
        path: 'register',
        loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent)
    },
    {
        path: 'home/seccion-usuarios',
        loadComponent: () => import('./home/seccion-usuarios/seccion-usuarios.component').then(m => m.SeccionUsuariosComponent),
        canActivate: [adminGuard]
    },
    {
        path: 'home/mis-turnos',
        loadComponent: () => import('./home/mis-turnos/mis-turnos.component').then(m => m.MisTurnosComponent),
        canActivate: [pacienteEspecialistaGuard]
    },
    {
        path: 'home/perfil',
        loadComponent: () => import('./home/perfil/perfil.component').then(m => m.PerfilComponent),
        canActivate: [especialistaGuard]
    },
    {
        path: 'home/solicitar-turno',
        loadComponent: () => import('./home/solicitar-turno/solicitar-turno.component').then(m => m.SolicitarTurnoComponent),
        canActivate: [pacienteAdminGuard]
    },
    {
        path: 'home/turnos',
        loadComponent: () => import('./home/turnos/turnos.component').then(m => m.TurnosComponent),
        canActivate: [adminGuard]
    },
];
