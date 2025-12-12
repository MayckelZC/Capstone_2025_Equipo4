import { TestBed } from '@angular/core/testing';
import { AdoptionStatsService } from './adoption-stats.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { of } from 'rxjs';

describe('AdoptionStatsService', () => {
    let service: AdoptionStatsService;
    let firestoreMock: any;

    const mockAdoptions = [
        { id: 'adopt-1', status: 'approved', reviewedAt: new Date() },
        { id: 'adopt-2', status: 'completed', reviewedAt: new Date() },
        { id: 'adopt-3', status: 'approved', reviewedAt: new Date() },
        { id: 'adopt-4', status: 'pending' }
    ];

    beforeEach(() => {
        const mockCollectionRef = {
            valueChanges: jasmine.createSpy('valueChanges').and.returnValue(of(mockAdoptions)),
            snapshotChanges: jasmine.createSpy('snapshotChanges').and.returnValue(of([
                { payload: { doc: { data: () => mockAdoptions[0], id: 'adopt-1' } } },
                { payload: { doc: { data: () => mockAdoptions[1], id: 'adopt-2' } } }
            ])),
            get: jasmine.createSpy('get').and.returnValue(of({
                empty: false,
                size: 3,
                docs: mockAdoptions.map((a) => ({ data: () => a, id: a.id }))
            }))
        };

        firestoreMock = {
            collection: jasmine.createSpy('collection').and.returnValue(mockCollectionRef)
        };

        TestBed.configureTestingModule({
            providers: [
                AdoptionStatsService,
                { provide: AngularFirestore, useValue: firestoreMock }
            ]
        });

        service = TestBed.inject(AdoptionStatsService);
    });

    describe('Service Creation', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });
    });

    describe('getCount', () => {
        it('should return count of approved adoptions', (done) => {
            service.getCount().subscribe(count => {
                expect(count).toBeGreaterThanOrEqual(0);
                done();
            });
        });

        it('should query adoption-requests collection', () => {
            service.getCount().subscribe();
            expect(firestoreMock.collection).toHaveBeenCalled();
        });
    });

    describe('getCompletedCount', () => {
        it('should return count of completed adoptions', (done) => {
            service.getCompletedCount().subscribe(count => {
                expect(count).toBeGreaterThanOrEqual(0);
                done();
            });
        });
    });

    describe('getNewApprovedAdoptionsCountThisWeek', () => {
        it('should return count as observable', (done) => {
            service.getNewApprovedAdoptionsCountThisWeek().subscribe(count => {
                expect(typeof count).toBe('number');
                expect(count).toBeGreaterThanOrEqual(0);
                done();
            });
        });
    });

    describe('getAdoptionsByMonth', () => {
        it('should return adoption counts by month as array', (done) => {
            service.getAdoptionsByMonth().subscribe(data => {
                expect(data).toBeDefined();
                expect(Array.isArray(data)).toBeTrue();
                done();
            });
        });

        it('should return array of specified length', (done) => {
            const months = 6;
            service.getAdoptionsByMonth(months).subscribe(data => {
                expect(data.length).toBe(months);
                done();
            });
        });

        it('should return array of numbers', (done) => {
            service.getAdoptionsByMonth().subscribe(data => {
                data.forEach(count => {
                    expect(typeof count).toBe('number');
                });
                done();
            });
        });
    });

    describe('getDashboardStats', () => {
        it('should return dashboard statistics as observable', (done) => {
            service.getDashboardStats().subscribe(stats => {
                expect(stats).toBeDefined();
                expect('total' in stats).toBeTrue();
                expect('pending' in stats).toBeTrue();
                expect('approved' in stats).toBeTrue();
                expect('completed' in stats).toBeTrue();
                done();
            });
        });

        it('should have correct property types', (done) => {
            service.getDashboardStats().subscribe(stats => {
                expect(typeof stats.total).toBe('number');
                expect(typeof stats.pending).toBe('number');
                expect(typeof stats.approved).toBe('number');
                expect(typeof stats.completed).toBe('number');
                done();
            });
        });

        it('should calculate correct counts from mock data', (done) => {
            service.getDashboardStats().subscribe(stats => {
                expect(stats.total).toBe(4);
                expect(stats.pending).toBe(1);
                expect(stats.approved).toBe(2);
                expect(stats.completed).toBe(1);
                done();
            });
        });
    });
});
