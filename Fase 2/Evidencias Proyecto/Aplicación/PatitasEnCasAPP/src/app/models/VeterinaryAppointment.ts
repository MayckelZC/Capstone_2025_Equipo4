export interface VeterinaryAppointment {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  petId: string;
  petName: string;
  appointmentDate: Date;
  timeSlot: string; // "09:00", "10:00", etc.
  status: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
  reason: string;
  createdAt: Date;
  
  // Appointment type fields
  appointmentType?: string; // 'consulta', 'vacunacion', 'control', etc.
  estimatedDuration?: number; // in minutes (default 30 if not specified)
  preparationInstructions?: string; // shown to user before appointment
}
