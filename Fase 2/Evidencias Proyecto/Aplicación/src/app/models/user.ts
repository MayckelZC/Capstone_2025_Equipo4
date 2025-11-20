export interface User {
    uid: string;
    nombreCompleto: string;
    nombreUsuario: string;
    email: string;
    telefono: string;
    direccion: string;
    region?: string; // Región del usuario
    ciudad?: string; // Ciudad del usuario
    profileImageUrl?: string; // Campo opcional para la URL de la foto de perfil
    bio?: string; // Campo opcional para la biografía
    isAdmin?: boolean; // Campo para identificar a los administradores
    isBlocked?: boolean; // Campo para marcar si el usuario está bloqueado
    isOrganization?: boolean; // Campo para identificar si el usuario pertenece a una ONG
    isVeterinarian?: boolean; // Campo para identificar a los veterinarios
    // Define el rol del usuario. Se amplía para poder representar roles rápidos como administrador y bloqueado.
    role?: 'individual' | 'organization' | 'veterinarian' | 'admin' | 'blocked';
    createdAt?: Date; // Fecha de creación del usuario
    // Email pendiente de verificación si el usuario solicitó un cambio de email
    pendingEmail?: string;
    pendingEmailRequestedAt?: Date;
}
