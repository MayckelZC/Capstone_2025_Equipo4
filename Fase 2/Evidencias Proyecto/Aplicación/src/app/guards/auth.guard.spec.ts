import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthGuard } from '../core/guards/auth.guard';
import { AuthService } from '../core/services/auth.service';
import { of, throwError } from 'rxjs';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'isAuthenticated',
      'isEmailVerified',
      'getCurrentFirebaseUser'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  describe('Guard Creation', () => {
    it('should be created', () => {
      expect(guard).toBeTruthy();
    });
  });

  describe('canActivate', () => {
    it('should allow access when user is authenticated and email verified', (done) => {
      authService.isAuthenticated.and.returnValue(of(true));
      authService.isEmailVerified.and.returnValue(Promise.resolve(true));

      guard.canActivate().subscribe(result => {
        expect(result).toBeTrue();
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      });
    });

    it('should redirect to login when user is not authenticated', (done) => {
      authService.isAuthenticated.and.returnValue(of(false));

      guard.canActivate().subscribe(result => {
        expect(result).toBeFalse();
        expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
        done();
      });
    });

    it('should redirect to verificacion-pendiente when email is not verified', (done) => {
      authService.isAuthenticated.and.returnValue(of(true));
      authService.isEmailVerified.and.returnValue(Promise.resolve(false));

      guard.canActivate().subscribe(result => {
        expect(result).toBeFalse();
        expect(router.navigate).toHaveBeenCalledWith(['/auth/verificacion-pendiente']);
        done();
      });
    });

    it('should handle authentication errors gracefully', (done) => {
      authService.isAuthenticated.and.returnValue(throwError(() => new Error('Auth error')));
      authService.getCurrentFirebaseUser.and.returnValue(Promise.resolve(null));

      guard.canActivate().subscribe(result => {
        expect(result).toBeFalse();
        done();
      });
    });

    it('should redirect to verificacion-pendiente on error if user exists but not verified', (done) => {
      const mockUnverifiedUser = { uid: 'test', emailVerified: false };
      authService.isAuthenticated.and.returnValue(throwError(() => new Error('Auth error')));
      authService.getCurrentFirebaseUser.and.returnValue(Promise.resolve(mockUnverifiedUser as any));

      guard.canActivate().subscribe(result => {
        expect(result).toBeFalse();
        expect(router.navigate).toHaveBeenCalledWith(['/auth/verificacion-pendiente']);
        done();
      });
    });
  });
});
