import { TestBed } from '@angular/core/testing';
import { AppointmentService } from './appointment.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { NotificationService } from '@shared/services/notification.service';
import { of } from 'rxjs';
import { Appointment } from '@models/Appointment';
import { VeterinaryAppointment } from '@models/VeterinaryAppointment';

describe('AppointmentService', () => {
    let service: AppointmentService;
    let firestoreMock: any;
    let notificationService: jasmine.SpyObj<NotificationService>;

    const mockAppointments: Partial<Appointment>[] = [
        { id: 'apt-1', userId: 'user-1', date: new Date(), status: 'pendiente' },
        { id: 'apt-2', userId: 'user-1', date: new Date(), status: 'confirmada' }
    ];

    const mockVetAppointments: Partial<VeterinaryAppointment>[] = [
        { id: 'vet-apt-1', userId: 'user-1', petId: 'pet-1', status: 'pendiente' },
        { id: 'vet-apt-2', userId: 'user-1', petId: 'pet-2', status: 'confirmada' }
    ];

    beforeEach(() => {
        const mockDocRef = {
            valueChanges: jasmine.createSpy('valueChanges').and.returnValue(of(mockAppointments[0])),
            update: jasmine.createSpy('update').and.returnValue(Promise.resolve()),
            delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve())
        };

        const mockCollectionRef = {
            valueChanges: jasmine.createSpy('valueChanges').and.returnValue(of(mockAppointments)),
            add: jasmine.createSpy('add').and.returnValue(Promise.resolve({ id: 'new-apt' })),
            doc: jasmine.createSpy('doc').and.returnValue(mockDocRef)
        };

        firestoreMock = {
            collection: jasmine.createSpy('collection').and.returnValue(mockCollectionRef)
        };

        const notificationSpy = jasmine.createSpyObj('NotificationService', ['createNotification']);
        notificationSpy.createNotification.and.returnValue(Promise.resolve());

        TestBed.configureTestingModule({
            providers: [
                AppointmentService,
                { provide: AngularFirestore, useValue: firestoreMock },
                { provide: NotificationService, useValue: notificationSpy }
            ]
        });

        service = TestBed.inject(AppointmentService);
        notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    });

    describe('Service Creation', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });
    });

    describe('getAppointmentsForUser', () => {
        it('should get appointments for user', (done) => {
            service.getAppointmentsForUser('user-1').subscribe(appointments => {
                expect(appointments).toBeDefined();
                expect(firestoreMock.collection).toHaveBeenCalledWith('appointments', jasmine.any(Function));
                done();
            });
        });
    });

    describe('addAppointment', () => {
        it('should add a new appointment', async () => {
            const newAppointment = {
                userId: 'user-1',
                date: new Date(),
                status: 'pendiente' as const
            } as Omit<Appointment, 'id'>;

            const result = await service.addAppointment(newAppointment);
            expect(result).toBeDefined();
            expect(firestoreMock.collection).toHaveBeenCalledWith('appointments');
        });
    });

    describe('getAppointment', () => {
        it('should get an appointment by ID', (done) => {
            service.getAppointment('apt-1').subscribe(appointment => {
                expect(appointment).toBeDefined();
                done();
            });
        });
    });

    describe('updateAppointment', () => {
        it('should update an appointment', async () => {
            await service.updateAppointment('apt-1', { status: 'confirmada' as any });
            expect(firestoreMock.collection).toHaveBeenCalledWith('appointments');
        });
    });

    describe('deleteAppointment', () => {
        it('should delete an appointment', async () => {
            await service.deleteAppointment('apt-1');
            expect(firestoreMock.collection).toHaveBeenCalledWith('appointments');
        });
    });

    describe('createVeterinaryAppointment', () => {
        it('should create a veterinary appointment', async () => {
            const newAppointment = {
                userId: 'user-1',
                petId: 'pet-1',
                date: new Date(),
                status: 'pendiente' as const
            } as Omit<VeterinaryAppointment, 'id'>;

            const result = await service.createVeterinaryAppointment(newAppointment);
            expect(result).toBeDefined();
        });
    });

    describe('getMyVeterinaryAppointments', () => {
        it('should get user veterinary appointments', (done) => {
            service.getMyVeterinaryAppointments('user-1').subscribe(appointments => {
                expect(appointments).toBeDefined();
                done();
            });
        });
    });

    describe('getAllVeterinaryAppointments', () => {
        it('should get all veterinary appointments', (done) => {
            service.getAllVeterinaryAppointments().subscribe(appointments => {
                expect(appointments).toBeDefined();
                done();
            });
        });
    });

    describe('getUpcomingAppointmentsCount', () => {
        it('should return count of upcoming appointments', (done) => {
            service.getUpcomingAppointmentsCount('user-1').subscribe(count => {
                expect(typeof count).toBe('number');
                done();
            });
        });
    });

    describe('getTodayVeterinaryAppointments', () => {
        it('should get today appointments', (done) => {
            service.getTodayVeterinaryAppointments().subscribe(appointments => {
                expect(appointments).toBeDefined();
                done();
            });
        });
    });

    describe('updateVeterinaryAppointmentStatus', () => {
        it('should update appointment status', async () => {
            await service.updateVeterinaryAppointmentStatus('vet-apt-1', 'confirmada');
            expect(firestoreMock.collection).toHaveBeenCalled();
        });
    });

    describe('cancelVeterinaryAppointment', () => {
        it('should cancel an appointment', async () => {
            await service.cancelVeterinaryAppointment('vet-apt-1');
            expect(firestoreMock.collection).toHaveBeenCalledWith('veterinaryAppointments');
        });
    });

    describe('getBookedTimeSlotsForDate', () => {
        it('should get booked time slots', (done) => {
            const date = new Date();
            service.getBookedTimeSlotsForDate(date).subscribe(slots => {
                expect(slots).toBeDefined();
                expect(Array.isArray(slots)).toBeTrue();
                done();
            });
        });
    });

    describe('convertTimestampToDate', () => {
        it('should convert Firestore timestamp to Date', () => {
            const timestamp = { toDate: () => new Date('2024-01-01') };
            const result = service.convertTimestampToDate(timestamp);
            expect(result instanceof Date).toBeTrue();
        });
    });
});
