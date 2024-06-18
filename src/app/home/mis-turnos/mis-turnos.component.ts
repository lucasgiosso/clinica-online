import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';
import { Auth,User } from '@angular/fire/auth';
import { Turno, TurnosService } from '../../services/turnos.service';
import { CommonModule } from '@angular/common';
import { FilterEspPipe } from "../../pipes/filter-esp.pipe";
import { LoadingComponent } from "../../loading/loading.component";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FilterPipe } from "../../pipes/filter.pipe";

@Component({
    selector: 'app-mis-turnos',
    standalone: true,
    templateUrl: './mis-turnos.component.html',
    styleUrl: './mis-turnos.component.css',
    imports: [CommonModule, FilterEspPipe, LoadingComponent, ReactiveFormsModule, FormsModule, FilterPipe]
})
export class MisTurnosComponent implements OnInit{

  btnVolver = 'Volver a home';
  showLoading: boolean = true;
  filtro: string = '';

 //@Output() onToggleSideNav: EventEmitter<SideNavToggle> = new EventEmitter();

  collapsed = false;
  screenWidth = 0;
  currentUser$: Observable<User | null>;
  isDropdownOpen = false;
  showLogoutButton = false;
  pacienteMail = '';
  pacienteNombre = '';
  pacienteApellido = '';
  especialistasMail = '';
  especialistasNombre = '';
  especialistasApellido = '';
  turnos: Turno[] = [];
  turno: Turno [] = [];
  turnosFiltrados: Turno[] = [];
  turnosPaciente: Turno[] = [];
  turnosEspecialista: Turno[] = [];
  turnosFiltradosPaciente: Turno[] = [];
  turnosFiltradosEspecialista: Turno[] = [];
  filtroPaciente: string = '';
  filtroEspecialista: string = '';
  especialidades: string[] = [];
  especialistas: string[] = [];
  fechaSeleccionada: Date = new Date();
  horaInicio: string = '';
  horaFin: string = '';
  selectedYear: number;
  selectedMonth: number;
  selectedDay: number;
  especialidadesPrecargadas: string[] = ['Ginecología', 'Cardiología', 'Kinesiología', 'Nutricionista'];
  isPaciente: boolean = false;
  isEspecialista: boolean = false;
  tieneTurnoCancelado: boolean = false;

  constructor (private router: Router, private authService: AuthService, private turnosService: TurnosService, private auth: Auth) {
    this.currentUser$ = this.authService.getCurrentUser();
    this.selectedYear = 0; 
    this.selectedMonth = 0;
    this.selectedDay = 0;

        
  }

  ngOnInit(): void {
    console.log('ngOnInit called');
    this.currentUser$.subscribe(
      (user) => {
        console.log('Usuario logueado:', user);
        if (user && user.email) {
          this.pacienteMail = user.email.toLowerCase();
          this.especialistasMail = user.email.toLowerCase();
          this.determinarRolUsuario();
          //this.obtenerTurnosPorEspecialista(this.especialistasMail);
        } else {
          console.error('No se encontró el usuario actual o el correo electrónico es nulo');
          this.router.navigate(['/login']);
        }
      },
      (error) => {
        console.error('Error al obtener el usuario actual:', error);
      }
    );
    
    
    setTimeout(() => {
      this.showLoading = false; // Ocultar el loading después de 2 segundos
    }, 2000); //

  }

  determinarRolUsuario(): void {
    this.authService.getUserRole().subscribe(
      (role) => {
        this.isPaciente = role === 'paciente';
        this.isEspecialista = role === 'especialista';
        if (this.isPaciente) {
          this.obtenerTurnosPaciente(this.pacienteMail);
        } else if (this.isEspecialista) {
          this.obtenerTurnosEspecialista(this.especialistasMail);
        }
      },
      (error) => {
        console.error('Error al obtener el rol del usuario:', error);
      }
    );
  }

