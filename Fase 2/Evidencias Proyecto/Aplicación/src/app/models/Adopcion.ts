import { User } from './user';

export interface Adopcion {
    id: string;
    tipoMascota: string;
    tamano: string;
    etapaVida: string; // Cachorro o Adulto
    edadMeses?: number; // Solo para cachorro
    edadAnios?: number; // Solo para adulto
    nombre?: string;
    raza?: string;
    sexo: string;
    color: string;
    descripcion?: string;
    esterilizado?: boolean;
    vacuna?: boolean;
    microchip?: boolean;
    condicionesSalud?: string;
    urlImagen: string;
    gallery?: string[];
    creadorId: string; // ID del usuario que creó la adopción
    currentOwnerId?: string; // ID del usuario que adopta la mascota
    adoptedAt?: Date;
    previousOwnerId?: string;
    adoptionCompletionData?: any;
    creador?: User; // Usuario que creó la adopción
    creadorRole?: 'individual' | 'organization' | 'veterinarian'; // Rol del creador de la adopción
    status?: 'available' | 'in_process' | 'adopted' | 'reserved' | 'handover_pending'; // Estado de la adopción
    isVerified?: boolean; // Campo para marcar si la publicación está verificada
    createdAt?: Date; // Fecha de creación de la publicación
    isHidden?: boolean; // Campo para indicar si la mascota está oculta
    selectedAdopterId?: string; // ID del adoptante seleccionado para el proceso de entrega
    giverConfirmedHandover?: boolean; // El dador confirma que ha entregado la mascota
    adopterConfirmedReceipt?: boolean; // El adoptante confirma que ha recibido la mascota
    lastAdoptionUpdateStatus?: 'approved' | 'rejected' | 'completed'; // Estado de la última solicitud de adopción
    lastAdoptionUpdateDate?: Date; // Fecha de la última actualización de solicitud
    lastAdoptionUpdateApplicantName?: string; // Nombre del solicitante de la última actualización
    lastAdoptionUpdateApplicantId?: string; // ID del solicitante de la última actualización
    personalityTraits?: string[]; // e.g., 'good with kids', 'good with other pets', 'house-trained'
    location?: string; // e.g., 'Santiago, Chile'
    vacunas?: { id: string; applied: boolean; date?: string | Date }[];
    desparasitado?: boolean;
    aptoParaAdopcion?: boolean;
    // Campos de personalidad y compatibilidad
    buenoConNinos?: boolean;
    buenoConMascotas?: boolean;
    energetico?: boolean;
    tranquilo?: boolean;
    entrenadoEnCasa?: boolean;
    guardian?: boolean;
    // Campos de ubicación
    ciudad?: string;
    barrio?: string;
    latitud?: string;
    longitud?: string;
}
  