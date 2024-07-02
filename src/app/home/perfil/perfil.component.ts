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
  animate1 = false;
  historiaClinica$: Observable<HistoriaClinica[]> | undefined;
  isEspecialista: boolean = false;
  historiasClinicas: any[] = [];

  constructor(private router: Router, private authService: AuthService,private auth: Auth, private historiaClinicaService: HistoriaClinicaService)
  {
    this.currentUser$ = this.authService.getCurrentUser();
  }

  ngOnInit() {
    this.obtenerInfoUsuarioLogueado2();
    this.obtenerInfoUsuarioLogueado1();
    this.obtenerInfoUsuarioLogueado();
    
    this.obtenerHistoriaClinica1();
    this.obtenerHistoriaClinica();
    setTimeout(() => {
      this.showLoading = false;
      this.animate1 = true;
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
          this.historiasClinicas = data.sort((a, b) => {
            const fechaA = new Date(a.fecha).getTime();
            const fechaB = new Date(b.fecha).getTime();
            return fechaB - fechaA; // Orden descendente por fecha
          });
        },
        (error) => {
          console.error('Error al obtener la historia clínica:', error);
        }
      );
    }
  }

  convertToDate(fecha: string): Date {
    const [day, month, year] = fecha.split('-');
    return new Date(`${year}-${month}-${day}`);
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

  obtenerInfoUsuarioLogueado2() {
    this.authService.getCurrentUser().subscribe(
      (user) => {
        this.usuarioLogueado = user;
        console.log('Usuario Logueado:', this.usuarioLogueado); // Verificar usuario logueado
        if (this.usuarioLogueado) {
          this.obtenerHistoriaClinica1();
        }
      },
      (error) => {
        console.error('Error al obtener el usuario logueado:', error);
      }
    );
  }

  cargarHistoriasClinicas() {
    const pacienteId = this.usuarioLogueado?.id; // Asegúrate de que `usuarioLogueado` tenga el ID del paciente
    if (pacienteId) {
      this.historiaClinicaService.getHistoriaClinicaByPacienteId(pacienteId).subscribe((data: HistoriaClinica[]) => {
        this.historiasClinicas = data.sort((a, b) => (b.fecha?.getTime() || 0) - (a.fecha?.getTime() || 0)); // Ordena las historias por fecha, de más reciente a más antigua
        console.log(this.historiasClinicas); // Verifica que los datos se están obteniendo
      });
    }
  }

  obtenerHistoriaClinica1() {
    if (this.usuarioLogueado) {
      this.historiaClinicaService.getHistoriaClinicaByPacienteId1(this.usuarioLogueado.uid).subscribe(
        (data) => {
          this.historiasClinicas = data;
          console.log('Historias Clínicas con Especialista:', this.historiasClinicas); // Verificar las historias clínicas con especialista
        },
        (error) => {
          console.error('Error al obtener la historia clínica:', error);
        }
      );
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
      const lineHeight = 10;
      const pageHeight = doc.internal.pageSize.height;
      const maxY = pageHeight - 20; // Dejar margen en la parte inferior
  
      const addNewPage = () => {
        doc.addPage();
        y = 20; // Reiniciar posición en la nueva página
      };
  
      const checkPageBreak = (currentY: number, increment: number = lineHeight) => {
        if (currentY + increment > maxY) {
          addNewPage();
        }
      };
  
      doc.setLineWidth(0.5);
      doc.line(10, y, 200, y);
      y += 10;
  
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text('Datos del Paciente', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
      y += 10;
  
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
  
      checkPageBreak(y);
      doc.text(`Nombre: ${this.usuarioLogueado.nombre} ${this.usuarioLogueado.apellido}`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
      y += lineHeight;
  
      checkPageBreak(y);
      doc.text(`Edad: ${this.usuarioLogueado.edad} años`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
      y += lineHeight;
  
      checkPageBreak(y);
      doc.text(`DNI: ${this.usuarioLogueado.dni}`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
      y += lineHeight;
  
      checkPageBreak(y);
      doc.text(`Obra Social: ${this.usuarioLogueado.obrasocial}`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
      y += lineHeight;
  
      this.historiasClinicas.forEach(historia => {
        doc.setLineWidth(0.5);
        doc.line(10, y, 200, y);
        y += lineHeight;
  
        checkPageBreak(y);
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text('Datos clínicos', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
        y += lineHeight;
  
        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
  
        if (historia.fecha) {
          checkPageBreak(y);
          const formattedDate = new Date(historia.fecha).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
          doc.text(`Fecha: ${formattedDate}`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
          y += lineHeight;
        }
  
        checkPageBreak(y);
        doc.text(`Altura: ${historia.altura} cm`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
        y += lineHeight;
  
        checkPageBreak(y);
        doc.text(`Peso: ${historia.peso} kg`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
        y += lineHeight;
  
        checkPageBreak(y);
        doc.text(`Temperatura: ${historia.temperatura} °C`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
        y += lineHeight;
  
        checkPageBreak(y);
        doc.text(`Presión: ${historia.presion} mm Hg`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
        y += lineHeight;
  
        historia.datosDinamicos.forEach((dato: any) => {
          checkPageBreak(y);
          doc.text(`${dato.clave}: ${dato.valor}`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
          y += lineHeight;
        });
  
        y += 10; // Espacio entre historias clínicas
  
        if (y > maxY) {
          addNewPage();
        }
      });
  
      doc.save('historia_clinica.pdf');
    };
  }

   async generarPDFPorProfesional() {
    await this.obtenerHistoriaClinica1();
    const doc = new jsPDF();
    const logo = 'assets/logo.png';
    const fechaEmision = new Date().toLocaleDateString();

    const img = new Image();
    img.src = logo;
    img.onload = () => {
        doc.addImage(img, 'PNG', 10, 10, 30, 30);

        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text('Atenciones por Profesional', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Fecha de emisión: ${fechaEmision}`, doc.internal.pageSize.getWidth() / 2, 35, { align: 'center' });

        if (!this.historiasClinicas || this.historiasClinicas.length === 0) {
            console.error('No hay historias clínicas disponibles');
            return;
        }

        console.log('Profesionalllll:', this.historiasClinicas);

        const groupedByProfesional = this.historiasClinicas.reduce((acc: { [key: string]: HistoriaClinica[] }, historia: HistoriaClinica) => {
            const profesional = `${historia.especialistaNombre} ${historia.especialistaApellido}`;
            console.log('Profesional:', profesional); // Verificar profesional
            if (!acc[profesional]) {
                acc[profesional] = [];
            }
            acc[profesional].push(historia);
            return acc;
        }, {});

        console.log('Grouped by Profesional:', groupedByProfesional); // Verificar agrupación

        let y = 50;
        const lineHeight = 10;
        const pageHeight = doc.internal.pageSize.height;
        const maxY = pageHeight - 20; // Dejar margen en la parte inferior

        const addNewPage = () => {
            doc.addPage();
            y = 20; // Reiniciar posición en la nueva página
        };

        const checkPageBreak = (currentY: number, increment: number = lineHeight) => {
            if (currentY + increment > maxY) {
                addNewPage();
            }
        };

        Object.keys(groupedByProfesional).forEach((profesional, index) => {
            if (index > 0) {
                doc.addPage();
                y = 50; // Reset the y position for the new page
            }
            doc.setLineWidth(0.5);
            doc.line(10, y, 200, y);
            y += 10;

            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text(`Atenciones realizadas por: ${profesional}`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
            y += 10;

            const atenciones: HistoriaClinica[] = groupedByProfesional[profesional];

            atenciones.forEach((historia: HistoriaClinica) => {
                console.log('Historia en PDF:', historia); // Verificar historia en el PDF
                doc.setLineWidth(0.5);
                doc.line(10, y, 200, y);
                y += lineHeight;

                checkPageBreak(y);
                doc.setFontSize(18);
                doc.setFont("helvetica", "bold");
                doc.text('Datos clínicos', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
                y += lineHeight;

                doc.setFontSize(14);
                doc.setFont("helvetica", "normal");

                if (historia.fecha) {
                    checkPageBreak(y);
                    const formattedDate = new Date(historia.fecha).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
                    doc.text(`Fecha: ${formattedDate}`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
                    y += lineHeight;
                }

                checkPageBreak(y);
                doc.text(`Altura: ${historia.altura} cm`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
                y += lineHeight;

                checkPageBreak(y);
                doc.text(`Peso: ${historia.peso} kg`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
                y += lineHeight;

                checkPageBreak(y);
                doc.text(`Temperatura: ${historia.temperatura} °C`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
                y += lineHeight;

                checkPageBreak(y);
                doc.text(`Presión: ${historia.presion} mm Hg`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
                y += lineHeight;

                if (historia.datosDinamicos) {
                    historia.datosDinamicos.forEach((dato: { clave: string, valor: string }) => {
                        checkPageBreak(y);
                        doc.text(`${dato.clave}: ${dato.valor}`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
                        y += lineHeight;
                    });
                }

                y += 10; // Espacio entre historias clínicas

                if (y > maxY) {
                    addNewPage();
                }
            });

            y += 20; // Espacio adicional entre profesionales
        });

        doc.save('atenciones_por_profesional.pdf');
    };
}


}