  public onClickHome(event: any): void 
  {
    this.router.navigate(['home']);
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    this.showLogoutButton = this.isDropdownOpen; 
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


  async obtenerTurnosPaciente(pacienteMail: string): Promise<void> {
    try {
      console.log('Obteniendo turnos para el usuario:', pacienteMail);
      this.turnosService.obtenerTurnosPorPaciente(pacienteMail).subscribe(
        (turnos) => {
          console.log('Turnos del paciente:', turnos);
          this.turnosPaciente  = turnos;
          this.turnosFiltradosPaciente = this.turnosPaciente;
          this.tieneTurnoCancelado = this.turnosPaciente.some(turno => turno.estado === 'cancelado');
          this.showLoading = false;
        },
        (error) => {
          console.error('Error al obtener los turnos del paciente:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error al obtener los turnos',
            text: 'Hubo un problema al obtener los turnos del paciente. Por favor, inténtalo nuevamente.'
          });
          this.showLoading = false;
        }
      );
    } catch (error) {
      console.error('Error al obtener los turnos del paciente:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al obtener los turnos',
        text: 'Hubo un problema al obtener los turnos del paciente. Por favor, inténtalo nuevamente.'
      });
      this.showLoading = false;
    }
  }

  obtenerTurnosPorEspecialista(especialistaMail: string) {
    console.log('llega?');
    this.turnosService.obtenerTurnosPorEspecialista(especialistaMail).subscribe(
      turnos => {
        console.log('Turnos obtenidos:', turnos);
        this.turnos = turnos;
        this.showLoading = false;
      },
      error => {
        console.error('Error al obtener turnos:', error);
        this.showLoading = false;
      }
    );
  }


  async obtenerTurnosEspecialista(especialistaMail: string): Promise<void> {
    try {
      console.log('Obteniendo turnos para el especialista:', especialistaMail);
      this.turnosService.obtenerTurnosPorEspecialista(especialistaMail).subscribe(
        (turnos) => {
          console.log('Turnos del especialista:', turnos);
          this.turnosEspecialista = turnos;
          this.turnosFiltradosEspecialista = this.turnosEspecialista;
          this.showLoading = false;
        },
        (error) => {
          console.error('Error al obtener los turnos del especialista:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error al obtener los turnos',
            text: 'Hubo un problema al obtener los turnos del especialista. Por favor, inténtalo nuevamente.'
          });
          this.showLoading = false;
        }
      );
    } catch (error) {
      console.error('Error al obtener los turnos del especialista:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al obtener los turnos',
        text: 'Hubo un problema al obtener los turnos del especialista. Por favor, inténtalo nuevamente.'
      });
      this.showLoading = false;
    }
  }

  solicitarTurno() {
    // Verifica si se ha seleccionado una fecha válida
    if (this.selectedYear && this.selectedMonth && this.selectedDay) {
        // Crear un objeto Date a partir de los valores seleccionados
        const fechaSeleccionada = new Date(this.selectedYear, this.selectedMonth, this.selectedDay);
        
        // Verificar si la fecha es válida
        if (isNaN(fechaSeleccionada.getTime())) {
            // La fecha no es válida, muestra un mensaje de error
            console.error('La fecha seleccionada no es válida');
            return;
        }

        const especialidad = 'Cardiología'; 
        const especialista = 'Dr. García'; 

        // Llama a la función de servicio pasando la fecha seleccionada como Date
        const nuevoTurno = this.turnosService.solicitarTurno(especialidad, especialista, fechaSeleccionada, this.horaInicio, this.horaFin, this.pacienteMail,this.pacienteNombre, this.pacienteApellido,this.especialistasMail,this.especialistasNombre, this.especialistasApellido);
        console.log('Nuevo turno solicitado:', nuevoTurno);
    } else {
        // Si no se ha seleccionado una fecha, muestra un mensaje de error
        console.error('No se ha seleccionado una fecha válida');
    }
}

