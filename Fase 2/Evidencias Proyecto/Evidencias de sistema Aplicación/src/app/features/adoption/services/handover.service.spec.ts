import { TestBed } from '@angular/core/testing';
import { HandoverService } from './handover.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { NotificationService } from '@shared/services/notification.service';
import { of } from 'rxjs';
import { AdoptionRequest } from '@models/AdoptionRequest';

describe('HandoverService', () => {
    let service: HandoverService;
    let firestoreMock: any;
    let notificationService: jasmine.SpyObj<NotificationService>;

    const mockRequest: AdoptionRequest = {
        id: 'request-1',
        petId: 'pet-1',
        applicantId: 'user-1',
        ownerId: 'owner-1',
        status: 'approved',
        applicantName: 'John Doe',
        petName: 'Max',
        createdAt: new Date()
    } as AdoptionRequest;

    beforeEach(() => {
        const mockDocRef = {
            set: jasmine.createSpy('set').and.returnValue(Promise.resolve()),
            update: jasmine.createSpy('update').and.returnValue(Promise.resolve()),
            get: jasmine.createSpy('get').and.returnValue(Promise.resolve({ exists: true, data: () => mockRequest })),
            snapshotChanges: jasmine.createSpy('snapshotChanges').and.returnValue(of({ exists: true, data: () => ({}) }))
        };

        const mockCollectionRef = {
            doc: jasmine.createSpy('doc').and.returnValue(mockDocRef),
            add: jasmine.createSpy('add').and.returnValue(Promise.resolve({ id: 'new-handover' })),
            valueChanges: jasmine.createSpy('valueChanges').and.returnValue(of([]))
        };

        firestoreMock = {
            collection: jasmine.createSpy('collection').and.returnValue(mockCollectionRef),
            doc: jasmine.createSpy('doc').and.returnValue(mockDocRef)
        };

        const notificationSpy = jasmine.createSpyObj('NotificationService', [
            'createNotification', 'sendHandoverNotification'
        ]);
        notificationSpy.createNotification.and.returnValue(Promise.resolve());

        TestBed.configureTestingModule({
            providers: [
                HandoverService,
                { provide: AngularFirestore, useValue: firestoreMock },
                { provide: NotificationService, useValue: notificationSpy }
            ]
        });

        service = TestBed.inject(HandoverService);
        notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    });

    describe('Service Creation', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });
    });

    describe('createHandover', () => {
        it('should create a new handover', async () => {
            const proposedDate = new Date();
            const result = await service.createHandover(mockRequest, proposedDate);

            expect(firestoreMock.collection).toHaveBeenCalledWith('handovers');
            expect(result).toBeDefined();
        });
    });

    describe('getHandover', () => {
        it('should get handover by id', (done) => {
            service.getHandover('handover-1').subscribe(result => {
                expect(firestoreMock.collection).toHaveBeenCalledWith('handovers');
                done();
            });
        });
    });

    describe('confirmHandover', () => {
        it('should confirm handover with date and location', async () => {
            const confirmedDate = new Date();
            await service.confirmHandover('handover-1', confirmedDate, 'Test Location');

            expect(firestoreMock.collection).toHaveBeenCalled();
        });
    });

    describe('completeHandover', () => {
        it('should mark handover as completed', async () => {
            await service.completeHandover('handover-1');
            expect(firestoreMock.collection).toHaveBeenCalled();
        });
    });

    describe('cancelHandover', () => {
        it('should cancel a handover', async () => {
            await service.cancelHandover('handover-1');
            expect(firestoreMock.collection).toHaveBeenCalled();
        });
    });

    describe('initiateHandover', () => {
        it('should initiate handover process', async () => {
            await service.initiateHandover('request-1', 'pet-1', 'user-1', 'John Doe');

            expect(firestoreMock.collection).toHaveBeenCalled();
            expect(notificationService.createNotification).toHaveBeenCalled();
        });
    });

    describe('confirmHandoverByGiver', () => {
        it('should confirm handover by giver', async () => {
            await service.confirmHandoverByGiver('pet-1', 'giver-1');
            expect(firestoreMock.collection).toHaveBeenCalled();
        });
    });

    describe('confirmReceipt', () => {
        it('should confirm receipt by adopter', async () => {
            await service.confirmReceipt('pet-1', 'adopter-1');
            expect(firestoreMock.collection).toHaveBeenCalled();
        });
    });

    describe('confirmDeliveryAsOwner', () => {
        it('should confirm delivery as owner', async () => {
            await service.confirmDeliveryAsOwner('request-1', 'pet-1');
            expect(firestoreMock.collection).toHaveBeenCalled();
        });
    });

    describe('confirmDeliveryAsAdopter', () => {
        it('should confirm delivery as adopter', async () => {
            await service.confirmDeliveryAsAdopter('request-1', 'pet-1');
            expect(firestoreMock.collection).toHaveBeenCalled();
        });
    });

    describe('updatePetOwnership', () => {
        it('should update pet ownership data', async () => {
            const newData = { newOwnerId: 'user-2' };
            await service.updatePetOwnership('pet-1', newData);
            expect(firestoreMock.collection).toHaveBeenCalledWith('mascotas');
        });
    });

    describe('getMascotasAdoptadas', () => {
        it('should get adopted pets for user', (done) => {
            service.getMascotasAdoptadas('user-1').subscribe(pets => {
                expect(firestoreMock.collection).toHaveBeenCalledWith('mascotas', jasmine.any(Function));
                done();
            });
        });
    });

    describe('finalizeDelivery', () => {
        it('should finalize delivery when both parties confirm', async () => {
            await service.finalizeDelivery('request-1', 'pet-1', mockRequest);
            expect(firestoreMock.collection).toHaveBeenCalled();
        });
    });
});
