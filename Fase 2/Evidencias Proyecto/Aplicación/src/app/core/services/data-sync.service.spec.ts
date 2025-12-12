import { TestBed } from '@angular/core/testing';
import { DataSyncService } from './data-sync.service';
import { Firestore, collection, doc, setDoc, getDoc, writeBatch, DocumentReference } from '@angular/fire/firestore';
import { ValidationService } from './validation.service';
import { LoggerService } from './logger.service';
import { of } from 'rxjs';

describe('DataSyncService', () => {
    let service: DataSyncService;
    let firestoreMock: any;
    let validationService: jasmine.SpyObj<ValidationService>;
    let logger: jasmine.SpyObj<LoggerService>;

    beforeEach(() => {
        firestoreMock = {};

        const validationSpy = jasmine.createSpyObj('ValidationService', [
            'validateObject',
            'prepareSafeData',
            'getErrorSummary'
        ]);
        validationSpy.validateObject.and.returnValue({
            isValid: true,
            errors: {},
            warnings: {}
        });
        validationSpy.prepareSafeData.and.returnValue({});
        validationSpy.getErrorSummary.and.returnValue([]);

        const loggerSpy = jasmine.createSpyObj('LoggerService', ['info', 'error', 'debug', 'warn']);

        TestBed.configureTestingModule({
            providers: [
                DataSyncService,
                { provide: Firestore, useValue: firestoreMock },
                { provide: ValidationService, useValue: validationSpy },
                { provide: LoggerService, useValue: loggerSpy }
            ]
        });

        service = TestBed.inject(DataSyncService);
        validationService = TestBed.inject(ValidationService) as jasmine.SpyObj<ValidationService>;
        logger = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
    });

    describe('Service Creation', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });
    });

    describe('validateBefore', () => {
        it('should validate data before saving', () => {
            const data = { name: 'Test', email: 'test@test.com' };
            const result = service.validateBefore('user', data);

            expect(result).toBeDefined();
            expect(validationService.validateObject).toHaveBeenCalledWith('user', data);
        });

        it('should return validation result', () => {
            const result = service.validateBefore('user', {});
            expect(result.isValid).toBeDefined();
        });
    });

    describe('getValidationSchema', () => {
        it('should return validation schema for entity', () => {
            const schema = service.getValidationSchema('user');
            expect(schema).toBeDefined();
        });
    });

    describe('getValidationRules', () => {
        it('should return validation rules for entity', () => {
            const rules = service.getValidationRules('user');
            expect(rules).toBeDefined();
        });

        it('should return rules for specific field', () => {
            const rules = service.getValidationRules('user', 'email');
            expect(rules).toBeDefined();
        });
    });

    describe('generateValidationReport', () => {
        it('should generate validation report', () => {
            const data = { name: 'Test', email: 'test@test.com' };
            const report = service.generateValidationReport('user', data);

            expect(report).toBeDefined();
            expect(typeof report).toBe('string');
        });

        it('should include entity type in report', () => {
            const report = service.generateValidationReport('user', {});
            expect(report).toContain('user');
        });
    });
});
