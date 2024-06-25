import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoriaClinicaModalComponent } from './historia-clinica-modal.component';

describe('HistoriaClinicaModalComponent', () => {
  let component: HistoriaClinicaModalComponent;
  let fixture: ComponentFixture<HistoriaClinicaModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoriaClinicaModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HistoriaClinicaModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
