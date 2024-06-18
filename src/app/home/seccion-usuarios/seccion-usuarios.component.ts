import { Component, EventEmitter, HostListener, Output } from '@angular/core';
import Swal from 'sweetalert2';
import { ImagesService } from '../../services/images.service'
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormControl, FormGroup, Validators, FormBuilder, AbstractControl } from '@angular/forms';
import { Observable, map } from 'rxjs';
import { Auth, User, signInWithEmailAndPassword } from '@angular/fire/auth';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { Firestore, collection, doc, setDoc } from '@angular/fire/firestore';
import { sendEmailVerification } from 'firebase/auth';
import { LoadingComponent } from "../../loading/loading.component";
import { ListaUsuariosComponent } from "./lista-usuarios/lista-usuarios.component";

interface SideNavToggle {
  screenWidth: number;
  collapsed: boolean;
}

@Component({
    selector: 'app-seccion-usuarios',
    standalone: true,
    templateUrl: './seccion-usuarios.component.html',
    styleUrl: './seccion-usuarios.component.css',
    imports: [CommonModule, FormsModule, ReactiveFormsModule, LoadingComponent, ListaUsuariosComponent]
})
export class SeccionUsuariosComponent {

  btnVolver = 'Volver a home';
  formReg: FormGroup;
  selectedRole: string = '';
  showLoading: boolean = true;
  usuariosPendientes: any[] = [];
  botonHabilitar: boolean = true;
  botonInhabilitar: boolean = true;
  imagenPerfil0: File | null = null;
  imagenPerfil: File | null = null;
  imagenPerfil1: File | null = null;
  imagenPerfil2: File | null = null;
  showCaptcha: boolean = false;
  crearUsuarioVisible: boolean = false;
  animacionCrearUsuario: boolean = false;
  usuarios: any[] = [];
  mostrarFormulario: boolean = false;



  @Output() onToggleSideNav: EventEmitter<SideNavToggle> = new EventEmitter();
    collapsed = false;
    screenWidth = 0;
    currentUser$: Observable<User | null>;
    isDropdownOpen = false;
    showLogoutButton = false;

    @HostListener('window:resize', ['$event'])
onResize(event: any){
  this.screenWidth = window.innerWidth;
  if (this.screenWidth <= 768) {
    this.collapsed = false;
    this.onToggleSideNav.emit({collapsed: this.collapsed, screenWidth: this.screenWidth});
  }
}

  constructor ( private formBuilder : FormBuilder, private ImagesService: ImagesService,private authService: AuthService,private router: Router, private firestore: Firestore, private auth: Auth) {

    this.currentUser$ = this.authService.getCurrentUser();


    this.formReg = new FormGroup({
      selectedRole: new FormControl('', [Validators.required]),
      nombre: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(20),Validators.pattern(/^[a-zA-Z\s]+$/)]),
      apellido: new FormControl('', [Validators.required, Validators.minLength(3),Validators.pattern(/^[a-zA-Z\s]+$/)]),
      edad: new FormControl('', [Validators.required, Validators.pattern("^[0-9]+"),Validators.min(18), Validators.max(99)]),
      dni: new FormControl('', [Validators.required,Validators.pattern("^[0-9]+"), Validators.minLength(6),Validators.maxLength(8)]),
      obraSocial: new FormControl('',[Validators.required,Validators.pattern(/^[a-zA-Z\s]+$/)]),
      email: new FormControl('', [Validators.email, Validators.required]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      confirmPassword: new FormControl('', [Validators.required]),
      especialidad: new FormControl('', [Validators.required] ),
      otraEspecialidad: new FormControl('', [Validators.required, Validators.minLength(4), Validators.maxLength(25), Validators.pattern(/^[a-zA-Z]+$/)]),
      imagenPerfil0: new FormControl('', [Validators.required]),
      imagenPerfil: new FormControl('', [Validators.required]),
      imagenPerfil1: new FormControl('', [Validators.required]),
      imagenPerfil2: new FormControl('', [Validators.required]),
    }); 

    const selectedRoleControl = this.formReg.get('selectedRole');

