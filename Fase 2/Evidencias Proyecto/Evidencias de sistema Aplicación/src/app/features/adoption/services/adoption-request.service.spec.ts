import { TestBed } from '@angular/core/testing';
import { AdoptionRequestService } from './adoption-request.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { NotificationService } from '@shared/services/notification.service';
import { of } from 'rxjs';
import { AdoptionRequest } from '@models/AdoptionRequest';

describe('AdoptionRequestService', () => {
    let service: AdoptionRequestService;
    let firestoreMock: any;
    let notificationServiceMock: any;

    const mockRequest: AdoptionRequest = {
        id: 'request-1',
        petId: 'pet-1',
        applicantId: 'user-applicant',
        applicantName: 'John Doe',
        creatorId: 'user-creator',
        petName: 'Max',
        status: 'pending',
        requestDate: new Date(),
        housingType: 'own',
        petLivingSpace: 'indoor_with_garden',
        previousExperience: true,
        hoursAlone: 4,
        veterinaryAccess: true,
        otherPets: false,
        longTermCommitment: 'I commit to caring for the pet for its entire life',
        verificationConsent: true
    };

    const mockPet = {
        id: 'pet-1',
        nombre: 'Max',
        tipoMascota: 'Perro',
        status: 'available',
        creadorId: 'user-creator'
    };

    beforeEach(() => {
        const mockDocRef = {
            set: jasmine.createSpy('set').and.returnValue(Promise.resolve()),
            update: jasmine.createSpy('update').and.returnValue(Promise.resolve()),
            get: jasmine.createSpy('get').and.returnValue(of({
                exists: true,
                data: () => mockRequest,
                id: 'request-1'
            })),
            snapshotChanges: jasmine.createSpy('snapshotChanges').and.returnValue(of({
                payload: { exists: true, data: () => mockRequest, id: 'request-1' }
            })),
            valueChanges: jasmine.createSpy('valueChanges').and.returnValue(of(mockRequest))
        };

        const mockCollectionRef = {
            doc: jasmine.createSpy('doc').and.returnValue(mockDocRef),
            add: jasmine.createSpy('add').and.returnValue(Promise.resolve({ id: 'new-request-id' })),
            snapshotChanges: jasmine.createSpy('snapshotChanges').and.returnValue(of([{
                payload: { doc: { data: () => mockRequest, id: 'request-1' } }
            }])),
            valueChanges: jasmine.createSpy('valueChanges').and.returnValue(of([mockRequest])),
            get: jasmine.createSpy('get').and.returnValue(of({
                empty: false,
                size: 1,
                docs: [{ data: () => mockRequest, id: 'request-1' }]
            }))
        };

        firestoreMock = {
            collection: jasmine.createSpy('collection').and.returnValue(mockCollectionRef),
            createId: jasmine.createSpy('createId').and.returnValue('generated-id')
        };

        notificationServiceMock = {
            createEnhanced: jasmine.createSpy('createEnhanced').and.returnValue(Promise.resolve('notif-id')),
            sendAdoptionRequestNotification: jasmine.createSpy('sendAdoptionRequestNotification').and.returnValue(Promise.resolve())
        };

        TestBed.configureTestingModule({
            providers: [
                AdoptionRequestService,
                { provide: AngularFirestore, useValue: firestoreMock },
                { provide: NotificationService, useValue: notificationServiceMock }
            ]
        });

        service = TestBed.inject(AdoptionRequestService);
    });

    describe('Service Creation', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });
    });

    describe('createRequest', () => {
        it('should create a new adoption request', async () => {
            await expectAsync(service.createRequest(mockRequest)).toBeResolved();
            expect(firestoreMock.collection).toHaveBeenCalledWith('adoption-requests');
        });

        it('should set request status to pending', async () => {
            const mockDocRef = {
                set: jasmine.createSpy('set').and.callFake((data: any) => {
                    expect(data.status).toBe('pending');
                    return Promise.resolve();
                })
            };

            firestoreMock.collection.and.returnValue({
                doc: () => mockDocRef
            });

            await service.createRequest(mockRequest);
        });
    });

    describe('hasPendingRequest', () => {
        it('should return true if user has pending request', (done) => {
            service.hasPendingRequest('user-applicant', 'pet-1').subscribe(hasPending => {
                expect(hasPending).toBeTrue();
                done();
            });
        });

        it('should return false if no pending request exists', (done) => {
            firestoreMock.collection.and.returnValue({
                snapshotChanges: jasmine.createSpy('snapshotChanges').and.returnValue(of([]))
            });

            service.hasPendingRequest('user-new', 'pet-1').subscribe(hasPending => {
                expect(hasPending).toBeFalse();
                done();
            });
        });
    });

    describe('getRequestsForUser', () => {
        it('should return requests for a specific user', (done) => {
            service.getRequestsForUser('user-applicant').subscribe(requests => {
                expect(requests).toBeDefined();
                expect(requests.length).toBeGreaterThan(0);
                done();
            });
        });

        it('should query by applicantId', () => {
            service.getRequestsForUser('user-applicant').subscribe();
            expect(firestoreMock.collection).toHaveBeenCalled();
        });
    });

    describe('getRequestsForPet', () => {
        it('should return requests for a specific pet', (done) => {
            service.getRequestsForPet('pet-1').subscribe(requests => {
                expect(requests).toBeDefined();
                done();
            });
        });
    });

    describe('getPendingRequestsForOwner', () => {
        it('should return count of pending requests for owner', (done) => {
            service.getPendingRequestsForOwner('user-creator').subscribe(count => {
                expect(count).toBeGreaterThanOrEqual(0);
                done();
            });
        });
    });

    describe('getPendingRequestsForApplicant', () => {
        it('should return count of pending requests for applicant', (done) => {
            service.getPendingRequestsForApplicant('user-applicant').subscribe(count => {
                expect(count).toBeGreaterThanOrEqual(0);
                done();
            });
        });
    });

    describe('getRequestById', () => {
        it('should return request by id', (done) => {
            service.getRequestById('request-1').subscribe(request => {
                expect(request).toBeDefined();
                expect(request?.id).toBe('request-1');
                done();
            });
        });

        it('should return undefined for non-existent request', (done) => {
            firestoreMock.collection.and.returnValue({
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

    describe('getPendingRequests', () => {
        it('should return all pending requests', (done) => {
            service.getPendingRequests().subscribe(requests => {
                expect(requests).toBeDefined();
                done();
            });
        });
    });

    describe('getLatestPendingRequests', () => {
        it('should return limited pending requests', (done) => {
            service.getLatestPendingRequests(5).subscribe(requests => {
                expect(requests).toBeDefined();
                done();
            });
        });

        it('should use default limit of 5', (done) => {
            service.getLatestPendingRequests().subscribe(requests => {
                expect(requests).toBeDefined();
                done();
            });
        });
    });

    describe('updateRequest', () => {
        it('should update request data', async () => {
            const mockDocRef = {
                update: jasmine.createSpy('update').and.returnValue(Promise.resolve())
            };

            firestoreMock.collection.and.returnValue({
                doc: jasmine.createSpy('doc').and.returnValue(mockDocRef)
            });

            await service.updateRequest('request-1', { status: 'approved' });
            expect(mockDocRef.update).toHaveBeenCalledWith({ status: 'approved' });
        });
    });

    describe('linkHandoverToRequest', () => {
        it('should link handover id to request', async () => {
            const mockDocRef = {
                update: jasmine.createSpy('update').and.returnValue(Promise.resolve())
            };

            firestoreMock.collection.and.returnValue({
                doc: jasmine.createSpy('doc').and.returnValue(mockDocRef)
            });

            await service.linkHandoverToRequest('request-1', 'handover-1');
            expect(mockDocRef.update).toHaveBeenCalledWith({ handoverId: 'handover-1' });
        });
    });

    describe('getAdoptionRequest', () => {
        it('should return request as Promise', async () => {
            const mockDocRef = {
                get: jasmine.createSpy('get').and.returnValue(Promise.resolve({
                    exists: true,
                    data: () => mockRequest,
                    id: 'request-1'
                }))
            };

            firestoreMock.collection.and.returnValue({
                doc: jasmine.createSpy('doc').and.returnValue(mockDocRef)
            });

            const request = await service.getAdoptionRequest('request-1');
            expect(request).toBeDefined();
            expect(request.id).toBe('request-1');
        });

        it('should throw error if request not found', async () => {
            const mockDocRef = {
                get: jasmine.createSpy('get').and.returnValue(Promise.resolve({
                    exists: false
                }))
            };

            firestoreMock.collection.and.returnValue({
                doc: jasmine.createSpy('doc').and.returnValue(mockDocRef)
            });

            await expectAsync(service.getAdoptionRequest('non-existent')).toBeRejected();
        });
    });

    describe('getAdoptionRequestsForPet', () => {
        it('should return all requests for a pet', async () => {
            const requests = await service.getAdoptionRequestsForPet('pet-1');
            expect(requests).toBeDefined();
            expect(Array.isArray(requests)).toBeTrue();
        });
    });
});
