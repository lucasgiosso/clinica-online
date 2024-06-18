import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EspecialistaDispoComponent } from './especialista-dispo.component';

describe('EspecialistaDispoComponent', () => {
  let component: EspecialistaDispoComponent;
  let fixture: ComponentFixture<EspecialistaDispoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EspecialistaDispoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EspecialistaDispoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
