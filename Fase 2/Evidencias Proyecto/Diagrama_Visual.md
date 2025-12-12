# Diagrama Visual de Base de Datos (Firestore)

Este diagrama representa las colecciones y sus referencias lógicas.

```mermaid
erDiagram
    USERS ||--o{ PETS : "publica"
    USERS ||--o{ ADOPTION_REQUESTS : "solicita"
    USERS ||--o{ APPOINTMENTS : "agenda"
    
    PETS ||--o{ ADOPTION_REQUESTS : "recibe"
    PETS ||--o{ APPOINTMENTS : "tiene"

    USERS {
        string uid PK "Firebase Auth ID"
        string email
        string role "adopter | veterinarian | admin"
        string displayName
        string phone
    }

    PETS {
        string id PK "Auto-ID"
        string name
        string species "Perro | Gato"
        string publisherId FK "Ref: users"
        string status "Disponible | Adoptado"
        boolean sterilized
        boolean vaccinated
    }

    ADOPTION_REQUESTS {
        string id PK "Auto-ID"
        string petId FK "Ref: pets"
        string userId FK "Ref: users"
        string status "Pendiente | Aprobada"
        timestamp requestDate
    }

    APPOINTMENTS {
        string id PK "Auto-ID"
        string petId FK "Ref: pets"
        string userId FK "Ref: users"
        string veterinarianId FK "Ref: users"
        timestamp date
        string type "Consulta | Vacuna"
    }
```

> **Nota:** En Firestore (NoSQL), las relaciones (líneas) son lógicas. No existen "Foreign Keys" estrictas como en SQL, pero este diagrama muestra cómo se conectan los datos a través de los IDs.
