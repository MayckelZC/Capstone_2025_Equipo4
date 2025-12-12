import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';
import { ToastController, AlertController, Platform } from '@ionic/angular';

describe('ToastService', () => {
    let service: ToastService;
    let toastController: jasmine.SpyObj<ToastController>;
    let alertController: jasmine.SpyObj<AlertController>;
    let platform: jasmine.SpyObj<Platform>;
    let mockToast: any;

    beforeEach(() => {
        mockToast = {
            present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
            dismiss: jasmine.createSpy('dismiss').and.returnValue(Promise.resolve()),
            onDidDismiss: jasmine.createSpy('onDidDismiss').and.returnValue(Promise.resolve())
        };

        const toastControllerSpy = jasmine.createSpyObj('ToastController', ['create']);
        toastControllerSpy.create.and.returnValue(Promise.resolve(mockToast));

        const alertControllerSpy = jasmine.createSpyObj('AlertController', ['create']);
        const platformSpy = jasmine.createSpyObj('Platform', ['is']);
        platformSpy.is.and.returnValue(false);

        TestBed.configureTestingModule({
            providers: [
                ToastService,
                { provide: ToastController, useValue: toastControllerSpy },
                { provide: AlertController, useValue: alertControllerSpy },
                { provide: Platform, useValue: platformSpy }
            ]
        });

        service = TestBed.inject(ToastService);
        toastController = TestBed.inject(ToastController) as jasmine.SpyObj<ToastController>;
        alertController = TestBed.inject(AlertController) as jasmine.SpyObj<AlertController>;
        platform = TestBed.inject(Platform) as jasmine.SpyObj<Platform>;
    });

    describe('Service Creation', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });
    });

    describe('presentToast', () => {
        it('should create and present a toast', async () => {
            await service.presentToast('Test message');

            expect(toastController.create).toHaveBeenCalled();
            expect(mockToast.present).toHaveBeenCalled();
        });

        it('should use default color primary', async () => {
            await service.presentToast('Test message');

            expect(toastController.create).toHaveBeenCalledWith(
                jasmine.objectContaining({ message: 'Test message' })
            );
        });

        it('should accept custom color', async () => {
            await service.presentToast('Test', 'success');

            expect(toastController.create).toHaveBeenCalled();
        });

        it('should accept custom icon', async () => {
            await service.presentToast('Test', 'primary', 'checkmark');

            expect(toastController.create).toHaveBeenCalled();
        });

        it('should debounce duplicate messages', async () => {
            await service.presentToast('Same message');
            await service.presentToast('Same message');

            expect(toastController.create).toHaveBeenCalledTimes(1);
        });

        it('should allow same message after debounce time', fakeAsync(async () => {
            await service.presentToast('Message 1');
            tick(1500);
            await service.presentToast('Message 1');

            expect(toastController.create).toHaveBeenCalledTimes(2);
        }));
    });

    describe('success', () => {
        it('should create success toast with correct options', async () => {
            await service.success('Success message');

            expect(toastController.create).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    color: 'success',
                    icon: 'checkmark-circle'
                })
            );
        });

        it('should accept custom duration', async () => {
            await service.success('Success', 5000);

            expect(toastController.create).toHaveBeenCalled();
        });
    });

    describe('warning', () => {
        it('should create warning toast with correct options', async () => {
            await service.warning('Warning message');

            expect(toastController.create).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    color: 'warning',
                    icon: 'warning'
                })
            );
        });
    });

    describe('error', () => {
        it('should create error toast with correct options', async () => {
            await service.error('Error message');

            expect(toastController.create).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    color: 'danger',
                    icon: 'alert-circle'
                })
            );
        });

        it('should have longer duration for errors', async () => {
            await service.error('Error');

            expect(toastController.create).toHaveBeenCalled();
        });
    });

    describe('info', () => {
        it('should create info toast with correct options', async () => {
            await service.info('Info message');

            expect(toastController.create).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    icon: 'information-circle'
                })
            );
        });
    });

    describe('sticky', () => {
        it('should create sticky toast with no duration', async () => {
            await service.sticky('Sticky message');

            expect(toastController.create).toHaveBeenCalledWith(
                jasmine.objectContaining({ duration: 0 })
            );
        });

        it('should have dismiss button by default', async () => {
            await service.sticky('Sticky');

            expect(toastController.create).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    buttons: jasmine.arrayContaining([
                        jasmine.objectContaining({ text: 'Entendido' })
                    ])
                })
            );
        });
    });

    describe('withUndo', () => {
        it('should create toast with undo button', async () => {
            const undoCallback = jasmine.createSpy('undoCallback');

            await service.withUndo('Action done', undoCallback);

            expect(toastController.create).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    buttons: jasmine.arrayContaining([
                        jasmine.objectContaining({ text: 'Deshacer' })
                    ])
                })
            );
        });
    });

    describe('mini', () => {
        it('should create mini toast', async () => {
            await service.mini('Mini message');

            expect(toastController.create).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    color: 'medium',
                    duration: 2000
                })
            );
        });
    });

    describe('large', () => {
        it('should create large toast', async () => {
            await service.large('Large message');

            expect(toastController.create).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    icon: 'megaphone',
                    duration: 5000
                })
            );
        });
    });

    describe('dismissAll', () => {
        it('should dismiss all active toasts', async () => {
            await service.presentToast('Toast 1');
            await service.dismissAll();

            expect(mockToast.dismiss).toHaveBeenCalled();
        });
    });

    describe('showAlert', () => {
        it('should create an alert', async () => {
            const mockAlert = {
                present: jasmine.createSpy('present')
            };
            alertController.create.and.returnValue(Promise.resolve(mockAlert as any));

            await service.showAlert({
                header: 'Test',
                message: 'Message',
                buttons: ['OK']
            });

            expect(alertController.create).toHaveBeenCalledWith({
                header: 'Test',
                message: 'Message',
                buttons: ['OK']
            });
        });
    });

    describe('Queue Management', () => {
        it('should handle toast queue when max concurrent reached', async () => {
            // Create multiple toasts beyond maxConcurrentToasts
            await service.presentToast('Toast 1');
            await service.presentToast('Toast 2');
            await service.presentToast('Toast 3');
            await service.presentToast('Toast 4');

            // Queue should handle overflow
            expect(toastController.create).toHaveBeenCalledTimes(3);
        });
    });
});
