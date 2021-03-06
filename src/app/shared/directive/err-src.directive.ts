import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
    selector: '[appErrorSrc]'
})
export class ErrSrcDirective {
    defaultSrc = '/assets/images/default-logo.png';

    constructor(private el: ElementRef) {}

    @Input('appErrorSrc') errorSrc: string;

    @HostListener('error') onError(e): void {
        this.el.nativeElement.src = this.errorSrc || this.defaultSrc;
    }
}
