/**
 * Interfaces para resultados de laboratorio
 */

export interface LabResult {
    id?: string;
    petId: string;
    appointmentId?: string;
    testType: LabTestType;
    testName: string;
    results: LabTestResult[];
    laboratory: string;
    requestedDate: Date;
    resultDate: Date;
    status: 'pending' | 'in_progress' | 'completed';
    notes?: string;
    attachments?: string[];
    veterinarianId: string;
    createdAt: Date;
    updatedAt?: Date;
}

export type LabTestType =
    | 'hematology'      // Hemograma
    | 'biochemistry'    // Bioquímica
    | 'urinalysis'      // Uroanálisis
    | 'fecal'           // Coproparasitológico
    | 'cytology'        // Citología
    | 'histopathology'  // Histopatología
    | 'microbiology'    // Microbiología
    | 'hormones'        // Hormonas
    | 'serology'        // Serología
    | 'imaging'         // Imagenología
    | 'other';

export interface LabTestResult {
    parameter: string;
    value: string | number;
    unit: string;
    referenceRange: {
        min?: number;
        max?: number;
        text?: string;
    };
    status: 'normal' | 'low' | 'high' | 'critical';
    notes?: string;
}

export interface CommonLabParameters {
    hematology: {
        name: string;
        parameters: Array<{
            name: string;
            unit: string;
            dogRange: { min: number; max: number };
            catRange: { min: number; max: number };
        }>;
    };
    biochemistry: {
        name: string;
        parameters: Array<{
            name: string;
            unit: string;
            dogRange: { min: number; max: number };
            catRange: { min: number; max: number };
        }>;
    };
}

// Parámetros comunes de laboratorio con rangos de referencia
export const COMMON_LAB_PARAMETERS: CommonLabParameters = {
    hematology: {
        name: 'Hemograma Completo',
        parameters: [
            { name: 'Eritrocitos (RBC)', unit: 'x10⁶/µL', dogRange: { min: 5.5, max: 8.5 }, catRange: { min: 5.0, max: 10.0 } },
            { name: 'Hemoglobina (Hb)', unit: 'g/dL', dogRange: { min: 12, max: 18 }, catRange: { min: 8, max: 15 } },
            { name: 'Hematocrito (Hct)', unit: '%', dogRange: { min: 37, max: 55 }, catRange: { min: 30, max: 45 } },
            { name: 'Leucocitos (WBC)', unit: 'x10³/µL', dogRange: { min: 6, max: 17 }, catRange: { min: 5.5, max: 19.5 } },
            { name: 'Plaquetas', unit: 'x10³/µL', dogRange: { min: 175, max: 500 }, catRange: { min: 175, max: 500 } },
            { name: 'Neutrófilos', unit: '%', dogRange: { min: 60, max: 77 }, catRange: { min: 35, max: 75 } },
            { name: 'Linfocitos', unit: '%', dogRange: { min: 12, max: 30 }, catRange: { min: 20, max: 55 } },
            { name: 'Monocitos', unit: '%', dogRange: { min: 3, max: 10 }, catRange: { min: 1, max: 4 } },
        ]
    },
    biochemistry: {
        name: 'Perfil Bioquímico',
        parameters: [
            { name: 'Glucosa', unit: 'mg/dL', dogRange: { min: 74, max: 143 }, catRange: { min: 74, max: 159 } },
            { name: 'Urea (BUN)', unit: 'mg/dL', dogRange: { min: 7, max: 27 }, catRange: { min: 16, max: 36 } },
            { name: 'Creatinina', unit: 'mg/dL', dogRange: { min: 0.5, max: 1.8 }, catRange: { min: 0.8, max: 2.4 } },
            { name: 'ALT (GPT)', unit: 'U/L', dogRange: { min: 10, max: 125 }, catRange: { min: 12, max: 130 } },
            { name: 'AST (GOT)', unit: 'U/L', dogRange: { min: 0, max: 50 }, catRange: { min: 0, max: 48 } },
            { name: 'Fosfatasa Alcalina', unit: 'U/L', dogRange: { min: 23, max: 212 }, catRange: { min: 14, max: 111 } },
            { name: 'Proteínas Totales', unit: 'g/dL', dogRange: { min: 5.2, max: 8.2 }, catRange: { min: 5.7, max: 8.9 } },
            { name: 'Albúmina', unit: 'g/dL', dogRange: { min: 2.3, max: 4.0 }, catRange: { min: 2.1, max: 3.3 } },
            { name: 'Bilirrubina Total', unit: 'mg/dL', dogRange: { min: 0, max: 0.9 }, catRange: { min: 0, max: 0.9 } },
            { name: 'Colesterol', unit: 'mg/dL', dogRange: { min: 110, max: 320 }, catRange: { min: 89, max: 176 } },
        ]
    }
};
