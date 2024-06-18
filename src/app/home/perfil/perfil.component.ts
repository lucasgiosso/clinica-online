import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EspecialistaDispoComponent } from "./especialista-dispo/especialista-dispo.component";
import { LoadingComponent } from "../../loading/loading.component";
import { Observable } from 'rxjs';
import { Auth,User } from '@angular/fire/auth';

@Component({
    selector: 'app-perfil',
    standalone: true,
    templateUrl: './perfil.component.html',
    styleUrl: './perfil.component.css',
    imports: [CommonModule, FormsModule, EspecialistaDispoComponent, LoadingComponent]
})
export class PerfilComponent implements OnInit{

  btnVolver = 'Volver a home';
  usuariosPendientes: any[] = [];
  usuarioLogueado: any;
  showLoading: boolean = true;
  currentUser$: Observable<User | null>;
  isDropdownOpen = false;
  showLogoutButton = false;

  constructor(private router: Router, private authService: AuthService,private auth: Auth)
  {
    this.currentUser$ = this.authService.getCurrentUser();
  }

  ngOnInit() {

    this.obtenerInfoUsuarioLogueado();
    setTimeout(() => {
      this.showLoading = false; // Ocultar el loading después de 2 segundos
    }, 2000); //
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    this.showLogoutButton = this.isDropdownOpen; 
  }

  public onClickHome(event: any): void 
  {
    this.router.navigate(['home']);
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

  async obtenerInfoUsuarioLogueado() {

    try {
      this.usuarioLogueado = await this.authService.obtenerInfoUsuarioActual();
    } catch (error) {
      
      console.error('Error al obtener información del usuario logueado:', error);
    }
  }

}
