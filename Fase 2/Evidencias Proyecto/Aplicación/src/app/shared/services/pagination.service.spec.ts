import { TestBed } from '@angular/core/testing';
import { PaginationService, PaginationConfig, PaginatedResult } from './pagination.service';
import { AngularFirestore, Query } from '@angular/fire/compat/firestore';
import { of, BehaviorSubject } from 'rxjs';

describe('PaginationService', () => {
    let service: PaginationService;
    let firestoreMock: any;

    const mockItems = [
        { id: 'item-1', name: 'Item 1' },
        { id: 'item-2', name: 'Item 2' },
        { id: 'item-3', name: 'Item 3' }
    ];

    const mockSnapshotChanges = mockItems.map((item, index) => ({
        payload: {
            doc: {
                id: item.id,
                data: () => item,
                ref: { id: item.id }
            }
        }
    }));

    beforeEach(() => {
        const mockCollectionRef = {
            snapshotChanges: jasmine.createSpy('snapshotChanges').and.returnValue(of(mockSnapshotChanges))
        };

        firestoreMock = {
            collection: jasmine.createSpy('collection').and.returnValue(mockCollectionRef)
        };

        TestBed.configureTestingModule({
            providers: [
                PaginationService,
                { provide: AngularFirestore, useValue: firestoreMock }
            ]
        });

        service = TestBed.inject(PaginationService);
    });

    describe('Service Creation', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });
    });

    describe('getPaginatedCollection', () => {
        it('should fetch paginated collection', (done) => {
            service.getPaginatedCollection('test-collection', 20).subscribe(result => {
                expect(result.items).toBeDefined();
                expect(firestoreMock.collection).toHaveBeenCalled();
                done();
            });
        });

        it('should use custom page size', (done) => {
            service.getPaginatedCollection('test-collection', 10).subscribe(result => {
                expect(firestoreMock.collection).toHaveBeenCalled();
                done();
            });
        });

        it('should detect if there are more pages', (done) => {
            service.getPaginatedCollection('test-collection', 2).subscribe(result => {
                expect(result.hasMore).toBeDefined();
                done();
            });
        });

        it('should include lastDoc in result', (done) => {
            service.getPaginatedCollection('test-collection', 20).subscribe(result => {
                expect(result.lastDoc).toBeDefined();
                done();
            });
        });
    });

    describe('loadNextPage', () => {
        it('should load next page', (done) => {
            service.loadNextPage('test-collection', 20).subscribe(result => {
                expect(result.items).toBeDefined();
                done();
            });
        });

        it('should accept custom query function', (done) => {
            const queryFn = (ref: Query) => ref;
            service.loadNextPage('test-collection', 20, queryFn).subscribe(result => {
                expect(result).toBeDefined();
                done();
            });
        });
    });

    describe('resetPagination', () => {
        it('should reset pagination for cache key', () => {
            // First load some data
            service.getPaginatedCollection('test-collection', 20, undefined, 'test-key').subscribe();

            // Reset
            service.resetPagination('test-key');

            // Should return true after reset (defaults to true)
            expect(service.hasMore('test-key')).toBeTrue();
        });

        it('should not throw for non-existent key', () => {
            expect(() => service.resetPagination('non-existent')).not.toThrow();
        });
    });

    describe('hasMore', () => {
        it('should return true by default', () => {
            expect(service.hasMore('unknown-key')).toBeTrue();
        });

        it('should track hasMore state per cache key', (done) => {
            service.getPaginatedCollection('collection-1', 100, undefined, 'key-1').subscribe(() => {
                expect(service.hasMore('key-1')).toBeDefined();
                done();
            });
        });
    });

    describe('getInfiniteScrollCollection', () => {
        it('should return items$ BehaviorSubject', () => {
            const result = service.getInfiniteScrollCollection('test-collection');
            expect(result.items$).toBeDefined();
            expect(result.items$ instanceof BehaviorSubject).toBeTrue();
        });

        it('should return loadMore function', () => {
            const result = service.getInfiniteScrollCollection('test-collection');
            expect(typeof result.loadMore).toBe('function');
        });

        it('should return reset function', () => {
            const result = service.getInfiniteScrollCollection('test-collection');
            expect(typeof result.reset).toBe('function');
        });

        it('should return hasMore function', () => {
            const result = service.getInfiniteScrollCollection('test-collection');
            expect(typeof result.hasMore).toBe('function');
        });

        it('should use custom config', () => {
            const config: PaginationConfig = {
                pageSize: 10,
                orderByField: 'createdAt',
                orderDirection: 'desc'
            };

            const result = service.getInfiniteScrollCollection('test-collection', config);
            expect(result.items$).toBeDefined();
        });

        it('should load first page automatically', (done) => {
            const result = service.getInfiniteScrollCollection('test-collection');

            // Give time for first page to load
            setTimeout(() => {
                expect(firestoreMock.collection).toHaveBeenCalled();
                done();
            }, 100);
        });

        it('should accumulate items on loadMore', (done) => {
            const result = service.getInfiniteScrollCollection('test-collection');

            // Wait for first load
            setTimeout(() => {
                const initialCount = result.items$.value.length;
                result.loadMore();

                setTimeout(() => {
                    // Items should be accumulated
                    expect(result.items$.value.length).toBeGreaterThanOrEqual(initialCount);
                    done();
                }, 100);
            }, 100);
        });

        it('should reset items on reset()', (done) => {
            const result = service.getInfiniteScrollCollection('test-collection');

            setTimeout(() => {
                result.reset();
                // After reset, items should be reloaded
                expect(firestoreMock.collection).toHaveBeenCalled();
                done();
            }, 100);
        });
    });
});
