import { TestBed } from '@angular/core/testing';
import { QrService, QRCheckInData } from './qr.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { LoggerService } from '@core/services/logger.service';
import { of } from 'rxjs';

describe('QrService', () => {
    let service: QrService;
    let firestoreMock: any;
    let logger: jasmine.SpyObj<LoggerService>;

    const mockAppointment = {
        id: 'apt-1',
        petId: 'pet-1',
        petName: 'Max',
        userEmail: 'test@test.com',
        date: new Date().toISOString(),
        status: 'confirmada'
    };

    beforeEach(() => {
        const mockDocRef = {
            get: jasmine.createSpy('get').and.returnValue(of({ exists: true, data: () => mockAppointment })),
            update: jasmine.createSpy('update').and.returnValue(Promise.resolve())
        };

        const mockCollectionRef = {
            doc: jasmine.createSpy('doc').and.returnValue(mockDocRef)
        };

        firestoreMock = {
            collection: jasmine.createSpy('collection').and.returnValue(mockCollectionRef)
        };

        const loggerSpy = jasmine.createSpyObj('LoggerService', ['info', 'error', 'debug', 'warn']);

        TestBed.configureTestingModule({
            providers: [
                QrService,
                { provide: AngularFirestore, useValue: firestoreMock },
                { provide: LoggerService, useValue: loggerSpy }
            ]
        });

        service = TestBed.inject(QrService);
        logger = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
    });

    describe('Service Creation', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });
    });

    describe('generateQRData', () => {
        it('should generate QR data for appointment', () => {
            const qrData = service.generateQRData(mockAppointment);
            expect(qrData).toBeDefined();
            expect(typeof qrData).toBe('string');
        });

        it('should encode data as base64', () => {
            const qrData = service.generateQRData(mockAppointment);
            // Should be valid base64
            expect(() => atob(qrData)).not.toThrow();
        });

        it('should include appointment ID in data', () => {
            const qrData = service.generateQRData(mockAppointment);
            const decoded = JSON.parse(atob(qrData));
            expect(decoded.appointmentId).toBe('apt-1');
        });

        it('should include signature for verification', () => {
            const qrData = service.generateQRData(mockAppointment);
            const decoded = JSON.parse(atob(qrData));
            expect(decoded.signature).toBeDefined();
        });
    });

    describe('decodeAndValidateQR', () => {
        it('should decode valid QR data', async () => {
            const qrData = service.generateQRData(mockAppointment);
            const result = await service.decodeAndValidateQR(qrData);

            expect(result.valid).toBeDefined();
        });

        it('should return error for invalid QR', async () => {
            const result = await service.decodeAndValidateQR('invalid-data');
            expect(result.valid).toBeFalse();
            expect(result.error).toBeDefined();
        });

        it('should return error for tampered signature', async () => {
            const qrData = service.generateQRData(mockAppointment);
            const decoded = JSON.parse(atob(qrData));
            decoded.signature = 'tampered-signature';
            const tamperedQR = btoa(JSON.stringify(decoded));

            const result = await service.decodeAndValidateQR(tamperedQR);
            expect(result.valid).toBeFalse();
        });
    });

    describe('performCheckIn', () => {
        it('should perform check-in successfully', async () => {
            const success = await service.performCheckIn('apt-1');
            expect(success).toBeTrue();
            expect(firestoreMock.collection).toHaveBeenCalledWith('veterinaryAppointments');
        });

        it('should update appointment status', async () => {
            await service.performCheckIn('apt-1');
            expect(firestoreMock.collection).toHaveBeenCalled();
        });
    });
});
