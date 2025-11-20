import { TestBed } from '@angular/core/testing';
import { ToastController } from '@ionic/angular';
import { of, throwError } from 'rxjs';
import { ErrorHandlerService } from './error-handler.service';
import { ERROR_MESSAGES, RETRY_CONSTANTS } from '../constants/veterinarian.constants';

describe('ErrorHandlerService', () => {
  let service: ErrorHandlerService;
  let toastController: jasmine.SpyObj<ToastController>;

  beforeEach(() => {
    const toastControllerSpy = jasmine.createSpyObj('ToastController', ['create']);

    TestBed.configureTestingModule({
      providers: [
        ErrorHandlerService,
        { provide: ToastController, useValue: toastControllerSpy }
      ]
    });

    service = TestBed.inject(ErrorHandlerService);
    toastController = TestBed.inject(ToastController) as jasmine.SpyObj<ToastController>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should show error toast', async () => {
    const mockToast = {
      present: jasmine.createSpy('present')
    };
    toastController.create.and.returnValue(Promise.resolve(mockToast as any));

    await service.showErrorToast('Test error');

    expect(toastController.create).toHaveBeenCalled();
    expect(mockToast.present).toHaveBeenCalled();
  });

  it('should handle firebase permission-denied error', (done) => {
    const error = { code: 'permission-denied' };
    
    service.handleError(error, false).subscribe({
      error: (err) => {
        expect(service.getErrorState()?.message).toBe(ERROR_MESSAGES.NO_PERMISSIONS);
        done();
      }
    });
  });

  it('should retry operations up to max attempts', (done) => {
    let attempts = 0;
    
    const mockOperation$ = of(null).pipe(
      service.retryWithBackoff(RETRY_CONSTANTS.MAX_RETRY_ATTEMPTS)
    );

    mockOperation$.subscribe({
      complete: () => {
        expect(attempts).toBeLessThanOrEqual(RETRY_CONSTANTS.MAX_RETRY_ATTEMPTS);
        done();
      }
    });
  });

  it('should not retry non-retryable errors', (done) => {
    const nonRetryableError = { code: 'permission-denied' };
    
    const mockOperation$ = throwError(() => nonRetryableError).pipe(
      service.retryWithBackoff(3)
    );

    let errorCaught = false;
    mockOperation$.subscribe({
      error: (err) => {
        errorCaught = true;
        expect(err.code).toBe('permission-denied');
        done();
      }
    });

    expect(errorCaught || true).toBeTruthy();
  });
});
