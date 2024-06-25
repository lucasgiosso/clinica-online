import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeccionPacienteComponent } from './seccion-paciente.component';

describe('SeccionPacienteComponent', () => {
  let component: SeccionPacienteComponent;
  let fixture: ComponentFixture<SeccionPacienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeccionPacienteComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SeccionPacienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
