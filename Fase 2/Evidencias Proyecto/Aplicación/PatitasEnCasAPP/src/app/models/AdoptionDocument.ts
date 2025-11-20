export interface AdoptionCommitment {
  id?: string;
  adoptionRequestId: string;
  adopterId: string;
  adopterName: string;
  petId: string;
  petName: string;

  // Datos personales
  personalData: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
  };

  // Compromisos
  commitments: {
    longTermCare: boolean; // 10-15 años
    veterinaryExpenses: boolean;
    noAbandonment: boolean;
    returnPolicy: boolean; // Contactar dueño, no abandonar
    legalConsequences: boolean;
    addressChangeNotification: boolean;
  };

  // Firma digital
  signature: {
    accepted: boolean;
    timestamp: Date;
    ipAddress?: string;
  };

  // Metadata
  createdAt: Date;
  documentUrl?: string; // URL del PDF generado
}

export interface HandoverAgreement {
  id?: string;
  adoptionRequestId: string;
  ownerId: string;
  ownerName: string;
  petId: string;
  petName: string;

  // Información de la mascota
  petInformation: {
    healthStatus: string;
    medicalHistory: string;
    vaccinationsUpToDate: boolean;
    vaccinationDocuments?: string[]; // URLs
    behavior: string;
    specialNeeds?: string;
    medication?: string;
    diet?: string;
  };

  // Compromisos del dueño
  ownerCommitments: {
    deliverInGoodCondition: boolean;
    ownershipTransfer: boolean;
    postAdoptionContact: boolean;
  };

  // Firma digital
  signature: {
    accepted: boolean;
    timestamp: Date;
  };

  // Metadata
  createdAt: Date;
  documentUrl?: string; // URL del PDF generado
}

export interface DeliveryChecklist {
  pet: boolean;
  vaccinationCard: boolean;
  medicalDocuments: boolean;
  food: boolean;
  accessories: boolean;
}

export interface HandoverReceipt {
  id?: string;
  adoptionRequestId: string;
  petId: string;
  petName: string;

  // Partes involucradas
  owner: {
    id: string;
    name: string;
    confirmed: boolean;
    confirmationDate?: Date;
    signature?: boolean;
  };

  adopter: {
    id: string;
    name: string;
    confirmed: boolean;
    confirmationDate?: Date;
    signature?: boolean;
  };

  // Detalles de entrega
  delivery: {
    date: Date;
    location?: string;
    checklist: DeliveryChecklist;
    photos?: string[]; // URLs opcionales
    additionalNotes?: string;
  };

  // Detalles de la mascota para el recibo
  petDetails?: {
    breed: string;
    age: string;
    color: string;
    sex: string;
  };

  // Estado del documento
  status: 'pending-owner' | 'pending-adopter' | 'completed';
  completedAt?: Date;

  // Número de acta único
  receiptNumber: string; // ej: ADOPT-2025-001234

  // PDF final
  documentUrl?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Helper para generar número de acta
export function generateReceiptNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `ADOPT-${year}-${random}`;
}
