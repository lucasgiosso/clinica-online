import { Component, Inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-historia-clinica-modal',
  standalone: true,
  imports: [MatDialogModule,MatButtonModule, CommonModule],
  templateUrl: './historia-clinica-modal.component.html',
  styleUrl: './historia-clinica-modal.component.css'
})
export class HistoriaClinicaModalComponent {

  private logoutSubscription: Subscription;

  // constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<HistoriaClinicaModalComponent>) { }
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<HistoriaClinicaModalComponent>,
    private authService: AuthService
  ) {
    this.logoutSubscription = this.authService.logout$.subscribe(() => {
      this.dialogRef.close();
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    if (this.logoutSubscription) {
      this.logoutSubscription.unsubscribe();
    }
    this.dialogRef.close();
  }

}
