/**
 * Veterinary Schedule Configuration
 * Defines working hours, slot duration, and capacity limits
 */
export interface VetScheduleConfig {
    /** Default slot duration in minutes (20 min recommended) */
    defaultSlotDuration: number;

    /** Buffer time between appointments in minutes */
    bufferBetweenSlots: number;

    /** Working hours blocks */
    workingHours: WorkingHoursBlock[];

    /** Break times (lunch, etc.) */
    breakTimes: TimeBlock[];

    /** Maximum appointments per day */
    maxAppointmentsPerDay: number;

    /** Emergency slots reserved per day */
    emergencySlotsReserved: number;

    /** Minimum hours in advance to book */
    minAdvanceHours: number;

    /** Maximum days in advance to book */
    maxAdvanceDays: number;
}

export interface WorkingHoursBlock {
    dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
    start: string;     // "08:00"
    end: string;       // "18:00"
    isActive: boolean;
}

export interface TimeBlock {
    start: string;
    end: string;
    label?: string;
}

/**
 * Appointment types with their estimated durations
 */
export interface AppointmentTypeConfig {
    id: string;
    name: string;
    description: string;
    durationMinutes: number;
    icon: string;
    color: string;
    preparationInstructions?: string;
    requiresFasting?: boolean;
}

/**
 * Time slot for scheduling
 */
export interface TimeSlot {
    time: string;           // "08:00"
    displayTime: string;    // "8:00 AM"
    available: boolean;
    isEmergencySlot: boolean;
    blockedReason?: string;
}

/**
 * Daily schedule with available slots
 */
export interface DaySchedule {
    date: Date;
    dayName: string;
    isWorkingDay: boolean;
    slots: TimeSlot[];
    availableCount: number;
    totalCount: number;
}

/**
 * Default schedule configuration
 */
export const DEFAULT_VET_SCHEDULE_CONFIG: VetScheduleConfig = {
    defaultSlotDuration: 20,
    bufferBetweenSlots: 5,
    workingHours: [
        { dayOfWeek: 1, start: '08:00', end: '12:00', isActive: true }, // Monday morning
        { dayOfWeek: 1, start: '14:00', end: '18:00', isActive: true }, // Monday afternoon
        { dayOfWeek: 2, start: '08:00', end: '12:00', isActive: true },
        { dayOfWeek: 2, start: '14:00', end: '18:00', isActive: true },
        { dayOfWeek: 3, start: '08:00', end: '12:00', isActive: true },
        { dayOfWeek: 3, start: '14:00', end: '18:00', isActive: true },
        { dayOfWeek: 4, start: '08:00', end: '12:00', isActive: true },
        { dayOfWeek: 4, start: '14:00', end: '18:00', isActive: true },
        { dayOfWeek: 5, start: '08:00', end: '12:00', isActive: true },
        { dayOfWeek: 5, start: '14:00', end: '18:00', isActive: true },
        { dayOfWeek: 6, start: '09:00', end: '13:00', isActive: true }, // Saturday morning only
    ],
    breakTimes: [
        { start: '12:00', end: '14:00', label: 'Almuerzo' }
    ],
    maxAppointmentsPerDay: 24,
    emergencySlotsReserved: 2,
    minAdvanceHours: 24,
    maxAdvanceDays: 30
};

/**
 * Available appointment types
 */
export const APPOINTMENT_TYPES: AppointmentTypeConfig[] = [
    {
        id: 'control',
        name: 'Control rápido',
        description: 'Revisión general, peso, estado de salud',
        durationMinutes: 20,
        icon: 'pulse-outline',
        color: 'success'
    },
    {
        id: 'vacunacion',
        name: 'Vacunación',
        description: 'Aplicación de vacunas según calendario',
        durationMinutes: 15,
        icon: 'medical-outline',
        color: 'primary'
    },
    {
        id: 'consulta',
        name: 'Consulta general',
        description: 'Evaluación de síntomas o problemas de salud',
        durationMinutes: 30,
        icon: 'medkit-outline',
        color: 'tertiary'
    },
    {
        id: 'primera_consulta',
        name: 'Primera consulta',
        description: 'Evaluación completa para nuevos pacientes',
        durationMinutes: 40,
        icon: 'clipboard-outline',
        color: 'warning',
        preparationInstructions: 'Traer historial médico previo si está disponible'
    },
    {
        id: 'desparasitacion',
        name: 'Desparasitación',
        description: 'Aplicación de antiparasitarios internos/externos',
        durationMinutes: 15,
        icon: 'shield-checkmark-outline',
        color: 'success'
    },
    {
        id: 'curacion',
        name: 'Curación / Vendaje',
        description: 'Limpieza de heridas y cambio de vendajes',
        durationMinutes: 25,
        icon: 'bandage-outline',
        color: 'warning'
    },
    {
        id: 'cirugia_menor',
        name: 'Cirugía menor',
        description: 'Procedimientos quirúrgicos menores',
        durationMinutes: 60,
        icon: 'cut-outline',
        color: 'danger',
        requiresFasting: true,
        preparationInstructions: 'Ayuno de 8 horas previo a la cirugía'
    },
    {
        id: 'emergencia',
        name: 'Emergencia',
        description: 'Atención urgente (solo veterinarios)',
        durationMinutes: 45,
        icon: 'warning-outline',
        color: 'danger'
    }
];
