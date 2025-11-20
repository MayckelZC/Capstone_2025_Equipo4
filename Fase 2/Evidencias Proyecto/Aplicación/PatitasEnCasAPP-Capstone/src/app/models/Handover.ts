export interface Handover {
  id?: string;
  adoptionRequestId: string;
  adopterId: string;
  ownerId: string;
  petId: string;
  proposedDate: Date;
  confirmedDate?: Date;
  location?: string; // Could be a string description or a GeoPoint
  status: 'requested' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}
