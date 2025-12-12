import {
    Directive,
    ElementRef,
    Input,
    OnInit,
    OnDestroy,
    Renderer2
} from '@angular/core';

@Directive({
    selector: '[appLazyLoadImage]'
})
export class LazyLoadImageDirective implements OnInit, OnDestroy {
    @Input() src: string = '';
    @Input() placeholder: string = 'assets/imgs/paw.png';
    @Input() errorImage: string = 'assets/imgs/pixelart-dog.png';

    private intersectionObserver?: IntersectionObserver;
    private isLoaded = false;

    constructor(
        private el: ElementRef,
        private renderer: Renderer2
    ) { }

    ngOnInit() {
        // Establecer placeholder inicial
        this.setImage(this.placeholder);

        // Agregar clase para transición suave
        this.renderer.addClass(this.el.nativeElement, 'lazy-image');
        this.renderer.setStyle(this.el.nativeElement, 'opacity', '0');
        this.renderer.setStyle(this.el.nativeElement, 'transition', 'opacity 0.3s ease-in');

        // Verificar soporte de IntersectionObserver
        if ('IntersectionObserver' in window) {
            this.setupIntersectionObserver();
        } else {
            // Fallback: cargar imagen inmediatamente
            this.loadImage();
        }
    }

    ngOnDestroy() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
    }

    private setupIntersectionObserver() {
        const options: IntersectionObserverInit = {
            root: null,
            rootMargin: '50px', // Cargar imagen 50px antes de que sea visible
            threshold: 0.01
        };

        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isLoaded) {
                    this.loadImage();
                    // Dejar de observar después de cargar
                    if (this.intersectionObserver) {
                        this.intersectionObserver.unobserve(this.el.nativeElement);
                    }
                }
            });
        }, options);

        this.intersectionObserver.observe(this.el.nativeElement);
    }

    private loadImage() {
        if (this.isLoaded || !this.src) {
            return;
        }

        const img = new Image();

        img.onload = () => {
            this.setImage(this.src);
            this.isLoaded = true;
            // Fade in
            this.renderer.setStyle(this.el.nativeElement, 'opacity', '1');
            this.renderer.addClass(this.el.nativeElement, 'lazy-loaded');
        };

        img.onerror = () => {
            this.setImage(this.errorImage);
            this.isLoaded = true;
            this.renderer.setStyle(this.el.nativeElement, 'opacity', '1');
            this.renderer.addClass(this.el.nativeElement, 'lazy-error');
        };

        img.src = this.src;
    }

    private setImage(src: string) {
        this.renderer.setAttribute(this.el.nativeElement, 'src', src);
    }
}
