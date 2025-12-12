export interface AdoptionRequest {
  id?: string;
  petId: string;
  petName?: string; // Denormalized data for easy display
  petImageUrl?: string; // Denormalized data for easy display
  creatorId: string; // UID of the pet's creator
  applicantId: string; // UID of the user applying
  applicantName: string; // Denormalized data
  requestDate: Date;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  handoverId?: string;
  adminNotes?: string;

  // Adoption Questionnaire
  housingType: 'own' | 'rented';
  landlordAllowsPets?: boolean;
  petLivingSpace: 'indoor' | 'indoor_with_garden' | 'outdoor' | 'other';
  petLivingSpaceOther?: string;
  hoursAlone: number;
  previousExperience: boolean;
  previousExperienceDetails?: string;
  otherPets: boolean;
  otherPetsDetails?: string;
  veterinaryAccess: boolean;
  longTermCommitment: string;
  verificationConsent: boolean;

  // Detailed Questions (Enhancement)
  secureFencing?: boolean; // Is the garden/balcony properly fenced/secured?
  householdMembers?: string; // Who lives in the home? (adults, children, ages)
  allergies?: 'yes' | 'no' | 'unknown'; // Anyone in the house with known allergies?
  petFood?: string; // What kind of food do you plan to provide?
  unexpectedExpenses?: boolean; // Are you willing to cover unexpected veterinary expenses?
  reviewedAt?: Date; // Timestamp for when the request was approved or rejected

  // Adoption Documents
  commitmentDocumentId?: string; // Reference to commitment document in adoption-commitments collection
  commitmentPdfUrl?: string; // URL to commitment PDF
  handoverAgreementId?: string; // Reference to handover agreement when approved
  handoverAgreementPdfUrl?: string; // URL to handover agreement PDF
  receiptId?: string; // Reference to delivery receipt when completed
  receiptPdfUrl?: string; // URL to delivery receipt PDF

  // Delivery Confirmation (Dual)
  ownerDeliveryConfirmedAt?: Date; // When owner confirmed delivery
  adopterDeliveryConfirmedAt?: Date; // When adopter confirmed delivery
  deliveryLocation?: string; // Where delivery took place
  deliveryNotes?: string; // Notes about delivery
  deliveryChecklist?: any; // Checklist object
  deliveryPhotos?: string[]; // Photos of delivery
}
