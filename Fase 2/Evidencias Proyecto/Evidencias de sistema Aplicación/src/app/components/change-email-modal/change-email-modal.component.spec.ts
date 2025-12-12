import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ChangeEmailModalComponent } from './change-email-modal.component';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@shared/services/toast.service';

describe('ChangeEmailModalComponent', () => {
    let component: ChangeEmailModalComponent;
    let fixture: ComponentFixture<ChangeEmailModalComponent>;
    let modalController: jasmine.SpyObj<ModalController>;
    let authService: jasmine.SpyObj<AuthService>;
    let toastService: jasmine.SpyObj<ToastService>;

    beforeEach(async () => {
        const modalControllerSpy = jasmine.createSpyObj('ModalController', ['dismiss']);
        const authServiceSpy = jasmine.createSpyObj('AuthService', [
            'requestSecureEmailUpdate',
            'confirmEmailUpdate',
            'cancelEmailUpdate'
        ]);
        const toastServiceSpy = jasmine.createSpyObj('ToastService', ['presentToast']);

        await TestBed.configureTestingModule({
            declarations: [ChangeEmailModalComponent],
            imports: [ReactiveFormsModule],
            providers: [
                FormBuilder,
                { provide: ModalController, useValue: modalControllerSpy },
                { provide: AuthService, useValue: authServiceSpy },
                { provide: ToastService, useValue: toastServiceSpy }
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
        }).compileComponents();

        fixture = TestBed.createComponent(ChangeEmailModalComponent);
        component = fixture.componentInstance;
        modalController = TestBed.inject(ModalController) as jasmine.SpyObj<ModalController>;
        authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
        toastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

        fixture.detectChanges();
    });

    describe('Component Creation', () => {
        it('should create', () => {
            expect(component).toBeTruthy();
        });

        it('should initialize form on ngOnInit', () => {
            expect(component.emailForm).toBeDefined();
            expect(component.emailForm.get('currentPassword')).toBeDefined();
            expect(component.emailForm.get('newEmail')).toBeDefined();
            expect(component.emailForm.get('confirmEmail')).toBeDefined();
        });

        it('should start with input step', () => {
            expect(component.step).toBe('input');
        });

        it('should start with loading false', () => {
            expect(component.loading).toBeFalse();
        });
    });

    describe('Form Validation', () => {
        it('should require current password', () => {
            component.emailForm.patchValue({ currentPassword: '' });
            expect(component.currentPassword?.hasError('required')).toBeTrue();
        });

        it('should require minimum 6 characters for password', () => {
            component.emailForm.patchValue({ currentPassword: '123' });
            expect(component.currentPassword?.hasError('minlength')).toBeTrue();
        });

        it('should validate email format', () => {
            component.emailForm.patchValue({ newEmail: 'invalid-email' });
            expect(component.newEmailControl?.hasError('email')).toBeTrue();
        });

        it('should validate email match', () => {
            component.emailForm.patchValue({
                newEmail: 'new@example.com',
                confirmEmail: 'different@example.com'
            });
            expect(component.emailForm.hasError('emailMismatch')).toBeTrue();
        });

        it('should be valid when emails match', () => {
            component.emailForm.patchValue({
                currentPassword: 'password123',
                newEmail: 'new@example.com',
                confirmEmail: 'new@example.com'
            });
            expect(component.emailForm.valid).toBeTrue();
        });
    });

    describe('requestEmailChange', () => {
        beforeEach(() => {
            component.emailForm.patchValue({
                currentPassword: 'password123',
                newEmail: 'new@example.com',
                confirmEmail: 'new@example.com'
            });
        });

        it('should call authService.requestSecureEmailUpdate', async () => {
            authService.requestSecureEmailUpdate.and.returnValue(Promise.resolve());

            await component.requestEmailChange();

            expect(authService.requestSecureEmailUpdate).toHaveBeenCalledWith('password123', 'new@example.com');
        });

        it('should change step to verification on success', async () => {
            authService.requestSecureEmailUpdate.and.returnValue(Promise.resolve());

            await component.requestEmailChange();

            expect(component.step).toBe('verification');
        });

        it('should show success toast on success', async () => {
            authService.requestSecureEmailUpdate.and.returnValue(Promise.resolve());

            await component.requestEmailChange();

            expect(toastService.presentToast).toHaveBeenCalledWith(
                jasmine.stringMatching(/verificación/),
                'success',
                'mail-outline'
            );
        });

        it('should not submit if form is invalid', async () => {
            component.emailForm.patchValue({ currentPassword: '' });

            await component.requestEmailChange();

            expect(authService.requestSecureEmailUpdate).not.toHaveBeenCalled();
        });

        it('should handle errors', async () => {
            authService.requestSecureEmailUpdate.and.returnValue(Promise.reject({ message: 'Error' }));

            await component.requestEmailChange();

            expect(toastService.presentToast).toHaveBeenCalled();
        });
    });

    describe('checkVerificationStatus', () => {
        it('should call authService.confirmEmailUpdate', async () => {
            authService.confirmEmailUpdate.and.returnValue(Promise.resolve());

            await component.checkVerificationStatus();

            expect(authService.confirmEmailUpdate).toHaveBeenCalled();
        });

        it('should change step to success when verified', async () => {
            authService.confirmEmailUpdate.and.returnValue(Promise.resolve());

            await component.checkVerificationStatus();

            expect(component.step).toBe('success');
        });

        it('should show success toast on verification', async () => {
            authService.confirmEmailUpdate.and.returnValue(Promise.resolve());

            await component.checkVerificationStatus();

            expect(toastService.presentToast).toHaveBeenCalledWith(
                jasmine.stringMatching(/exitosamente/),
                'success',
                'checkmark-circle-outline'
            );
        });

        it('should handle verification error', async () => {
            authService.confirmEmailUpdate.and.returnValue(Promise.reject({ message: 'Not verified' }));

            await component.checkVerificationStatus();

            expect(toastService.presentToast).toHaveBeenCalledWith(
                jasmine.any(String),
                'warning',
                'time-outline'
            );
        });
    });

    describe('cancelEmailChange', () => {
        it('should call authService.cancelEmailUpdate', async () => {
            authService.cancelEmailUpdate.and.returnValue(Promise.resolve());

            await component.cancelEmailChange();

            expect(authService.cancelEmailUpdate).toHaveBeenCalled();
        });

        it('should dismiss modal on cancel', async () => {
            authService.cancelEmailUpdate.and.returnValue(Promise.resolve());

            await component.cancelEmailChange();

            expect(modalController.dismiss).toHaveBeenCalledWith({ success: false });
        });

        it('should show toast on cancel', async () => {
            authService.cancelEmailUpdate.and.returnValue(Promise.resolve());

            await component.cancelEmailChange();

            expect(toastService.presentToast).toHaveBeenCalled();
        });
    });

    describe('togglePasswordVisibility', () => {
        it('should toggle showPassword', () => {
            expect(component.showPassword).toBeFalse();
            component.togglePasswordVisibility();
            expect(component.showPassword).toBeTrue();
            component.togglePasswordVisibility();
            expect(component.showPassword).toBeFalse();
        });
    });

    describe('dismiss', () => {
        it('should dismiss without success by default', () => {
            component.dismiss();
            expect(modalController.dismiss).toHaveBeenCalledWith({ success: false });
        });

        it('should dismiss with success when specified', () => {
            component.dismiss(true);
            expect(modalController.dismiss).toHaveBeenCalledWith({ success: true });
        });
    });

    describe('Form Getters', () => {
        it('should return currentPassword control', () => {
            expect(component.currentPassword).toBe(component.emailForm.get('currentPassword'));
        });

        it('should return newEmail control', () => {
            expect(component.newEmailControl).toBe(component.emailForm.get('newEmail'));
        });

        it('should return confirmEmail control', () => {
            expect(component.confirmEmail).toBe(component.emailForm.get('confirmEmail'));
        });
    });

    describe('Retry Logic', () => {
        it('should increment retry count on network error', async () => {
            component.emailForm.patchValue({
                currentPassword: 'password123',
                newEmail: 'new@example.com',
                confirmEmail: 'new@example.com'
            });

            authService.requestSecureEmailUpdate.and.returnValue(
                Promise.reject({ message: 'Error de conexión' })
            );

            await component.requestEmailChange();

            expect(component.retryCount).toBe(1);
        });

        it('should allow retry when lastError is network and count < max', async () => {
            component.lastError = 'network';
            component.retryCount = 1;
            component.emailForm.patchValue({
                currentPassword: 'password123',
                newEmail: 'new@example.com',
                confirmEmail: 'new@example.com'
            });

            authService.requestSecureEmailUpdate.and.returnValue(Promise.resolve());

            await component.retryEmailChange();

            expect(authService.requestSecureEmailUpdate).toHaveBeenCalled();
        });
    });
});
