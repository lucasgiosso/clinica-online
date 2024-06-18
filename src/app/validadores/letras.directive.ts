import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[lettersOnly]',
  standalone: true,
})
export class LetterDirective {
  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event'])
  onInputChange(event: any) {
    const initialValue = this.el.nativeElement.value;
    this.el.nativeElement.value = initialValue.replace(/[^a-zA-Z\s]*/g, '');
    if (initialValue !== this.el.nativeElement.value) {
      event.stopPropagation();
    }
  }
}