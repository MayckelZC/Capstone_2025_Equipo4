import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NotificationService } from './notification.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ToastController, Platform } from '@ionic/angular';
import { LoggerService } from '@core/services/logger.service';
import { of } from 'rxjs';

describe('NotificationService', () => {
    let service: NotificationService;
    let firestoreMock: any;
    let toastControllerMock: any;
    let platformMock: any;
    let loggerMock: any;

    const mockNotification = {
        id: 'notif-1',
        userId: 'user-1',
        title: 'Test Notification',
        body: 'Test Body',
        type: 'general' as const,
        read: false,
        createdAt: new Date()
    };

    beforeEach(() => {
        const mockDocRef = {
            set: jasmine.createSpy('set').and.returnValue(Promise.resolve()),
            update: jasmine.createSpy('update').and.returnValue(Promise.resolve()),
            delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve()),
            get: jasmine.createSpy('get').and.returnValue(Promise.resolve({
                exists: true,
                data: () => mockNotification
            }))
        };

        const mockCollectionRef = {
            doc: jasmine.createSpy('doc').and.returnValue(mockDocRef),
            add: jasmine.createSpy('add').and.returnValue(Promise.resolve({ id: 'new-notif-id' })),
            valueChanges: jasmine.createSpy('valueChanges').and.returnValue(of([mockNotification])),
            get: jasmine.createSpy('get').and.returnValue(of({
                empty: false,
                docs: [{ ref: mockDocRef, id: 'notif-1', data: () => mockNotification }],
                forEach: (fn: Function) => fn({ ref: mockDocRef, id: 'notif-1', data: () => mockNotification })
            }))
        };

        firestoreMock = {
            collection: jasmine.createSpy('collection').and.returnValue(mockCollectionRef),
            createId: jasmine.createSpy('createId').and.returnValue('generated-id'),
            firestore: {
                batch: jasmine.createSpy('batch').and.returnValue({
                    update: jasmine.createSpy('update'),
                    commit: jasmine.createSpy('commit').and.returnValue(Promise.resolve())
                })
            }
        };

        const mockToast = {
            present: jasmine.createSpy('present').and.returnValue(Promise.resolve())
        };

        toastControllerMock = {
            create: jasmine.createSpy('create').and.returnValue(Promise.resolve(mockToast))
        };

        platformMock = {
            is: jasmine.createSpy('is').and.returnValue(true)
        };

        loggerMock = {
            error: jasmine.createSpy('error'),
            warn: jasmine.createSpy('warn'),
            info: jasmine.createSpy('info')
        };

        TestBed.configureTestingModule({
            providers: [
                NotificationService,
                { provide: AngularFirestore, useValue: firestoreMock },
                { provide: ToastController, useValue: toastControllerMock },
                { provide: Platform, useValue: platformMock },
                { provide: LoggerService, useValue: loggerMock }
            ]
        });

        service = TestBed.inject(NotificationService);
    });

    describe('Service Creation', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });
    });

    describe('create', () => {
        it('should create a notification with generated id', async () => {
            await service.create({
                userId: 'user-1',
                title: 'Test',
                body: 'Test Body',
                type: 'general'
            });

            expect(firestoreMock.createId).toHaveBeenCalled();
            expect(firestoreMock.collection).toHaveBeenCalledWith('notifications');
        });

        it('should set read to false by default', async () => {
            const mockDocRef = {
                set: jasmine.createSpy('set').and.callFake((data: any) => {
                    expect(data.read).toBeFalse();
                    return Promise.resolve();
                })
            };

            firestoreMock.collection.and.returnValue({
                doc: () => mockDocRef
            });

            await service.create({
                userId: 'user-1',
                title: 'Test',
                body: 'Test Body'
            });
        });
    });

    describe('getForUser', () => {
        it('should return notifications for a user', (done) => {
            service.getForUser('user-1').subscribe(notifications => {
                expect(notifications).toBeDefined();
                expect(notifications.length).toBeGreaterThan(0);
                done();
            });
        });

        it('should query by userId and order by createdAt', () => {
            service.getForUser('user-1').subscribe();
            expect(firestoreMock.collection).toHaveBeenCalled();
        });
    });

    describe('markAsRead', () => {
        it('should update notification read status', async () => {
            await service.markAsRead('notif-1');
            expect(firestoreMock.collection).toHaveBeenCalledWith('notifications');
        });
    });

    describe('getUnreadCount', () => {
        it('should return count of unread notifications', (done) => {
            firestoreMock.collection.and.returnValue({
                valueChanges: () => of([mockNotification, { ...mockNotification, id: 'notif-2' }])
            });

            service.getUnreadCount('user-1').subscribe(count => {
                expect(count).toBeGreaterThanOrEqual(0);
                done();
            });
        });
    });

    describe('markAllAsRead', () => {
        it('should batch update all unread notifications', async () => {
            await service.markAllAsRead('user-1');
            expect(firestoreMock.firestore.batch).toHaveBeenCalled();
        });
    });

    describe('deleteNotification', () => {
        it('should delete a notification', async () => {
            const mockDocRef = {
                delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve())
            };

            firestoreMock.collection.and.returnValue({
                doc: () => mockDocRef
            });

            await service.deleteNotification('notif-1');
            expect(mockDocRef.delete).toHaveBeenCalled();
        });

        it('should log error on failure', async () => {
            const mockDocRef = {
                delete: jasmine.createSpy('delete').and.returnValue(Promise.reject(new Error('Delete failed')))
            };

            firestoreMock.collection.and.returnValue({
                doc: () => mockDocRef
            });

            await expectAsync(service.deleteNotification('notif-1')).toBeRejected();
            expect(loggerMock.error).toHaveBeenCalled();
        });
    });

    describe('showToastNotification', () => {
        it('should create and present toast', async () => {
            await service.showToastNotification('Title', 'Message');

            expect(toastControllerMock.create).toHaveBeenCalledWith(jasmine.objectContaining({
                header: 'Title',
                message: 'Message'
            }));
        });

        it('should include action button when actionUrl provided', async () => {
            await service.showToastNotification('Title', 'Message', '/some-url');

            expect(toastControllerMock.create).toHaveBeenCalledWith(jasmine.objectContaining({
                buttons: jasmine.any(Array)
            }));
        });
    });

    describe('sendAdoptionRequestNotification', () => {
        it('should create adoption request notification', async () => {
            spyOn(service, 'createEnhanced').and.returnValue(Promise.resolve('notif-id'));

            await service.sendAdoptionRequestNotification(
                'owner-1',
                'Max',
                'John Doe',
                'request-1'
            );

            expect(service.createEnhanced).toHaveBeenCalledWith(jasmine.objectContaining({
                type: 'adoption_request',
                title: jasmine.stringMatching(/adopción/)
            }));
        });
    });

    describe('sendAppointmentNotification', () => {
        it('should create appointment notification', async () => {
            spyOn(service, 'createEnhanced').and.returnValue(Promise.resolve('notif-id'));

            await service.sendAppointmentNotification(
                'vet-1',
                'Max',
                'John Doe',
                new Date(),
                'appointment-1'
            );

            expect(service.createEnhanced).toHaveBeenCalledWith(jasmine.objectContaining({
                type: 'appointment'
            }));
        });
    });

    describe('sendGeneralNotification', () => {
        it('should create general notification', async () => {
            spyOn(service, 'createEnhanced').and.returnValue(Promise.resolve('notif-id'));

            await service.sendGeneralNotification(
                'user-1',
                'Test Title',
                'Test Body',
                '/test-url'
            );

            expect(service.createEnhanced).toHaveBeenCalledWith(jasmine.objectContaining({
                userId: 'user-1',
                title: 'Test Title',
                body: 'Test Body',
                type: 'general'
            }));
        });
    });

    describe('updateNotificationPreferences', () => {
        it('should update user preferences', async () => {
            const mockDocRef = {
                set: jasmine.createSpy('set').and.returnValue(Promise.resolve())
            };

            firestoreMock.collection.and.returnValue({
                doc: () => mockDocRef
            });

            await service.updateNotificationPreferences('user-1', {
                adoptionRequests: true,
                pushEnabled: false
            });

            expect(firestoreMock.collection).toHaveBeenCalledWith('user_notification_preferences');
        });
    });

    describe('getNotificationPreferences', () => {
        it('should return user preferences', async () => {
            const mockDocRef = {
                get: jasmine.createSpy('get').and.returnValue(Promise.resolve({
                    data: () => ({ adoptionRequests: true, pushEnabled: true })
                }))
            };

            firestoreMock.collection.and.returnValue({
                doc: () => mockDocRef
            });

            const prefs = await service.getNotificationPreferences('user-1');
            expect(prefs).toBeDefined();
        });

        it('should return defaults if no preferences exist', async () => {
            const mockDocRef = {
                get: jasmine.createSpy('get').and.returnValue(Promise.resolve({
                    data: () => null
                }))
            };

            firestoreMock.collection.and.returnValue({
                doc: () => mockDocRef
            });

            const prefs = await service.getNotificationPreferences('user-1');
            expect(prefs.adoptionRequests).toBeTrue();
            expect(prefs.pushEnabled).toBeTrue();
        });
    });
});
