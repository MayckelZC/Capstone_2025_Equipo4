# Documentación de Base de Datos - PatitasEnCasAPP
## Tipo: NoSQL (Firebase Firestore)

### 1. Colección: `users`
Almacena la información de todos los usuarios (Adoptantes, Veterinarios, Admins).

```json
{
  "uid": "string (PK - Firebase Auth ID)",
  "email": "string",
  "displayName": "string",
  "role": "string ('adopter' | 'veterinarian' | 'admin')",
  "photoURL": "string (url)",
  "createdAt": "timestamp",
  "phone": "string",
  "rut": "string",
  "address": "string"
}
```

### 2. Colección: `pets`
Catálogo de mascotas disponibles para adopción.

```json
{
  "id": "string (Auto-ID)",
  "name": "string",
  "species": "string ('Perro' | 'Gato')",
  "breed": "string",
  "age": "number",
  "size": "string ('Pequeño' | 'Mediano' | 'Grande')",
  "gender": "string ('Macho' | 'Hembra')",
  "description": "string",
  "images": ["url_string"],
  "status": "string ('Disponible' | 'En Proceso' | 'Adoptado')",
  "publisherId": "string (Ref: users)",
  "location": {
    "lat": "number",
    "lng": "number",
    "address": "string"
  },
  "sterilized": "boolean",
  "vaccinated": "boolean",
  "createdAt": "timestamp"
}
```

### 3. Colección: `adoption_requests`
Solicitudes de adopción realizadas por usuarios.

```json
{
  "id": "string (Auto-ID)",
  "petId": "string (Ref: pets)",
  "userId": "string (Ref: users)",
  "status": "string ('Pendiente' | 'Aprobada' | 'Rechazada')",
  "requestDate": "timestamp",
  "message": "string",
  "housingType": "string",
  "hasOtherPets": "boolean",
  "salaryRange": "string"
}
```

### 4. Colección: `appointments`
Citas veterinarias agendadas.

```json
{
  "id": "string (Auto-ID)",
  "petId": "string (Ref: pets)",
  "veterinarianId": "string (Ref: users - role:vet)",
  "userId": "string (Ref: users - owner)",
  "date": "timestamp",
  "type": "string ('Consulta' | 'Vacunación' | 'Desparasitación')",
  "status": "string ('Confirmada' | 'Cancelada' | 'Completada')",
  "notes": "string"
}
```