cancelarTurno(turno: any) {
  Swal.fire({
    title: 'Cancelar Turno',
    text: 'Ingrese el motivo de la cancelación:',
    input: 'text',
    inputAttributes: {
      'aria-label': 'Ingrese el motivo de la cancelación'
    },
    showCancelButton: true,
    confirmButtonText: 'Cancelar Turno',
    cancelButtonText: 'Cerrar',
    inputValidator: (value) => {
      if (!value) {
        return 'Debes ingresar un motivo para cancelar el turno';
      } else {
        return null;
      }
    }
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      const motivo = result.value;
      if (this.pacienteMail) {
        this.turnosService.cancelarTurno(turno.id, this.pacienteMail, motivo).then(() => {
          Swal.fire({
            icon: 'success',
            title: 'Turno Cancelado',
            text: 'El turno ha sido cancelado correctamente.',
            confirmButtonText: 'OK'
          });
        }).catch((error: any) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un problema al cancelar el turno. Por favor, inténtalo nuevamente.',
            confirmButtonText: 'OK'
          });
          console.error('Error al cancelar el turno:', error);
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo obtener el correo electrónico del paciente.',
          confirmButtonText: 'OK'
        });
      }
    }
  });
}

verResena(turno: Turno): void {
  this.turnosService.obtenerResena(turno.id, turno.paciente.mail).subscribe(
    (comentario) => {
      if (comentario) {
        Swal.fire({
          title: 'Reseña del Turno',
          text: comentario,
          icon: 'info',
          confirmButtonText: 'Cerrar'
        });
      } else {
        Swal.fire({
          title: 'No hay reseña',
          text: 'Este turno no tiene una reseña cargada.',
          icon: 'warning',
          confirmButtonText: 'Cerrar'
        });
      }
    },
    (error) => {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo obtener la reseña del turno.',
        icon: 'error',
        confirmButtonText: 'Cerrar'
      });
    }
  );
}

