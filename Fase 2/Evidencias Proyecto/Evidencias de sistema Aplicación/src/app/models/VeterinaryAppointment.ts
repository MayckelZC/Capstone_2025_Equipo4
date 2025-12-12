export interface VeterinaryAppointment {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  petId: string;
  petName: string;
  appointmentDate: Date;
  timeSlot: string; // "08:00", "08:20", "08:40", etc.
  endTime?: string; // Calculated based on duration
  status: 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'en_consulta';
  reason: string;
  createdAt: Date;

  // Appointment type fields
  appointmentType: string; // 'consulta', 'vacunacion', 'control', etc.
  estimatedDuration: number; // in minutes (20 min default)
  preparationInstructions?: string; // shown to user before appointment

  // Additional info
  notes?: string; // Vet notes
  requiresFasting?: boolean;
  reminderSent?: boolean;
  checkedInAt?: Date;
}

