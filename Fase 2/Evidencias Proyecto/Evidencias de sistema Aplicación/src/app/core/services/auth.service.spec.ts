import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { AuthenticationService } from './authentication.service';
import { EmailVerificationService } from './email-verification.service';
import { UserProfileService } from './user-profile.service';
import { of } from 'rxjs';

// Mock para AuthenticationService
const mockAuthenticationService = {
  user$: of(null),
  login: jasmine.createSpy('login').and.returnValue(Promise.resolve({ user: { uid: 'test-uid' } })),
  logout: jasmine.createSpy('logout').and.returnValue(Promise.resolve()),
  isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(of(true)),
  registerUser: jasmine.createSpy('registerUser').and.returnValue(Promise.resolve()),
  registerUserByAdmin: jasmine.createSpy('registerUserByAdmin').and.returnValue(Promise.resolve()),
  resetPassword: jasmine.createSpy('resetPassword').and.returnValue(Promise.resolve()),
  reauthenticate: jasmine.createSpy('reauthenticate').and.returnValue(Promise.resolve()),
  getCurrentFirebaseUser: jasmine.createSpy('getCurrentFirebaseUser').and.returnValue(Promise.resolve(null))
};

// Mock para EmailVerificationService
const mockEmailVerificationService = {
  isEmailVerified: jasmine.createSpy('isEmailVerified').and.returnValue(Promise.resolve(true)),
  sendVerificationEmail: jasmine.createSpy('sendVerificationEmail').and.returnValue(Promise.resolve()),
  requestSecureEmailUpdate: jasmine.createSpy('requestSecureEmailUpdate').and.returnValue(Promise.resolve()),
  confirmEmailUpdate: jasmine.createSpy('confirmEmailUpdate').and.returnValue(Promise.resolve()),
  cancelEmailUpdate: jasmine.createSpy('cancelEmailUpdate').and.returnValue(Promise.resolve()),
  requestEmailUpdate: jasmine.createSpy('requestEmailUpdate').and.returnValue(Promise.resolve()),
  cleanupExpiredEmailChanges: jasmine.createSpy('cleanupExpiredEmailChanges').and.returnValue(Promise.resolve()),
  syncUserEmailWithFirebase: jasmine.createSpy('syncUserEmailWithFirebase').and.returnValue(Promise.resolve()),
  checkEmailExists: jasmine.createSpy('checkEmailExists').and.returnValue(Promise.resolve(false))
};

// Mock para UserProfileService
const mockUserProfileService = {
  getUserData: jasmine.createSpy('getUserData').and.returnValue(Promise.resolve({ uid: 'test-uid', email: 'test@example.com' })),
  getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue(Promise.resolve({ uid: 'test-uid', email: 'test@example.com' })),
  getCurrentUserEmail: jasmine.createSpy('getCurrentUserEmail').and.returnValue(Promise.resolve('test@example.com')),
  updateUserProfile: jasmine.createSpy('updateUserProfile').and.returnValue(Promise.resolve()),
  getUserById: jasmine.createSpy('getUserById').and.returnValue(Promise.resolve({ uid: 'test-uid' })),
  checkUsernameExists: jasmine.createSpy('checkUsernameExists').and.returnValue(Promise.resolve(false))
};

describe('AuthService (Facade)', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: AuthenticationService, useValue: mockAuthenticationService },
        { provide: EmailVerificationService, useValue: mockEmailVerificationService },
        { provide: UserProfileService, useValue: mockUserProfileService }
      ]
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Authentication tests
  describe('Authentication delegation', () => {
    it('should delegate login to AuthenticationService', async () => {
      await service.login('test@example.com', 'password', true);
      expect(mockAuthenticationService.login).toHaveBeenCalledWith('test@example.com', 'password', true);
    });

    it('should delegate logout to AuthenticationService', async () => {
      await service.logout();
      expect(mockAuthenticationService.logout).toHaveBeenCalled();
    });

    it('should delegate isAuthenticated to AuthenticationService', () => {
      service.isAuthenticated();
      expect(mockAuthenticationService.isAuthenticated).toHaveBeenCalled();
    });
  });

  // User Profile tests
  describe('User Profile delegation', () => {
    it('should delegate getUserData to UserProfileService', async () => {
      await service.getUserData('test-uid');
      expect(mockUserProfileService.getUserData).toHaveBeenCalledWith('test-uid');
    });

    it('should delegate getCurrentUser to UserProfileService', async () => {
      await service.getCurrentUser();
      expect(mockUserProfileService.getCurrentUser).toHaveBeenCalled();
    });
  });
});
