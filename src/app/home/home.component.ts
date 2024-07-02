import { Component, EventEmitter, HostListener, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Auth, User } from '@angular/fire/auth';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoadingComponent } from "../loading/loading.component";
import 'animate.css';

interface SideNavToggle {
  screenWidth: number;
  collapsed: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LoadingComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit{

  showLoading: boolean = true;

  @Output() onToggleSideNav: EventEmitter<SideNavToggle> = new EventEmitter();
    collapsed = false;
    screenWidth = 0;
    //navData = navbarData;
    currentUser$: Observable<User | null>;
    isDropdownOpen = false;
    showLogoutButton = false;
    user: User | null = null;
    imagenPerfil: string | null = null;

constructor (private router: Router, private authService: AuthService, private auth: Auth) {
  this.currentUser$ = this.authService.getCurrentUser();
}

@HostListener('window:resize', ['$event'])
onResize(event: any){
  this.screenWidth = window.innerWidth;
  if (this.screenWidth <= 768) {
    this.collapsed = false;
    this.onToggleSideNav.emit({collapsed: this.collapsed, screenWidth: this.screenWidth});
  }
}

ngOnInit(): void {

  setTimeout(() => {
    this.showLoading = false;
  }, 2000);

  this.screenWidth = window.innerWidth;
  this.currentUser$ = this.authService.getCurrentUser();
  this.authService.userRole$.subscribe(role => {
    //console.log('Rol del usuario:', role);
  });
}

toggleCollapse(): void{
  this.collapsed = !this.collapsed;
  this.onToggleSideNav.emit({collapsed: this.collapsed, screenWidth: this.screenWidth});
}

closeSidenav(): void{
  this.collapsed = false;
  this.onToggleSideNav.emit({collapsed: this.collapsed, screenWidth: this.screenWidth});
}

handleNavigation(routeLink: string) {

  if (routeLink === 'logout') {
    this.logout();
  }
}

async logout() {
  Swal.fire({
    title: '¿Estás seguro?',
    text: 'Lamentamos que quieras salir...',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, salir'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        //console.log('Route link clicked: logout');
        await this.auth.signOut();
        this.router.navigate(['/login']);
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
      }
    } else {
      this.router.navigate(['/home']);
    }
  });
}

userLogged() {
  this.authService.getCurrentUser().subscribe(
    (user) => {
      console.log(user?.email);
    },
    (error) => {
      console.error('Error al obtener el usuario actual:', error);
    }
  );
}

toggleDropdown() {
  this.isDropdownOpen = !this.isDropdownOpen;
  this.showLogoutButton = this.isDropdownOpen; 
}
  
onClickConfig(event: any): void 
{
  this.router.navigate(['/home/config']);
  
}

  seccionUsuarios()
  {
    this.router.navigate(['home/seccion-usuarios']);
  }

  misTurnos()
  {
    this.router.navigate(['home/mis-turnos']);
  }

  turnos()
  {
    this.router.navigate(['home/turnos']);
  }

  solicitarTurno()
  {
    this.router.navigate(['home/solicitar-turno']);
  }

  perfil()
  {
    this.router.navigate(['home/perfil']);
  }
  seccionPacientes()
  {
    this.router.navigate(['home/seccion-pacientes']);
  }
  
  estadisticas()
  {
    this.router.navigate(['estadisticas']);
  }
}
