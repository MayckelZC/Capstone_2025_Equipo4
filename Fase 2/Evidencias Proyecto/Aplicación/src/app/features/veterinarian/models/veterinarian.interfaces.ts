/**
 * Interfaces para el módulo de Veterinarian
 */

export interface VeterinarianMetrics {
  totalAppointments: number;
  todayAppointments: number;
  pendingAppointments: number;
  completedToday: number;
  activePatients: number;
  emergenciesToday: number;
  averageRating?: number;
  monthlyRevenue?: number;
}

export interface DayActivity {
  id: string;
  type: 'appointment' | 'emergency' | 'followup' | 'reminder';
  title: string;
  description: string;
  time: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  petId?: string;
  petName?: string;
  status?: string;
}

export interface ConsultationStats {
  type: string;
  count: number;
  percentage: number;
  color: string;
}

export interface WeeklyActivity {
  day: string;
  appointments: number;
  emergencies: number;
  revenue?: number;
}

export interface VetNotification {
  id: string;
  title: string;
  message: string;
  type: 'appointment' | 'emergency' | 'reminder' | 'message';
  date: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  action?: {
    label: string;
    route: string;
  };
}

export interface AppointmentCard {
  id: string;
  petId: string;
  petName: string;
  petImage?: string;
  ownerId: string;
  ownerName: string;
  ownerPhone?: string;
  ownerEmail?: string;
  date: Date;
  time?: string;
  reason: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  type?: string;
  notes?: string;
  veterinarianId?: string;
  veterinarianName?: string;
  createdAt?: Date;
  updatedAt?: Date;
  cancellationReason?: string;
  rescheduleReason?: string;
}

export interface MedicalRecord {
  id: string;
  petId: string;
  petName?: string;
  veterinarianId: string;
  veterinarianName: string;
  date: Date;
  type: 'checkup' | 'vaccine' | 'surgery' | 'emergency' | 'treatment' | 'followup';
  diagnosis: string;
  treatment: string;
  notes?: string;
  vaccines?: string[];
  weight?: number;
  temperature?: number;
  nextAppointment?: Date;
  prescriptions?: Prescription[];
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface PatientSummary {
  petId: string;
  petName: string;
  petImage?: string;
  species: string;
  breed?: string;
  age?: string;
  lastVisit?: Date;
  totalVisits: number;
  upcomingAppointments: number;
  chronicConditions?: string[];
  allergies?: string[];
  currentMedications?: string[];
}
