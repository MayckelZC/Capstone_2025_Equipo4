import { TestBed } from '@angular/core/testing';
import { VeterinarianService } from './veterinarian.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from '@core/services/auth.service';
import { ErrorHandlerService } from './error-handler.service';
import { LoggerService } from '@core/services/logger.service';
import { of, BehaviorSubject } from 'rxjs';

describe('VeterinarianService', () => {
    let service: VeterinarianService;
    let firestoreMock: any;
    let authService: jasmine.SpyObj<AuthService>;
    let errorHandler: jasmine.SpyObj<ErrorHandlerService>;
    let logger: jasmine.SpyObj<LoggerService>;

    const mockUser = { uid: 'vet-1', email: 'vet@test.com' };
    const mockAppointments = [
        { id: 'apt-1', petName: 'Max', status: 'pending', date: new Date() },
        { id: 'apt-2', petName: 'Luna', status: 'completed', date: new Date() }
    ];

    beforeEach(() => {
        const mockDocRef = {
            update: jasmine.createSpy('update').and.returnValue(Promise.resolve()),
            valueChanges: jasmine.createSpy('valueChanges').and.returnValue(of(mockUser))
        };

        const mockCollectionRef = {
            valueChanges: jasmine.createSpy('valueChanges').and.returnValue(of(mockAppointments)),
            snapshotChanges: jasmine.createSpy('snapshotChanges').and.returnValue(of([])),
            doc: jasmine.createSpy('doc').and.returnValue(mockDocRef)
        };

        firestoreMock = {
            collection: jasmine.createSpy('collection').and.returnValue(mockCollectionRef),
            doc: jasmine.createSpy('doc').and.returnValue(mockDocRef)
        };

        const authSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser', 'getAuthState']);
        authSpy.getCurrentUser.and.returnValue(Promise.resolve(mockUser));
        authSpy.getAuthState.and.returnValue(of(mockUser));

        const errorSpy = jasmine.createSpyObj('ErrorHandlerService', ['handleError']);
        const loggerSpy = jasmine.createSpyObj('LoggerService', ['info', 'error', 'debug', 'warn']);

        TestBed.configureTestingModule({
            providers: [
                VeterinarianService,
                { provide: AngularFirestore, useValue: firestoreMock },
                { provide: AuthService, useValue: authSpy },
                { provide: ErrorHandlerService, useValue: errorSpy },
                { provide: LoggerService, useValue: loggerSpy }
            ]
        });

        service = TestBed.inject(VeterinarianService);
        authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
        errorHandler = TestBed.inject(ErrorHandlerService) as jasmine.SpyObj<ErrorHandlerService>;
        logger = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
    });

    describe('Service Creation', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });
    });

    describe('Observables', () => {
        it('should have appointments$ observable', () => {
            expect(service.appointments$).toBeDefined();
        });

        it('should have medicalRecords$ observable', () => {
            expect(service.medicalRecords$).toBeDefined();
        });

        it('should have patients$ observable', () => {
            expect(service.patients$).toBeDefined();
        });
    });

    describe('getMetrics', () => {
        it('should return metrics observable', (done) => {
            service.getMetrics().subscribe(metrics => {
                expect(metrics).toBeDefined();
                done();
            });
        });
    });

    describe('getTodayActivities', () => {
        it('should return today activities', (done) => {
            service.getTodayActivities().subscribe(activities => {
                expect(activities).toBeDefined();
                done();
            });
        });
    });

    describe('getConsultationStats', () => {
        it('should return consultation stats', (done) => {
            service.getConsultationStats().subscribe(stats => {
                expect(stats).toBeDefined();
                done();
            });
        });
    });

    describe('getWeeklyActivity', () => {
        it('should return weekly activity', (done) => {
            service.getWeeklyActivity().subscribe(activity => {
                expect(activity).toBeDefined();
                done();
            });
        });
    });

    describe('getUnreadNotifications', () => {
        it('should return unread notifications', (done) => {
            service.getUnreadNotifications().subscribe(notifications => {
                expect(notifications).toBeDefined();
                done();
            });
        });
    });

    describe('getUpcomingAppointments', () => {
        it('should return upcoming appointments', (done) => {
            service.getUpcomingAppointments().subscribe(appointments => {
                expect(appointments).toBeDefined();
                done();
            });
        });
    });

    describe('getActiveEmergencies', () => {
        it('should return active emergencies', (done) => {
            service.getActiveEmergencies().subscribe(emergencies => {
                expect(emergencies).toBeDefined();
                done();
            });
        });
    });

    describe('updateAppointmentStatus', () => {
        it('should update appointment status', async () => {
            await service.updateAppointmentStatus('apt-1', 'completed');
            expect(firestoreMock.collection).toHaveBeenCalled();
        });
    });

    describe('cancelAppointment', () => {
        it('should cancel appointment with reason', async () => {
            await service.cancelAppointment('apt-1', 'Client request');
            expect(firestoreMock.collection).toHaveBeenCalled();
        });
    });

    describe('rescheduleAppointment', () => {
        it('should reschedule appointment', async () => {
            const newDate = new Date();
            await service.rescheduleAppointment('apt-1', newDate);
            expect(firestoreMock.collection).toHaveBeenCalled();
        });

        it('should accept optional reason', async () => {
            const newDate = new Date();
            await service.rescheduleAppointment('apt-1', newDate, 'Schedule conflict');
            expect(firestoreMock.collection).toHaveBeenCalled();
        });
    });

    describe('markNotificationAsRead', () => {
        it('should mark notification as read', async () => {
            await service.markNotificationAsRead('notif-1');
            expect(firestoreMock.collection).toHaveBeenCalled();
        });
    });

    describe('toDate', () => {
        it('should convert Firestore timestamp to Date', () => {
            const timestamp = { toDate: () => new Date('2024-01-01') };
            const result = service.toDate(timestamp);
            expect(result instanceof Date).toBeTrue();
        });

        it('should handle Date objects', () => {
            const date = new Date('2024-01-01');
            const result = service.toDate(date);
            expect(result instanceof Date).toBeTrue();
        });

        it('should handle string dates', () => {
            const result = service.toDate('2024-01-01');
            expect(result instanceof Date).toBeTrue();
        });
    });

    describe('translateRecordType', () => {
        it('should translate known record types', () => {
            const result = service.translateRecordType('vaccination');
            expect(result).toBeDefined();
        });
    });

    describe('refresh', () => {
        it('should trigger data refresh', () => {
            expect(() => service.refresh()).not.toThrow();
        });
    });
});
