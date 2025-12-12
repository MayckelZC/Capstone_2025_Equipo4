/**
 * Validators Schema
 * 
 * Define todas las reglas de validación de forma centralizada
 * Se usa en: Cliente (Reactive Forms) + Firestore Rules
 * 
 * Esto asegura que SIEMPRE exista sincronía entre validaciones
 */

// ==================== TIPOS ====================

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'email' | 'min' | 'max' | 'custom';
  value?: any;
  message: string;
  severity?: 'error' | 'warning'; // 'error' = bloquea, 'warning' = alerta
}

export interface ValidationSchema {
  [fieldName: string]: ValidationRule[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>; // campo -> lista de errores
  warnings: Record<string, string[]>;
}

// ==================== USUARIOS ====================

export const USER_VALIDATORS: ValidationSchema = {
  // Email
  email: [
    { type: 'required', message: 'Email es requerido', severity: 'error' },
    { type: 'email', message: 'Email debe ser válido', severity: 'error' },
    { type: 'maxLength', value: 254, message: 'Email no puede exceder 254 caracteres', severity: 'error' }
  ],

  // Contraseña
  password: [
    { type: 'required', message: 'Contraseña es requerida', severity: 'error' },
    { type: 'minLength', value: 8, message: 'Mínimo 8 caracteres', severity: 'error' },
    { type: 'maxLength', value: 128, message: 'Máximo 128 caracteres', severity: 'error' },
    { type: 'pattern', value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: 'Debe contener mayúscula, minúscula y número', severity: 'error' }
  ],

  // Nombre
  name: [
    { type: 'required', message: 'Nombre es requerido', severity: 'error' },
    { type: 'minLength', value: 2, message: 'Mínimo 2 caracteres', severity: 'error' },
    { type: 'maxLength', value: 100, message: 'Máximo 100 caracteres', severity: 'error' },
    { type: 'pattern', value: /^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]*$/, message: 'Solo letras y espacios permitidos', severity: 'error' }
  ],

  // Teléfono
  phone: [
    { type: 'pattern', value: /^\+?[\d\s\-\(\)]{10,}$/, message: 'Teléfono inválido', severity: 'error' },
    { type: 'maxLength', value: 20, message: 'Máximo 20 caracteres', severity: 'error' }
  ],

  // Ciudad
  city: [
    { type: 'required', message: 'Ciudad es requerida', severity: 'error' },
    { type: 'minLength', value: 2, message: 'Mínimo 2 caracteres', severity: 'error' },
    { type: 'maxLength', value: 100, message: 'Máximo 100 caracteres', severity: 'error' }
  ],

  // País
  country: [
    { type: 'required', message: 'País es requerido', severity: 'error' },
    { type: 'minLength', value: 2, message: 'Mínimo 2 caracteres', severity: 'error' },
    { type: 'maxLength', value: 100, message: 'Máximo 100 caracteres', severity: 'error' }
  ],

  // Biografía
  bio: [
    { type: 'maxLength', value: 500, message: 'Máximo 500 caracteres', severity: 'error' }
  ]
};

// ==================== MASCOTAS ====================

export const PET_VALIDATORS: ValidationSchema = {
  // Nombre
  name: [
    { type: 'required', message: 'Nombre de mascota es requerido', severity: 'error' },
    { type: 'minLength', value: 2, message: 'Mínimo 2 caracteres', severity: 'error' },
    { type: 'maxLength', value: 100, message: 'Máximo 100 caracteres', severity: 'error' },
    { type: 'pattern', value: /^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s\-]*$/, message: 'Solo letras, espacios y guiones', severity: 'error' }
  ],

  // Especie
  species: [
    { type: 'required', message: 'Especie es requerida', severity: 'error' },
    { type: 'pattern', value: /^(perro|gato|conejo|otro)$/i, message: 'Especie debe ser: perro, gato, conejo u otro', severity: 'error' }
  ],

  // Raza
  breed: [
    { type: 'required', message: 'Raza es requerida', severity: 'error' },
    { type: 'minLength', value: 2, message: 'Mínimo 2 caracteres', severity: 'error' },
    { type: 'maxLength', value: 100, message: 'Máximo 100 caracteres', severity: 'error' }
  ],

  // Edad
  age: [
    { type: 'required', message: 'Edad es requerida', severity: 'error' },
    { type: 'min', value: 0, message: 'Edad no puede ser negativa', severity: 'error' },
    { type: 'max', value: 50, message: 'Edad máxima es 50 años', severity: 'error' }
  ],

  // Peso
  weight: [
    { type: 'required', message: 'Peso es requerido', severity: 'error' },
    { type: 'min', value: 0.1, message: 'Peso debe ser mayor a 0.1 kg', severity: 'error' },
    { type: 'max', value: 200, message: 'Peso máximo es 200 kg', severity: 'error' }
  ],

  // Descripción
  description: [
    { type: 'maxLength', value: 2000, message: 'Máximo 2000 caracteres', severity: 'error' }
  ],

  // Ubicación
  location: [
    { type: 'required', message: 'Ubicación es requerida', severity: 'error' },
    { type: 'maxLength', value: 500, message: 'Máximo 500 caracteres', severity: 'error' }
  ],

  // Estado de salud
  healthStatus: [
    { type: 'pattern', value: /^(healthy|sick|injured|vaccinated|needs_care)$/i, message: 'Estado de salud inválido', severity: 'error' }
  ],

  // Disponibilidad
  status: [
    { type: 'required', message: 'Estado es requerido', severity: 'error' },
    { type: 'pattern', value: /^(available|adopted|reserved|pending)$/i, message: 'Estado debe ser: available, adopted, reserved o pending', severity: 'error' }
  ]
};

