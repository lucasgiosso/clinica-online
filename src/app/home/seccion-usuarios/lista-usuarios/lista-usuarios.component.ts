import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service'; 
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FilterPipe } from '../../../pipes/filter.pipe';

@Component({
  selector: 'app-lista-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FilterPipe],
  templateUrl: './lista-usuarios.component.html',
  styleUrl: './lista-usuarios.component.css'
})
export class ListaUsuariosComponent implements OnInit{

  usuarios: any[] = [];
  filtro: string = '';
  datos: any[] = [];

  constructor(private authService: AuthService){

  }


  ngOnInit(): void {
    this.obtenerUsuarios();

  }

  async obtenerUsuarios() {
    try {
      this.usuarios = await this.authService.obtenerUsuarios();
    } catch (error) {
      console.error('Error al obtener usuarios en el componente:', error);
    }
  }

    aprobarUsuario(userId: string) {
    this.authService.aprobarUsuario(userId)
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: 'Usuario habilitado',
          text: 'El usuario ha sido habilitado exitosamente.',
        });
        this.obtenerUsuarios();
      })
      .catch((error) => {
        
        Swal.fire({
          icon: 'error',
          title: 'Error al aprobar usuario',
          text: 'Hubo un error al aprobar el usuario. Por favor, inténtalo de nuevo.',});

      });
  }

  inhabilitarUsuario(userId: string) {
    this.authService.inhabilitarUsuario(userId)
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: 'Usuario inhabilitado',
          text: 'El usuario ha sido inhabilitado exitosamente.',
        });
        this.obtenerUsuarios();

      })
      .catch((error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error al aprobar usuario',
          text: 'Hubo un error al aprobar el usuario. Por favor, inténtalo de nuevo.',});
      });
  }

}
