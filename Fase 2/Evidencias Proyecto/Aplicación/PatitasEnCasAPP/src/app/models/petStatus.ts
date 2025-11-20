export type PetStatus = 'available' | 'reserved' | 'adopted' | 'rejected' | 'under_review';
export type AdoptionStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';

export interface PetStatusUpdate {
    status: PetStatus;
    updatedAt: Date;
    updatedBy: string;
    reason?: string;
}

export interface PetAdoptionData {
    adoptionId?: string;
    adopterId?: string;
    adoptedAt?: Date;
    previousOwnerId?: string;
}