import { TestBed } from '@angular/core/testing';
import { UserProfileService } from './user-profile.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { of } from 'rxjs';

describe('UserProfileService', () => {
    let service: UserProfileService;
    let firestore: any;
    let afAuth: any;

    const mockUserData = {
        uid: 'test-uid',
        email: 'test@example.com',
        nombreCompleto: 'Test User',
        nombreUsuario: 'testuser',
        telefono: '+56912345678',
        direccion: 'Test Address'
    };

    beforeEach(() => {
        const mockAfAuth = {
            authState: of({ uid: 'test-uid', email: 'test@example.com' }),
            currentUser: Promise.resolve({ uid: 'test-uid', email: 'test@example.com' })
        };

        const mockFirestore = {
            collection: jasmine.createSpy('collection').and.returnValue({
                doc: jasmine.createSpy('doc').and.returnValue({
                    get: jasmine.createSpy('get').and.returnValue(of({
                        exists: true,
                        data: () => mockUserData
                    })),
                    update: jasmine.createSpy('update').and.returnValue(Promise.resolve())
                }),
                get: jasmine.createSpy('get').and.returnValue(of({
                    empty: false,
                    docs: [{ data: () => mockUserData }]
                }))
            })
        };

        TestBed.configureTestingModule({
            providers: [
                UserProfileService,
                { provide: AngularFireAuth, useValue: mockAfAuth },
                { provide: AngularFirestore, useValue: mockFirestore }
            ]
        });

        service = TestBed.inject(UserProfileService);
        firestore = TestBed.inject(AngularFirestore);
        afAuth = TestBed.inject(AngularFireAuth);
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
    // getUserData
    // ==========================================
    describe('getUserData', () => {
        it('should return user data for valid uid', async () => {
            const result = await service.getUserData('test-uid');
            expect(result).toBeDefined();
            expect(result?.nombreCompleto).toBe('Test User');
        });

        it('should return null for non-existent user', async () => {
            firestore.collection.and.returnValue({
                doc: jasmine.createSpy('doc').and.returnValue({
                    get: jasmine.createSpy('get').and.returnValue(of({
                        exists: false,
                        data: () => null
                    }))
                })
            });

            const result = await service.getUserData('non-existent');
            expect(result).toBeNull();
        });
    });

    // ==========================================
    // getCurrentUser
    // ==========================================
    describe('getCurrentUser', () => {
        it('should return current user data', async () => {
            const result = await service.getCurrentUser();
            expect(result).toBeDefined();
        });

        it('should return null when not authenticated', async () => {
            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                providers: [
                    UserProfileService,
                    { provide: AngularFireAuth, useValue: { authState: of(null) } },
                    { provide: AngularFirestore, useValue: firestore }
                ]
            });

            const newService = TestBed.inject(UserProfileService);
            const result = await newService.getCurrentUser();
            expect(result).toBeNull();
        });
    });

    // ==========================================
    // getCurrentUserEmail
    // ==========================================
    describe('getCurrentUserEmail', () => {
        it('should return current user email', async () => {
            const email = await service.getCurrentUserEmail();
            expect(email).toBe('test@example.com');
        });
    });

    // ==========================================
    // updateUserProfile
    // ==========================================
    describe('updateUserProfile', () => {
        it('should update user profile in Firestore', async () => {
            const updateData = { nombreCompleto: 'Updated Name' };
            const mockDocRef = {
                update: jasmine.createSpy('update').and.returnValue(Promise.resolve())
            };

            firestore.collection.and.returnValue({
                doc: jasmine.createSpy('doc').and.returnValue(mockDocRef)
            });

            await service.updateUserProfile('test-uid', updateData);
            expect(mockDocRef.update).toHaveBeenCalledWith(updateData);
        });
    });

    // ==========================================
    // getUserById
    // ==========================================
    describe('getUserById', () => {
        it('should return user by id', async () => {
            const result = await service.getUserById('test-uid');
            expect(result).toBeDefined();
            expect(result?.uid).toBe('test-uid');
        });

        it('should return null for non-existent user', async () => {
            firestore.collection.and.returnValue({
                doc: jasmine.createSpy('doc').and.returnValue({
                    get: jasmine.createSpy('get').and.returnValue(of({
                        exists: false
                    }))
                })
            });

            const result = await service.getUserById('non-existent');
            expect(result).toBeNull();
        });
    });

    // ==========================================
    // checkUsernameExists
    // ==========================================
    describe('checkUsernameExists', () => {
        it('should return true if username exists', async () => {
            firestore.collection.and.returnValue({
                get: jasmine.createSpy('get').and.returnValue(of({
                    empty: false,
                    docs: [{ data: () => mockUserData }]
                }))
            });

            const result = await service.checkUsernameExists('testuser');
            expect(result).toBeTrue();
        });

        it('should return false if username does not exist', async () => {
            firestore.collection.and.returnValue({
                get: jasmine.createSpy('get').and.returnValue(of({
                    empty: true,
                    docs: []
                }))
            });

            const result = await service.checkUsernameExists('newusername');
            expect(result).toBeFalse();
        });
    });
});
