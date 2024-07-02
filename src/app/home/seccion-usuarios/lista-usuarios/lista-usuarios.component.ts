import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service'; 
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FilterPipe } from '../../../pipes/filter.pipe';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Router } from '@angular/router';
import { HistoriaClinicaService } from '../../../services/historia-clinica.service';
import { HistoriaClinica, TurnosService } from '../../../services/turnos.service';
import { HistoriaClinicaModalComponent } from '../../../historia-clinica-modal/historia-clinica-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { PacienteService } from '../../../services/paciente.service';

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
  historiasClinicas: HistoriaClinica[] = [];
  selectedPacienteId: string | null = null;
  historiasClinicasExist: { [key: string]: boolean } = {};

  constructor(private authService: AuthService, private router: Router, private historiaClinicaService: HistoriaClinicaService, private dialog: MatDialog, private pacienteService: PacienteService, private turnosService: TurnosService){

  }


  ngOnInit(): void {
    this.obtenerUsuarios();
    this.fetchUsuarios();
    this.cargarUsuarios();

  }

  async obtenerUsuarios() {
    try {
      this.usuarios = await this.authService.obtenerUsuarios();
    } catch (error) {
      console.error('Error al obtener usuarios en el componente:', error);
    }
  }

  fetchUsuarios() {
    this.authService.obtenerUsuarios1().subscribe((data: any[]) => {
      this.usuarios = data;
      console.log('Usuarios obtenidos:', this.usuarios);
    });
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

  exportToExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.usuarios);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Usuarios': worksheet },
      SheetNames: ['Usuarios']
    };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, 'usuarios');
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: 'application/octet-stream' });
    const currentDate = new Date();
    const formattedDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
    saveAs(data, `${fileName}_${formattedDate}.xlsx`);
  }

  verHistoriaClinica(pacienteId: string) {
    this.historiaClinicaService.getHistoriaClinicaByPacienteId(pacienteId).subscribe((data: HistoriaClinica[]) => {
      this.dialog.open(HistoriaClinicaModalComponent, {
        width: '600px',
        data: { historiasClinicas: data }
      });
    });
  }

  cargarUsuarios() {
    this.pacienteService.getUsuarios().subscribe(usuarios => {
      this.usuarios = usuarios;
      this.usuarios.forEach(usuario => {
        if (usuario.role === 'paciente') {
          this.historiaClinicaService.getHistoriaClinicaByPacienteId(usuario.id).subscribe(historias => {
            this.historiasClinicasExist[usuario.id] = historias.length > 0;
          });
        }
      });
    });
  }

  getUserImage(usuario: any): string {
    if (usuario.role === 'paciente') {
      return usuario.imagenPerfil1;
    }
    return usuario.imagenPerfil;
  }

  descargarTurnos(usuario: any) {

    const userEmail = usuario.mail;
    const userRole = usuario.role;

    console.log('mail:',  usuario.mail)
    console.log('role:',  usuario.role)

    if (!usuario.mail) {
      console.error('El correo electrónico del usuario es indefinido.');
      return;
    }
        
    this.turnosService.obtenerTurnosPorUsuario(userEmail, userRole).subscribe(turnos => {
      if (turnos.length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'No Turnos',
          text: 'Este usuario no tiene turnos.',
        });
        return;
      }

      const formattedTurnos = turnos.map(turno => ({
        // id: turno.id,
        //especialistaId: turno.especialistaId,
        especialista: turno.especialista.nombre + turno.especialista.apellido || 'Desconocido',
        paciente: turno.paciente.nombre + turno.paciente.apellido || 'Desconocido',
        especialidad: turno.especialidad || 'Desconocido',
        horaInicio: turno.horaInicio || 'Desconocida',
        horaFin: turno.horaFin || 'Desconocida',
        estado: turno.estado || 'Desconocido',
        fechaHora: turno.fechaHora ||  'Desconocida',
        ocupado: turno.ocupado ? 'VERDADERO' : 'FALSO'
      }));
  
      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedTurnos);
      const workbook: XLSX.WorkBook = {
        Sheets: { 'Turnos': worksheet },
        SheetNames: ['Turnos']
      };
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.saveAsExcelFile(excelBuffer, `${usuario.nombre}_turnos`);
    }, error => {
      console.error('Error al obtener turnos del usuario:', error);
    });
  }
    
}

