import { Injectable } from '@angular/core';

export interface Medication {
    id: string;
    name: string;
    genericName: string;
    category: string;
    presentations: string[];
    dosagePerKg: {
        min: number;
        max: number;
        unit: string;
        frequency: string;
    };
    contraindications: string[];
    species: ('perro' | 'gato' | 'ave' | 'todos')[];
    notes?: string;
}

// Base de datos de medicamentos veterinarios comunes
const MEDICATIONS_DATABASE: Medication[] = [
    // Antibióticos
    {
        id: 'amoxicilina',
        name: 'Amoxicilina',
        genericName: 'Amoxicilina',
        category: 'Antibiótico',
        presentations: ['Tabletas 250mg', 'Tabletas 500mg', 'Suspensión 250mg/5ml'],
        dosagePerKg: { min: 10, max: 20, unit: 'mg/kg', frequency: 'cada 12h' },
        contraindications: ['Alergia a penicilinas'],
        species: ['todos'],
    },
    {
        id: 'amoxicilina-clavulanico',
        name: 'Amoxicilina + Ácido Clavulánico',
        genericName: 'Amoxicilina/Clavulanato',
        category: 'Antibiótico',
        presentations: ['Tabletas 250/62.5mg', 'Tabletas 500/125mg', 'Suspensión'],
        dosagePerKg: { min: 12.5, max: 25, unit: 'mg/kg', frequency: 'cada 12h' },
        contraindications: ['Alergia a penicilinas'],
        species: ['todos'],
    },
    {
        id: 'enrofloxacina',
        name: 'Enrofloxacina',
        genericName: 'Enrofloxacina',
        category: 'Antibiótico',
        presentations: ['Tabletas 50mg', 'Tabletas 150mg', 'Inyectable'],
        dosagePerKg: { min: 5, max: 10, unit: 'mg/kg', frequency: 'cada 24h' },
        contraindications: ['Cachorros en crecimiento', 'Gestación'],
        species: ['perro', 'gato'],
        notes: 'No usar en animales jóvenes en crecimiento'
    },
    {
        id: 'metronidazol',
        name: 'Metronidazol',
        genericName: 'Metronidazol',
        category: 'Antibiótico/Antiparasitario',
        presentations: ['Tabletas 250mg', 'Tabletas 500mg', 'Suspensión'],
        dosagePerKg: { min: 10, max: 25, unit: 'mg/kg', frequency: 'cada 12h' },
        contraindications: ['Gestación', 'Insuficiencia hepática severa'],
        species: ['todos'],
    },
    {
        id: 'doxiciclina',
        name: 'Doxiciclina',
        genericName: 'Doxiciclina',
        category: 'Antibiótico',
        presentations: ['Cápsulas 100mg', 'Tabletas 100mg'],
        dosagePerKg: { min: 5, max: 10, unit: 'mg/kg', frequency: 'cada 12-24h' },
        contraindications: ['Cachorros menores de 6 meses', 'Gestación'],
        species: ['todos'],
    },
    {
        id: 'cefalexina',
        name: 'Cefalexina',
        genericName: 'Cefalexina',
        category: 'Antibiótico',
        presentations: ['Cápsulas 250mg', 'Cápsulas 500mg', 'Suspensión'],
        dosagePerKg: { min: 15, max: 30, unit: 'mg/kg', frequency: 'cada 12h' },
        contraindications: ['Alergia a cefalosporinas'],
        species: ['todos'],
    },

    // Antiinflamatorios
    {
        id: 'meloxicam',
        name: 'Meloxicam',
        genericName: 'Meloxicam',
        category: 'AINE',
        presentations: ['Tabletas 0.5mg', 'Tabletas 1mg', 'Tabletas 2mg', 'Gotas', 'Inyectable'],
        dosagePerKg: { min: 0.1, max: 0.2, unit: 'mg/kg', frequency: 'cada 24h' },
        contraindications: ['Insuficiencia renal', 'Úlceras GI', 'Deshidratación'],
        species: ['perro', 'gato'],
        notes: 'En gatos usar dosis más bajas'
    },
    {
        id: 'carprofeno',
        name: 'Carprofeno',
        genericName: 'Carprofeno',
        category: 'AINE',
        presentations: ['Tabletas 25mg', 'Tabletas 75mg', 'Tabletas 100mg'],
        dosagePerKg: { min: 2, max: 4, unit: 'mg/kg', frequency: 'cada 12-24h' },
        contraindications: ['Insuficiencia renal/hepática', 'Úlceras GI'],
        species: ['perro'],
        notes: 'No recomendado en gatos'
    },
    {
        id: 'prednisolona',
        name: 'Prednisolona',
        genericName: 'Prednisolona',
        category: 'Corticosteroide',
        presentations: ['Tabletas 5mg', 'Tabletas 20mg', 'Gotas oftálmicas'],
        dosagePerKg: { min: 0.5, max: 2, unit: 'mg/kg', frequency: 'cada 12-24h' },
        contraindications: ['Infecciones sistémicas', 'Diabetes no controlada'],
        species: ['todos'],
        notes: 'Reducir dosis gradualmente'
    },
    {
        id: 'dexametasona',
        name: 'Dexametasona',
        genericName: 'Dexametasona',
        category: 'Corticosteroide',
        presentations: ['Inyectable', 'Tabletas'],
        dosagePerKg: { min: 0.1, max: 0.5, unit: 'mg/kg', frequency: 'cada 12-24h' },
        contraindications: ['Infecciones sistémicas', 'Diabetes'],
        species: ['todos'],
    },

    // Analgésicos
    {
        id: 'tramadol',
        name: 'Tramadol',
        genericName: 'Tramadol',
        category: 'Analgésico opioide',
        presentations: ['Cápsulas 50mg', 'Gotas'],
        dosagePerKg: { min: 2, max: 5, unit: 'mg/kg', frequency: 'cada 8-12h' },
        contraindications: ['Epilepsia', 'Uso con IMAO'],
        species: ['perro', 'gato'],
    },
    {
        id: 'gabapentina',
        name: 'Gabapentina',
        genericName: 'Gabapentina',
        category: 'Analgésico/Anticonvulsivo',
        presentations: ['Cápsulas 100mg', 'Cápsulas 300mg', 'Cápsulas 400mg'],
        dosagePerKg: { min: 5, max: 10, unit: 'mg/kg', frequency: 'cada 8-12h' },
        contraindications: ['Insuficiencia renal severa'],
        species: ['perro', 'gato'],
        notes: 'Útil para dolor neuropático y ansiedad'
    },

    // Antiparasitarios
    {
        id: 'ivermectina',
        name: 'Ivermectina',
        genericName: 'Ivermectina',
        category: 'Antiparasitario',
        presentations: ['Tabletas', 'Inyectable', 'Spot-on'],
        dosagePerKg: { min: 0.006, max: 0.012, unit: 'mg/kg', frequency: 'dosis única' },
        contraindications: ['Collies y razas sensibles al gen MDR1'],
        species: ['perro', 'gato'],
        notes: 'Precaución en razas pastor'
    },
    {
        id: 'fenbendazol',
        name: 'Fenbendazol',
        genericName: 'Fenbendazol',
        category: 'Antiparasitario',
        presentations: ['Suspensión', 'Tabletas', 'Pasta'],
        dosagePerKg: { min: 50, max: 50, unit: 'mg/kg', frequency: 'cada 24h por 3-5 días' },
        contraindications: [],
        species: ['todos'],
    },
    {
        id: 'praziquantel',
        name: 'Praziquantel',
        genericName: 'Praziquantel',
        category: 'Antiparasitario',
        presentations: ['Tabletas', 'Inyectable'],
        dosagePerKg: { min: 5, max: 10, unit: 'mg/kg', frequency: 'dosis única' },
        contraindications: [],
        species: ['todos'],
        notes: 'Efectivo contra cestodos'
    },

    // Antieméticos
    {
        id: 'metoclopramida',
        name: 'Metoclopramida',
        genericName: 'Metoclopramida',
        category: 'Antiemético',
        presentations: ['Tabletas 10mg', 'Gotas', 'Inyectable'],
        dosagePerKg: { min: 0.2, max: 0.5, unit: 'mg/kg', frequency: 'cada 8h' },
        contraindications: ['Obstrucción GI', 'Epilepsia'],
        species: ['todos'],
    },
    {
        id: 'maropitant',
        name: 'Maropitant (Cerenia)',
        genericName: 'Maropitant',
        category: 'Antiemético',
        presentations: ['Tabletas', 'Inyectable'],
        dosagePerKg: { min: 2, max: 2, unit: 'mg/kg', frequency: 'cada 24h' },
        contraindications: ['Cachorros menores de 8 semanas'],
        species: ['perro', 'gato'],
        notes: 'De elección para vómitos'
    },
    {
        id: 'ondansetron',
        name: 'Ondansetrón',
        genericName: 'Ondansetrón',
        category: 'Antiemético',
        presentations: ['Tabletas 4mg', 'Tabletas 8mg', 'Inyectable'],
        dosagePerKg: { min: 0.5, max: 1, unit: 'mg/kg', frequency: 'cada 12h' },
        contraindications: [],
        species: ['todos'],
    },

    // Gastroprotectores
    {
        id: 'omeprazol',
        name: 'Omeprazol',
        genericName: 'Omeprazol',
        category: 'Protector gástrico',
        presentations: ['Cápsulas 10mg', 'Cápsulas 20mg'],
        dosagePerKg: { min: 0.7, max: 1, unit: 'mg/kg', frequency: 'cada 24h' },
        contraindications: [],
        species: ['todos'],
        notes: 'Dar en ayunas, 30 min antes de la comida'
    },
    {
        id: 'ranitidina',
        name: 'Ranitidina',
        genericName: 'Ranitidina',
        category: 'Protector gástrico',
        presentations: ['Tabletas 150mg', 'Tabletas 300mg', 'Jarabe'],
        dosagePerKg: { min: 1, max: 2, unit: 'mg/kg', frequency: 'cada 12h' },
        contraindications: ['Insuficiencia renal/hepática severa'],
        species: ['todos'],
    },
    {
        id: 'sucralfato',
        name: 'Sucralfato',
        genericName: 'Sucralfato',
        category: 'Protector gástrico',
        presentations: ['Tabletas 1g', 'Suspensión'],
        dosagePerKg: { min: 0.5, max: 1, unit: 'g por animal', frequency: 'cada 8h' },
        contraindications: [],
        species: ['todos'],
        notes: 'Dar 30 min antes de las comidas'
    },

    // Antihistamínicos
    {
        id: 'difenhidramina',
        name: 'Difenhidramina',
        genericName: 'Difenhidramina',
        category: 'Antihistamínico',
        presentations: ['Cápsulas 25mg', 'Jarabe', 'Inyectable'],
        dosagePerKg: { min: 2, max: 4, unit: 'mg/kg', frequency: 'cada 8-12h' },
        contraindications: ['Glaucoma', 'Retención urinaria'],
        species: ['todos'],
    },
    {
        id: 'cetirizina',
        name: 'Cetirizina',
        genericName: 'Cetirizina',
        category: 'Antihistamínico',
        presentations: ['Tabletas 10mg', 'Gotas'],
        dosagePerKg: { min: 1, max: 1, unit: 'mg/kg', frequency: 'cada 24h' },
        contraindications: ['Insuficiencia renal severa'],
        species: ['perro', 'gato'],
    },

    // Diuréticos
    {
        id: 'furosemida',
        name: 'Furosemida',
        genericName: 'Furosemida',
        category: 'Diurético',
        presentations: ['Tabletas 40mg', 'Inyectable'],
        dosagePerKg: { min: 1, max: 4, unit: 'mg/kg', frequency: 'cada 8-12h' },
        contraindications: ['Deshidratación', 'Hipopotasemia'],
        species: ['todos'],
        notes: 'Monitorear electrolitos'
    },

    // Cardíacos
    {
        id: 'enalapril',
        name: 'Enalapril',
        genericName: 'Enalapril',
        category: 'Cardiovascular (IECA)',
        presentations: ['Tabletas 2.5mg', 'Tabletas 5mg', 'Tabletas 10mg'],
        dosagePerKg: { min: 0.25, max: 0.5, unit: 'mg/kg', frequency: 'cada 12-24h' },
        contraindications: ['Hipotensión', 'Estenosis aórtica'],
        species: ['todos'],
    },
    {
        id: 'pimobendan',
        name: 'Pimobendan',
        genericName: 'Pimobendan',
        category: 'Cardiovascular',
        presentations: ['Cápsulas 1.25mg', 'Cápsulas 2.5mg', 'Cápsulas 5mg'],
        dosagePerKg: { min: 0.25, max: 0.3, unit: 'mg/kg', frequency: 'cada 12h' },
        contraindications: ['Cardiomiopatía hipertrófica', 'Estenosis aórtica'],
        species: ['perro'],
        notes: 'Dar 1 hora antes de las comidas'
    },

    // Otros
    {
        id: 'metilprednisolona',
        name: 'Metilprednisolona',
        genericName: 'Metilprednisolona',
        category: 'Corticosteroide',
        presentations: ['Tabletas 4mg', 'Inyectable depot'],
        dosagePerKg: { min: 0.5, max: 2, unit: 'mg/kg', frequency: 'cada 12-24h' },
        contraindications: ['Infecciones sistémicas'],
        species: ['todos'],
    },
    {
        id: 'fenobarbital',
        name: 'Fenobarbital',
        genericName: 'Fenobarbital',
        category: 'Anticonvulsivo',
        presentations: ['Tabletas', 'Elixir'],
        dosagePerKg: { min: 2, max: 5, unit: 'mg/kg', frequency: 'cada 12h' },
        contraindications: ['Insuficiencia hepática severa'],
        species: ['perro', 'gato'],
        notes: 'Monitorear niveles séricos'
    },
];

