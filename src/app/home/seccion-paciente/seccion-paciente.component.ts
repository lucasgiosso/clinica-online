import { Component, EventEmitter, OnInit, Output  } from '@angular/core';
import { Observable, filter, firstValueFrom, from, map, of, switchMap } from 'rxjs';
import { PacienteService } from '../../services/paciente.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HistoriaClinicaService } from '../../services/historia-clinica.service';
import { HistoriaClinicaModalComponent } from '../../historia-clinica-modal/historia-clinica-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { HistoriaClinica, Turno, TurnosService } from '../../services/turnos.service';
import { LoadingComponent } from "../../loading/loading.component";
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Auth, User } from '@angular/fire/auth';
import Swal from 'sweetalert2';

interface SideNavToggle {
  screenWidth: number;
  collapsed: boolean;
}

@Component({
    selector: 'app-seccion-paciente',
    standalone: true,
    templateUrl: './seccion-paciente.component.html',
    styleUrl: './seccion-paciente.component.css',
    imports: [CommonModule, LoadingComponent, MatButtonModule, MatIconModule,MatCardModule]
})
export class SeccionPacienteComponent implements OnInit{

  pacientes: any[] = [];
  usuarioLogueado: any;
  historiasClinicasExist: { [key: string]: boolean } = {};
  btnVolver = 'Volver a home';
  showLoading: boolean = true;
  pacienteSeleccionado: any = null;
  turnosPacienteSeleccionado: any[] = [];

  @Output() onToggleSideNav: EventEmitter<SideNavToggle> = new EventEmitter();
  collapsed = false;
  screenWidth = 0;
  isDropdownOpen = false;
  showLogoutButton = false;
  
  currentUser$: Observable<User | null>;
  pacientes$: Observable<any[]>= of([]);
  turnos$: Observable<any[]> = of([]);
  selectedUser: any;
  selectedResena: any;
  userEmail: string = '';
  selectedHistoriaClinica: any;

  
  constructor(private pacienteService: PacienteService, private turnosService: TurnosService, private authService: AuthService, private route: ActivatedRoute, private auth: Auth,private router: Router, private historiaClinicaService: HistoriaClinicaService, private dialog: MatDialog) 
  {
    this.currentUser$ = this.authService.getCurrentUser();
    // this.pacientes$ = this.pacienteService.getUsers();
   
  }

  ngOnInit() {
    this.currentUser$.pipe(
      filter(user => {
        console.log('Usuario autenticado:', user); // Log para verificar el usuario autenticado
        return user !== null;
      }),
      switchMap(user => {
        console.log('Obteniendo datos del usuario con UID:', (user as User).uid); // Log para verificar el UID del usuario
        const uid = (user as User).uid;
        return this.authService.getUserData(uid).pipe(
          map(userData => {
            console.log('Datos del usuario obtenidos:', userData); // Log para verificar los datos del usuario
            return { uid, ...userData };
          })
        );
      }),
      switchMap(({ uid }) => {
        console.log('Obteniendo pacientes atendidos por el especialista con UID:', uid); // Log para verificar el UID del especialista
        return this.pacienteService.getUsersAttendedBySpecialist(uid);
      })
    ).subscribe(pacientes => {
      console.log('Pacientes atendidos:', pacientes);  // Log para verificar los pacientes obtenidos
      // Convertir Timestamp a Date
      this.pacientes$ = of(pacientes.map(paciente => {
        if (paciente.fechaHora instanceof Object && paciente.fechaHora.toDate) {
          paciente.fechaHora = paciente.fechaHora.toDate();
        }
        return paciente;
      }));
    }, error => {
      console.error('Error fetching patients attended by specialist:', error);
    });
  
    setTimeout(() => {
      this.showLoading = false;
    }, 2000);
  }
  
  viewUserDetails(userEmail: string) {
    if (!userEmail) {
      console.error('User email is undefined');
      return;
    }
    this.pacienteService.getUserTurnos(userEmail).pipe(
      map(turnos => {
        return turnos.map(turno => {
          if (turno.fechaHora instanceof Object && turno.fechaHora.toDate) {
            turno.fechaHora = turno.fechaHora.toDate();
          }
          return turno;
        });
      })
    ).subscribe(turnos => {
      console.log('Turnos del usuario (con fechas convertidas):', turnos);  // Log para verificar los turnos del usuario
      this.turnos$ = of(turnos);
      this.selectedUser = userEmail;
    });
  }

  viewResena(turno: Turno) {
    this.selectedResena = turno.comentario;
  }
  clearSelection() {
    this.selectedUser = null;
    this.selectedResena = null;
    this.selectedHistoriaClinica = null;
    this.turnos$ = of([]);
  }


