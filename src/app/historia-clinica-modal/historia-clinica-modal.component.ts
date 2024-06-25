import { Component, Inject } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-historia-clinica-modal',
  standalone: true,
  imports: [MatDialogModule,MatButtonModule, CommonModule],
  templateUrl: './historia-clinica-modal.component.html',
  styleUrl: './historia-clinica-modal.component.css'
})
export class HistoriaClinicaModalComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }

}
