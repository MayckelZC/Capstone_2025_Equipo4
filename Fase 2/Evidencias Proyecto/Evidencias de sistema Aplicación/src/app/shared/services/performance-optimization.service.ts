import { Injectable } from '@angular/core';
import { Observable, fromEvent, merge } from 'rxjs';
import { map, startWith, debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  loadTime: number;
  renderTime: number;
  bundleSize: number;
  networkSpeed: 'slow' | 'fast' | 'unknown';
  deviceType: 'mobile' | 'tablet' | 'desktop';
  connectionType: string;
}

interface OptimizationSettings {
  enableLazyLoading: boolean;
  enableImageOptimization: boolean;
  enableCodeSplitting: boolean;
  maxConcurrentRequests: number;
  prefetchDistance: number;
  cacheStrategy: 'aggressive' | 'conservative' | 'minimal';
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceOptimizationService {
  private metrics: PerformanceMetrics = {
    fps: 60,
    memoryUsage: 0,
    loadTime: 0,
    renderTime: 0,
    bundleSize: 0,
    networkSpeed: 'unknown',
    deviceType: 'desktop',
    connectionType: 'unknown'
  };

  private settings: OptimizationSettings = {
    enableLazyLoading: true,
    enableImageOptimization: true,
    enableCodeSplitting: true,
    maxConcurrentRequests: 4,
    prefetchDistance: 200,
    cacheStrategy: 'conservative'
  };

  private intersectionObserver?: IntersectionObserver;
  private performanceObserver?: PerformanceObserver;
  private isMonitoring = false;

  constructor() {
    this.initializePerformanceMonitoring();
    this.detectDeviceCapabilities();
    this.setupNetworkDetection();
  }

  /**
   * Inicializar monitoreo de rendimiento
   */
  startPerformanceMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.setupFPSMonitoring();
    this.setupMemoryMonitoring();
    this.setupNavigationTimingMonitoring();
    this.setupUserTimingMonitoring();
  }

  /**
   * Detener monitoreo de rendimiento
   */
  stopPerformanceMonitoring(): void {
    this.isMonitoring = false;
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }

  /**
   * Obtener métricas actuales
   */
  getCurrentMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Observar cambios en métricas
   */
  getMetrics$(): Observable<PerformanceMetrics> {
    return new Observable(observer => {
      const interval = setInterval(() => {
        this.updateMetrics();
        observer.next(this.getCurrentMetrics());
      }, 1000);

      return () => clearInterval(interval);
    });
  }

