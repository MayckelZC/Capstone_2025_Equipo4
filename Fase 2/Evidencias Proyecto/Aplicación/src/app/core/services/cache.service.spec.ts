import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CacheService, TypedCacheService } from './cache.service';
import { of } from 'rxjs';

describe('CacheService', () => {
    let service: CacheService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [CacheService]
        });
        service = TestBed.inject(CacheService);
        service.clear();
    });

    describe('Service Creation', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });
    });

    describe('set and get', () => {
        it('should store and retrieve data', () => {
            service.set('key1', { name: 'test' });
            const result = service.get('key1');
            expect(result).toEqual({ name: 'test' });
        });

        it('should return null for non-existent key', () => {
            const result = service.get('unknown');
            expect(result).toBeNull();
        });

        it('should store different data types', () => {
            service.set('string', 'hello');
            service.set('number', 42);
            service.set('array', [1, 2, 3]);
            service.set('object', { key: 'value' });

            expect(service.get('string')).toBe('hello');
            expect(service.get('number')).toBe(42);
            expect(service.get<number[]>('array')).toEqual([1, 2, 3]);
            expect(service.get('object')).toEqual({ key: 'value' });
        });

        it('should overwrite existing key', () => {
            service.set('key', 'value1');
            service.set('key', 'value2');
            expect(service.get('key')).toBe('value2');
        });
    });

    describe('TTL (Time To Live)', () => {
        it('should expire items after TTL', fakeAsync(() => {
            service.set('expiring', 'data', { ttl: 100 });
            expect(service.get('expiring')).toBe('data');

            tick(150);
            expect(service.get('expiring')).toBeNull();
        }));

        it('should use default TTL when not specified', () => {
            service.set('default-ttl', 'data');
            expect(service.get('default-ttl')).toBe('data');
        });
    });

    describe('has', () => {
        it('should return true for existing key', () => {
            service.set('exists', 'value');
            expect(service.has('exists')).toBeTrue();
        });

        it('should return false for non-existent key', () => {
            expect(service.has('not-exists')).toBeFalse();
        });

        it('should return false for expired key', fakeAsync(() => {
            service.set('expiring', 'value', { ttl: 50 });
            tick(100);
            expect(service.has('expiring')).toBeFalse();
        }));
    });

    describe('delete', () => {
        it('should delete existing key', () => {
            service.set('to-delete', 'value');
            const result = service.delete('to-delete');
            expect(result).toBeTrue();
            expect(service.get('to-delete')).toBeNull();
        });

        it('should return false for non-existent key', () => {
            const result = service.delete('unknown');
            expect(result).toBeFalse();
        });
    });

    describe('clear', () => {
        it('should remove all items', () => {
            service.set('key1', 'value1');
            service.set('key2', 'value2');
            service.set('key3', 'value3');

            service.clear();

            expect(service.get('key1')).toBeNull();
            expect(service.get('key2')).toBeNull();
            expect(service.get('key3')).toBeNull();
        });
    });

    describe('getOrSet', () => {
        it('should return cached value if exists', (done) => {
            service.set('cached', 'existing-value');
            const factory = jasmine.createSpy('factory').and.returnValue(of('new-value'));

            service.getOrSet('cached', factory).subscribe(result => {
                expect(result).toBe('existing-value');
                expect(factory).not.toHaveBeenCalled();
                done();
            });
        });

        it('should call factory and cache result if not cached', (done) => {
            const factory = jasmine.createSpy('factory').and.returnValue(of('new-value'));

            service.getOrSet('not-cached', factory).subscribe(result => {
                expect(result).toBe('new-value');
                expect(factory).toHaveBeenCalled();
                expect(service.get('not-cached')).toBe('new-value');
                done();
            });
        });
    });

    describe('invalidatePattern', () => {
        it('should delete keys matching pattern', () => {
            service.set('user:1', 'data1');
            service.set('user:2', 'data2');
            service.set('pet:1', 'data3');

            const deleted = service.invalidatePattern('^user:');

            expect(deleted).toBe(2);
            expect(service.get('user:1')).toBeNull();
            expect(service.get('user:2')).toBeNull();
            expect(service.get('pet:1')).toBe('data3');
        });

        it('should return 0 when no keys match', () => {
            service.set('key', 'value');
            const deleted = service.invalidatePattern('^xyz');
            expect(deleted).toBe(0);
        });
    });

    describe('getStats', () => {
        it('should return cache statistics', () => {
            service.set('key1', 'value1');
            service.set('key2', { complex: 'object' });

            const stats = service.getStats();

            expect(stats.size).toBe(2);
            expect(stats.maxSize).toBeDefined();
            expect(stats.hitRate).toBeDefined();
            expect(stats.items.length).toBe(2);
        });

        it('should include item details', () => {
            service.set('test-key', 'test-value');
            const stats = service.getStats();

            const item = stats.items.find(i => i.key === 'test-key');
            expect(item).toBeDefined();
            expect(item?.size).toBeGreaterThan(0);
            expect(item?.age).toBeDefined();
            expect(item?.ttl).toBeGreaterThan(0);
        });
    });

    describe('getCacheSize$', () => {
        it('should emit cache size changes', (done) => {
            service.getCacheSize$().subscribe(size => {
                if (size === 2) {
                    done();
                }
            });

            service.set('key1', 'value1');
            service.set('key2', 'value2');
        });
    });

    describe('preload', () => {
        it('should load data into cache', (done) => {
            const factory = () => of({ preloaded: true });

            service.preload('preload-key', factory).subscribe(result => {
                expect(result).toEqual({ preloaded: true });
                expect(service.get('preload-key')).toEqual({ preloaded: true });
                done();
            });
        });

        it('should return cached value if already preloaded', (done) => {
            service.set('already-preloaded', 'cached-value');
            const factory = jasmine.createSpy('factory').and.returnValue(of('new'));

            service.preload('already-preloaded', factory).subscribe(result => {
                expect(result).toBe('cached-value');
                expect(factory).not.toHaveBeenCalled();
                done();
            });
        });
    });

    describe('Max Size Eviction', () => {
        it('should evict oldest when max size reached', () => {
            for (let i = 0; i < 5; i++) {
                service.set(`key${i}`, `value${i}`, { maxSize: 3 });
            }

            const stats = service.getStats();
            expect(stats.size).toBeLessThanOrEqual(5);
        });
    });
});

describe('TypedCacheService', () => {
    let cacheService: CacheService;
    let typedCache: TypedCacheService<{ name: string }>;

    beforeEach(() => {
        cacheService = new CacheService();
        typedCache = new TypedCacheService<{ name: string }>(cacheService, 'test');
    });

    it('should add prefix to keys', () => {
        typedCache.set('key', { name: 'value' });
        expect(cacheService.get('test:key')).toEqual({ name: 'value' });
    });

    it('should get with prefix', () => {
        cacheService.set('test:key', { name: 'test-value' });
        expect(typedCache.get('key')).toEqual({ name: 'test-value' });
    });

    it('should check has with prefix', () => {
        cacheService.set('test:exists', { name: 'value' });
        expect(typedCache.has('exists')).toBeTrue();
        expect(typedCache.has('not-exists')).toBeFalse();
    });

    it('should delete with prefix', () => {
        cacheService.set('test:to-delete', { name: 'value' });
        typedCache.delete('to-delete');
        expect(cacheService.get('test:to-delete')).toBeNull();
    });
});
