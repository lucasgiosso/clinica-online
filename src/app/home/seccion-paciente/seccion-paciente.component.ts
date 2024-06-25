import { Component, OnInit  } from '@angular/core';
import { Observable } from 'rxjs';
import { PacienteService } from '../../services/paciente.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HistoriaClinicaService } from '../../services/historia-clinica.service';
import { HistoriaClinicaModalComponent } from '../../historia-clinica-modal/historia-clinica-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { HistoriaClinica } from '../../services/turnos.service';

@Component({
  selector: 'app-seccion-paciente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seccion-paciente.component.html',
  styleUrl: './seccion-paciente.component.css'
})
export class SeccionPacienteComponent implements OnInit{

  pacientes: any[] = [];
  usuarioLogueado: any;
  historiasClinicasExist: { [key: string]: boolean } = {};
  btnVolver = 'Volver a home';
  
  constructor(private pacienteService: PacienteService, private authService: AuthService, private route: ActivatedRoute, private router: Router, private historiaClinicaService: HistoriaClinicaService, private dialog: MatDialog) 
  {

  }

  async ngOnInit() {
    this.usuarioLogueado = await this.authService.obtenerInfoUsuarioActual();
    console.log('Usuario logueado:', this.usuarioLogueado);
    this.cargarPacientesAtendidos();
  }

  cargarPacientesAtendidos() {
    if (this.usuarioLogueado) {
      this.pacienteService.getPacientesAtendidosPorEspecialista(this.usuarioLogueado.id).subscribe(pacientes => {
        this.pacientes = pacientes;
        console.log('Pacientes atendidos:', this.pacientes);
        this.pacientes.forEach(paciente => {
          this.historiaClinicaService.getHistoriaClinicaByPacienteId(paciente.id).subscribe(historias => {
            this.historiasClinicasExist[paciente.id] = historias.length > 0;
          });
        });
      });
    }
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

  public onClickHome(event: any): void 
  {
    this.router.navigate(['home']);
  }

}
