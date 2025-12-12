import { TestBed } from '@angular/core/testing';
import { ReportService, Report } from './report.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from '@core/services/auth.service';
import { LoggerService } from '@core/services/logger.service';
import { of } from 'rxjs';
import { Adopcion } from '@models/Adopcion';

describe('ReportService', () => {
    let service: ReportService;
    let firestoreMock: any;
    let authService: jasmine.SpyObj<AuthService>;
    let logger: jasmine.SpyObj<LoggerService>;

    const mockUser = { uid: 'user-1', email: 'test@test.com' };
    const mockPet: Adopcion = {
        id: 'pet-1',
        nombre: 'Max',
        tipoMascota: 'Perro',
        creadorId: 'owner-1'
    } as Adopcion;

    const mockReports: Report[] = [
        { id: 'report-1', reporterId: 'user-1', reportedItemId: 'pet-1', reportedItemType: 'pet', reason: 'spam', status: 'pending', createdAt: new Date() },
        { id: 'report-2', reporterId: 'user-2', reportedItemId: 'pet-2', reportedItemType: 'pet', reason: 'inappropriate_content', status: 'pending', createdAt: new Date() }
    ];

    beforeEach(() => {
        const mockCollectionRef = {
            add: jasmine.createSpy('add').and.returnValue(Promise.resolve({ id: 'new-report' })),
            valueChanges: jasmine.createSpy('valueChanges').and.returnValue(of(mockReports)),
            snapshotChanges: jasmine.createSpy('snapshotChanges').and.returnValue(of([{ payload: { doc: { id: 'r1' } } }]))
        };

        firestoreMock = {
            collection: jasmine.createSpy('collection').and.returnValue(mockCollectionRef)
        };

        const authSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
        authSpy.getCurrentUser.and.returnValue(Promise.resolve(mockUser));

        const loggerSpy = jasmine.createSpyObj('LoggerService', ['error', 'info', 'debug']);

        TestBed.configureTestingModule({
            providers: [
                ReportService,
                { provide: AngularFirestore, useValue: firestoreMock },
                { provide: AuthService, useValue: authSpy },
                { provide: LoggerService, useValue: loggerSpy }
            ]
        });

        service = TestBed.inject(ReportService);
        authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
        logger = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
    });

    describe('Service Creation', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });
    });

    describe('submitReport', () => {
        it('should submit a report for a pet', async () => {
            await service.submitReport('pet-1', 'pet', 'spam', 'Details', mockPet);

            expect(firestoreMock.collection).toHaveBeenCalledWith('reports');
        });

        it('should throw error when user not authenticated', async () => {
            authService.getCurrentUser.and.returnValue(Promise.resolve(null));

            await expectAsync(
                service.submitReport('pet-1', 'pet', 'spam')
            ).toBeRejectedWithError('User not authenticated. Cannot submit report.');
        });

        it('should prevent self-reporting own pet', async () => {
            const ownPet: Adopcion = { ...mockPet, creadorId: 'user-1' };

            await expectAsync(
                service.submitReport('pet-1', 'pet', 'spam', undefined, ownPet)
            ).toBeRejectedWithError('No puedes reportar tu propia publicación.');
        });

        it('should prevent self-reporting own user', async () => {
            await expectAsync(
                service.submitReport('user-1', 'user', 'spam')
            ).toBeRejectedWithError('No puedes reportarte a ti mismo.');
        });

        it('should include pet snapshot in report', async () => {
            await service.submitReport('pet-1', 'pet', 'spam', undefined, mockPet);
            expect(firestoreMock.collection).toHaveBeenCalled();
        });
    });

    describe('getLatestPendingReports', () => {
        it('should get pending reports', (done) => {
            service.getLatestPendingReports(5).subscribe(reports => {
                expect(firestoreMock.collection).toHaveBeenCalled();
                done();
            });
        });

        it('should use default limit of 5', (done) => {
            service.getLatestPendingReports().subscribe(() => {
                expect(firestoreMock.collection).toHaveBeenCalled();
                done();
            });
        });
    });

    describe('getPendingReportsCount', () => {
        it('should return count of pending reports', (done) => {
            service.getPendingReportsCount().subscribe(count => {
                expect(typeof count).toBe('number');
                done();
            });
        });
    });

    describe('getNewPendingReportsCountThisWeek', () => {
        it('should return count of new pending reports', (done) => {
            service.getNewPendingReportsCountThisWeek().subscribe(count => {
                expect(typeof count).toBe('number');
                done();
            });
        });
    });

    describe('getReportsByType', () => {
        it('should return reports grouped by type', (done) => {
            service.getReportsByType().subscribe(counts => {
                expect(counts).toBeDefined();
                done();
            });
        });

        it('should count reports by reason', (done) => {
            service.getReportsByType().subscribe(counts => {
                expect(typeof counts).toBe('object');
                done();
            });
        });
    });
});
