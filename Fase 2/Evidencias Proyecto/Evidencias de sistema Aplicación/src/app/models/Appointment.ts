

export interface Appointment {
  id: string;
  vetId: string;
  userId: string;
  petId: string;
  shelterId?: string;
  date: Date;
  reason: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  createdAt?: Date;
  updatedAt?: Date;
}
