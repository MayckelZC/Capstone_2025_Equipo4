/**
 * Constantes y Enums para el módulo de Veterinarian
 * Centraliza valores mágicos y strings hardcodeados
 */

// Enums
export enum DashboardView {
  Dashboard = 'dashboard',
  Appointments = 'appointments',
  Patients = 'patients',
  History = 'history'
}

export enum AppointmentStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  InProgress = 'in_progress',
  Completed = 'completed',
  Cancelled = 'cancelled'
}

export enum AppointmentPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical'
}

export enum RecordType {
  Checkup = 'checkup',
  Vaccine = 'vaccine',
  Surgery = 'surgery',
  Emergency = 'emergency',
  Treatment = 'treatment',
  Followup = 'followup'
}

// Constantes de Tiempo
export const TIME_CONSTANTS = {
  LOADING_DELAY_MS: 1000,
  DEBOUNCE_TIME_MS: 300,
  RETRY_DELAY_MS: 2000,
  TOAST_DURATION_MS: 3000,
  TOAST_SHORT_DURATION_MS: 2500
} as const;

// Constantes de Retry
export const RETRY_CONSTANTS = {
  MAX_RETRY_ATTEMPTS: 3,
  INITIAL_RETRY_DELAY: 2000,
  RETRY_BACKOFF_MULTIPLIER: 2
} as const;

// Constantes de Paginación
export const PAGINATION_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 20,
  APPOINTMENTS_PAGE_SIZE: 15,
  PATIENTS_PAGE_SIZE: 20,
  MAX_ITEMS_BEFORE_PAGINATION: 100
} as const;

// Constantes de Validación Médica
export const MEDICAL_VALIDATION = {
  MIN_WEIGHT_KG: 0.1,
  MAX_WEIGHT_KG: 200,
  MIN_TEMPERATURE_C: 35,
  MAX_TEMPERATURE_C: 42,
  NORMAL_TEMP_DOG_MIN: 37.5,
  NORMAL_TEMP_DOG_MAX: 39.2,
  NORMAL_TEMP_CAT_MIN: 38.0,
  NORMAL_TEMP_CAT_MAX: 39.5
} as const;

// Colores por Estado
export const STATUS_COLORS = {
  [AppointmentStatus.Pending]: 'warning',
  [AppointmentStatus.Confirmed]: 'primary',
  [AppointmentStatus.InProgress]: 'secondary',
  [AppointmentStatus.Completed]: 'success',
  [AppointmentStatus.Cancelled]: 'danger'
} as const;

// Colores por Prioridad
export const PRIORITY_COLORS = {
  [AppointmentPriority.Low]: 'success',
  [AppointmentPriority.Medium]: 'warning',
  [AppointmentPriority.High]: 'danger',
  [AppointmentPriority.Critical]: 'danger'
} as const;

// Iconos por Estado
export const STATUS_ICONS = {
  [AppointmentStatus.Pending]: 'time-outline',
  [AppointmentStatus.Confirmed]: 'checkmark-circle-outline',
  [AppointmentStatus.InProgress]: 'hourglass-outline',
  [AppointmentStatus.Completed]: 'checkmark-done-outline',
  [AppointmentStatus.Cancelled]: 'close-circle-outline'
} as const;

// Iconos por Prioridad
export const PRIORITY_ICONS = {
  [AppointmentPriority.Low]: 'information-circle',
  [AppointmentPriority.Medium]: 'warning',
  [AppointmentPriority.High]: 'alert-circle',
  [AppointmentPriority.Critical]: 'skull'
} as const;

// Iconos por Tipo de Actividad
export const ACTIVITY_ICONS = {
  appointment: 'calendar-outline',
  emergency: 'alert-circle-outline',
  followup: 'refresh-outline',
  reminder: 'alarm-outline'
} as const;

// Colores por Tipo de Consulta
export const CONSULTATION_COLORS = {
  'Chequeos Generales': '#4CAF50',
  'Vacunaciones': '#2196F3',
  'Emergencias': '#F44336',
  'Cirugías': '#FF9800',
  'Seguimientos': '#9C27B0'
} as const;

// Textos de Estado
export const STATUS_LABELS = {
  [AppointmentStatus.Pending]: 'Pendiente',
  [AppointmentStatus.Confirmed]: 'Confirmada',
  [AppointmentStatus.InProgress]: 'En Curso',
  [AppointmentStatus.Completed]: 'Completada',
  [AppointmentStatus.Cancelled]: 'Cancelada'
} as const;

// Tipos de Registro Médico
export const RECORD_TYPES = [
  { value: RecordType.Checkup, label: 'Chequeo General', icon: 'medical-outline' },
  { value: RecordType.Vaccine, label: 'Vacunación', icon: 'shield-checkmark-outline' },
  { value: RecordType.Surgery, label: 'Cirugía', icon: 'cut-outline' },
  { value: RecordType.Emergency, label: 'Emergencia', icon: 'alert-circle-outline' },
  { value: RecordType.Treatment, label: 'Tratamiento', icon: 'bandage-outline' },
  { value: RecordType.Followup, label: 'Seguimiento', icon: 'refresh-outline' }
] as const;

// Vacunas Comunes
export const COMMON_VACCINES = [
  'Antirrábica',
  'DHPP (Distemper, Hepatitis, Parvovirus, Parainfluenza)',
  'Bordetella',
  'Leishmaniosis',
  'Triple Felina (FVRCP)',
  'FeLV (Leucemia Felina)',
  'Otra (especificar)'
] as const;

// Mensajes de Error
export const ERROR_MESSAGES = {
  NO_AUTH: 'No hay usuario autenticado',
  NO_PERMISSIONS: 'Usuario no tiene permisos de veterinario',
  LOAD_DATA_FAILED: 'Error al cargar datos. Por favor, recarga la página.',
  SAVE_FAILED: 'Error al guardar. Inténtalo nuevamente.',
  DELETE_FAILED: 'Error al eliminar. Inténtalo nuevamente.',
  NETWORK_ERROR: 'Error de conexión. Verifica tu internet.',
  INVALID_WEIGHT: 'Peso inválido (debe ser 0.1-200 kg)',
  INVALID_TEMPERATURE: 'Temperatura inválida (debe ser 35-42°C)',
  FUTURE_DATE_REQUIRED: 'La fecha debe ser futura',
  COMPLETE_REQUIRED_FIELDS: 'Por favor complete todos los campos requeridos'
} as const;

// Mensajes de Éxito
export const SUCCESS_MESSAGES = {
  APPOINTMENT_CONFIRMED: 'Cita confirmada exitosamente',
  APPOINTMENT_COMPLETED: 'Cita completada exitosamente',
  APPOINTMENT_CANCELLED: 'Cita cancelada exitosamente',
  APPOINTMENT_RESCHEDULED: 'Cita reagendada exitosamente',
  RECORD_CREATED: 'Registro médico creado exitosamente',
  RECORD_UPDATED: 'Registro médico actualizado exitosamente',
  NOTIFICATION_SENT: 'Notificación enviada exitosamente',
  DATA_EXPORTED: 'Datos exportados exitosamente'
} as const;

// Filtros de Tiempo
export const TIME_RANGES = {
  TODAY: 'today',
  TOMORROW: 'tomorrow',
  THIS_WEEK: 'week',
  THIS_MONTH: 'month',
  CUSTOM: 'custom'
} as const;

// Filtros de Citas
export const APPOINTMENT_FILTERS = {
  ALL: 'all',
  TODAY: 'today',
  UPCOMING: 'upcoming',
  PENDING: 'pending',
  COMPLETED: 'completed'
} as const;
