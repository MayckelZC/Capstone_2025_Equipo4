import { TestBed } from '@angular/core/testing';
import { AdoptionWorkflowService } from './adoption-workflow.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { NotificationService } from '@shared/services/notification.service';
import { AdoptionDocumentService } from './adoption-document.service';
import { of } from 'rxjs';
import { AdoptionRequest } from '@models/AdoptionRequest';
import { Adopcion } from '@models/Adopcion';

describe('AdoptionWorkflowService', () => {
    let service: AdoptionWorkflowService;
    let firestoreMock: any;
    let storageMock: any;
    let notificationService: jasmine.SpyObj<NotificationService>;
    let documentService: jasmine.SpyObj<AdoptionDocumentService>;

    const mockRequest: AdoptionRequest = {
        id: 'request-1',
        petId: 'pet-1',
        applicantId: 'user-1',
        ownerId: 'owner-1',
        status: 'pending',
        applicantName: 'John Doe',
        petName: 'Max',
        createdAt: new Date()
    } as AdoptionRequest;

    const mockPet: Adopcion = {
        id: 'pet-1',
        nombre: 'Max',
        tipoMascota: 'Perro',
        status: 'available',
        creadorId: 'owner-1'
    } as Adopcion;

    beforeEach(() => {
        const mockDocRef = {
            get: jasmine.createSpy('get').and.returnValue(Promise.resolve({
                exists: true,
                data: () => mockRequest,
                id: 'request-1'
            })),
            update: jasmine.createSpy('update').and.returnValue(Promise.resolve()),
            set: jasmine.createSpy('set').and.returnValue(Promise.resolve())
        };

        const mockQuerySnapshot = {
            docs: [],
            empty: true,
            forEach: jasmine.createSpy('forEach')
        };

        const mockCollectionRef = {
            doc: jasmine.createSpy('doc').and.returnValue(mockDocRef),
            add: jasmine.createSpy('add').and.returnValue(Promise.resolve({ id: 'new-doc' })),
            get: jasmine.createSpy('get').and.returnValue(of(mockQuerySnapshot)),
            valueChanges: jasmine.createSpy('valueChanges').and.returnValue(of([]))
        };

        firestoreMock = {
            collection: jasmine.createSpy('collection').and.returnValue(mockCollectionRef),
            doc: jasmine.createSpy('doc').and.returnValue(mockDocRef)
        };

        storageMock = {
            ref: jasmine.createSpy('ref').and.returnValue({
                putString: jasmine.createSpy('putString').and.returnValue({
                    snapshotChanges: () => of(null),
                    percentageChanges: () => of(100)
                }),
                getDownloadURL: jasmine.createSpy('getDownloadURL').and.returnValue(of('https://example.com/doc.pdf'))
            })
        };

        const notificationSpy = jasmine.createSpyObj('NotificationService', [
            'createNotification', 'sendAdoptionApprovalNotification'
        ]);
        notificationSpy.createNotification.and.returnValue(Promise.resolve());

        const documentSpy = jasmine.createSpyObj('AdoptionDocumentService', [
            'generateAdoptionContract', 'generateReceipt'
        ]);
        documentSpy.generateAdoptionContract.and.returnValue(Promise.resolve('contract-url'));

        TestBed.configureTestingModule({
            providers: [
                AdoptionWorkflowService,
                { provide: AngularFirestore, useValue: firestoreMock },
                { provide: AngularFireStorage, useValue: storageMock },
                { provide: NotificationService, useValue: notificationSpy },
                { provide: AdoptionDocumentService, useValue: documentSpy }
            ]
        });

        service = TestBed.inject(AdoptionWorkflowService);
        notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
        documentService = TestBed.inject(AdoptionDocumentService) as jasmine.SpyObj<AdoptionDocumentService>;
    });

    describe('Service Creation', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });
    });

    describe('approveRequest', () => {
        it('should approve an adoption request', async () => {
            await service.approveRequest(mockRequest);

            expect(firestoreMock.collection).toHaveBeenCalled();
            expect(notificationService.createNotification).toHaveBeenCalled();
        });

        it('should update request status to approved', async () => {
            await service.approveRequest(mockRequest);

            expect(firestoreMock.collection).toHaveBeenCalledWith('adoptionRequests');
        });
    });

    describe('rejectRequest', () => {
        it('should reject an adoption request', async () => {
            await service.rejectRequest(mockRequest);

            expect(firestoreMock.collection).toHaveBeenCalled();
        });

        it('should send rejection notification', async () => {
            await service.rejectRequest(mockRequest);

            expect(notificationService.createNotification).toHaveBeenCalled();
        });
    });

    describe('updateAdoptionRequestStatus', () => {
        it('should update status to pending', async () => {
            await service.updateAdoptionRequestStatus('request-1', 'pending');
            expect(firestoreMock.collection).toHaveBeenCalled();
        });

        it('should update status to approved', async () => {
            await service.updateAdoptionRequestStatus('request-1', 'approved');
            expect(firestoreMock.collection).toHaveBeenCalled();
        });

        it('should update status to rejected', async () => {
            await service.updateAdoptionRequestStatus('request-1', 'rejected');
            expect(firestoreMock.collection).toHaveBeenCalled();
        });
    });

    describe('completeAdoption', () => {
        it('should complete the adoption process', async () => {
            const completion = {
                requestId: 'request-1',
                petId: 'pet-1',
                adopterId: 'user-1',
                previousOwnerId: 'owner-1',
                completedAt: new Date()
            };

            await service.completeAdoption(completion);

            expect(firestoreMock.collection).toHaveBeenCalled();
        });
    });

    describe('rejectOtherRequestsForPet', () => {
        it('should reject other pending requests for the same pet', async () => {
            await service.rejectOtherRequestsForPet('pet-1', 'approved-request-1');
            expect(firestoreMock.collection).toHaveBeenCalled();
        });
    });

    describe('generateAdoptionAgreement', () => {
        it('should generate adoption agreement PDF', async () => {
            const result = await service.generateAdoptionAgreement(mockRequest, mockPet);

            expect(result).toBeDefined();
        });
    });

    describe('generateReceiptNumber', () => {
        it('should generate a unique receipt number', () => {
            const receipt1 = service.generateReceiptNumber();
            const receipt2 = service.generateReceiptNumber();

            expect(receipt1).toBeDefined();
            expect(receipt2).toBeDefined();
            expect(receipt1).not.toBe(receipt2);
        });

        it('should follow expected format', () => {
            const receipt = service.generateReceiptNumber();
            expect(receipt.length).toBeGreaterThan(5);
        });
    });

    describe('getUserById', () => {
        it('should get user data by ID', async () => {
            const result = await service.getUserById('user-1');
            expect(firestoreMock.collection).toHaveBeenCalledWith('users');
        });
    });
});
