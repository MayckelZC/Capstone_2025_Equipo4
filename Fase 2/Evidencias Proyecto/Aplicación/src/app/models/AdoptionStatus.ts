export type AdoptionStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';

export interface AdoptionCompletion {
    adoptionId: string;
    petId: string;
    adopterId: string;
    deliveryDate: Date;
    comments?: string;
    completedAt?: Date;
    completedBy?: string;
    documents?: {
        agreementUrl?: string;
        transferFormUrl?: string;
        [key: string]: string | undefined;
    };
}