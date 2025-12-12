import { TestBed } from '@angular/core/testing';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ValidationService } from './validation.service';

describe('ValidationService', () => {
    let service: ValidationService;
    let fb: FormBuilder;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ValidationService, FormBuilder]
        });

        service = TestBed.inject(ValidationService);
        fb = TestBed.inject(FormBuilder);
    });

    describe('Service Creation', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });
    });

    describe('createFieldValidators', () => {
        it('should create validators for user email', () => {
            const validators = service.createFieldValidators('user', 'email');
            expect(Array.isArray(validators)).toBeTrue();
        });

        it('should return empty array for unknown entity', () => {
            const validators = service.createFieldValidators('unknown', 'field');
            expect(validators).toEqual([]);
        });
    });

    describe('isValidEmail', () => {
        it('should validate correct email', () => {
            expect(service.isValidEmail('test@example.com')).toBeTrue();
        });

        it('should reject invalid email', () => {
            expect(service.isValidEmail('invalid-email')).toBeFalse();
        });

        it('should reject email without domain', () => {
            expect(service.isValidEmail('test@')).toBeFalse();
        });

        it('should reject email without @', () => {
            expect(service.isValidEmail('testexample.com')).toBeFalse();
        });

        it('should reject empty string', () => {
            expect(service.isValidEmail('')).toBeFalse();
        });
    });

    describe('isValidUrl', () => {
        it('should validate correct URL', () => {
            expect(service.isValidUrl('https://example.com')).toBeTrue();
        });

        it('should validate URL with path', () => {
            expect(service.isValidUrl('https://example.com/path/to/page')).toBeTrue();
        });

        it('should reject invalid URL', () => {
            expect(service.isValidUrl('not-a-url')).toBeFalse();
        });

        it('should reject empty string', () => {
            expect(service.isValidUrl('')).toBeFalse();
        });
    });

    describe('isValidDate', () => {
        it('should validate correct date format', () => {
            expect(service.isValidDate('2024-01-15')).toBeTrue();
        });

        it('should reject incorrect format', () => {
            expect(service.isValidDate('15-01-2024')).toBeFalse();
        });

        it('should reject invalid date', () => {
            expect(service.isValidDate('2024-13-45')).toBeFalse();
        });

        it('should reject non-date string', () => {
            expect(service.isValidDate('not-a-date')).toBeFalse();
        });
    });

    describe('validateField', () => {
        it('should validate required field with value', () => {
            const rule = { type: 'required' as const, message: 'Campo requerido' };
            expect(service.validateField('value', rule)).toBeNull();
        });

        it('should fail required field without value', () => {
            const rule = { type: 'required' as const, message: 'Campo requerido' };
            expect(service.validateField('', rule)).toBe('Campo requerido');
        });

        it('should validate minLength', () => {
            const rule = { type: 'minLength' as const, value: 5, message: 'Minimo 5' };
            expect(service.validateField('abc', rule)).toBe('Minimo 5');
            expect(service.validateField('abcdef', rule)).toBeNull();
        });

        it('should validate maxLength', () => {
            const rule = { type: 'maxLength' as const, value: 5, message: 'Maximo 5' };
            expect(service.validateField('abcdefgh', rule)).toBe('Maximo 5');
            expect(service.validateField('abc', rule)).toBeNull();
        });

        it('should validate email format', () => {
            const rule = { type: 'email' as const, message: 'Email invalido' };
            expect(service.validateField('invalid', rule)).toBe('Email invalido');
            expect(service.validateField('test@test.com', rule)).toBeNull();
        });

        it('should validate min number', () => {
            const rule = { type: 'min' as const, value: 10, message: 'Minimo 10' };
            expect(service.validateField(5, rule)).toBe('Minimo 10');
            expect(service.validateField(15, rule)).toBeNull();
        });

        it('should validate max number', () => {
            const rule = { type: 'max' as const, value: 100, message: 'Maximo 100' };
            expect(service.validateField(150, rule)).toBe('Maximo 100');
            expect(service.validateField(50, rule)).toBeNull();
        });
    });

    describe('countFormErrors', () => {
        it('should count errors in form', () => {
            const form = fb.group({
                name: ['', Validators.required],
                email: ['invalid', Validators.email]
            });

            const count = service.countFormErrors(form);
            expect(count).toBeGreaterThan(0);
        });

        it('should return 0 for valid form', () => {
            const form = fb.group({
                name: ['John'],
                email: ['john@example.com']
            });

            const count = service.countFormErrors(form);
            expect(count).toBe(0);
        });
    });

    describe('markFormGroupTouched', () => {
        it('should mark all controls as touched', () => {
            const form = fb.group({
                name: [''],
                email: ['']
            });

            expect(form.get('name')?.touched).toBeFalse();
            expect(form.get('email')?.touched).toBeFalse();

            service.markFormGroupTouched(form);

            expect(form.get('name')?.touched).toBeTrue();
            expect(form.get('email')?.touched).toBeTrue();
        });

        it('should handle nested form groups', () => {
            const form = fb.group({
                basic: fb.group({
                    name: ['']
                })
            });

            service.markFormGroupTouched(form);
            expect((form.get('basic') as FormGroup).get('name')?.touched).toBeTrue();
        });
    });

    describe('getErrorSummary', () => {
        it('should create error summary from validation result', () => {
            const result = {
                isValid: false,
                errors: {
                    name: ['Nombre requerido'],
                    email: ['Email invalido']
                },
                warnings: {}
            };

            const summary = service.getErrorSummary(result);

            expect(summary.length).toBe(2);
            expect(summary).toContain('name: Nombre requerido');
            expect(summary).toContain('email: Email invalido');
        });

        it('should return empty array for valid result', () => {
            const result = {
                isValid: true,
                errors: {},
                warnings: {}
            };

            const summary = service.getErrorSummary(result);
            expect(summary.length).toBe(0);
        });
    });

    describe('prepareSafeData', () => {
        it('should trim string values', () => {
            const data = { name: '  John  ', email: '  test@test.com  ' };
            const safe = service.prepareSafeData('user', data);

            if (safe.name) {
                expect(safe.name).not.toContain('  ');
            }
        });
    });
});