  /**
   * Configurar lazy loading para elementos
   */
  setupLazyLoading(
    elements: HTMLElement[], 
    callback: (element: HTMLElement) => void,
    options: IntersectionObserverInit = {}
  ): void {
    if (!this.settings.enableLazyLoading) {
      elements.forEach(callback);
      return;
    }

    const defaultOptions: IntersectionObserverInit = {
      threshold: 0.1,
      rootMargin: `${this.settings.prefetchDistance}px`
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback(entry.target as HTMLElement);
          this.intersectionObserver?.unobserve(entry.target);
        }
      });
    }, { ...defaultOptions, ...options });

    elements.forEach(el => this.intersectionObserver?.observe(el));
  }

  /**
   * Optimizar imágenes basado en el dispositivo
   */
  getOptimalImageSettings(): {
    quality: number;
    maxWidth: number;
    format: string;
    enableWebP: boolean;
  } {
    const baseQuality = this.metrics.networkSpeed === 'slow' ? 0.6 : 0.8;
    const maxWidth = this.metrics.deviceType === 'mobile' ? 800 : 1200;
    
    return {
      quality: baseQuality,
      maxWidth,
      format: this.metrics.networkSpeed === 'slow' ? 'jpeg' : 'webp',
      enableWebP: this.supportsWebP()
    };
  }

  /**
   * Throttle para funciones pesadas
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return function(this: any, ...args: Parameters<T>) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Debounce para eventos frecuentes
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    
    return function(this: any, ...args: Parameters<T>) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * RequestAnimationFrame optimizado
   */
  scheduleWork(callback: () => void, priority: 'high' | 'normal' | 'low' = 'normal'): void {
    const delays = { high: 0, normal: 16, low: 33 };
    
    setTimeout(() => {
      requestAnimationFrame(callback);
    }, delays[priority]);
  }

  /**
   * Lazy loading de módulos
   */
  async loadModuleLazy<T>(moduleLoader: () => Promise<T>): Promise<T> {
    if (!this.settings.enableCodeSplitting) {
      return moduleLoader();
    }

    try {
      const startTime = performance.now();
      const module = await moduleLoader();
      const loadTime = performance.now() - startTime;
      
      console.log(`Módulo cargado en ${loadTime}ms`);
      return module;
    } catch (error) {
      console.error('Error cargando módulo:', error);
      throw error;
    }
  }

  /**
   * Prefetch de recursos
   */
  prefetchResource(url: string, type: 'script' | 'style' | 'image' = 'script'): void {
    if (this.metrics.networkSpeed === 'slow') return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = type;
    link.href = url;
    
    document.head.appendChild(link);
  }

  /**
   * Preload de recursos críticos
   */
  preloadResource(url: string, type: 'script' | 'style' | 'image' | 'font'): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = type;
    link.href = url;
    
    if (type === 'font') {
      link.crossOrigin = 'anonymous';
    }
    
    document.head.appendChild(link);
  }

  /**
   * Optimizar scroll performance
   */
  optimizeScrollPerformance(): Observable<number> {
    return fromEvent(window, 'scroll').pipe(
      debounceTime(10),
      map(() => window.scrollY),
      distinctUntilChanged()
    );
  }

  /**
   * Detectar cuando la app está en foreground/background
   */
  getVisibilityState$(): Observable<'visible' | 'hidden'> {
    return fromEvent(document, 'visibilitychange').pipe(
      map(() => document.visibilityState as 'visible' | 'hidden'),
      startWith(document.visibilityState as 'visible' | 'hidden')
    );
  }

  /**
   * Obtener información de conexión
   */
  getConnectionInfo(): {
    effectiveType: string;
    downlink: number;
    saveData: boolean;
  } {
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    
    if (connection) {
      return {
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        saveData: connection.saveData || false
      };
    }
    
    return {
      effectiveType: 'unknown',
      downlink: 0,
      saveData: false
    };
  }

  /**
   * Configurar optimizaciones automáticas
   */
  configureAutomaticOptimizations(): void {
    const connectionInfo = this.getConnectionInfo();
    
    // Ajustar configuraciones basadas en la conexión
    if (connectionInfo.saveData || connectionInfo.effectiveType === 'slow-2g') {
      this.settings.cacheStrategy = 'aggressive';
      this.settings.maxConcurrentRequests = 2;
      this.settings.prefetchDistance = 50;
    } else if (connectionInfo.effectiveType === '4g') {
      this.settings.cacheStrategy = 'minimal';
      this.settings.maxConcurrentRequests = 6;
      this.settings.prefetchDistance = 400;
    }

    // Ajustar basado en memoria disponible
    const memory = (performance as any).memory;
    if (memory && memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
      this.settings.cacheStrategy = 'minimal';
      this.settings.enableImageOptimization = true;
    }
  }

  /**
   * Limpiar recursos no utilizados
   */
  cleanup(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    this.stopPerformanceMonitoring();
  }

  // Métodos privados
  private initializePerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        this.processPerformanceEntries(entries);
      });
    }
  }

  private detectDeviceCapabilities(): void {
    // Detectar tipo de dispositivo
    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
      this.metrics.deviceType = /ipad|tablet/i.test(userAgent) ? 'tablet' : 'mobile';
    } else {
      this.metrics.deviceType = 'desktop';
    }

    // Detectar capacidades de hardware
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        console.log('GPU:', renderer);
      }
    }
  }

  private setupNetworkDetection(): void {
    const connectionInfo = this.getConnectionInfo();
    
    // Clasificar velocidad de red
    if (connectionInfo.effectiveType === '4g' && connectionInfo.downlink > 5) {
      this.metrics.networkSpeed = 'fast';
    } else if (connectionInfo.effectiveType === 'slow-2g' || connectionInfo.downlink < 1) {
      this.metrics.networkSpeed = 'slow';
    } else {
      this.metrics.networkSpeed = 'fast'; // Asumir rápido por defecto
    }
    
    this.metrics.connectionType = connectionInfo.effectiveType;
  }

  private setupFPSMonitoring(): void {
    let lastTime = performance.now();
    let frames = 0;
    
    const measureFPS = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        this.metrics.fps = Math.round((frames * 1000) / (currentTime - lastTime));
        frames = 0;
        lastTime = currentTime;
      }
      
      if (this.isMonitoring) {
        requestAnimationFrame(measureFPS);
      }
    };
    
    requestAnimationFrame(measureFPS);
  }

  private setupMemoryMonitoring(): void {
    const measureMemory = () => {
      const memory = (performance as any).memory;
      if (memory) {
        this.metrics.memoryUsage = Math.round(
          (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        );
      }
    };
    
    setInterval(measureMemory, 5000);
  }

  private setupNavigationTimingMonitoring(): void {
    if (this.performanceObserver) {
      this.performanceObserver.observe({ entryTypes: ['navigation'] });
    }
  }

  private setupUserTimingMonitoring(): void {
    if (this.performanceObserver) {
      this.performanceObserver.observe({ entryTypes: ['measure', 'mark'] });
    }
  }

  private processPerformanceEntries(entries: PerformanceEntry[]): void {
    entries.forEach(entry => {
      if (entry.entryType === 'navigation') {
        const navEntry = entry as PerformanceNavigationTiming;
        this.metrics.loadTime = navEntry.loadEventEnd - navEntry.fetchStart;
      } else if (entry.entryType === 'measure') {
        if (entry.name === 'render-time') {
          this.metrics.renderTime = entry.duration;
        }
      }
    });
  }

  private updateMetrics(): void {
    // Actualizar métricas dinámicas
    const memory = (performance as any).memory;
    if (memory) {
      this.metrics.memoryUsage = Math.round(
        (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      );
    }
  }

  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
}