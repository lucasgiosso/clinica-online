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
import { HistoriaClinicaComponent } from "../../historia-clinica/historia-clinica.component";
import { HistoriaClinica } from '../../services/turnos.service';
import { HistoriaClinicaService } from '../../services/historia-clinica.service';
import jsPDF from 'jspdf';

@Component({
    selector: 'app-perfil',
    standalone: true,
    templateUrl: './perfil.component.html',
    styleUrl: './perfil.component.css',
    imports: [CommonModule, FormsModule, EspecialistaDispoComponent, LoadingComponent, HistoriaClinicaComponent]
})
export class PerfilComponent implements OnInit{

  btnVolver = 'Volver a home';
  usuariosPendientes: any[] = [];
  usuarioLogueado: any;
  showLoading: boolean = true;
  currentUser$: Observable<User | null>;
  isDropdownOpen = false;
  showLogoutButton = false;
  animate = false;
  historiaClinica$: Observable<HistoriaClinica[]> | undefined;
  isEspecialista: boolean = false;
  historiasClinicas: any[] = [];

  constructor(private router: Router, private authService: AuthService,private auth: Auth, private historiaClinicaService: HistoriaClinicaService)
  {
    this.currentUser$ = this.authService.getCurrentUser();
  }

  ngOnInit() {

    this.obtenerInfoUsuarioLogueado1();
    this.obtenerInfoUsuarioLogueado();
    
    this.obtenerHistoriaClinica();
    setTimeout(() => {
      this.showLoading = false; // Ocultar el loading después de 2 segundos
    }, 2000); //
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    this.showLogoutButton = this.isDropdownOpen; 
  }

  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  obtenerHistoriaClinica() {
    if (this.usuarioLogueado) {
      this.historiaClinicaService.getMedicalHistory(this.usuarioLogueado.id).subscribe(
        (data) => {
          this.historiasClinicas = data;
        },
        (error) => {
          console.error('Error al obtener la historia clínica:', error);
        }
      );
    }
  }