completarEncuesta(turno: Turno): void {
  Swal.fire({
    title: 'Completar encuesta de satisfacción',
    html: `
      <style>
        .star-rating {
          display: flex;
          flex-direction: row-reverse;
          justify-content: center;
        }
        .star-rating input {
          display: none;
        }
        .star-rating label {
          font-size: 2rem;
          color: #ddd;
          cursor: pointer;
        }
        .star-rating input:checked ~ label {
          color: #f2b600;
        }
        .star-rating input:hover ~ label {
          color: #f2b600;
        }
      </style>
      <div>
        <label>Atención recibida:</label>
        <div class="star-rating">
          <input type="radio" id="star5" name="calificacionAtencion" value="5" /><label for="star5" title="5 estrellas">★</label>
          <input type="radio" id="star4" name="calificacionAtencion" value="4" /><label for="star4" title="4 estrellas">★</label>
          <input type="radio" id="star3" name="calificacionAtencion" value="3" /><label for="star3" title="3 estrellas">★</label>
          <input type="radio" id="star2" name="calificacionAtencion" value="2" /><label for="star2" title="2 estrellas">★</label>
          <input type="radio" id="star1" name="calificacionAtencion" value="1" /><label for="star1" title="1 estrella">★</label>
        </div>
      </div>
      <div>
        <label>Tiempo de espera:</label>
        <div class="star-rating">
          <input type="radio" id="star10" name="tiempoEspera" value="5" /><label for="star10" title="5 estrellas">★</label>
          <input type="radio" id="star9" name="tiempoEspera" value="4" /><label for="star9" title="4 estrellas">★</label>
          <input type="radio" id="star8" name="tiempoEspera" value="3" /><label for="star8" title="3 estrellas">★</label>
          <input type="radio" id="star7" name="tiempoEspera" value="2" /><label for="star7" title="2 estrellas">★</label>
          <input type="radio" id="star6" name="tiempoEspera" value="1" /><label for="star6" title="1 estrella">★</label>
        </div>
      </div>
      <div>
        <label>Satisfacción general:</label>
        <div class="star-rating">
          <input type="radio" id="star15" name="satisfaccionGeneral" value="5" /><label for="star15" title="5 estrellas">★</label>
          <input type="radio" id="star14" name="satisfaccionGeneral" value="4" /><label for="star14" title="4 estrellas">★</label>
          <input type="radio" id="star13" name="satisfaccionGeneral" value="3" /><label for="star13" title="3 estrellas">★</label>
          <input type="radio" id="star12" name="satisfaccionGeneral" value="2" /><label for="star12" title="2 estrellas">★</label>
          <input type="radio" id="star11" name="satisfaccionGeneral" value="1" /><label for="star11" title="1 estrella">★</label>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Enviar Encuesta',
    cancelButtonText: 'Cancelar',
    focusConfirm: false,
    preConfirm: () => {
      const calificacionAtencion = (document.querySelector('input[name="calificacionAtencion"]:checked') as HTMLInputElement)?.value;
      const tiempoEspera = (document.querySelector('input[name="tiempoEspera"]:checked') as HTMLInputElement)?.value;
      const satisfaccionGeneral = (document.querySelector('input[name="satisfaccionGeneral"]:checked') as HTMLInputElement)?.value;

      if (!calificacionAtencion || !tiempoEspera || !satisfaccionGeneral) {
        Swal.showValidationMessage('Debe completar todos los campos obligatorios');
        return null;
      }

      return {
        calificacionAtencion: parseInt(calificacionAtencion),
        tiempoEspera: parseInt(tiempoEspera),
        satisfaccionGeneral: parseInt(satisfaccionGeneral)
      };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const encuestaData = result.value;
      this.turnosService.completarEncuesta(turno.id, turno.paciente.mail, encuestaData)
        .then(() => {
          Swal.fire('Encuesta completada', 'La encuesta ha sido enviada correctamente.', 'success');
          turno.encuestaCompletada = true;
          turno.encuesta = encuestaData;
          this.obtenerTurnosPaciente(turno.paciente.mail); // Refrescar la lista de turnos
        })
        .catch((error) => {
          Swal.fire('Error', 'Hubo un problema al enviar la encuesta. Por favor, inténtalo nuevamente.', 'error');
        });
    }
  });
}

verEncuesta(turno: Turno): void {
  Swal.fire({
    title: 'Resultados de la Encuesta',
    html: `
      <div>
        <p><strong>Atención recibida:</strong> ${turno.encuesta?.calificacionAtencion} estrellas</p>
      </div>
      <div>
        <p><strong>Tiempo de espera:</strong> ${turno.encuesta?.tiempoEspera} estrellas</p>
      </div>
      <div>
        <p><strong>Satisfacción general:</strong> ${turno.encuesta?.satisfaccionGeneral} estrellas</p>
      </div>
    `,
    confirmButtonText: 'Cerrar'
  });
}

calificarAtencion(turno: Turno): void {
  Swal.fire({
    title: 'Comentario Atención',
    input: 'textarea',
    inputPlaceholder: 'Escriba su calificación aquí...',
    showCancelButton: true,
    confirmButtonText: 'Enviar Calificación',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      if (!value) {
        return 'Debes ingresar una calificación';
      }
      return null;
    }
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      this.turnosService.calificarAtencion(turno.id, turno.paciente.mail, result.value)
        .then(() => {
          turno.calificacionCompletada = true;
          Swal.fire('Calificación enviada', 'La calificación ha sido enviada correctamente.', 'success');
          this.obtenerTurnosPaciente(turno.paciente.mail); // Refrescar la lista de turnos
        })
        .catch((error) => {
          Swal.fire('Error', 'Hubo un problema al enviar la calificación. Por favor, inténtalo nuevamente.', 'error');
        });
    }
  });
}

verCalificacion(turno: Turno): void {
  Swal.fire({
    title: 'Comentario de la Calificación',
    html: `
      <div>
        <strong><p>${turno.comentarioCalificacion}</p></strong>
      </div>
    `,
    confirmButtonText: 'Cerrar'
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

}