    if (selectedRoleControl) {
      selectedRoleControl.valueChanges.pipe(
        map((selectedRole) => {

          this.updateValidators(selectedRole);
        })
      ).subscribe();
    }
    
  }

  ngOnInit() : void{
   
    setTimeout(() => {
    this.showLoading = false;
  }, 2000);

  this.screenWidth = window.innerWidth;
  this.currentUser$ = this.authService.getCurrentUser();
  this.cargarUsuariosPendientes();

}

  public onClickHome(event: any): void 
  {
    this.router.navigate(['home']);
  }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
  }

  toggleCrearUsuario() {
    this.animacionCrearUsuario = !this.animacionCrearUsuario;
  }

  async obtenerUsuarios() {
    try {
      this.usuarios = await this.authService.obtenerUsuarios();
    } catch (error) {
      console.error('Error al obtener usuarios en el componente:', error);
    }
  }

  onAnimationEnd() {
    this.animacionCrearUsuario = false;
  }

  getValue(value: string): AbstractControl{
    return this.formReg.get(value) as FormGroup;
  }

  updateValidators(selectedRole: string | null): void {
  
    if (selectedRole === null) {
      return;
    }
  
    this.formReg.get('obraSocial')?.clearValidators();
    this.formReg.get('especialidad')?.clearValidators();
    this.formReg.get('otraEspecialidad')?.clearValidators();
    this.formReg.get('imagenPerfil')?.clearValidators();
    this.formReg.get('imagenPerfil1')?.clearValidators();
    this.formReg.get('imagenPerfil2')?.clearValidators();
  
    if (selectedRole === 'especialista') {
      this.formReg.get('especialidad')?.setValidators([Validators.required]);
  
      if (this.formReg.get('especialidad')?.value === 'otra') {
        this.formReg.get('otraEspecialidad')?.setValidators([Validators.required]);
      }
      
      this.formReg.get('imagenPerfil')?.setValidators([Validators.required]);
      this.formReg.get('obraSocial')?.setValidators([Validators.required]);
  
      this.formReg.get('obraSocial')?.clearValidators();
      this.formReg.get('imagenPerfil1')?.clearValidators();
      this.formReg.get('imagenPerfil2')?.clearValidators();
    } 
    else if (selectedRole === 'paciente') {
  
      this.formReg.get('especialidad')?.clearValidators();
      this.formReg.get('otraEspecialidad')?.clearValidators();
  
  
      this.formReg.get('imagenPerfil1')?.setValidators([Validators.required]);
      this.formReg.get('imagenPerfil2')?.setValidators([Validators.required]);
  
      this.formReg.get('imagenPerfil')?.clearValidators();
    }

    else if (selectedRole === 'admin') {
  
      if (this.formReg.get('especialidad')?.value === 'otra') {
        this.formReg.get('otraEspecialidad')?.setValidators([Validators.required]);
      }
      
      this.formReg.get('imagenPerfil')?.setValidators([Validators.required]);
      this.formReg.get('obraSocial')?.setValidators([Validators.required]);
  
      this.formReg.get('obraSocial')?.clearValidators();
      this.formReg.get('imagenPerfil1')?.clearValidators();
      this.formReg.get('imagenPerfil2')?.clearValidators();

      this.formReg.get('especialidad')?.clearValidators();
      this.formReg.get('otraEspecialidad')?.clearValidators();
  
  
      this.formReg.get('imagenPerfil1')?.setValidators([Validators.required]);
      this.formReg.get('imagenPerfil2')?.setValidators([Validators.required]);
  
      this.formReg.get('imagenPerfil')?.clearValidators();
    }
    this.formReg.get('obraSocial')?.updateValueAndValidity();
    this.formReg.get('especialidad')?.updateValueAndValidity();
    this.formReg.get('otraEspecialidad')?.updateValueAndValidity();
    this.formReg.get('imagenPerfil0')?.updateValueAndValidity();
    this.formReg.get('imagenPerfil')?.updateValueAndValidity();
    this.formReg.get('imagenPerfil1')?.updateValueAndValidity();
    this.formReg.get('imagenPerfil2')?.updateValueAndValidity();
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    this.showLogoutButton = this.isDropdownOpen; 
  }

  toggleCollapse(): void{
    this.collapsed = !this.collapsed;
    this.onToggleSideNav.emit({collapsed: this.collapsed, screenWidth: this.screenWidth});
  }
  
  closeSidenav(): void{
    this.collapsed = false;
    this.onToggleSideNav.emit({collapsed: this.collapsed, screenWidth: this.screenWidth});
  }
  
  handleNavigation(routeLink: string) {
  
    if (routeLink === 'logout') {
      this.logout();
    }
  }

  onFileSelected0(event: any) {
    this.imagenPerfil0 = event.target.files[0];
  }

  onFileSelected(event: any) {
    this.imagenPerfil = event.target.files[0];
  }
  
  onFileSelected1(event: any) {
    this.imagenPerfil1 = event.target.files[0];
  }
  
  onFileSelected2(event: any) {
    this.imagenPerfil2 = event.target.files[0];
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

  async sendEmailVerification(user: User) {
    await sendEmailVerification(user);
  }

  async onSubmit() {
  
    const passwordControl = this.formReg.get('password');
    const confirmPasswordControl = this.formReg.get('confirmPassword');
    const selectedRole = this.formReg.get('selectedRole')?.value;
    const { email, password, confirmPassword } = this.formReg.value;
  
    if (password !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Error en la contraseña',
        text: 'Las contraseñas no coinciden. Por favor, verifica.',
      }).then(() => {
        if (passwordControl && confirmPasswordControl) {
          passwordControl.reset();
          confirmPasswordControl.reset();
        }
      });
      return;
    }
  
    if (!selectedRole) {
      Swal.fire({
        icon: 'error',
        title: 'Perfil no seleccionado',
        text: 'Por favor, selecciona un perfil antes de registrarte.',
      });
      return;
    }
  
    try {
      const userExists = await this.authService.checkIfUserExists(email);
  
      if (userExists) {
        Swal.fire({
          icon: 'error',
          title: 'Usuario existente',
          text: 'El correo electrónico ya está registrado. Inicia sesión en lugar de registrarte.',
        }).then(() => {
          if (passwordControl && confirmPasswordControl) {
            passwordControl.reset();
            confirmPasswordControl.reset();
            this.router.navigate(['/login']);
            return;
          }
        });
      }
  
        console.log("paso 1");
        const userCredential = await this.authService.register(email, password);
        const user = userCredential.user;
        console.log("paso 2");
        const userDocRef = doc(collection(this.firestore, 'DatosUsuarios'), user.uid);
  
        let additionalUserData: any = {
          mail: email,
          role: selectedRole,
          nombre: this.formReg.get('nombre')?.value,
          apellido: this.formReg.get('apellido')?.value,
          edad: this.formReg.get('edad')?.value,
          dni: this.formReg.get('dni')?.value
        };
  
        if (selectedRole === 'paciente') {
          
          if (this.imagenPerfil1 && this.imagenPerfil2) 
              {
                console.log("entra1?");
                const image1 = await this.ImagesService.uploadFile(this.imagenPerfil1);
                const image2 = await this.ImagesService.uploadFile(this.imagenPerfil2);
  
                additionalUserData = {
                  ...additionalUserData,
                  obrasocial: this.formReg.get('obraSocial')?.value,
                  aprobadoPorAdmin: true,
                  imagenPerfil1: image1,
                  imagenPerfil2: image2,
                };
              } 
              console.log("paso 3, cargado");
              await setDoc(userDocRef, additionalUserData, { merge: true });
  
      }
      else if (selectedRole === 'especialista') 
      {
        if (this,this.imagenPerfil) {
          
          const image = await this.ImagesService.uploadFile(this.imagenPerfil);
            
          additionalUserData = {
            ...additionalUserData,
            especialidad: this.formReg.get('especialidad')?.value,
            otraEspecialidad: this.formReg.get('otraEspecialidad')?.value,
            aprobadoPorAdmin: false,
            imagenPerfil: image,
          };
        }
        await setDoc(userDocRef, additionalUserData, { merge: true });
        console.log("paso 3, cargado");
        }     
        else if (selectedRole === 'admin') 
      {
        if (this.imagenPerfil0) {
          
          const image0 = await this.ImagesService.uploadFile(this.imagenPerfil0);
            
          additionalUserData = {
            ...additionalUserData,
            aprobadoPorAdmin: true,
            imagenPerfil: image0,
          };
        }
        await setDoc(userDocRef, additionalUserData, { merge: true });
        console.log("paso 3, cargado");
        }     

        
        if (!user.emailVerified) {
          await this.sendEmailVerification(user);
  
          Swal.fire({
            icon: 'warning',
            title: 'Faltan validar tus datos antes de iniciar sesión.',
            text: 'Debes verificar tu correo electrónico antes de iniciar sesión. Hemos enviado un correo de verificación a tu dirección de correo.',
          }).then(() => {
  
            if (passwordControl && confirmPasswordControl) {
              passwordControl.reset();
              confirmPasswordControl.reset();
              this.cargarUsuariosPendientes();
              this.obtenerUsuarios();
              this.formReg.reset();
              this.router.navigate(['/home/seccion-usuarios']).then(() => {
                window.location.reload();
              });
            }
          });
          
        } else {
          Swal.fire({
            icon: 'success',
            title: 'Registro exitoso',
            text: '¡Bienvenido!',
            confirmButtonText: 'OK'
          }).then(() => {
            this.router.navigate(['/login']);
          });
        }
    } catch (error: any) 
        {
          if (error.message === 'Debes verificar tu correo electrónico antes de iniciar sesión.') {
    
            Swal.fire({
              icon: 'warning',
              title: 'Faltan validar tus datos',
              text: error.message,
            });
            this.router.navigate(['/login']);
          } else if (error.code === 'auth/invalid-email') {
            Swal.fire({
              icon: 'error',
              title: 'Error en el correo electrónico',
              text: 'El formato del correo electrónico es incorrecto. Por favor, verifica.',
            });
          } else if (error.code === 'auth/weak-password') {
            Swal.fire({
              icon: 'error',
              title: 'Contraseña débil',
              text: 'La contraseña es demasiado débil. Debe contener al menos 6 caracteres.',
            }).then(() => {
              if (passwordControl && confirmPasswordControl) {
                passwordControl.reset();
                confirmPasswordControl.reset();
              }
            });
          } else if (error.code === 'auth/email-already-in-use') {
            Swal.fire({
              icon: 'error',
              title: 'Correo electrónico en uso',
              text: 'El correo electrónico ya está registrado. Inicia sesión en lugar de registrarte.',
            }); 
          } else {
            console.error('Error en el registro:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error en el registro',
              text: 'Hubo un error al registrar tu cuenta. Por favor, verifica tus datos.',
            }).then(() => {
              if (passwordControl && confirmPasswordControl) {
                passwordControl.reset();
                confirmPasswordControl.reset();
              }
            });
          }
          return Promise.resolve();
        }
    }

  userLogged() {
    this.authService.getCurrentUser().subscribe(
      (user) => {
        console.log(user?.email);
      },
      (error) => {
        console.error('Error al obtener el usuario actual:', error);
      }
    );
  }

  cargarUsuariosPendientes() {
    this.authService.obtenerUsuariosPendientesAprobacion()
      .then((usuarios) => {
        this.usuariosPendientes = usuarios;
      })
      .catch((error) => {
        console.error('Error al cargar usuarios pendientes:', error);
      });
  }

  aprobarUsuario(userId: string) {
    this.authService.aprobarUsuario(userId)
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: 'Usuario habilitado',
          text: 'El usuario ha sido aprobado exitosamente.',
        });

        this.cargarUsuariosPendientes();
        this.obtenerUsuarios();
      })
      .catch((error) => {
        
        Swal.fire({
          icon: 'error',
          title: 'Error al aprobar usuario',
          text: 'Hubo un error al aprobar el usuario. Por favor, inténtalo de nuevo.',});

      });
  }

  inhabilitarUsuario(userId: string) {
    this.authService.inhabilitarUsuario(userId)
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: 'Usuario inhabilitado',
          text: 'El usuario ha sido aprobado exitosamente.',
        });

        this.cargarUsuariosPendientes();
        this.obtenerUsuarios();
      })
      .catch((error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error al aprobar usuario',
          text: 'Hubo un error al aprobar el usuario. Por favor, inténtalo de nuevo.',});
      });
  }
}
