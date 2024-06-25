import { Component } from '@angular/core';
import { EspecialistaService, Horario } from '../../../services/especialista.service';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { TurnoDisponible, TurnosService } from '../../../services/turnos.service';
import { format } from 'date-fns';

@Component({
  selector: 'app-especialista-dispo',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './especialista-dispo.component.html',
  styleUrl: './especialista-dispo.component.css'
})
export class EspecialistaDispoComponent {

  private unsubscribe$ = new Subject<void>();
  disponibilidadForm: FormGroup;
  horariosDisponibles: Horario[] = [];
  mostrarBotonGuardar = true;
  horasDisponibles: string[] = [];
  editandoHorario: Horario | null = null;

  constructor(private fb: FormBuilder, public especialistaService: EspecialistaService, private turnosService: TurnosService) {
    this.disponibilidadForm = this.fb.group({
      id: [''],
      especialidad: ['', Validators.required],
      dias: this.fb.array([], Validators.required),
      horaInicio: ['', Validators.required],
      horaFin: ['', Validators.required],
    });
  }

  ngOnInit() {

    this.especialistaService.disponibilidad$.subscribe((horarios) => {
      this.horariosDisponibles = horarios;
  
      if (this.editandoHorario && this.diasFormArray.length === 0) {
        this.cargarDias();
      }
    });

    this.especialistaService.cargarDisponibilidad();

    this.generarHorasDisponibles();
    
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  getDiasString(dias: string[] | string): string {
    if (Array.isArray(dias)) {
      return dias.join(', ');
    } else {
      return dias;
    }
  }

  toggleActive(event: Event) {
    const button = event.target as HTMLButtonElement;
    if (button.classList.contains('active')) {
      button.classList.remove('active');
    } else {
      button.classList.add('active');
    }
  }

  obtenerTurnosDisponibles(especialistaId: string): void {

    this.turnosService.obtenerTurnosDisponiblesParaEspecialista(especialistaId)
      .then((turnosDisponibles: TurnoDisponible[]) => {

        console.log('Turnos disponibles para el especialista:', turnosDisponibles);
      })
      .catch((error: any) => {
        console.error('Error al obtener turnos disponibles:', error);
      });
  }

  get diasFormArray() {
    return this.disponibilidadForm.get('dias') as FormArray;
  }

  cargarDias() {
    const horarioAModificar = this.horariosDisponibles.find(horario =>
      horario.especialidad === this.disponibilidadForm.value.especialidad &&
      horario.dias === this.disponibilidadForm.value.dias &&
      horario.horaInicio === this.disponibilidadForm.value.horaInicio &&
      horario.horaFin === this.disponibilidadForm.value.horaFin
    );
  
    if (horarioAModificar) {
      this.toggleDias(horarioAModificar.dias);
    }
  }

  toggleDias(dias: string | string[]) {
    const diasControl = this.disponibilidadForm.get('dias') as FormArray;
    diasControl.clear();
    if (Array.isArray(dias)) {
      dias.forEach(dia => diasControl.push(this.fb.control(dia)));
    } else {
      diasControl.push(this.fb.control(dias));
    }
  }

  private generarHorasDisponibles() {
    this.horasDisponibles = []; 
    const horaInicial = 8;
    const horaFinal = 19; 
    const sabadoHoraInicial = 9;
    const sabadoHoraFinal = 14;

    const diasSeleccionados = this.disponibilidadForm.value.dias || [];
    
    diasSeleccionados.forEach((dia: string) => {
      if (dia === 'Sabado') {
        
        for (let hora = sabadoHoraInicial; hora <= sabadoHoraFinal; hora++) {
          for (let minuto = 0; minuto < 60; minuto += 30) {
            if (hora === sabadoHoraFinal && minuto > 0) {
              break; 
            }
          const horaFormateada = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
          this.horasDisponibles.push(horaFormateada);
          }
        }
      } else {
        
        for (let hora = horaInicial; hora <= horaFinal; hora++) {
          for (let minuto = 0; minuto < 60; minuto += 30) {
            if (hora === 19 && minuto > 0) {
              break; 
            }
            const horaFormateada = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
            this.horasDisponibles.push(horaFormateada);
          }
        }
      }
    });
  }

  isDiaSeleccionado(dia: string): boolean {
    return this.disponibilidadForm.value.dias.includes(dia);
  }

  toggleDia(dia: string): void {
    const diasControl = this.disponibilidadForm.get('dias') as FormArray;

    if (this.isDiaSeleccionado(dia)) {
      const index = diasControl.value.indexOf(dia);
      diasControl.removeAt(index);
    } else {
      diasControl.push(this.fb.control(dia));
    }
    this.generarHorasDisponibles();
  }

  obtenerIdHorarioAModificar(): number | null {
    return this.editandoHorario ? this.disponibilidadForm.value.id || null : null;
  }

  getFormattedDate(turno: TurnoDisponible): string {
    const dateStr = turno.dias[0]; // Asumiendo que turno.dias[0] contiene la fecha
    const [day, month, year] = dateStr.split('-').map(Number); // Ajusta según el formato de la fecha que tienes actualmente
    const date = new Date(year, month - 1, day);
  
    const formattedDate = format(date, 'yyyy-MM-dd');
    const horaInicio = this.formatTime(turno.horaInicio);
    const horaFin = this.formatTime(turno.horaFin);
  
    return `${formattedDate} ${horaInicio} - ${horaFin}`;
  }
  
  formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  guardarDisponibilidad() {
    if (this.disponibilidadForm.valid) {
      const diasSeleccionados = this.disponibilidadForm.value.dias || [];
      const diasFiltrados = diasSeleccionados.filter((dia: string | null) => dia !== null);
  
      const nuevoHorario = {
        ...this.disponibilidadForm.value,
        dias: Array.isArray(diasFiltrados) ? diasFiltrados : [diasFiltrados],
      };
  
      if (this.esHorarioValido(nuevoHorario.horaInicio, nuevoHorario.horaFin)) {
        const idHorarioAModificar = this.obtenerIdHorarioAModificar();
  
        if (idHorarioAModificar !== null) {
          const index = this.horariosDisponibles.findIndex(h => h.id === idHorarioAModificar);
  
          if (index !== -1) {
            //this.horariosDisponibles[index] = nuevoHorario;
            this.especialistaService.modificarDisponibilidad(idHorarioAModificar, nuevoHorario);
                    
          }
        } else {
          this.especialistaService.guardarDisponibilidad(nuevoHorario);
        }
  
        this.disponibilidadForm.reset();
        this.mostrarBotonGuardar = true;
        this.editandoHorario = null;
  
        Swal.fire({
          icon: 'success',
          title: 'Disponibilidad guardada con éxito',
          showConfirmButton: false,
          timer: 1500
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'El horario seleccionado no es válido.'
        });
      }
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, completa todos los campos del formulario.'
      });
    }
  }
  

  esHorarioValido(horaInicio: string, horaFin: string): boolean {
    const horaInicioDate = new Date(`2000-01-01T${horaInicio}`);
    const horaFinDate = new Date(`2000-01-01T${horaFin}`);
    
    return horaInicioDate.getTime() < horaFinDate.getTime();
  }

  modificarHorario(horario: Horario) {

    this.toggleDias(horario.dias);
    this.editandoHorario = horario;
    this.mostrarBotonGuardar = true;
    
    this.disponibilidadForm.patchValue({
      ...horario,
    });

  }

  cancelarModificacion(): void {
    this.editandoHorario = null;
    this.disponibilidadForm.reset(); 
  }
}
