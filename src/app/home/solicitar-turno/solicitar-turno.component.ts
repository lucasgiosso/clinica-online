import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { TurnosService } from '../../services/turnos.service';
import { EspecialistaService } from '../../services/especialista.service';
import { AuthService } from '../../services/auth.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { addDays, format, isValid, parse, startOfTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';
import { PacienteService } from '../../services/paciente.service';
import { LoadingComponent } from "../../loading/loading.component";
import { Observable } from 'rxjs';
import { Auth,User } from '@angular/fire/auth';

interface Especialista {
  id: number;
  nombre: string;
  imagenPerfil: string;
}

interface TurnoDisponible {
  id: number;
  dias: string[];
  horaInicio: string;
  horaFin: string;
}

@Component({
    selector: 'app-solicitar-turno',
    standalone: true,
    templateUrl: './solicitar-turno.component.html',
    styleUrl: './solicitar-turno.component.css',
    imports: [CommonModule, FormsModule, ReactiveFormsModule, LoadingComponent]
})
export class SolicitarTurnoComponent implements OnInit{
 
  solicitarTurnoForm: FormGroup;
  currentUser$: Observable<User | null>;
  isDropdownOpen = false;
  showLogoutButton = false;
  pacienteMail = '';
  especialidad: string = '';
  especialista: string = '';
  especialidades: string[] = []; 
  especialistas: { nombre: string, apellido: string, imagenPerfil: string }[] = [];
  //availableDates: string[] = [];
  availableDates: { value: string, label: string }[] = [];
  fechaSeleccionada: string = '';
  selectedDay: Date = new Date();
  formSubmitted: boolean;
  btnVolver = 'Volver a home';
  horaInicio = '';
  horaFin = '';
  filtro: string = '';
  fechaSeleccionadaComoDate = new Date();
  especialidadesConImagenes: { [key: string]: string } = {};
  imagenPorDefecto: string = 'assets/imagenesEspecialidades/noimage.png';
  imagenEspecialidadSeleccionada: string = '';
  seleccionado: string | null = null;
  especialistaSeleccionado: any | null = null;
  fechaString = '';
  especialidadSeleccionada: boolean = false;
  especialistaSeleccionadoHorario: boolean = false;
  especialidadIndex: number | null = null;
  horariosDisponibles: string[] = [];
  turnosDisponibles: TurnoDisponible[] = [];
  turnoSeleccionado: any; 
  showLoading: boolean = true;
  
  constructor(private sanitizer: DomSanitizer, public especialistaService: EspecialistaService, private turnosService: TurnosService, private router: Router, private fb: FormBuilder, private authService: AuthService, private pacienteService: PacienteService, private auth: Auth) {
    this.currentUser$ = this.authService.getCurrentUser();
    this.formSubmitted = false;

    this.solicitarTurnoForm = this.fb.group({
      especialidad: ['', Validators.required],
      especialista: ['', Validators.required],
      date: ['', Validators.required],
      horaInicio: ['', Validators.required],
      horaFin: ['', Validators.required],
    });

    this.fetchTurnosDisponibles();

  }

