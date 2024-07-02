import { Component, Input, OnInit } from '@angular/core';
import { HistoriaClinica } from '../services/turnos.service';
import { HistoriaClinicaService } from '../services/historia-clinica.service';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PacienteService } from '../services/paciente.service';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-historia-clinica',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './historia-clinica.component.html',
  styleUrl: './historia-clinica.component.css'
})
export class HistoriaClinicaComponent implements OnInit{

  // @Input() pacienteId!: string;
  historiaClinicaForm: FormGroup;
  medicalHistories: HistoriaClinica[] = [];
  turnoId: string = '';
  pacienteId: string = '';
  pacienteNombre: string = '';
  pacienteApellido: string = '';
  btnVolver = 'Volver';
  maxDatosDinamicos = 3;
  animateForm = false;
  fechaTurno!: Date;
  
  constructor(private historiaClinicaService: HistoriaClinicaService, private route: ActivatedRoute, private fb: FormBuilder, private router: Router, private pacienteService: PacienteService, private firestore: Firestore)
  {
    this.historiaClinicaForm = this.fb.group({
      altura: ['', Validators.required],
      peso: ['', Validators.required],
      temperatura: ['', [Validators.required]],
      presion: ['', Validators.required],
      datosDinamicos: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.turnoId = params.get('turnoId') || '';
      this.pacienteId = params.get('pacienteId') || '';
      const fechaTurnoParam = this.route.snapshot.paramMap.get('fechaTurno')!;
      this.fechaTurno = new Date(fechaTurnoParam);

      this.pacienteService.getPacienteInfo1(this.pacienteId).subscribe(paciente => {
        this.pacienteNombre = paciente.nombre;
        this.pacienteApellido = paciente.apellido;
      });
    });
  }

  get datosDinamicos(): FormArray {
    return this.historiaClinicaForm.get('datosDinamicos') as FormArray;
  }

  agregarDatoDinamico() {
    if (this.datosDinamicos.length < this.maxDatosDinamicos) {
      this.datosDinamicos.push(this.fb.group({
        clave: ['', Validators.required],
        valor: ['', Validators.required]
      }));
    }
  }

  onSubmit() {
    if (this.historiaClinicaForm.valid) {
      const formValues = this.historiaClinicaForm.value;
      this.animateForm = true;
      setTimeout(() => {
      const fechaTurno = this.fechaTurno;
      this.historiaClinicaService.addMedicalHistory(this.pacienteId, this.turnoId, formValues, fechaTurno).then(() => {
        this.historiaClinicaForm.reset();
        this.router.navigate(['/home/mis-turnos']);
        const turnoDocRef = doc(this.firestore, `turnos/${this.turnoId}`);
        updateDoc(turnoDocRef, { historiaClinicaCargada: true });
      }).catch(error => {
        console.error('Error al guardar la historia clínica:', error);
      });
    }, 700);
    }
  }
  
  public onClickHome(event: any): void 
  {
    this.router.navigate(['home/mis-turnos']);
  }
  
}