@Injectable({
    providedIn: 'root'
})
export class MedicationService {

    private medications = MEDICATIONS_DATABASE;

    constructor() { }

    /**
     * Buscar medicamentos por nombre
     */
    searchMedications(term: string, species?: string): Medication[] {
        if (!term || term.length < 2) {
            return [];
        }

        const lowerTerm = term.toLowerCase();

        return this.medications.filter(med => {
            // Filtrar por nombre
            const matchesName = med.name.toLowerCase().includes(lowerTerm) ||
                med.genericName.toLowerCase().includes(lowerTerm) ||
                med.category.toLowerCase().includes(lowerTerm);

            // Filtrar por especie si se especifica
            if (species && matchesName) {
                const speciesLower = species.toLowerCase();
                return med.species.includes('todos') ||
                    med.species.some(s => s.toLowerCase() === speciesLower);
            }

            return matchesName;
        });
    }

    /**
     * Obtener medicamento por ID
     */
    getMedicationById(id: string): Medication | undefined {
        return this.medications.find(med => med.id === id);
    }

    /**
     * Calcular dosis sugerida basada en el peso del animal
     */
    calculateDose(medication: Medication, weightKg: number): {
        minDose: string;
        maxDose: string;
        frequency: string;
        presentation: string;
    } {
        const minDose = medication.dosagePerKg.min * weightKg;
        const maxDose = medication.dosagePerKg.max * weightKg;

        // Buscar la presentación más adecuada
        const defaultPresentation = medication.presentations[0] || '';

        return {
            minDose: `${minDose.toFixed(2)} ${medication.dosagePerKg.unit.split('/')[0]}`,
            maxDose: `${maxDose.toFixed(2)} ${medication.dosagePerKg.unit.split('/')[0]}`,
            frequency: medication.dosagePerKg.frequency,
            presentation: defaultPresentation
        };
    }

    /**
     * Obtener todos los medicamentos de una categoría
     */
    getMedicationsByCategory(category: string): Medication[] {
        return this.medications.filter(med =>
            med.category.toLowerCase().includes(category.toLowerCase())
        );
    }

    /**
     * Obtener categorías disponibles
     */
    getCategories(): string[] {
        const categories = new Set(this.medications.map(med => med.category));
        return Array.from(categories).sort();
    }

    /**
     * Verificar contraindicaciones
     */
    checkContraindications(medicationId: string, conditions: string[]): string[] {
        const medication = this.getMedicationById(medicationId);
        if (!medication) return [];

        return medication.contraindications.filter(contra =>
            conditions.some(cond =>
                contra.toLowerCase().includes(cond.toLowerCase()) ||
                cond.toLowerCase().includes(contra.toLowerCase())
            )
        );
    }
}