  async obtenerInfoUsuarioLogueado(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.authService.getCurrentUser().subscribe(
        async user => {
          if (user && user.uid) {
            try {
              const usuario = await this.pacienteService.obtenerInformacionPaciente1(user.uid);
              this.usuarioLogueado = { ...usuario, uid: user.uid }; // Asegúrate de que el uid está siendo asignado
              console.log('Usuario logueado:', this.usuarioLogueado);
              resolve();
            } catch (error) {
              console.error('Error al obtener la información del usuario:', error);
              reject(error);
            }
          } else {
            console.error('No se encontró el UID del usuario autenticado');
            reject(new Error('No se encontró el UID del usuario autenticado'));
          }
        },
        error => {
          console.error('Error al obtener el usuario actual:', error);
          reject(error);
        }
      );
    });
  }
  
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    this.showLogoutButton = this.isDropdownOpen; 
  }

  async cargarPacientesAtendidos() {
    if (!this.usuarioLogueado || !this.usuarioLogueado.uid) {
      console.error('El UID del especialista es undefined.');
      return;
    }
  
    this.pacienteService.getPacientesAtendidosPorEspecialista(this.usuarioLogueado.uid).subscribe(
      async pacientes => {
        console.log('Pacientes antes de obtener info:', pacientes);
        const pacientesConInfo = await Promise.all(pacientes.map(async paciente => {
          console.log('Obteniendo info para paciente UID:', paciente.uid);
          if (!paciente.uid) {
            console.error('El paciente no tiene UID:', paciente);
            return paciente; // Devuelve el paciente sin información adicional si no tiene UID
          }
          const pacienteInfo = await this.pacienteService.obtenerInformacionPaciente1(paciente.uid);
          console.log('Info obtenida:', pacienteInfo);
          return { ...paciente, ...pacienteInfo };
        }));
        
        this.pacientes = pacientesConInfo;
        console.log('Pacientes obtenidos en el componente:', this.pacientes);
      },
      error => {
        console.error('Error al cargar los pacientes atendidos:', error);
      }
    );
  }

  verHistoriaClinica3(turno: any) {
    if (!turno.paciente || !turno.paciente.id) {
      console.error('El turno no tiene un paciente o el paciente no tiene un ID');
      return;
    }
  
    console.log(`Consultando historia clínica para el paciente con ID: ${turno.paciente.id}`);
    this.historiaClinicaService.getHistoriaClinicaByPacienteId1(turno.paciente.id).subscribe(historiaClinica => {
      console.log('Historia clínica obtenida:', historiaClinica);
      if (historiaClinica && historiaClinica.length > 0) {
        this.selectedHistoriaClinica = historiaClinica[0];
      } else {
        this.selectedHistoriaClinica = null;
      }
    });
  }

cargarUsuarios() {
    this.pacienteService.getUsuarios().subscribe(usuarios => {
      this.pacientes = usuarios;
      const verificaciones = this.pacientes.map(paciente => {
        if (paciente.role === 'paciente') {
          return this.historiaClinicaService.getHistoriaClinicaByPacienteId(paciente.id).toPromise().then(historias => {
            if (historias) {
              this.historiasClinicasExist[paciente.id] = historias.length > 0;
            } else {
              this.historiasClinicasExist[paciente.id] = false;
            }
          });
        }
        return Promise.resolve();
      });

      Promise.all(verificaciones).then(() => {
        console.log('Verificación de historias clínicas para usuarios completa', this.historiasClinicasExist);
      });
    });
  }

  seleccionarPaciente(paciente: any) {
    this.pacienteSeleccionado = paciente;
    this.cargarTurnosPacienteSeleccionado();
  }


  cargarTurnosDelPaciente(pacienteId: string) {
    if (this.usuarioLogueado) {
      this.turnosService.getTurnosPorPacienteYEspecialista(pacienteId, this.usuarioLogueado.uid).subscribe(
        (turnos: any) => {
          this.turnosPacienteSeleccionado = turnos;
        },
        (error: any) => {
          console.error('Error al cargar los turnos del paciente:', error);
        }
      );
    }
  }

  cargarTurnosPacienteSeleccionado() {
    if (!this.pacienteSeleccionado || !this.usuarioLogueado) {
      console.error('Paciente seleccionado o usuario logueado es undefined');
      return;
    }

    this.turnosService.getTurnosPorPacienteYEspecialista(this.pacienteSeleccionado.uid, this.usuarioLogueado.uid).subscribe(
      turnos => {
        this.turnosPacienteSeleccionado = turnos;
      },
      error => {
        console.error('Error al cargar los turnos del paciente seleccionado:', error);
      }
    );
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
          console.log('Route link clicked: logout');
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


}
