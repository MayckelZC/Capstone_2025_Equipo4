# 🐾 PatitasEnCasAPP

<div align="center">

![Angular](https://img.shields.io/badge/Angular-18-DD0031?style=for-the-badge&logo=angular)
![Ionic](https://img.shields.io/badge/Ionic-8-3880FF?style=for-the-badge&logo=ionic)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript)

**Plataforma de Adopción de Mascotas**

Una aplicación móvil y web para conectar mascotas que buscan hogar con familias amorosas.

[Características](#-características) • [Instalación](#-instalación) • [Configuración](#-configuración) • [Uso](#-uso) • [Arquitectura](#-arquitectura)

</div>

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Scripts Disponibles](#-scripts-disponibles)
- [Roles de Usuario](#-roles-de-usuario)
- [Funcionalidades por Módulo](#-funcionalidades-por-módulo)
- [Despliegue](#-despliegue)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## ✨ Características

### 🏠 Para Adoptantes
- Explorar catálogo de mascotas disponibles
- Filtrar por especie, tamaño, edad, ubicación
- Solicitar adopción de mascotas
- Agendar citas con veterinarios
- Recibir notificaciones en tiempo real
- Chat con publicadores

### 📝 Para Publicadores/Refugios
- Publicar mascotas en adopción
- Gestionar solicitudes de adopción
- Aprobar/rechazar solicitudes
- Historial de adopciones
- Dashboard con estadísticas

### 👨‍⚕️ Para Veterinarios
- Gestionar consultas médicas
- Agregar registros médicos
- Vacunas y tratamientos
- Generar reportes de salud
- Calendario de citas

### 🔧 Para Administradores
- Panel de administración completo
- Gestión de usuarios y roles
- Reportes y estadísticas
- Moderación de contenido
- Configuración del sistema

---

## 🛠️ Tecnologías

### Frontend
| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| Angular | 18.x | Framework principal |
| Ionic | 8.x | Componentes UI móvil |
| Capacitor | 6.x | Acceso a APIs nativas |
| NgRx | 18.x | Gestión de estado |
| RxJS | 7.8 | Programación reactiva |
| TypeScript | 5.4 | Lenguaje tipado |

### Backend (BaaS)
| Servicio | Descripción |
|----------|-------------|
| Firebase Auth | Autenticación de usuarios |
| Cloud Firestore | Base de datos NoSQL en tiempo real |
| Firebase Storage | Almacenamiento de imágenes |
| Firebase Functions | Funciones serverless |
| Firebase Analytics | Métricas y análisis |

### Herramientas
| Herramienta | Descripción |
|-------------|-------------|
| Sentry | Monitoreo de errores |
| ESLint | Linting de código |
| Karma/Jasmine | Testing |

---

## 🗄️ Base de Datos (NoSQL)

Este proyecto utiliza **Google Cloud Firestore**, una base de datos NoSQL orientada a documentos.

- **Tipo:** NoSQL Document Store
- **Estructura:** Colecciones y Documentos
- **Documentación:** Ver carpeta [`Evidencia_Base_Datos/`](Evidencia_Base_Datos/) para:
  - Diagrama de estructura (`Documentacion_Estructura.md`)
  - Datos de ejemplo (`Datos_Ejemplo.json`)
  - Reglas de seguridad (`firestore.rules`)

---

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** >= 18.x ([Descargar](https://nodejs.org/))
- **npm** >= 9.x (incluido con Node.js)
- **Angular CLI** >= 18.x
- **Ionic CLI** >= 7.x
- **Firebase CLI** (para despliegue)

```bash
# Verificar versiones
node --version
npm --version

# Instalar CLIs globalmente
npm install -g @angular/cli @ionic/cli firebase-tools
```

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/PatitasEnCasAPP.git
cd PatitasEnCasAPP
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar credenciales

Sigue las instrucciones en [`docs/SETUP_CREDENTIALS.md`](docs/SETUP_CREDENTIALS.md) para configurar:
- Firebase (environment.ts)
- Firebase Functions (.env)
- Android (google-services.json)

### 4. Iniciar en modo desarrollo

```bash
ionic serve
```

La aplicación estará disponible en `http://localhost:8100`

---

## ⚙️ Configuración y Credenciales

> ⚠️ **IMPORTANTE**: Por seguridad, este proyecto **NO incluye** los archivos de credenciales. Debes crearlos manualmente para que la aplicación compile y funcione.

### 1. Archivos de Environment (Frontend)

La aplicación no compilará sin estos archivos.

1. Navega a la carpeta `src/environments/`
2. Verás un archivo llamado `environment.example.ts`. Úsalo como base.
3. Crea dos nuevos archivos en esa misma carpeta:

**Archivo 1: `environment.ts` (Para desarrollo)**
```typescript
export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: "TU_API_KEY_AQUI",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456",
    measurementId: "G-XXXXXXXXXX"
  }
};
```

**Archivo 2: `environment.prod.ts` (Para producción)**
```typescript
export const environment = {
  production: true,
  firebaseConfig: {
    // Copia aquí las mismas credenciales que en environment.ts
    // O usa las de tu proyecto de producción si tienes uno separado
    apiKey: "TU_API_KEY_AQUI",
    // ...
  }
};
```

> **¿Dónde obtengo estos datos?**
> Ve a la [Consola de Firebase](https://console.firebase.google.com/) > Configuración del Proyecto > General > Tus apps > Web.

### 2. Configuración Android

Para que la compilación de Android funcione correctamente:

1. Descarga el archivo `google-services.json` desde la Consola de Firebase (sección Android).
2. Pégalo en la ruta: `android/app/google-services.json`

### 3. Configuración Backend (Cloud Functions)

Si vas a desplegar o probar las funciones:

1. Navega a la carpeta `functions/`
2. Crea un archivo llamado `.env`
3. Agrega tus variables de entorno:

```env
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-contraseña-de-aplicación
```

---

## 📁 Estructura del Proyecto

```
PatitasEnCasAPP/
├── 📂 android/                 # Proyecto Android (Capacitor)
├── 📂 docs/                    # Documentación
├── 📂 functions/               # Firebase Cloud Functions
├── 📂 src/
│   ├── 📂 app/
│   │   ├── 📂 components/      # Componentes globales (card, header, menu)
│   │   ├── 📂 core/            # Servicios singleton, guards, interceptors
│   │   ├── 📂 features/        # Módulos de funcionalidad (lazy loading)
│   │   │   ├── admin/          # Panel de administración
│   │   │   ├── adoption/       # Flujo de adopción
│   │   │   ├── appointments/   # Gestión de citas
│   │   │   ├── auth/           # Autenticación
│   │   │   ├── legal/          # Términos y políticas
│   │   │   ├── pets/           # CRUD de mascotas
│   │   │   ├── reports/        # Reportes y estadísticas
│   │   │   ├── user/           # Perfil y configuración
│   │   │   └── veterinarian/   # Consultas veterinarias
│   │   ├── 📂 guards/          # Route guards
│   │   ├── 📂 models/          # Interfaces TypeScript
│   │   ├── 📂 pipes/           # Pipes personalizados
│   │   ├── 📂 shared/          # Servicios y componentes compartidos
│   │   └── 📂 store/           # NgRx (estado global)
│   ├── 📂 assets/              # Recursos estáticos
│   ├── 📂 environments/        # Configuración por ambiente
│   └── 📂 theme/               # Variables de estilo Ionic
├── 📄 angular.json             # Configuración de Angular
├── 📄 capacitor.config.ts      # Configuración de Capacitor
├── 📄 firebase.json            # Configuración de Firebase
├── 📄 firestore.rules          # Reglas de seguridad Firestore
├── 📄 storage.rules            # Reglas de seguridad Storage
└── 📄 package.json             # Dependencias y scripts
```

---

## 📜 Scripts Disponibles

```bash
# Desarrollo
npm start                    # Alias de ng serve
ionic serve                  # Servidor de desarrollo con hot reload

# Construcción
npm run build                # Build de desarrollo
npm run build:prod           # Build de producción
npm run build:prod:optimized # Build optimizado con limpieza

# Testing
npm run test                 # Ejecutar tests unitarios
npm run lint                 # Ejecutar ESLint

# Utilidades
npm run clean:logs           # Limpiar logs de build
```

### Comandos de Ionic/Capacitor

```bash
# Agregar plataforma
ionic capacitor add android
ionic capacitor add ios

# Sincronizar cambios
ionic capacitor sync

# Abrir en IDE nativo
ionic capacitor open android
ionic capacitor open ios

# Build y ejecutar
ionic capacitor run android
ionic capacitor run ios
```

---

## 👤 Roles de Usuario

| Rol | Tipo | Descripción |
|-----|------|-------------|
| **Adoptante** | `adopter` | Usuario que busca adoptar mascotas |
| **Publicador** | `publisher` | Dueño o refugio que publica mascotas |
| **Veterinario** | `veterinarian` | Profesional de salud animal |
| **Administrador** | `admin` | Acceso completo al sistema |

### Permisos por Rol

| Acción | Adoptante | Publicador | Veterinario | Admin |
|--------|:---------:|:----------:|:-----------:|:-----:|
| Ver mascotas | ✅ | ✅ | ✅ | ✅ |
| Solicitar adopción | ✅ | ❌ | ❌ | ✅ |
| Publicar mascotas | ❌ | ✅ | ❌ | ✅ |
| Gestionar solicitudes | ❌ | ✅ | ❌ | ✅ |
| Consultas médicas | ❌ | ❌ | ✅ | ✅ |
| Panel de admin | ❌ | ❌ | ❌ | ✅ |

---

## 📱 Funcionalidades por Módulo

### 🔐 Auth (`/auth`)
- Login con email/contraseña
- Registro de nuevos usuarios
- Recuperación de contraseña
- Verificación de email
- Login con Google

### 🐕 Pets (`/tabs/pets`)
- Listado de mascotas
- Filtros avanzados
- Detalle de mascota
- Crear/Editar mascota
- Galería de imágenes

### 💚 Adoption (`/adoption`)
- Flujo de solicitud de adopción
- Cuestionario de adopción
- Estados de solicitud
- Historial de adopciones
- Documentos de adopción

### 📅 Appointments (`/appointments`)
- Calendario de citas
- Agendar cita con veterinario
- Tipos de cita (consulta, vacunación, etc.)
- Recordatorios

### 👨‍⚕️ Veterinarian (`/veterinarian`)
- Dashboard de veterinario
- Consultas del día
- Historial médico
- Signos vitales
- Prescripciones

### 👤 User (`/user`)
- Perfil de usuario
- Configuración
- Notificaciones
- Favoritos
- Historial

### 🛡️ Admin (`/admin`)
- Dashboard con métricas
- Gestión de usuarios
- Gestión de mascotas
- Reportes
- Configuración del sistema

---

## 🚢 Despliegue

### Web (Firebase Hosting)

```bash
# Build de producción
npm run build:prod

# Desplegar a Firebase
firebase deploy --only hosting
```

### Android

```bash
# Sincronizar cambios
ionic capacitor sync android

# Abrir en Android Studio
ionic capacitor open android

# Generar APK desde Android Studio
# Build > Generate Signed Bundle / APK
```

### Firebase Functions

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

---

## 🔒 Seguridad

- **Autenticación**: Firebase Auth con tokens JWT
- **Autorización**: Guards de Angular + Firestore Security Rules
- **Datos**: Encriptación en tránsito (HTTPS/TLS)
- **Validación**: Cliente + Servidor
- **Archivos sensibles**: Excluidos en `.gitignore`

---

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto es privado y confidencial.

---

## 📞 Soporte

Si tienes preguntas o problemas, contacta al equipo de desarrollo.

---

<div align="center">
  <p>Hecho con 💚 para las mascotas que buscan hogar</p>
  <p><i>PatitasEnCasAPP © 2025</i></p>
</div>
