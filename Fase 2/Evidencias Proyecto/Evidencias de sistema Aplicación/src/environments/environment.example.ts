/**
 * Archivo de ejemplo para configuración del environment.
 * 
 * INSTRUCCIONES:
 * 1. Copia este archivo como 'environment.ts' y 'environment.prod.ts'
 * 2. Reemplaza los valores placeholder con tus credenciales reales
 * 3. NUNCA commitees los archivos con credenciales reales
 * 
 * Para obtener las credenciales de Firebase:
 * 1. Ve a la consola de Firebase: https://console.firebase.google.com/
 * 2. Selecciona tu proyecto
 * 3. Ve a Configuración del proyecto > General
 * 4. En "Tus apps", selecciona la app web y copia la configuración
 */

export const environment = {
    production: false, // Cambiar a 'true' para environment.prod.ts
    sentryDsn: '', // Tu DSN de Sentry (opcional)
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
