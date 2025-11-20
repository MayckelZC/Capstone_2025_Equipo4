import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  format?: 'jpeg' | 'png' | 'webp';
  progressive?: boolean;
}

interface ResponsiveImageConfig {
  sizes: Array<{
    width: number;
    suffix: string;
    quality?: number;
  }>;
  formats: string[];
  lazy?: boolean;
}

interface ImageLoadingState {
  loading: boolean;
  error: boolean;
  loaded: boolean;
  progress: number;
}

@Injectable({
  providedIn: 'root'
})
export class ImageOptimizationService {
  private imageCache = new Map<string, string>();
  private loadingStates = new Map<string, BehaviorSubject<ImageLoadingState>>();
  
  // Configuraciones por defecto
  private defaultOptions: ImageOptimizationOptions = {
    maxWidth: 1200,
    maxHeight: 800,
    quality: 0.8,
    format: 'jpeg',
    progressive: true
  };

  private responsiveBreakpoints = [
    { width: 320, suffix: 'xs' },
    { width: 640, suffix: 'sm' },
    { width: 768, suffix: 'md' },
    { width: 1024, suffix: 'lg' },
    { width: 1440, suffix: 'xl' }
  ];

  constructor() {}

  /**
   * Optimizar una imagen desde File o Blob
   */
  optimizeImage(file: File | Blob, options: ImageOptimizationOptions = {}): Observable<Blob> {
    const config = { ...this.defaultOptions, ...options };
    
    return new Observable(observer => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calcular dimensiones optimizadas
        const dimensions = this.calculateOptimalDimensions(
          img.width, 
          img.height, 
          config.maxWidth!, 
          config.maxHeight!
        );
        
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
        
        // Aplicar optimizaciones de canvas
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Dibujar imagen redimensionada
          ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
          
          // Convertir a blob optimizado
          canvas.toBlob(
            (blob) => {
              if (blob) {
                observer.next(blob);
                observer.complete();
              } else {
                observer.error(new Error('Failed to optimize image'));
              }
            },
            this.getMimeType(config.format!),
            config.quality
          );
        }
      };
      