  async ngOnInit() {

    this.inicializarEspecialidades();

    this.especialidadesConImagenes = {
      ginecología: 'assets/imagenesEspecialidades/ginecologia.png',
      kinesiología: 'assets/imagenesEspecialidades/kinesiologia.png',
      nutricionista: 'assets/imagenesEspecialidades/nutricionista.png',
      cardiología: 'assets/imagenesEspecialidades/cardiologia.png',
    };
    this.especialidadSeleccionada = false;
    setTimeout(() => {
      this.showLoading = false; // Ocultar el loading después de 2 segundos
    }, 2000); //
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
  
  toggleEspecialidad(index: number) {
    if (this.especialidadIndex === index) {

      this.especialidadSeleccionada = !this.especialidadSeleccionada;
    } else {

      this.especialidadSeleccionada = true;
      this.especialidadIndex = index;
    }
  }
  onEspecialidadButtonClick(especialidad: string) {
    this.seleccionado = especialidad === this.seleccionado ? null : especialidad;
    this.especialistaSeleccionadoHorario = false;  
  

    this.solicitarTurnoForm.patchValue({
      especialidad: especialidad
    });
    console.log('especialidad seleccionada:', especialidad);
  }

  guardarFechaYHora() {
    const fechaSeleccionada = this.selectedDay;
    const horaInicio = this.solicitarTurnoForm.get('horaInicio')?.value;
  

    const fechaHoraString = `${fechaSeleccionada.getFullYear()}-${fechaSeleccionada.getMonth() + 1}-${fechaSeleccionada.getDate()} ${horaInicio}`;
  

    this.solicitarTurnoForm.patchValue({
      date: fechaHoraString
    });
  }

  formatFechaHora(fecha: string, horaInicio: string, horaFin: string): string {
    const fechaFormateada = format(new Date(fecha), 'EEEE dd/MM/yy', { locale: es });
    return `${fechaFormateada} - ${horaInicio} a ${horaFin}`;
  }

  validarYConvertirHora(hora: string): string {
    const horaPartes = hora.split(':');
    let horas = parseInt(horaPartes[0], 10);
    let minutos = parseInt(horaPartes[1], 10);
  
    if (minutos === 60) {
      horas++;
      minutos = 0;
    }
  
    const horaFormateada = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
    return horaFormateada;
  }


  async fetchTurnosDisponibles() {
    if (this.especialistaSeleccionado) {
      try {
        this.turnosDisponibles = await this.especialistaService.obtenerTurnosDisponiblesParaEspecialista(this.especialistaSeleccionado);
      } catch (error) {
        console.error('Error fetching turnos disponibles:', error);
      }
    }
  }

  // onEspecialidadButtonClick1(especialista: any) {
  //   this.especialistaSeleccionado = this.especialistaSeleccionado === especialista ? null : especialista;
  //   this.especialistaSeleccionadoHorario = true;
  //   console.log('Especialista seleccionado:', this.especialistaSeleccionado);
  
  //   if (this.especialistaSeleccionado) {

  //     this.solicitarTurnoForm.patchValue({
  //       especialistaNombre: this.especialistaSeleccionado.nombre || '',
  //       especialistaApellido: this.especialistaSeleccionado.apellido || '',

  //     });

  //     const especialistaId = this.especialistaSeleccionado.id; 
  //     this.especialistaService.obtenerTurnosDisponiblesParaEspecialista(especialistaId)
  //       .then((turnosDisponibles: TurnoDisponible[]) => {

  //         const turnosFiltrados = turnosDisponibles.map(turno => ({
  //           ...turno,
  //           horaInicio: this.validarYConvertirHora(turno.horaInicio),
  //           horaFin: this.validarYConvertirHora(turno.horaFin)
  //         }));
  
  //         this.turnosDisponibles = turnosFiltrados;

  //         if (this.solicitarTurnoForm) {
  //           this.solicitarTurnoForm.patchValue({
  //             date: '', 
  //             horaInicio: '', 
  //             horaFin: '', 
  //           });
  //         }
  
  //         console.log('Turnos disponibles válidos:', this.turnosDisponibles);
  //       })
  //       .catch(error => {
  //         console.error('Error al obtener turnos disponibles:', error);
          
  //         this.turnosDisponibles = []; 
  //       });
  //   }
  // }

  onEspecialidadButtonClick1(especialista: any) {
    this.especialistaSeleccionado = this.especialistaSeleccionado === especialista ? null : especialista;
    this.especialistaSeleccionadoHorario = true;
    console.log('Especialista seleccionado:', this.especialistaSeleccionado);
  
    if (this.especialistaSeleccionado) {
      this.solicitarTurnoForm.patchValue({
        especialistaNombre: this.especialistaSeleccionado.nombre || '',
        especialistaApellido: this.especialistaSeleccionado.apellido || '',
        especialista: this.especialistaSeleccionado.id || ''
      });

      const especialistaId = this.especialistaSeleccionado.id;
      console.log('Especialista ID seleccionado:', especialistaId);  // Asegúrate de que el ID no es undefined
      if (especialistaId) {
        this.especialistaService.getEspecialistaInfo(especialistaId)
          .subscribe(
            especialistasInfo => {
              // Procesar la información del especialista si es necesario
              console.log('Información del especialista:', especialistasInfo);
            },
            error => {
              console.error('Error al obtener la información del especialista:', error);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo obtener la información del especialista. Por favor, intenta nuevamente.'
              });
            }
          );

        this.especialistaService.obtenerTurnosDisponiblesParaEspecialista(especialistaId)
          .then((turnosDisponibles: TurnoDisponible[]) => {
            const turnosFiltrados = turnosDisponibles.map(turno => ({
              ...turno,
              horaInicio: this.validarYConvertirHora(turno.horaInicio),
              horaFin: this.validarYConvertirHora(turno.horaFin)
            }));
    
            this.turnosDisponibles = turnosFiltrados;

            if (this.solicitarTurnoForm) {
              this.solicitarTurnoForm.patchValue({
                date: '', 
                horaInicio: '', 
                horaFin: '', 
              });
            }
    
            console.log('Turnos disponibles válidos:', this.turnosDisponibles);
          })
          .catch(error => {
            console.error('Error al obtener turnos disponibles:', error);
            this.turnosDisponibles = [];
          });
      } else {
        console.error('El ID del especialista es inválido.');
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'El ID del especialista es inválido. Por favor, selecciona un especialista válido.'
        });
      }
    }
  }

  esTurnoValido(fechaTurno: Date, fechaActual: Date, fechaLimite: Date): boolean {

    return fechaTurno > fechaActual && fechaTurno <= fechaLimite;
  }

  validarYConvertirFecha(fecha: string): Date | string {
  
    if (!fecha) {
      console.warn('La fecha recibida está vacía o es indefinida.');
      return 'Fecha vacía o indefinida';
    }
  
    const fechaConvertida = new Date(fecha);

    if (isNaN(fechaConvertida.getTime())) {
      console.error('Fecha inválida:', fecha);
      return 'Invalid Date';
    } else {
      console.log('Fecha convertida:', fechaConvertida.toISOString());
      return fechaConvertida;
    }
  }
  
  onTurnoSeleccionado(turno: TurnoDisponible) {
    try {

      const fechaConvertida = parse(turno.dias[0], 'EEEE dd-MM-yyyy', new Date(), { locale: es });
    
      const fechaFormateada = format(fechaConvertida, 'EEEE dd/MM/yyyy', { locale: es });
   
      this.solicitarTurnoForm.patchValue({
        date: fechaFormateada, 
        horaInicio: turno.horaInicio,
        horaFin: turno.horaFin
      });
  
      this.turnoSeleccionado = turno;

    } catch (error) {
      console.error('Error in onTurnoSeleccionado:', error);
    }
  }

  getSafeImageURL(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  obtenerImagenEspecialista(especialista: Especialista): string {

    return especialista.imagenPerfil || this.imagenPorDefecto;
  }

  obtenerImagenEspecialidad(especialidad: string): string {
    
    return this.especialidadesConImagenes[especialidad.trim().toLowerCase()] || this.imagenPorDefecto;
    
  }

  async inicializarEspecialidades() {

    await this.obtenerEspecialidades();
  
    for (const especialidad of this.especialidades) {
      const nombreEspecialidad = especialidad.toLowerCase();

      const rutaImagen = `assets/imagenesEspecialidades/${nombreEspecialidad}.png`;

      this.especialidadesConImagenes[nombreEspecialidad] = rutaImagen;

    }
  }

  obtenerEspecialidades() {
    this.authService.obtenerListaEspecialidades().then((especialidades) => {
      this.especialidades = especialidades;
    }).catch((error) => {
      console.error('Error al obtener especialidades:', error);
    });
  }

  onEspecialidadChange(especialidad: string) {
    
    if (especialidad) {
      this.authService.obtenerEspecialistasPorEspecialidad(especialidad)
        .then((especialistas: { nombre: string, apellido: string , imagenPerfil: string }[]) => {
          if (especialistas.length > 0) {
            this.especialistas = especialistas;
          } else {
            console.warn('No se encontraron especialistas para la especialidad seleccionada.');
          }
        })
        .catch(error => {
          console.error('Error al obtener especialistas:', error);
        });
    } else {
      console.warn('Especialidad seleccionada no válida.');
    }
  }

  guardarTurno() {
    const formValues = this.solicitarTurnoForm.value;
    console.log('Formulario actual:', formValues);

    if (!formValues.date || !formValues.horaInicio || !formValues.horaFin) {
      console.error('Fecha, hora de inicio o hora de fin no están definidos correctamente en el formulario.');
      return;
    }
    const fechaTurno = this.construirFechaTurno(formValues.date, formValues.horaInicio);

    if (!fechaTurno) {
      this.mostrarMensajeError('La fecha y hora del turno no son válidas.');
      return;
    }
    
    const fechaActual: Date = new Date();
    const fechaLimite: Date = new Date();
    fechaLimite.setDate(fechaActual.getDate() + 15);
  
    const especialidadSeleccionada = this.solicitarTurnoForm.get('especialidad')?.value;
    const especialistaSeleccionado = this.solicitarTurnoForm.get('especialista')?.value;
    console.log('Formulario actual:', formValues);

    if (!especialidadSeleccionada || !especialistaSeleccionado) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, seleccione una especialidad y un especialista antes de solicitar el turno.'
      });
      return;
    }

    console.log('Especialista seleccionado ID:', especialistaSeleccionado);
  
    this.pacienteService.getPacienteInfo().subscribe(
      pacienteInfo => {

        this.especialistaService.getEspecialistaInfo(especialistaSeleccionado).subscribe(
          especialistasInfo => {

            this.turnosService.solicitarTurno(
              especialidadSeleccionada,
              especialistaSeleccionado,
              fechaTurno,
              formValues.horaInicio,
              formValues.horaFin,
              pacienteInfo.mail,
              pacienteInfo.nombre,
              pacienteInfo.apellido,
              especialistasInfo.mail,
              especialistasInfo.nombre,
              especialistasInfo.apellido
            ).then(() => {
              console.log('Guardando el turno...');
              this.solicitarTurnoForm.reset();
  
              Swal.fire({
                icon: 'success',
                title: 'Turno solicitado con éxito',
                text: 'Tu turno ha sido solicitado correctamente.',
                confirmButtonText: 'OK'
              }).then(() => {
                this.router.navigate(['/home/mis-turnos']);
              });
  
            }).catch(error => {
              console.error('Error al guardar el turno:', error);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un problema al solicitar el turno. Por favor, intenta nuevamente.'
              });
            });
          },
          error => {
            console.error('Error al obtener la información del especialista:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo obtener la información del especialista. Por favor, intenta nuevamente.'
            });
          }
        );
      },
      error => {
        console.error('Error al obtener la información del paciente:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo obtener la información del paciente. Por favor, intenta nuevamente.'
        });
      }
    );
  }

  construirFechaTurno(date: string, hora: string): Date | null {
    try {
      const [dayOfWeek, dayMonthYear] = date.split(' ');
      const day = parseInt(dayMonthYear.split('/')[0], 10);
      const month = parseInt(dayMonthYear.split('/')[1], 10) - 1; // Restamos 1 porque los meses en JavaScript van de 0 a 11
      const year = parseInt(dayMonthYear.split('/')[2], 10);
  
      const [hour, minute] = hora.split(':').map(Number);
  
      const fechaTurno = new Date(year, month, day);
      fechaTurno.setHours(hour);
      fechaTurno.setMinutes(minute);
  
      return fechaTurno;
    } catch (error) {
      console.error('Error al construir fecha de turno:', error);
      return null;
    }
  }

  obtenerInformacionPaciente(pacienteId: number) {
    this.turnosService.obtenerPacientePorId(pacienteId).subscribe(
      pacienteData => {
        if (pacienteData) {
          console.log('Información del paciente:', pacienteData);

        } else {
          this.mostrarMensajeError(`No se encontró información para el paciente con ID ${pacienteId}`);
        }
      },
      error => {
        console.error('Error al obtener la información del paciente:', error);
        this.mostrarMensajeError('Ocurrió un error al obtener la información del paciente. Por favor, intenta de nuevo más tarde.');
      }
    );
  }

  mostrarMensajeError(mensaje: string) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: mensaje
    });
  }
}
