import { TestBed } from '@angular/core/testing';
import { AdoptionService } from './adoption.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { NotificationService } from '@shared/services/notification.service';
import { AdoptionDocumentService } from './adoption-document.service';
import { of } from 'rxjs';

describe('AdoptionService', () => {
    let service: AdoptionService;
    let firestore: any;
    let notificationService: any;
    let documentService: any;

    const mockRequest = {
        id: 'request-1',
        petId: 'pet-1',
        applicantId: 'user-applicant',
        creatorId: 'user-creator',
        petName: 'Max',
        status: 'pending',
        reason: 'I love dogs',
        petExperience: 'I have owned dogs before',
        homeType: 'house',
        homeSize: 100,
        hasYard: true,
        hasPets: false,
        hoursAlone: 4,
        createdAt: new Date()
    };

    const mockPet = {
        id: 'pet-1',
        nombre: 'Max',
        tipoMascota: 'Perro',
        status: 'available',
        creadorId: 'user-creator'
    };

    beforeEach(() => {
        const mockFirestore = {
            collection: jasmine.createSpy('collection').and.callFake((path: string) => ({
                doc: jasmine.createSpy('doc').and.returnValue({
                    get: jasmine.createSpy('get').and.returnValue(of({
                        exists: true,
                        data: () => path.includes('mascotas') ? mockPet : mockRequest,
                        id: path.includes('mascotas') ? 'pet-1' : 'request-1'
                    })),
                    set: jasmine.createSpy('set').and.returnValue(Promise.resolve()),
                    update: jasmine.createSpy('update').and.returnValue(Promise.resolve()),
                    delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve()),
                    snapshotChanges: jasmine.createSpy('snapshotChanges').and.returnValue(of({
                        payload: { exists: true, data: () => mockRequest, id: 'request-1' }
                    })),
                    valueChanges: jasmine.createSpy('valueChanges').and.returnValue(of(mockRequest))
                }),
                add: jasmine.createSpy('add').and.returnValue(Promise.resolve({ id: 'new-request-id' })),
                get: jasmine.createSpy('get').and.returnValue(of({
                    empty: false,
                    size: 1,
                    docs: [{ data: () => mockRequest, id: 'request-1' }]
                })),
                snapshotChanges: jasmine.createSpy('snapshotChanges').and.returnValue(of([{
                    payload: { doc: { data: () => mockRequest, id: 'request-1' } }
                }])),
                valueChanges: jasmine.createSpy('valueChanges').and.returnValue(of([mockRequest]))
            })),
            firestore: {
                batch: jasmine.createSpy('batch').and.returnValue({
                    update: jasmine.createSpy('update'),
                    set: jasmine.createSpy('set'),
                    commit: jasmine.createSpy('commit').and.returnValue(Promise.resolve())
                })
            }
        };

        const mockNotificationService = {
            createNotification: jasmine.createSpy('createNotification').and.returnValue(Promise.resolve())
        };

        const mockStorage = {
            ref: jasmine.createSpy('ref').and.returnValue({
                getDownloadURL: jasmine.createSpy('getDownloadURL').and.returnValue(of('http://example.com/doc.pdf')),
                put: jasmine.createSpy('put').and.returnValue({
                    then: (cb: Function) => cb()
                })
            }),
            upload: jasmine.createSpy('upload').and.returnValue(Promise.resolve())
        };

        const mockDocumentService = {
            generateAdoptionCommitment: jasmine.createSpy('generateAdoptionCommitment')
                .and.returnValue(Promise.resolve('commitment-id')),
            generateHandoverAgreement: jasmine.createSpy('generateHandoverAgreement')
                .and.returnValue(Promise.resolve('handover-id'))
        };

        TestBed.configureTestingModule({
            providers: [
                AdoptionService,
                { provide: AngularFirestore, useValue: mockFirestore },
                { provide: AngularFireStorage, useValue: mockStorage },
                { provide: NotificationService, useValue: mockNotificationService },
                { provide: AdoptionDocumentService, useValue: mockDocumentService }
            ]
        });

        service = TestBed.inject(AdoptionService);
        firestore = TestBed.inject(AngularFirestore);
        notificationService = TestBed.inject(NotificationService);
        documentService = TestBed.inject(AdoptionDocumentService);
    });

    // ==========================================
    // Service Creation
    // ==========================================
    describe('Service Creation', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });
    });

    // ==========================================
    // createRequest
    // ==========================================
    describe('createRequest', () => {
        it('should create a new adoption request', async () => {
            const { id, ...newRequest } = mockRequest;

            await expectAsync(service.createRequest(newRequest as any)).toBeResolved();
            expect(firestore.collection).toHaveBeenCalledWith('adoption-requests');
        });

        it('should send notification to pet creator', async () => {
            await service.createRequest(mockRequest as any);
            expect(notificationService.createNotification).toHaveBeenCalled();
        });
    });

    // ==========================================
    // hasPendingRequest
    // ==========================================
    describe('hasPendingRequest', () => {
        it('should return true if user has pending request for pet', (done) => {
            service.hasPendingRequest('user-applicant', 'pet-1').subscribe(hasPending => {
                expect(hasPending).toBeTrue();
                done();
            });
        });

        it('should return false if no pending request exists', (done) => {
            firestore.collection.and.returnValue({
                snapshotChanges: jasmine.createSpy('snapshotChanges').and.returnValue(of([]))
            });

            service.hasPendingRequest('user-new', 'pet-1').subscribe(hasPending => {
                expect(hasPending).toBeFalse();
                done();
            });
        });
    });

    // ==========================================
    // getRequestsForUser
    // ==========================================
    describe('getRequestsForUser', () => {
        it('should return requests for a specific user', (done) => {
            service.getRequestsForUser('user-applicant').subscribe(requests => {
                expect(requests).toBeDefined();
                expect(requests.length).toBeGreaterThan(0);
                done();
            });
        });
    });

    // ==========================================
    // getRequestsForPet
    // ==========================================
    describe('getRequestsForPet', () => {
        it('should return requests for a specific pet', (done) => {
            service.getRequestsForPet('pet-1').subscribe(requests => {
                expect(requests).toBeDefined();
                done();
            });
        });
    });

    // ==========================================
    // getPendingRequestsForOwner
    // ==========================================
    describe('getPendingRequestsForOwner', () => {
        it('should return count of pending requests for owner', (done) => {
            service.getPendingRequestsForOwner('user-creator').subscribe(count => {
                expect(count).toBeGreaterThanOrEqual(0);
                done();
            });
        });
    });

    // ==========================================
    // getPendingRequestsForApplicant
    // ==========================================
    describe('getPendingRequestsForApplicant', () => {
        it('should return count of pending requests for applicant', (done) => {
            service.getPendingRequestsForApplicant('user-applicant').subscribe(count => {
                expect(count).toBeGreaterThanOrEqual(0);
                done();
            });
        });
    });

    // ==========================================
    // getRequestById
    // ==========================================
    describe('getRequestById', () => {
        it('should return request by id', (done) => {
            service.getRequestById('request-1').subscribe(request => {
                expect(request).toBeDefined();
                expect(request?.id).toBe('request-1');
                done();
            });
        });

        it('should return undefined for non-existent request', (done) => {
            firestore.collection.and.returnValue({
                doc: jasmine.createSpy('doc').and.returnValue({
                    snapshotChanges: jasmine.createSpy('snapshotChanges').and.returnValue(of({
                        payload: { exists: false }
                    }))
                })
            });

            service.getRequestById('non-existent').subscribe(request => {
                expect(request).toBeUndefined();
                done();
            });
        });
    });

    // ==========================================
    // getCount
    // ==========================================
    describe('getCount', () => {
        it('should return total request count', (done) => {
            service.getCount().subscribe(count => {
                expect(count).toBeGreaterThanOrEqual(0);
                done();
            });
        });
    });

    // ==========================================
    // updateRequest
    // ==========================================
    describe('updateRequest', () => {
        it('should update request data', async () => {
            const mockDocRef = {
                update: jasmine.createSpy('update').and.returnValue(Promise.resolve())
            };

            firestore.collection.and.returnValue({
                doc: jasmine.createSpy('doc').and.returnValue(mockDocRef)
            });

            await service.updateRequest('request-1', { status: 'approved' });
            expect(mockDocRef.update).toHaveBeenCalledWith({ status: 'approved' });
        });
    });

    // ==========================================
    // approveRequest
    // ==========================================
    describe('approveRequest', () => {
        it('should update request status to approved', async () => {
            const mockDocRef = {
                update: jasmine.createSpy('update').and.returnValue(Promise.resolve()),
                get: jasmine.createSpy('get').and.returnValue(of({
                    exists: true,
                    data: () => mockPet
                }))
            };

            firestore.collection.and.callFake((path: string) => ({
                doc: jasmine.createSpy('doc').and.returnValue(mockDocRef),
                get: jasmine.createSpy('get').and.returnValue(of({
                    empty: true,
                    docs: []
                })),
                add: jasmine.createSpy('add').and.returnValue(Promise.resolve({ id: 'conv-id' }))
            }));

            await expectAsync(service.approveRequest(mockRequest as any)).toBeResolved();
        });

        it('should send notification to applicant', async () => {
            const mockDocRef = {
                update: jasmine.createSpy('update').and.returnValue(Promise.resolve()),
                get: jasmine.createSpy('get').and.returnValue(of({
                    exists: true,
                    data: () => mockPet
                }))
            };

            firestore.collection.and.callFake(() => ({
                doc: jasmine.createSpy('doc').and.returnValue(mockDocRef),
                get: jasmine.createSpy('get').and.returnValue(of({
                    empty: true,
                    docs: []
                })),
                add: jasmine.createSpy('add').and.returnValue(Promise.resolve({ id: 'conv-id' }))
            }));

            await service.approveRequest(mockRequest as any);
            expect(notificationService.createNotification).toHaveBeenCalled();
        });
    });

    // ==========================================
    // rejectRequest
    // ==========================================
    describe('rejectRequest', () => {
        it('should update request status to rejected', async () => {
            const mockDocRef = {
                update: jasmine.createSpy('update').and.returnValue(Promise.resolve()),
                get: jasmine.createSpy('get').and.returnValue(of({
                    exists: true,
                    data: () => mockPet
                }))
            };

            firestore.collection.and.returnValue({
                doc: jasmine.createSpy('doc').and.returnValue(mockDocRef),
                get: jasmine.createSpy('get').and.returnValue(of({
                    empty: true,
                    docs: []
                }))
            });

            await expectAsync(service.rejectRequest(mockRequest as any)).toBeResolved();
        });

        it('should send rejection notification to applicant', async () => {
            const mockDocRef = {
                update: jasmine.createSpy('update').and.returnValue(Promise.resolve()),
                get: jasmine.createSpy('get').and.returnValue(of({
                    exists: true,
                    data: () => mockPet
                }))
            };

            firestore.collection.and.returnValue({
                doc: jasmine.createSpy('doc').and.returnValue(mockDocRef),
                get: jasmine.createSpy('get').and.returnValue(of({
                    empty: true,
                    docs: []
                }))
            });

            await service.rejectRequest(mockRequest as any);
            expect(notificationService.createNotification).toHaveBeenCalled();
        });
    });

    // ==========================================
    // getMascotasAdoptadas
    // ==========================================
    describe('getMascotasAdoptadas', () => {
        it('should return adopted pets for user', (done) => {
            firestore.collection.and.returnValue({
                valueChanges: jasmine.createSpy('valueChanges').and.returnValue(of([mockPet]))
            });

            service.getMascotasAdoptadas('user-1').subscribe(pets => {
                expect(pets).toBeDefined();
                done();
            });
        });
    });

    // ==========================================
    // linkHandoverToRequest
    // ==========================================
    describe('linkHandoverToRequest', () => {
        it('should link handover to request', async () => {
            const mockDocRef = {
                update: jasmine.createSpy('update').and.returnValue(Promise.resolve())
            };

            firestore.collection.and.returnValue({
                doc: jasmine.createSpy('doc').and.returnValue(mockDocRef)
            });

            await expectAsync(service.linkHandoverToRequest('request-1', 'handover-1')).toBeResolved();
        });
    });
});
