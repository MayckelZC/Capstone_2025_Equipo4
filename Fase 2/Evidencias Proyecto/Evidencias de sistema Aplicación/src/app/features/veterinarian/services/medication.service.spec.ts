import { TestBed } from '@angular/core/testing';
import { MedicationService } from './medication.service';

describe('MedicationService', () => {
    let service: MedicationService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [MedicationService]
        });

        service = TestBed.inject(MedicationService);
    });

    describe('Service Creation', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });
    });

    describe('searchMedications', () => {
        it('should search medications by name', () => {
            const results = service.searchMedications('amoxi');
            expect(results.length).toBeGreaterThan(0);
        });

        it('should return empty for no match', () => {
            const results = service.searchMedications('xyz123nonexistent');
            expect(results.length).toBe(0);
        });

        it('should be case insensitive', () => {
            const results1 = service.searchMedications('AMOXI');
            const results2 = service.searchMedications('amoxi');
            expect(results1.length).toBe(results2.length);
        });
    });

    describe('getMedicationById', () => {
        it('should get medication by id', () => {
            const medication = service.getMedicationById('amoxicilina');
            expect(medication).toBeDefined();
            expect(medication?.name).toBe('Amoxicilina');
        });

        it('should return undefined for unknown id', () => {
            const medication = service.getMedicationById('unknown');
            expect(medication).toBeUndefined();
        });
    });

    describe('calculateDosage', () => {
        it('should calculate dosage for given weight', () => {
            const dosage = service.calculateDosage('amoxicilina', 10);
            expect(dosage).toBeDefined();
            expect(dosage.minDose).toBeDefined();
            expect(dosage.maxDose).toBeDefined();
        });

        it('should include frequency in result', () => {
            const dosage = service.calculateDosage('amoxicilina', 10);
            expect(dosage.frequency).toBeDefined();
        });

        it('should handle unknown medication', () => {
            const dosage = service.calculateDosage('unknown', 10);
            expect(dosage).toBeNull();
        });
    });

    describe('getMedicationsByCategory', () => {
        it('should get medications by category', () => {
            const antibiotics = service.getMedicationsByCategory('Antibiótico');
            expect(antibiotics.length).toBeGreaterThan(0);
        });

        it('should return empty for unknown category', () => {
            const results = service.getMedicationsByCategory('UnknownCategory');
            expect(results.length).toBe(0);
        });
    });

    describe('getCategories', () => {
        it('should return list of categories', () => {
            const categories = service.getCategories();
            expect(categories.length).toBeGreaterThan(0);
        });

        it('should include common categories', () => {
            const categories = service.getCategories();
            expect(categories).toContain('Antibiótico');
        });
    });

    describe('checkContraindications', () => {
        it('should check for contraindications', () => {
            const contraindications = service.checkContraindications('amoxicilina', ['Alergia a penicilina']);
            expect(contraindications.length).toBeGreaterThan(0);
        });

        it('should return empty for no matching conditions', () => {
            const contraindications = service.checkContraindications('amoxicilina', ['None']);
            expect(contraindications.length).toBe(0);
        });
    });

    describe('getMedicationsForSpecies', () => {
        it('should get medications for dogs', () => {
            const medications = service.getMedicationsForSpecies('perro');
            expect(medications.length).toBeGreaterThan(0);
        });

        it('should get medications for cats', () => {
            const medications = service.getMedicationsForSpecies('gato');
            expect(medications.length).toBeGreaterThan(0);
        });
    });

    describe('getAllMedications', () => {
        it('should return all medications', () => {
            const medications = service.getAllMedications();
            expect(medications.length).toBeGreaterThan(0);
        });
    });
});
