import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items in cache
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private cacheSize$ = new BehaviorSubject<number>(0);
  private readonly defaultTtl = 5 * 60 * 1000; // 5 minutos
  private readonly defaultMaxSize = 100;

  constructor() {
    // Limpiar cache expirado cada minuto
    setInterval(() => {
      this.cleanExpired();
    }, 60000);
  }

  /**
   * Obtener item del cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Verificar si ha expirado
    if (Date.now() > item.expiresAt) {
      this.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Guardar item en cache
   */
  set<T>(key: string, data: T, config: CacheConfig = {}): void {
    const ttl = config.ttl || this.defaultTtl;
    const maxSize = config.maxSize || this.defaultMaxSize;
    
    // Si el cache está lleno, eliminar el item más antiguo
    if (this.cache.size >= maxSize) {
      this.evictOldest();
    }

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    };

    this.cache.set(key, item);
    this.updateCacheSize();
  }

  /**
   * Eliminar item del cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.updateCacheSize();
    }
    return deleted;
  }

  /**
   * Verificar si existe un item en cache
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    // Verificar si ha expirado
    if (Date.now() > item.expiresAt) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Limpiar todo el cache
   */
  clear(): void {
    this.cache.clear();
    this.updateCacheSize();
  }

  /**
   * Obtener o crear item en cache con factory function
   */
  getOrSet<T>(key: string, factory: () => Observable<T>, config: CacheConfig = {}): Observable<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return of(cached);
    }

    return factory().pipe(
      tap(data => this.set(key, data, config))
    );
  }

  /**
   * Invalidar cache por patrón
   */
  invalidatePattern(pattern: string): number {
    let deletedCount = 0;
    const regex = new RegExp(pattern);
    
    for (const [key] of this.cache) {
      if (regex.test(key)) {
        this.delete(key);
        deletedCount++;
      }
    }
    
    return deletedCount;
  }

  /**
   * Obtener estadísticas del cache
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    items: Array<{ key: string; size: number; age: number; ttl: number }>;
  } {
    const items = Array.from(this.cache.entries()).map(([key, item]) => ({
      key,
      size: this.getItemSize(item.data),
      age: Date.now() - item.timestamp,
      ttl: item.expiresAt - Date.now()
    }));

    return {
      size: this.cache.size,
      maxSize: this.defaultMaxSize,
      hitRate: this.calculateHitRate(),
      items
    };
  }

  /**
   * Observable del tamaño del cache
   */
  getCacheSize$(): Observable<number> {
    return this.cacheSize$.asObservable();
  }

  /**
   * Precarga de datos específicos
   */
  preload<T>(key: string, factory: () => Observable<T>, config: CacheConfig = {}): Observable<T> {
    if (this.has(key)) {
      return of(this.get<T>(key)!);
    }

    return factory().pipe(
      tap(data => this.set(key, data, config))
    );
  }

  /**
   * Cache con refresh automático
   */
  getWithAutoRefresh<T>(
    key: string, 
    factory: () => Observable<T>, 
    config: CacheConfig & { refreshInterval?: number } = {}
  ): Observable<T> {
    const refreshInterval = config.refreshInterval || 30000; // 30 segundos
    
    // Configurar auto-refresh
    const refreshTimer = setInterval(() => {
      if (this.has(key)) {
        factory().subscribe(data => {
          this.set(key, data, config);
        });
      } else {
        clearInterval(refreshTimer);
      }
    }, refreshInterval);

    return this.getOrSet(key, factory, config);
  }

  // Métodos privados
  private cleanExpired(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, item] of this.cache) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.updateCacheSize();
      console.log(`Cache: Cleaned ${cleanedCount} expired items`);
    }
  }

  private evictOldest(): void {
    let oldestKey = '';
    let oldestTimestamp = Date.now();
    
    for (const [key, item] of this.cache) {
      if (item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  private updateCacheSize(): void {
    this.cacheSize$.next(this.cache.size);
  }

  private getItemSize(data: any): number {
    // Estimación simple del tamaño en bytes
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  private calculateHitRate(): number {
    // Implementación simplificada - en producción sería más sofisticada
    return this.cache.size > 0 ? 0.75 : 0;
  }
}

// Decorador para cache automático en métodos
export function Cacheable(config: CacheConfig & { keyGenerator?: (...args: any[]) => string } = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const cacheService = new CacheService(); // En implementación real, usar inyección
    
    descriptor.value = function (...args: any[]) {
      const keyGenerator = config.keyGenerator || ((...args) => `${propertyKey}_${JSON.stringify(args)}`);
      const cacheKey = keyGenerator.apply(this, args);
      
      return cacheService.getOrSet(
        cacheKey,
        () => originalMethod.apply(this, args),
        config
      );
    };
    
    return descriptor;
  };
}

// Tipos para cache tipado
export interface TypedCache<T> {
  get(key: string): T | null;
  set(key: string, data: T, config?: CacheConfig): void;
  has(key: string): boolean;
  delete(key: string): boolean;
}

export class TypedCacheService<T> implements TypedCache<T> {
  constructor(private cacheService: CacheService, private prefix: string = '') {}

  get(key: string): T | null {
    return this.cacheService.get<T>(this.getKey(key));
  }

  set(key: string, data: T, config?: CacheConfig): void {
    this.cacheService.set(this.getKey(key), data, config);
  }

  has(key: string): boolean {
    return this.cacheService.has(this.getKey(key));
  }

  delete(key: string): boolean {
    return this.cacheService.delete(this.getKey(key));
  }

  getOrSet(key: string, factory: () => Observable<T>, config?: CacheConfig): Observable<T> {
    return this.cacheService.getOrSet(this.getKey(key), factory, config);
  }

  private getKey(key: string): string {
    return this.prefix ? `${this.prefix}:${key}` : key;
  }
}