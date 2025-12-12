import { Injectable } from '@angular/core';
import { getPerformance, trace, PerformanceTrace } from 'firebase/performance';
import { FirebaseApp } from '@angular/fire/app';
import { LoggerService } from './logger.service';

/**
 * PerformanceMonitoringService
 * 
 * Monitore performance de:
 * - Carga inicial de páginas
 * - Llamadas HTTP (time to first byte, download time)
 * - Operaciones de Firestore
 * - Funciones customizadas
 */
@Injectable({
  providedIn: 'root'
})
export class PerformanceMonitoringService {
  private performance = getPerformance(this.firebaseApp);
  private activeTraces = new Map<string, PerformanceTrace>();

  constructor(
    private firebaseApp: FirebaseApp,
    private logger: LoggerService
  ) {
    this.initializeWebVitals();
  }

  /**
   * Inicializar medición de Web Vitals
   */
  private initializeWebVitals(): void {
    if ('PerformanceObserver' in window) {
      // Medir Largest Contentful Paint (LCP)
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.logger.info('LCP recorded', {
            feature: 'Performance',
            action: 'lcp_measured',
            metadata: { value: lastEntry.renderTime || lastEntry.loadTime }
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        this.logger.warn('LCP observer not supported');
      }

      // Medir First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            this.logger.info('FID recorded', {
              feature: 'Performance',
              action: 'fid_measured',
              metadata: { value: entry.processingDuration }
            });
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        this.logger.warn('FID observer not supported');
      }

      // Medir Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              this.logger.info('CLS recorded', {
                feature: 'Performance',
                action: 'cls_measured',
                metadata: { value: clsValue }
              });
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        this.logger.warn('CLS observer not supported');
      }
    }
  }

  /**
   * Iniciar trace de performance personalizado
   */
  startTrace(traceName: string): PerformanceTrace {
    const perfTrace = trace(this.performance, traceName);
    this.activeTraces.set(traceName, perfTrace);

    this.logger.debug(`Performance trace started: ${traceName}`, {
      feature: 'Performance',
      action: 'trace_started',
      metadata: { traceName }
    });

    return perfTrace;
  }

  /**
   * Finalizar trace
   */
  stopTrace(traceName: string): void {
    const perfTrace = this.activeTraces.get(traceName);
    if (perfTrace) {
      perfTrace.stop();
      this.activeTraces.delete(traceName);

      this.logger.debug(`Performance trace stopped: ${traceName}`, {
        feature: 'Performance',
        action: 'trace_stopped',
        metadata: { traceName }
      });
    }
  }

  /**
   * Ejecutar función dentro de un trace
   */
  async runInTrace<T>(
    traceName: string,
    fn: (trace: PerformanceTrace) => Promise<T>
  ): Promise<T> {
    const perfTrace = this.startTrace(traceName);
    try {
      const result = await fn(perfTrace);
      this.stopTrace(traceName);
      return result;
    } catch (error) {
      this.stopTrace(traceName);
      this.logger.error(`Error in trace ${traceName}`, error, {
        feature: 'Performance',
        action: 'trace_error',
        metadata: { traceName }
      });
      throw error;
    }
  }

  /**
   * Medir tiempo de operación Firestore
   */
  async measureFirestoreOperation<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const traceName = `firestore_${operationName}`;
    return this.runInTrace(traceName, async (trace) => {
      const startTime = performance.now();
      try {
        const result = await operation();
        const duration = performance.now() - startTime;

        trace.putAttribute('operation', operationName);
        trace.putMetric('duration_ms', duration);

        if (duration > 1000) {
          this.logger.warn(`Slow Firestore operation: ${operationName}`, {
            feature: 'Performance',
            action: 'slow_operation',
            metadata: { operationName, duration }
          });
        }

        return result;
      } catch (error) {
        trace.putAttribute('status', 'error');
        throw error;
      }
    });
  }

  /**
   * Medir tiempo de llamada HTTP
   */
  async measureHttpCall<T>(
    url: string,
    call: () => Promise<T>
  ): Promise<T> {
    const traceName = `http_${this.sanitizeUrl(url)}`;
    return this.runInTrace(traceName, async (trace) => {
      const startTime = performance.now();
      try {
        const result = await call();
        const duration = performance.now() - startTime;

        trace.putAttribute('url', url);
        trace.putAttribute('method', 'http_call');
        trace.putMetric('response_time_ms', duration);

        if (duration > 3000) {
          this.logger.warn(`Slow HTTP request: ${url}`, {
            feature: 'Performance',
            action: 'slow_http',
            metadata: { url, duration }
          });
        }

        return result;
      } catch (error) {
        trace.putAttribute('status', 'error');
        throw error;
      }
    });
  }

  /**
   * Medir tiempo de componente
   */
  async measureComponentLoad<T>(
    componentName: string,
    loadFn: () => Promise<T>
  ): Promise<T> {
    const traceName = `component_${componentName}`;
    return this.runInTrace(traceName, async (trace) => {
      const startTime = performance.now();
      try {
        const result = await loadFn();
        const duration = performance.now() - startTime;

        trace.putAttribute('component', componentName);
        trace.putMetric('load_time_ms', duration);

        if (duration > 2000) {
          this.logger.warn(`Slow component load: ${componentName}`, {
            feature: 'Performance',
            action: 'slow_component_load',
            metadata: { componentName, duration }
          });
        }

        return result;
      } catch (error) {
        trace.putAttribute('status', 'error');
        throw error;
      }
    });
  }

  /**
   * Medir memoria disponible
   */
  measureMemory(): void {
    if ((performance as any).memory) {
      const memInfo = (performance as any).memory;
      const usedPercent = (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100;

      this.logger.debug('Memory usage', {
        feature: 'Performance',
        action: 'memory_measured',
        metadata: {
          usedMB: Math.round(memInfo.usedJSHeapSize / 1048576),
          limitMB: Math.round(memInfo.jsHeapSizeLimit / 1048576),
          usedPercent: Math.round(usedPercent)
        }
      });

      if (usedPercent > 80) {
        this.logger.warn('High memory usage', {
          feature: 'Performance',
          action: 'high_memory',
          metadata: { usedPercent }
        });
      }
    }
  }

  /**
   * Obtener métricas de Core Web Vitals
   */
  getCoreWebVitals(): any {
    if ((window as any).web_vitals) {
      return (window as any).web_vitals;
    }
    return null;
  }

  /**
   * Sanitizar URL para nombre de trace
   */
  private sanitizeUrl(url: string): string {
    return url
      .replace(/^https?:\/\//, '')
      .replace(/\//g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .substring(0, 32);
  }

  /**
   * Obtener resumen de performance
   */
  getPerformanceSummary(): any {
    if ('performance' in window && 'getEntriesByType' in window.performance) {
      const navigationTiming = (window.performance as any).getEntriesByType('navigation')[0];

      return {
        dns: navigationTiming.domainLookupEnd - navigationTiming.domainLookupStart,
        tcp: navigationTiming.connectEnd - navigationTiming.connectStart,
        ttfb: navigationTiming.responseStart - navigationTiming.requestStart,
        download: navigationTiming.responseEnd - navigationTiming.responseStart,
        domInteractive: navigationTiming.domInteractive - navigationTiming.responseEnd,
        domComplete: navigationTiming.domComplete - navigationTiming.domInteractive,
        loadComplete: navigationTiming.loadEventEnd - navigationTiming.loadEventStart,
        totalTime: navigationTiming.loadEventEnd - navigationTiming.fetchStart
      };
    }
    return null;
  }
}
