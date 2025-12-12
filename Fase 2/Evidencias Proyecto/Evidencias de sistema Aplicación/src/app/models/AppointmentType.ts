export interface AppointmentType {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  color: string; // hex color for visual identification
  icon: string; // ionicon name
  requiresPreparation: boolean;
  preparationInstructions?: string;
  allowOnlineScheduling: boolean; // some types require vet approval
}

export const APPOINTMENT_TYPES: AppointmentType[] = [
  {
    id: 'consulta',
    name: 'Consulta General',
    description: 'Revisión médica general, diagnóstico de síntomas',
    duration: 30,
    color: '#3880ff',
    icon: 'medical-outline',
    requiresPreparation: false,
    allowOnlineScheduling: true
  },
  {
    id: 'vacunacion',
    name: 'Vacunación',
    description: 'Aplicación de vacunas preventivas',
    duration: 15,
    color: '#2dd36f',
    icon: 'shield-checkmark-outline',
    requiresPreparation: true,
    preparationInstructions: 'Traer carnet de vacunación actualizado. La mascota debe estar en ayunas de 2 horas.',
    allowOnlineScheduling: true
  },
  {
    id: 'control',
    name: 'Control Post-tratamiento',
    description: 'Seguimiento de tratamientos previos',
    duration: 20,
    color: '#ffc409',
    icon: 'checkmark-circle-outline',
    requiresPreparation: true,
    preparationInstructions: 'Traer registro de medicamentos administrados y cualquier reacción observada.',
    allowOnlineScheduling: true
  },
  {
    id: 'cirugia',
    name: 'Cirugía Programada',
    description: 'Procedimientos quirúrgicos (esterilización, extracciones, etc)',
    duration: 120,
    color: '#eb445a',
    icon: 'cut-outline',
    requiresPreparation: true,
    preparationInstructions: 'AYUNO COMPLETO de 12 horas (sin comida ni agua). Traer manta o toalla. No suspender sin consultar.',
    allowOnlineScheduling: false // requires vet approval
  },
  {
    id: 'examen',
    name: 'Exámenes de Laboratorio',
    description: 'Toma de muestras y análisis clínicos',
    duration: 30,
    color: '#92949c',
    icon: 'flask-outline',
    requiresPreparation: true,
    preparationInstructions: 'Ayuno de 8 horas para análisis de sangre. Traer muestra de orina/heces en recipiente limpio si aplica.',
    allowOnlineScheduling: true
  },
  {
    id: 'emergencia',
    name: 'Emergencia',
    description: 'Atención urgente por traumatismos, intoxicación, dificultad respiratoria',
    duration: 60,
    color: '#d33682',
    icon: 'alert-circle-outline',
    requiresPreparation: false,
    allowOnlineScheduling: false // emergencies go directly, no scheduling
  }
];

// Helper functions
export function getAppointmentTypeById(id: string): AppointmentType | undefined {
  return APPOINTMENT_TYPES.find(type => type.id === id);
}

export function getOnlineSchedulableTypes(): AppointmentType[] {
  return APPOINTMENT_TYPES.filter(type => type.allowOnlineScheduling);
}
