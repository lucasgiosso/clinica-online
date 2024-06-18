import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-bienvenido',
  standalone: true,
  imports: [],
  templateUrl: './bienvenido.component.html',
  styleUrl: './bienvenido.component.css'
})
export class BienvenidoComponent {

  btnIniciar = 'Iniciar sesión';
  btnRegistrar = 'Registrarse';

  constructor(private router: Router) { }

  ngOnInit() : void{
    
}

  public onClick(event: any): void 
  {
    this.router.navigate(['/login']);

  }

  public onClickReg(event: any): void 
  {
    this.router.navigate(['/register']);

  }
}