  public onClickHome(event: Event) {
    this.animate = true;
    setTimeout(() => {
      this.router.navigate(['/home']);
    }, 600); // Tiempo de la animación en milisegundos
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
      if (this.usuarioLogueado?.role === 'especialista') {
        this.isEspecialista = true;
      } else {
        this.isEspecialista = false;
      }
    } catch (error) {
      console.error('Error al obtener información del usuario logueado:', error);
    }
  }

  async obtenerInfoUsuarioLogueado1() {

    try {
      this.usuarioLogueado = await this.authService.obtenerInfoUsuarioActual();
      if (this.usuarioLogueado && this.usuarioLogueado.role === 'paciente') {
        this.historiaClinica$ = this.historiaClinicaService.getHistoriaClinicaByPacienteId(this.usuarioLogueado.id);
        this.cargarHistoriasClinicas();
      }
    } catch (error) {
      console.error('Error al obtener información del usuario logueado:', error);
    }
  }

  cargarHistoriasClinicas() {
    const pacienteId = this.usuarioLogueado?.id; // Asegúrate de que `usuarioLogueado` tenga el ID del paciente
    if (pacienteId) {
      this.historiaClinicaService.getHistoriaClinicaByPacienteId(pacienteId).subscribe((data: HistoriaClinica[]) => {
        this.historiasClinicas = data;
        console.log(this.historiasClinicas); // Verifica que los datos se están obteniendo
      });
    }
  }

  generarPDF() {
    const doc = new jsPDF();
    const logo = 'assets/logo.png';
    const fechaEmision = new Date().toLocaleDateString();
  
    const img = new Image();
    img.src = logo;
    img.onload = () => {
      doc.addImage(img, 'PNG', 10, 10, 30, 30);
  
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text('Historia Clínica', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
  
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Fecha de emisión: ${fechaEmision}`, doc.internal.pageSize.getWidth() / 2, 35, { align: 'center' });
  
      if (!this.historiasClinicas || this.historiasClinicas.length === 0) {
        console.error('No hay historias clínicas disponibles');
        return;
      }
  
      let y = 50;
      doc.setLineWidth(0.5);
      doc.line(10, y, 200, y);
      y += 10;
  
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text('Datos del Paciente', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
      y += 10;
  
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text(`Nombre: ${this.usuarioLogueado.nombre} ${this.usuarioLogueado.apellido}`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
      y += 10;
      doc.text(`Edad: ${this.usuarioLogueado.edad} años`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
      y += 10;
      doc.text(`DNI: ${this.usuarioLogueado.dni}`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
      y += 10;
      doc.text(`Obra Social: ${this.usuarioLogueado.obrasocial}`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
      y += 10;
  
      this.historiasClinicas.forEach(historia => {
        doc.setLineWidth(0.5);
        doc.line(10, y, 200, y);
        y += 10;
  
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text('Datos clínicos', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
        y += 10;
  
        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text(`Altura: ${historia.altura} cm`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
        y += 10;
        doc.text(`Peso: ${historia.peso} kg`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
        y += 10;
        doc.text(`Temperatura: ${historia.temperatura} °C`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
        y += 10;
        doc.text(`Presión: ${historia.presion} mm Hg`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
        y += 10;
  
        historia.datosDinamicos.forEach((dato: any, index: number) => {
          doc.text(`${dato.clave}: ${dato.valor}`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
          y += 10;
        });
  
        y += 10; // Espacio entre historias clínicas
  
        if (y > 270) {
          doc.addPage();
          y = 10;
        }
      });
  
      doc.save('historia_clinica.pdf');
    };
  }

  // generarPDF() {
  //   const doc = new jsPDF();
  //   const logo = 'assets/logo.png';
  //   const fechaEmision = new Date().toLocaleDateString();

  //   const img = new Image();
  //   img.src = logo;
  //   img.onload = () => {
  //     doc.addImage(img, 'PNG', 10, 10, 30, 30);


  //     doc.setFontSize(20);
  //     doc.text('Historia Clínica', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
  //     doc.setFontSize(12);
  //     doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.getWidth() / 2, 35, { align: 'center' });

  //     if (!this.historiasClinicas || this.historiasClinicas.length === 0) {
  //       console.error('No hay historias clínicas disponibles');
  //       return;
  //     }

  //     let y = 50;
  //     y += 10;
  //     doc.setFontSize(18);
  //     doc.text('Datos del Paciente', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
  //     y += 20;

  //     doc.setFontSize(14);
  //     doc.text(`Nombre: ${this.usuarioLogueado.nombre} ${this.usuarioLogueado.apellido}`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
  //     y += 10;
  //     doc.text(`Edad: ${this.usuarioLogueado.edad} años`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
  //     y += 10;
  //     doc.text(`DNI: ${this.usuarioLogueado.dni}`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
  //     y += 10;
  //     doc.text(`Obra Social: ${this.usuarioLogueado.obrasocial}`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });

  //     this.historiasClinicas.forEach(historia => {
  //       y += 10;
  //       doc.setFontSize(14);
  
  //       doc.text(`Altura: ${historia.altura} cm`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
  //       y += 10;
  //       doc.text(`Peso: ${historia.peso} kg`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
  //       y += 10;
  //       doc.text(`Temperatura: ${historia.temperatura} °C`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
  //       y += 10;
  //       doc.text(`Presión: ${historia.presion} mm Hg`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
  //       y += 10;

  //       historia.datosDinamicos.forEach((dato: any, index: number) => {
  //         doc.text(`${dato.clave}: ${dato.valor}`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
  //         y += 10;
  //       });
  
  //       y += historia.datosDinamicos.length * 10 + 10;
  
  //       if (y > 270) { 
  //         doc.addPage();
  //         y = 10;
  //       }
  //     });

  //     doc.setLineWidth(0.1);
  //     doc.rect(10, 45, 190, y - 45); 

  //     doc.save('historia_clinica.pdf');
  //   };
  // }

}