// ==================== SOLICITUDES DE ADOPCIÓN ====================

export const ADOPTION_REQUEST_VALIDATORS: ValidationSchema = {
  // Motivo
  reason: [
    { type: 'required', message: 'Motivo de adopción es requerido', severity: 'error' },
    { type: 'minLength', value: 10, message: 'Mínimo 10 caracteres', severity: 'error' },
    { type: 'maxLength', value: 1000, message: 'Máximo 1000 caracteres', severity: 'error' }
  ],

  // Experiencia
  petExperience: [
    { type: 'required', message: 'Experiencia con mascotas es requerida', severity: 'error' },
    { type: 'minLength', value: 10, message: 'Mínimo 10 caracteres', severity: 'error' },
    { type: 'maxLength', value: 1000, message: 'Máximo 1000 caracteres', severity: 'error' }
  ],

  // Alojamiento
  homeType: [
    { type: 'required', message: 'Tipo de alojamiento es requerido', severity: 'error' },
    { type: 'pattern', value: /^(apartment|house|farm|other)$/i, message: 'Tipo inválido', severity: 'error' }
  ],

  // Superficie
  homeSize: [
    { type: 'required', message: 'Superficie es requerida', severity: 'error' },
    { type: 'min', value: 10, message: 'Mínimo 10 m²', severity: 'error' },
    { type: 'max', value: 10000, message: 'Máximo 10000 m²', severity: 'error' }
  ],

  // Jardín
  hasYard: [
    { type: 'required', message: 'Debe indicar si tiene jardín', severity: 'error' }
  ],

  // Cantidad mascotas
  otherPetsCount: [
    { type: 'min', value: 0, message: 'No puede ser negativo', severity: 'error' },
    { type: 'max', value: 20, message: 'Máximo 20 mascotas', severity: 'error' }
  ],

  // Estado: pending, approved, rejected
  status: [
    { type: 'pattern', value: /^(pending|approved|rejected|withdrawn)$/i, message: 'Estado inválido', severity: 'error' }
  ]
};

// ==================== MENSAJES ====================

export const MESSAGE_VALIDATORS: ValidationSchema = {
  // Contenido
  content: [
    { type: 'required', message: 'Mensaje no puede estar vacío', severity: 'error' },
    { type: 'minLength', value: 1, message: 'Mínimo 1 carácter', severity: 'error' },
    { type: 'maxLength', value: 5000, message: 'Máximo 5000 caracteres', severity: 'error' }
  ]
};

// ==================== CITAS VETERINARIAS ====================

export const VET_APPOINTMENT_VALIDATORS: ValidationSchema = {
  // Fecha
  date: [
    { type: 'required', message: 'Fecha es requerida', severity: 'error' }
  ],

  // Hora
  time: [
    { type: 'required', message: 'Hora es requerida', severity: 'error' },
    { type: 'pattern', value: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, message: 'Hora inválida (HH:MM)', severity: 'error' }
  ],

  // Tipo de cita
  type: [
    { type: 'required', message: 'Tipo de cita es requerido', severity: 'error' },
    { type: 'pattern', value: /^(checkup|vaccination|surgery|grooming|consultation)$/i, message: 'Tipo inválido', severity: 'error' }
  ],

  // Descripción de síntomas/razón
  reason: [
    { type: 'maxLength', value: 500, message: 'Máximo 500 caracteres', severity: 'error' }
  ]
};

// ==================== REPORTES ====================

export const REPORT_VALIDATORS: ValidationSchema = {
  // Tipo
  type: [
    { type: 'required', message: 'Tipo de reporte es requerido', severity: 'error' },
    { type: 'pattern', value: /^(abuse|fraud|inappropriate|other)$/i, message: 'Tipo inválido', severity: 'error' }
  ],

  // Descripción
  description: [
    { type: 'required', message: 'Descripción es requerida', severity: 'error' },
    { type: 'minLength', value: 20, message: 'Mínimo 20 caracteres', severity: 'error' },
    { type: 'maxLength', value: 2000, message: 'Máximo 2000 caracteres', severity: 'error' }
  ],

  // Evidencia (opcional)
  evidence: [
    { type: 'maxLength', value: 5000, message: 'Máximo 5000 caracteres', severity: 'error' }
  ]
};

// ==================== FUNCIONES AUXILIARES ====================

/**
 * Obtener esquema de validación por tipo de entidad
 */
export function getValidationSchema(entityType: string): ValidationSchema {
  const schemas: Record<string, ValidationSchema> = {
    user: USER_VALIDATORS,
    pet: PET_VALIDATORS,
    adoptionRequest: ADOPTION_REQUEST_VALIDATORS,
    message: MESSAGE_VALIDATORS,
    vetAppointment: VET_APPOINTMENT_VALIDATORS,
    report: REPORT_VALIDATORS
  };

  return schemas[entityType] || {};
}

/**
 * Obtener reglas para un campo específico
 */
export function getFieldRules(entityType: string, fieldName: string): ValidationRule[] {
  const schema = getValidationSchema(entityType);
  return schema[fieldName] || [];
}

/**
 * Obtener mensaje de error para una regla
 */
export function getErrorMessage(entityType: string, fieldName: string, ruleType: string): string {
  const rules = getFieldRules(entityType, fieldName);
  const rule = rules.find(r => r.type === ruleType);
  return rule?.message || `${fieldName} es inválido`;
}
