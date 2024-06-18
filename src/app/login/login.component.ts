import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';
import { User, UserCredential } from 'firebase/auth';
import { ImagesService } from '../services/images.service';
import { LoadingComponent } from "../loading/loading.component";
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-login',
    standalone: true,
    templateUrl: './login.component.html',
    styleUrl: './login.component.css',
    imports: [LoadingComponent, CommonModule, FormsModule, ReactiveFormsModule]
})
export class LoginComponent implements OnInit{

  formLogin: FormGroup;
    errorMensaje: string = '';
    currentUser: User | null = null;

    defaultEmailAdmin = 'proyectos.utn.pps@gmail.com';
    defaultPasswordAdmin = '123456';

    defaultEmailEspecialista1 = '6g1ty15s@cj.mintemail.com';
    defaultPasswordEspecialista1 = '123456';

    defaultEmailEspecialista2 = 'v16cufk5@cj.mintemail.com';
    defaultPasswordEspecialista2 = '123456';

    defaultEmailPaciente1 = 'nast71lq@cj.mintemail.com';
    defaultPasswordPaciente1 = '123456';

    defaultEmailPaciente2 = 'xnd16zp0@cj.mintemail.com';
    defaultPasswordPaciente2 = '123456';

    defaultEmailPaciente3 = 'o8lpxrxf@cj.mintemail.com';
    defaultPasswordPaciente3 = '123456';

    fotoPerfilUrls: { [key: string]: string } = {};
    imagenPerfilUrl: string = '';
    usuarioActual: any = {};

    email: string = '';
    password: string = '';
    showLoading: boolean = true;
    formReset: boolean = false;

    constructor(private router: Router, private fb: FormBuilder,private authService: AuthService, private imagesService: ImagesService )
    {
      this.formLogin = this.fb.group(
        { email: ['', [Validators.required, Validators.email]],
          password: ['', [Validators.required]]});
    }
    ngOnInit(): void {
      this.formLogin = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required]],
      });
    
      this.showLoading = true; // Mostrar el indicador de carga
      
      setTimeout(() => {
        this.showLoading = false;
      }, 2000);
    
      // Llama a todas las funciones de carga de usuarios
      Promise.all([
        this.loginLoadAdmin(),
        this.loginLoadEspecialista1(),
        this.loginLoadEspecialista2(),
        this.loginLoadPaciente1(),
        this.loginLoadPaciente2(),
        this.loginLoadPaciente3()
      ]).catch(error => {
        console.error('Error al cargar los usuarios:', error);
      });
    }


      resetLoginForm(): void {
        this.formLogin.reset();
      }

      onSubmit() {
        this.authService.login(this.formLogin.value)
          .then((userCredential: UserCredential) => {
            const user = userCredential.user;
            if (user.emailVerified) {
              //console.log('Inicio de sesión exitoso');
              Swal.fire({
                icon: 'success',
                title: 'Inicio de sesión exitoso',
                text: '¡Bienvenido!',
                showConfirmButton: false,
                timer: 1500,
                timerProgressBar: true

              }).then(() => {
                this.router.navigate(['/home']);
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error en el inicio de sesión',
                text: 'Debes verificar tu correo electrónico antes de iniciar sesión. Hemos enviado un correo de verificación a tu dirección de correo.',
              });
            }
          })
          .catch((error: any) => {
            let errorMessage = 'Error al iniciar sesión. Por favor, verifica tu correo electrónico y contraseña.';
            if (error.code === 'auth/user-not-found') {
              errorMessage = 'El correo electrónico no existe. Por favor, verifica.';
            } else if (error.code === 'auth/wrong-password') {
              errorMessage = 'La contraseña es incorrecta. Por favor, verifica.';
            } else if (error.message === 'La cuenta aún no ha sido aprobada por el administrador.') {
              Swal.fire({
                icon: 'error',
                title: 'Error de inicio de sesión',
                text: 'La cuenta aún no ha sido aprobada por el administrador.',
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: errorMessage,
              });
            }
          });
      }
      
      async cargarUsuario(email: string, password: string): Promise<void> {
        try {
          const usuarios = await this.authService.obtenerUsuariosConFotoPerfil(email);
          if (usuarios.length > 0) {
            const usuario = usuarios[0];
            //usuario.imagenPerfilUrl = usuario.imagenPerfilUrl;
            this.fotoPerfilUrls[email] = usuario.imagenPerfilUrl;
            if (!this.formReset) {
              this.resetLoginForm();
              this.formReset = true; // Marcar que el formulario se ha restablecido
            }
          } else {
            console.error('Usuario no encontrado');
          }
        } catch (error) {
          console.error('Error al cargar el usuario:', error);
        }
      } 
      
      loginLoadAdmin(): void {
        const email = this.defaultEmailAdmin;
        const password = this.defaultPasswordAdmin;
        this.cargarUsuario(email, password);
        this.formLogin.setValue({ email, password });
      }
      
      loginLoadEspecialista1(): void {
        const email = this.defaultEmailEspecialista1;
        const password = this.defaultPasswordEspecialista1;
        this.cargarUsuario(email, password);
        this.formLogin.setValue({ email, password });
      }
      
      loginLoadEspecialista2(): void {
        const email = this.defaultEmailEspecialista2;
        const password = this.defaultPasswordEspecialista2;
        this.cargarUsuario(email, password);
        this.formLogin.setValue({ email, password });
      }
      
      loginLoadPaciente1(): void {
        const email = this.defaultEmailPaciente1;
        const password = this.defaultPasswordPaciente1;
        this.cargarUsuario(email, password);
        this.formLogin.setValue({ email, password });
      }
      
      loginLoadPaciente2(): void {
        const email = this.defaultEmailPaciente2;
        const password = this.defaultPasswordPaciente2;
        this.cargarUsuario(email, password);
        this.formLogin.setValue({ email, password });
      }
      
      loginLoadPaciente3(): void {
        const email = this.defaultEmailPaciente3;
        const password = this.defaultPasswordPaciente3;
        this.cargarUsuario(email, password);
        this.formLogin.setValue({ email, password });
      }

      loginLoadBlank(): void {
        this.email = '';
        this.password = '';
      }
      

    onRegister() {
      this.router.navigate(['/register'])
        .catch(error => console.log(error));
    }

    onClickWel(event: any): void 
  {
    this.router.navigate(['']);
    
  }

}
