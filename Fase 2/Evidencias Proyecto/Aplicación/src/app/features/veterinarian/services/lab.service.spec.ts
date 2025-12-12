import { TestBed } from '@angular/core/testing';
import { LabService } from './lab.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { LoggerService } from '@core/services/logger.service';
import { of } from 'rxjs';

describe('LabService', () => {
    let service: LabService;
    let firestoreMock: any;
    let storageMock: any;
    let logger: jasmine.SpyObj<LoggerService>;

    const mockLabResults = [
        { id: 'result-1', petId: 'pet-1', testType: 'hematology', status: 'completed' },
        { id: 'result-2', petId: 'pet-1', testType: 'biochemistry', status: 'pending' }
    ];

    beforeEach(() => {
        const mockDocRef = {
            get: jasmine.createSpy('get').and.returnValue(of({ exists: true, id: 'result-1', data: () => mockLabResults[0] })),
            update: jasmine.createSpy('update').and.returnValue(Promise.resolve()),
            delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve())
        };

        const mockCollectionRef = {
            add: jasmine.createSpy('add').and.returnValue(Promise.resolve({ id: 'new-result' })),
            valueChanges: jasmine.createSpy('valueChanges').and.returnValue(of(mockLabResults)),
            get: jasmine.createSpy('get').and.returnValue(of({ docs: [] })),
            doc: jasmine.createSpy('doc').and.returnValue(mockDocRef)
        };

        firestoreMock = {
            collection: jasmine.createSpy('collection').and.returnValue(mockCollectionRef)
        };

        storageMock = {
            ref: jasmine.createSpy('ref').and.returnValue({
                getDownloadURL: jasmine.createSpy('getDownloadURL').and.returnValue(of('https://example.com/file.pdf'))
            }),
            upload: jasmine.createSpy('upload').and.returnValue({
                snapshotChanges: () => of(null)
            })
        };

        const loggerSpy = jasmine.createSpyObj('LoggerService', ['info', 'error', 'debug', 'warn']);

        TestBed.configureTestingModule({
            providers: [
                LabService,
                { provide: AngularFirestore, useValue: firestoreMock },
                { provide: AngularFireStorage, useValue: storageMock },
                { provide: LoggerService, useValue: loggerSpy }
            ]
        });

        service = TestBed.inject(LabService);
        logger = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
    });

    describe('Service Creation', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });
    });

    describe('createLabResult', () => {
        it('should create a new lab result', async () => {
            const result = await service.createLabResult({
                petId: 'pet-1',
                appointmentId: 'apt-1',
                testType: 'hematology',
                status: 'pending',
                results: []
            } as any);

            expect(result).toBe('new-result');
            expect(firestoreMock.collection).toHaveBeenCalledWith('lab-results');
        });
    });

    describe('getLabResultsByPet', () => {
        it('should get lab results for a pet', (done) => {
            service.getLabResultsByPet('pet-1').subscribe(results => {
                expect(results).toBeDefined();
                expect(firestoreMock.collection).toHaveBeenCalled();
                done();
            });
        });
    });

    describe('getLabResultsByAppointment', () => {
        it('should get lab results for an appointment', (done) => {
            service.getLabResultsByAppointment('apt-1').subscribe(results => {
                expect(results).toBeDefined();
                done();
            });
        });
    });

    describe('getLabResultById', () => {
        it('should get a specific lab result', async () => {
            const result = await service.getLabResultById('result-1');
            expect(result).toBeDefined();
        });
    });

    describe('updateLabResult', () => {
        it('should update a lab result', async () => {
            await service.updateLabResult('result-1', { status: 'completed' as any });
            expect(firestoreMock.collection).toHaveBeenCalled();
        });
    });

    describe('deleteLabResult', () => {
        it('should delete a lab result', async () => {
            await service.deleteLabResult('result-1');
            expect(firestoreMock.collection).toHaveBeenCalled();
        });
    });

    describe('evaluateResult', () => {
        it('should return normal for values in range', () => {
            const result = service.evaluateResult(5, 3, 10);
            expect(result).toBe('normal');
        });

        it('should return low for values below range', () => {
            const result = service.evaluateResult(2, 3, 10);
            expect(result).toBe('low');
        });

        it('should return high for values above range', () => {
            const result = service.evaluateResult(15, 3, 10);
            expect(result).toBe('high');
        });

        it('should return critical for very low values', () => {
            const result = service.evaluateResult(1, 5, 10);
            expect(result).toBe('critical');
        });

        it('should return critical for very high values', () => {
            const result = service.evaluateResult(20, 3, 10);
            expect(result).toBe('critical');
        });
    });

    describe('getCommonParameters', () => {
        it('should return parameters for hematology', () => {
            const params = service.getCommonParameters('hematology', 'dog');
            expect(params).toBeDefined();
            expect(Array.isArray(params)).toBeTrue();
        });

        it('should return parameters for biochemistry', () => {
            const params = service.getCommonParameters('biochemistry', 'cat');
            expect(params).toBeDefined();
        });
    });

    describe('generateEmptyResults', () => {
        it('should generate empty results for a test type', () => {
            const results = service.generateEmptyResults('hematology', 'dog');
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBeTrue();
        });
    });

    describe('getResultStats', () => {
        it('should return result statistics', async () => {
            const stats = await service.getResultStats('pet-1');
            expect(stats).toBeDefined();
            expect(stats.total).toBeDefined();
            expect(stats.pending).toBeDefined();
            expect(stats.critical).toBeDefined();
        });
    });
});
