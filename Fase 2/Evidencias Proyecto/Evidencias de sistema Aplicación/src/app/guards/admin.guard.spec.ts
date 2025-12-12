import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AdminGuard } from '../core/guards/admin.guard';
import { AuthService } from '../core/services/auth.service';
import { of, BehaviorSubject } from 'rxjs';

describe('AdminGuard', () => {
    let guard: AdminGuard;
    let authService: any;
    let router: jasmine.SpyObj<Router>;

    const mockRoute = {} as ActivatedRouteSnapshot;
    const mockState = {} as RouterStateSnapshot;

    beforeEach(() => {
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        authService = {
            user$: new BehaviorSubject(null)
        };

        TestBed.configureTestingModule({
            providers: [
                AdminGuard,
                { provide: AuthService, useValue: authService },
                { provide: Router, useValue: routerSpy }
            ]
        });

        guard = TestBed.inject(AdminGuard);
        router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    });

    describe('Guard Creation', () => {
        it('should be created', () => {
            expect(guard).toBeTruthy();
        });
    });

    describe('canActivate', () => {
        it('should allow access for admin users', (done) => {
            const adminUser = { uid: 'admin-id', isAdmin: true };
            authService.user$.next(adminUser);

            (guard.canActivate(mockRoute, mockState) as any).subscribe((result: boolean) => {
                expect(result).toBeTrue();
                expect(router.navigate).not.toHaveBeenCalled();
                done();
            });
        });

        it('should deny access for non-admin users and redirect to home', (done) => {
            const regularUser = { uid: 'user-id', isAdmin: false };
            authService.user$.next(regularUser);

            (guard.canActivate(mockRoute, mockState) as any).subscribe((result: boolean) => {
                expect(result).toBeFalse();
                expect(router.navigate).toHaveBeenCalledWith(['/pets/home']);
                done();
            });
        });

        it('should deny access when no user is logged in', (done) => {
            authService.user$.next(null);

            (guard.canActivate(mockRoute, mockState) as any).subscribe((result: boolean) => {
                expect(result).toBeFalse();
                expect(router.navigate).toHaveBeenCalledWith(['/pets/home']);
                done();
            });
        });

        it('should deny access when user is undefined', (done) => {
            authService.user$.next(undefined);

            (guard.canActivate(mockRoute, mockState) as any).subscribe((result: boolean) => {
                expect(result).toBeFalse();
                expect(router.navigate).toHaveBeenCalledWith(['/pets/home']);
                done();
            });
        });

        it('should handle user with missing isAdmin property', (done) => {
            const userWithoutAdminFlag = { uid: 'user-id' };
            authService.user$.next(userWithoutAdminFlag);

            (guard.canActivate(mockRoute, mockState) as any).subscribe((result: boolean) => {
                expect(result).toBeFalse();
                done();
            });
        });
    });
});
