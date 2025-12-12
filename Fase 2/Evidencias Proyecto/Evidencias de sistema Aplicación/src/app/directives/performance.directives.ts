import { 
  Directive, 
  ElementRef, 
  Input, 
  OnInit, 
  OnDestroy, 
  Renderer2,
  Output,
  EventEmitter
} from '@angular/core';

interface LazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  fallbackSrc?: string;
  loadingClass?: string;
  errorClass?: string;
  loadedClass?: string;
}

@Directive({
  selector: '[appLazyLoad]'
})
export class LazyLoadDirective implements OnInit, OnDestroy {
  @Input('appLazyLoad') src: string = '';
  @Input() lazyLoadOptions: LazyLoadOptions = {};
  
  @Output() imageLoaded = new EventEmitter<void>();
  @Output() imageError = new EventEmitter<Error>();
  @Output() imageLoading = new EventEmitter<void>();

  private observer?: IntersectionObserver;
  private isLoaded = false;
  private isLoading = false;

  private defaultOptions: LazyLoadOptions = {
    threshold: 0.1,
    rootMargin: '50px',
    loadingClass: 'lazy-loading',
    errorClass: 'lazy-error',
    loadedClass: 'lazy-loaded'
  };

  constructor(
    private el: ElementRef<HTMLImageElement>,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.setupLazyLoading();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupLazyLoading(): void {
    const options = { ...this.defaultOptions, ...this.lazyLoadOptions };
    
    // Agregar clase de loading inicial
    if (options.loadingClass) {
      this.renderer.addClass(this.el.nativeElement, options.loadingClass);
    }

    // Configurar placeholder inicial
    if (options.fallbackSrc) {
      this.renderer.setAttribute(this.el.nativeElement, 'src', options.fallbackSrc);
    }

    // Crear Intersection Observer
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        threshold: options.threshold,
        rootMargin: options.rootMargin
      }
    );

    this.observer.observe(this.el.nativeElement);
  }

  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach(entry => {
      if (entry.isIntersecting && !this.isLoaded && !this.isLoading) {
        this.loadImage();
        if (this.observer) {
          this.observer.unobserve(this.el.nativeElement);
        }
      }
    });
  }

  private loadImage(): void {
    if (!this.src || this.isLoaded || this.isLoading) return;

    this.isLoading = true;
    this.imageLoading.emit();

    const options = { ...this.defaultOptions, ...this.lazyLoadOptions };
    const img = new Image();

    img.onload = () => {
      this.isLoaded = true;
      this.isLoading = false;
      
      // Actualizar src del elemento
      this.renderer.setAttribute(this.el.nativeElement, 'src', this.src);
      
      // Actualizar clases
      if (options.loadingClass) {
        this.renderer.removeClass(this.el.nativeElement, options.loadingClass);
      }
      if (options.loadedClass) {
        this.renderer.addClass(this.el.nativeElement, options.loadedClass);
      }
      
      this.imageLoaded.emit();
    };

    img.onerror = (error) => {
      this.isLoading = false;
      
      // Mantener fallback o mostrar error
      if (options.loadingClass) {
        this.renderer.removeClass(this.el.nativeElement, options.loadingClass);
      }
      if (options.errorClass) {
        this.renderer.addClass(this.el.nativeElement, options.errorClass);
      }
      
      this.imageError.emit(new Error('Failed to load image'));
    };

    // Comenzar carga
    img.src = this.src;
  }
}

// Directiva para lazy loading de contenido
@Directive({
  selector: '[appLazyContent]'
})
export class LazyContentDirective implements OnInit, OnDestroy {
  @Input() lazyContentDistance: string = '100px';
  @Input() lazyContentThreshold: number = 0.1;
  
  @Output() contentVisible = new EventEmitter<void>();
  @Output() contentHidden = new EventEmitter<void>();

  private observer?: IntersectionObserver;
  private isVisible = false;

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.setupContentObserver();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupContentObserver(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.isVisible) {
            this.isVisible = true;
            this.contentVisible.emit();
          } else if (!entry.isIntersecting && this.isVisible) {
            this.isVisible = false;
            this.contentHidden.emit();
          }
        });
      },
      {
        threshold: this.lazyContentThreshold,
        rootMargin: this.lazyContentDistance
      }
    );

    this.observer.observe(this.el.nativeElement);
  }
}

// Directiva para optimización de imágenes automática
@Directive({
  selector: '[appOptimizedImage]'
})
export class OptimizedImageDirective implements OnInit {
  @Input('appOptimizedImage') baseSrc: string = '';
  @Input() sizes: string = '';
  @Input() optimizationQuality: number = 0.8;
  @Input() enableWebP: boolean = true;

