import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appSinImagen]',
  standalone: true
})
export class SinImagenDirective {

  @Input() appSinImagen?: string;

  constructor(private elementImg: ElementRef) {}

  @HostListener('error')
  onError(): void {
    this.elementImg.nativeElement.src = this.appSinImagen || 'assets/imagenesEspecialidades/noimage.png';
  }

}
