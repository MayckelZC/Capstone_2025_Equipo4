import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

// ===== FIREBASE LOGGING INITIALIZATION =====
// No se requiere inicialización previa
// Los logs se enviarán automáticamente a Firestore en producción
// Sin costos, 100% gratuito con tu plan de Firebase

// ===== SERVICE WORKER REGISTRATION =====
if ('serviceWorker' in navigator && !window.hasOwnProperty('Capacitor')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Verificar actualizaciones periódicamente
        setInterval(() => {
          registration.update();
        }, 60000); // Cada minuto
        
        // Manejar actualizaciones del SW
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nueva versión disponible
                if (confirm('Nueva versión disponible. ¿Deseas actualizar?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// ===== BOOTSTRAP APPLICATION =====
platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => {
    console.error('Bootstrap error:', err);
  });
