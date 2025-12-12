import { TestBed } from '@angular/core/testing';
import { AuthenticationService } from './authentication.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { of } from 'rxjs';

describe('AuthenticationService', () => {
    let service: AuthenticationService;
    let afAuth: any;
    let firestore: any;

    const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        emailVerified: true,
        sendEmailVerification: jasmine.createSpy('sendEmailVerification').and.returnValue(Promise.resolve())
    };

    const mockUserData = {
        uid: 'test-uid',
        email: 'test@example.com',
        nombreCompleto: 'Test User',
        nombreUsuario: 'testuser',
        isBlocked: false,
        emailVerified: true
    };

    beforeEach(() => {
        const mockAfAuth = {
            authState: of(mockUser),
            signInWithEmailAndPassword: jasmine.createSpy('signInWithEmailAndPassword')
                .and.returnValue(Promise.resolve({ user: mockUser })),
            createUserWithEmailAndPassword: jasmine.createSpy('createUserWithEmailAndPassword')
                .and.returnValue(Promise.resolve({ user: mockUser })),
            signOut: jasmine.createSpy('signOut').and.returnValue(Promise.resolve()),
            setPersistence: jasmine.createSpy('setPersistence').and.returnValue(Promise.resolve()),
            sendPasswordResetEmail: jasmine.createSpy('sendPasswordResetEmail').and.returnValue(Promise.resolve()),
            currentUser: Promise.resolve(mockUser)
        };

        const mockFirestore = {
            collection: jasmine.createSpy('collection').and.returnValue({
                doc: jasmine.createSpy('doc').and.returnValue({
                    get: jasmine.createSpy('get').and.returnValue(of({
                        exists: true,
                        data: () => mockUserData
                    })),
                    set: jasmine.createSpy('set').and.returnValue(Promise.resolve()),
                    update: jasmine.createSpy('update').and.returnValue(Promise.resolve()),
                    snapshotChanges: jasmine.createSpy('snapshotChanges').and.returnValue(of({
                        payload: { exists: true, data: () => mockUserData, id: 'test-uid' }
                    }))
                }),
                get: jasmine.createSpy('get').and.returnValue(of({ empty: true, docs: [] }))
            }),
            doc: jasmine.createSpy('doc').and.returnValue({
                snapshotChanges: jasmine.createSpy('snapshotChanges').and.returnValue(of({
                    payload: { exists: true, data: () => mockUserData, id: 'test-uid' }
                }))
            })
        };

        const mockStorage = {
            ref: jasmine.createSpy('ref').and.returnValue({
                getDownloadURL: jasmine.createSpy('getDownloadURL').and.returnValue(of('http://example.com/image.jpg'))
            }),
            upload: jasmine.createSpy('upload').and.returnValue(Promise.resolve())
        };

        TestBed.configureTestingModule({
            providers: [
                AuthenticationService,
                { provide: AngularFireAuth, useValue: mockAfAuth },
                { provide: AngularFirestore, useValue: mockFirestore },
                { provide: AngularFireStorage, useValue: mockStorage }
            ]
        });

        service = TestBed.inject(AuthenticationService);
        afAuth = TestBed.inject(AngularFireAuth);
        firestore = TestBed.inject(AngularFirestore);
    });

    // ==========================================
    // Service Creation
    // ==========================================
    describe('Service Creation', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });

        it('should have user$ observable', () => {
            expect(service.user$).toBeDefined();
        });
    });

    // ==========================================
    // Login
    // ==========================================
    describe('login', () => {
        it('should login successfully with email', async () => {
            const result = await service.login('test@example.com', 'password123', true);
            expect(afAuth.setPersistence).toHaveBeenCalledWith('local');
            expect(afAuth.signInWithEmailAndPassword).toHaveBeenCalledWith('test@example.com', 'password123');
            expect(result.user).toBeDefined();
        });

        it('should use session persistence when keepSession is false', async () => {
            await service.login('test@example.com', 'password123', false);
            expect(afAuth.setPersistence).toHaveBeenCalledWith('session');
        });

        it('should try login with username if email fails', async () => {
            afAuth.signInWithEmailAndPassword
                .and.returnValues(
                    Promise.reject({ code: 'auth/user-not-found' }),
                    Promise.resolve({ user: mockUser })
                );

            firestore.collection.and.returnValue({
                get: jasmine.createSpy('get').and.returnValue(of({
                    empty: false,
                    docs: [{ data: () => ({ ...mockUserData, email: 'found@example.com' }) }]
                })),
                doc: jasmine.createSpy('doc').and.returnValue({
                    get: jasmine.createSpy('get').and.returnValue(of({
                        exists: true,
                        data: () => mockUserData
                    }))
                })
            });

            const result = await service.login('testuser', 'password123', true);
            expect(result.user).toBeDefined();
        });

        it('should throw error for blocked users', async () => {
            const blockedUserData = { ...mockUserData, isBlocked: true };
            firestore.collection.and.returnValue({
                get: jasmine.createSpy('get').and.returnValue(of({ empty: true })),
                doc: jasmine.createSpy('doc').and.returnValue({
                    get: jasmine.createSpy('get').and.returnValue(of({
                        exists: true,
                        data: () => blockedUserData
                    }))
                })
            });

            await expectAsync(service.login('test@example.com', 'password123', true))
                .toBeRejectedWith(jasmine.objectContaining({ code: 'auth/user-blocked' }));
        });
    });

    // ==========================================
    // Logout
    // ==========================================
    describe('logout', () => {
        it('should call signOut', async () => {
            await service.logout();
            expect(afAuth.signOut).toHaveBeenCalled();
        });
    });

    // ==========================================
    // isAuthenticated
    // ==========================================
    describe('isAuthenticated', () => {
        it('should return true when user is authenticated', (done) => {
            service.isAuthenticated().subscribe(isAuth => {
                expect(isAuth).toBeTrue();
                done();
            });
        });

        it('should return false when user is not authenticated', (done) => {
            afAuth.authState = of(null);

            // Recrear el servicio con authState null
            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                providers: [
                    AuthenticationService,
                    { provide: AngularFireAuth, useValue: { ...afAuth, authState: of(null) } },
                    { provide: AngularFirestore, useValue: firestore },
                    { provide: AngularFireStorage, useValue: {} }
                ]
            });

            const newService = TestBed.inject(AuthenticationService);
            newService.isAuthenticated().subscribe(isAuth => {
                expect(isAuth).toBeFalse();
                done();
            });
        });
    });

    // ==========================================
    // Register User
    // ==========================================
    describe('registerUser', () => {
        it('should register a new user successfully', async () => {
            await expectAsync(service.registerUser(
                'Test User',
                'newuser',
                'new@example.com',
                'password123',
                '+56912345678',
                'Test Address',
                null
            )).toBeResolved();

            expect(afAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith('new@example.com', 'password123');
        });

        it('should throw error if username already exists', async () => {
            firestore.collection.and.returnValue({
                get: jasmine.createSpy('get').and.returnValue(of({
                    empty: false,
                    docs: [{ data: () => mockUserData }]
                }))
            });

            await expectAsync(service.registerUser(
                'Test User',
                'existinguser',
                'new@example.com',
                'password123',
                '+56912345678',
                'Test Address',
                null
            )).toBeRejectedWith(jasmine.objectContaining({ code: 'auth/username-already-in-use' }));
        });
    });

    // ==========================================
    // Reset Password
    // ==========================================
    describe('resetPassword', () => {
        it('should send password reset email', async () => {
            await service.resetPassword('test@example.com');
            expect(afAuth.sendPasswordResetEmail).toHaveBeenCalledWith('test@example.com');
        });

        it('should propagate errors', async () => {
            afAuth.sendPasswordResetEmail.and.returnValue(Promise.reject(new Error('User not found')));

            await expectAsync(service.resetPassword('nonexistent@example.com'))
                .toBeRejected();
        });
    });

    // ==========================================
    // getCurrentFirebaseUser
    // ==========================================
    describe('getCurrentFirebaseUser', () => {
        it('should return current firebase user', async () => {
            const user = await service.getCurrentFirebaseUser();
            expect(user).toBeDefined();
            expect(user?.uid).toBe('test-uid');
        });
    });
});