  constructor(
    private el: ElementRef<HTMLImageElement>,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.setupOptimizedImage();
  }

  private setupOptimizedImage(): void {
    if (!this.baseSrc) return;

    // Detectar soporte WebP
    const supportsWebP = this.checkWebPSupport();
    
    // Generar srcset para diferentes resoluciones
    const srcSet = this.generateSrcSet(supportsWebP);
    
    if (srcSet) {
      this.renderer.setAttribute(this.el.nativeElement, 'srcset', srcSet);
    }

    // Configurar sizes si se proporcionó
    if (this.sizes) {
      this.renderer.setAttribute(this.el.nativeElement, 'sizes', this.sizes);
    }

    // Fallback para navegadores sin soporte
    this.renderer.setAttribute(this.el.nativeElement, 'src', this.baseSrc);
  }

  private generateSrcSet(useWebP: boolean): string {
    const breakpoints = [320, 640, 768, 1024, 1440];
    const extension = useWebP ? 'webp' : 'jpg';
    
    return breakpoints
      .map(width => {
        const optimizedUrl = this.getOptimizedUrl(this.baseSrc, width, extension);
        return `${optimizedUrl} ${width}w`;
      })
      .join(', ');
  }

  private getOptimizedUrl(baseUrl: string, width: number, format: string): string {
    // En implementación real, esto se conectaría con un servicio de optimización de imágenes
    const parts = baseUrl.split('.');
    if (parts.length < 2) return baseUrl;
    
    const name = parts.slice(0, -1).join('.');
    return `${name}_${width}.${format}`;
  }

  private checkWebPSupport(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
}

// Directiva para throttle de eventos
@Directive({
  selector: '[appThrottle]'
})
export class ThrottleDirective implements OnInit, OnDestroy {
  @Input() throttleTime: number = 300;
  @Input() throttleEvent: string = 'input';
  
  @Output() throttledEvent = new EventEmitter<Event>();

  private throttleTimer?: NodeJS.Timeout;
  private lastEmitted = 0;

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.el.nativeElement.addEventListener(
      this.throttleEvent,
      this.handleEvent.bind(this)
    );
  }

  ngOnDestroy(): void {
    if (this.throttleTimer) {
      clearTimeout(this.throttleTimer);
    }
  }

  private handleEvent(event: Event): void {
    const now = Date.now();
    
    if (now - this.lastEmitted >= this.throttleTime) {
      this.lastEmitted = now;
      this.throttledEvent.emit(event);
    } else {
      if (this.throttleTimer) {
        clearTimeout(this.throttleTimer);
      }
      
      this.throttleTimer = setTimeout(() => {
        this.lastEmitted = Date.now();
        this.throttledEvent.emit(event);
      }, this.throttleTime - (now - this.lastEmitted));
    }
  }
}

// Directiva para debounce de eventos
@Directive({
  selector: '[appDebounce]'
})
export class DebounceDirective implements OnInit, OnDestroy {
  @Input() debounceTime: number = 300;
  @Input() debounceEvent: string = 'input';
  
  @Output() debouncedEvent = new EventEmitter<Event>();

  private debounceTimer?: NodeJS.Timeout;

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.el.nativeElement.addEventListener(
      this.debounceEvent,
      this.handleEvent.bind(this)
    );
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  private handleEvent(event: Event): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      this.debouncedEvent.emit(event);
    }, this.debounceTime);
  }
}

// Directiva para preload de enlaces
@Directive({
  selector: '[appPreload]'
})
export class PreloadDirective implements OnInit {
  @Input() preloadDelay: number = 0;
  @Input() preloadOnHover: boolean = true;

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    if (this.preloadOnHover) {
      this.setupHoverPreload();
    } else if (this.preloadDelay > 0) {
      setTimeout(() => this.preloadLink(), this.preloadDelay);
    } else {
      this.preloadLink();
    }
  }

  private setupHoverPreload(): void {
    let hoverTimer: NodeJS.Timeout;
    
    this.el.nativeElement.addEventListener('mouseenter', () => {
      hoverTimer = setTimeout(() => this.preloadLink(), 100);
    });
    
    this.el.nativeElement.addEventListener('mouseleave', () => {
      if (hoverTimer) clearTimeout(hoverTimer);
    });
  }

  private preloadLink(): void {
    const href = this.el.nativeElement.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:')) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  }
}