      img.onerror = () => observer.error(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Crear versiones responsive de una imagen
   */
  createResponsiveVersions(
    file: File, 
    config: ResponsiveImageConfig
  ): Observable<Array<{ size: string; blob: Blob; url: string }>> {
    const results: Array<{ size: string; blob: Blob; url: string }> = [];
    const promises: Promise<any>[] = [];

    config.sizes.forEach(sizeConfig => {
      const options: ImageOptimizationOptions = {
        maxWidth: sizeConfig.width,
        maxHeight: sizeConfig.width, // Mantener proporción
        quality: sizeConfig.quality || 0.8
      };

      const promise = this.optimizeImage(file, options).toPromise().then(blob => {
        if (blob) {
          results.push({
            size: sizeConfig.suffix,
            blob,
            url: URL.createObjectURL(blob)
          });
        }
      });

      promises.push(promise);
    });

    return new Observable(observer => {
      Promise.all(promises).then(() => {
        observer.next(results);
        observer.complete();
      }).catch(error => observer.error(error));
    });
  }

  /**
   * Cargar imagen con lazy loading
   */
  loadImageLazy(src: string, placeholder?: string): Observable<ImageLoadingState> {
    const key = src;
    
    if (this.loadingStates.has(key)) {
      return this.loadingStates.get(key)!.asObservable();
    }

    const state$ = new BehaviorSubject<ImageLoadingState>({
      loading: false,
      error: false,
      loaded: false,
      progress: 0
    });

    this.loadingStates.set(key, state$);

    // Usar Intersection Observer para lazy loading
    this.setupLazyLoading(src, state$);

    return state$.asObservable();
  }

  /**
   * Precargar imágenes críticas
   */
  preloadImages(urls: string[]): Observable<string[]> {
    const loadPromises = urls.map(url => this.preloadSingleImage(url));
    
    return new Observable(observer => {
      Promise.allSettled(loadPromises).then(results => {
        const loaded = results
          .map((result, index) => result.status === 'fulfilled' ? urls[index] : null)
          .filter(Boolean) as string[];
        
        observer.next(loaded);
        observer.complete();
      });
    });
  }

  /**
   * Generar srcset para imágenes responsive
   */
  generateSrcSet(baseUrl: string, sizes: Array<{ width: number; suffix: string }>): string {
    return sizes
      .map(size => `${this.getResponsiveUrl(baseUrl, size.suffix)} ${size.width}w`)
      .join(', ');
  }

  /**
   * Generar sizes attribute para responsive images
   */
  generateSizesAttribute(breakpoints: Array<{ minWidth?: number; size: string }>): string {
    return breakpoints
      .map(bp => bp.minWidth ? `(min-width: ${bp.minWidth}px) ${bp.size}` : bp.size)
      .join(', ');
  }

  /**
   * Detectar soporte de formatos modernos
   */
  getSupportedFormats(): Observable<string[]> {
    return new Observable(observer => {
      const formats = ['webp', 'avif', 'jpeg', 'png'];
      const supportedFormats: string[] = [];
      let tested = 0;

      formats.forEach(format => {
        this.testFormatSupport(format).then(supported => {
          if (supported) {
            supportedFormats.push(format);
          }
          tested++;
          
          if (tested === formats.length) {
            observer.next(supportedFormats);
            observer.complete();
          }
        });
      });
    });
  }

  /**
   * Optimizar imagen para thumbnail
   */
  createThumbnail(file: File, size: number = 150): Observable<string> {
    const options: ImageOptimizationOptions = {
      maxWidth: size,
      maxHeight: size,
      quality: 0.7,
      format: 'jpeg'
    };

    return this.optimizeImage(file, options).pipe(
      map(blob => URL.createObjectURL(blob))
    );
  }

  /**
   * Comprimir imagen manteniendo calidad visual
   */
  smartCompress(file: File, targetSize: number): Observable<Blob> {
    return new Observable(observer => {
      let quality = 0.9;
      const step = 0.1;
      
      const compress = () => {
        this.optimizeImage(file, { quality }).subscribe(blob => {
          if (blob.size <= targetSize || quality <= 0.1) {
            observer.next(blob);
            observer.complete();
          } else {
            quality -= step;
            compress();
          }
        });
      };
      
      compress();
    });
  }

  /**
   * Limpiar cache de imágenes
   */
  clearCache(): void {
    // Limpiar URLs de objeto para evitar memory leaks
    this.imageCache.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    
    this.imageCache.clear();
    this.loadingStates.clear();
  }

  /**
   * Obtener estadísticas de cache
   */
  getCacheStats(): { size: number; urls: string[] } {
    return {
      size: this.imageCache.size,
      urls: Array.from(this.imageCache.keys())
    };
  }

  // Métodos privados
  private calculateOptimalDimensions(
    originalWidth: number, 
    originalHeight: number, 
    maxWidth: number, 
    maxHeight: number
  ): { width: number; height: number } {
    let width = originalWidth;
    let height = originalHeight;
    
    // Calcular ratio para mantener proporciones
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    
    if (ratio < 1) {
      width *= ratio;
      height *= ratio;
    }
    
    return { width: Math.round(width), height: Math.round(height) };
  }

  private getMimeType(format: string): string {
    const mimeTypes: { [key: string]: string } = {
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp'
    };
    
    return mimeTypes[format] || 'image/jpeg';
  }

  private setupLazyLoading(src: string, state$: BehaviorSubject<ImageLoadingState>): void {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage(src, state$);
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    });

    // En implementación real, se asociaría con el elemento DOM
    // observer.observe(element);
  }

  private loadImage(src: string, state$: BehaviorSubject<ImageLoadingState>): void {
    state$.next({ loading: true, error: false, loaded: false, progress: 0 });
    
    const img = new Image();
    
    img.onload = () => {
      this.imageCache.set(src, src);
      state$.next({ loading: false, error: false, loaded: true, progress: 100 });
    };
    
    img.onerror = () => {
      state$.next({ loading: false, error: true, loaded: false, progress: 0 });
    };
    
    img.onprogress = (event: any) => {
      if (event.lengthComputable) {
        const progress = (event.loaded / event.total) * 100;
        state$.next({ loading: true, error: false, loaded: false, progress });
      }
    };
    
    img.src = src;
  }

  private preloadSingleImage(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = reject;
      img.src = url;
    });
  }

  private getResponsiveUrl(baseUrl: string, suffix: string): string {
    const parts = baseUrl.split('.');
    if (parts.length < 2) return baseUrl;
    
    const extension = parts.pop();
    const name = parts.join('.');
    
    return `${name}_${suffix}.${extension}`;
  }

  private testFormatSupport(format: string): Promise<boolean> {
    return new Promise(resolve => {
      const testImages: { [key: string]: string } = {
        webp: 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA',
        avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
      };
      
      if (!testImages[format]) {
        resolve(false);
        return;
      }
      
      const img = new Image();
      img.onload = () => resolve(img.width === 2 && img.height === 2);
      img.onerror = () => resolve(false);
      img.src = testImages[format];
    });
  }
}