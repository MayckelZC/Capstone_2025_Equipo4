// Service Worker para Patitas en Casa
// Versión de cache - incrementar cuando se actualice
const CACHE_NAME = 'patitas-en-casa-v1.0.0';
const DATA_CACHE_NAME = 'patitas-data-v1.0.0';

// Recursos para cachear
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  
  // Páginas principales
  '/home',
  '/login',
  '/registro',
  '/perfil',
  
  // Assets estáticos
  '/assets/icon/icon-192x192.png',
  '/assets/icon/icon-512x512.png',
  '/assets/imgs/paw.png',
  '/assets/imgs/default-dog.png',
  
  // Estilos y scripts principales
  '/main.js',
  '/polyfills.js',
  '/vendor.js',
  '/styles.css'
];

// URLs de la API que se pueden cachear
const API_URLS = [
  '/api/pets',
  '/api/users',
  '/api/adoptions'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching app shell');
        return cache.addAll(FILES_TO_CACHE);
      })
      .catch((error) => {
        console.error('[SW] Error during install:', error);
      })
  );
  
  // Forzar activación inmediata
  self.skipWaiting();
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log('[SW] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Tomar control de todas las páginas inmediatamente
  self.clients.claim();
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Manejar requests de Firebase/API
  if (request.url.includes('firestore.googleapis.com') || 
      request.url.includes('firebase.googleapis.com')) {
    event.respondWith(handleFirebaseRequest(event));
    return;
  }
  
  // Manejar requests de imágenes
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(event));
    return;
  }
  
  // Manejar navegación (páginas HTML)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(event));
    return;
  }
  
  // Manejar otros recursos estáticos
  event.respondWith(handleStaticRequest(event));
});

// Manejar requests de Firebase
async function handleFirebaseRequest(event) {
  const { request } = event;
  
  try {
    // Intentar request de red primero
    const response = await fetch(request);
    
    // Si es exitoso, cachear para uso offline
    if (response.status === 200) {
      const cache = await caches.open(DATA_CACHE_NAME);
      cache.put(request.url, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Firebase request failed, trying cache:', request.url);
    
    // Si falla la red, intentar desde cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Si no hay cache, retornar response offline
    return createOfflineResponse();
  }
}

// Manejar requests de imágenes
async function handleImageRequest(event) {
  const { request } = event;
  
  try {
    // Buscar en cache primero
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Si no está en cache, hacer request de red
    const response = await fetch(request);
    
    // Cachear imagen para uso futuro
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Image request failed:', request.url);
    
    // Retornar imagen placeholder
    return caches.match('/assets/imgs/placeholder.png') ||
           createPlaceholderImageResponse();
  }
}

// Manejar navegación (páginas)
async function handleNavigationRequest(event) {
  const { request } = event;
  
  try {
    // Intentar request de red primero
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.log('[SW] Navigation request failed, serving offline page');
    
    // Servir página offline o index.html desde cache
    const cachedResponse = await caches.match('/index.html');
    return cachedResponse || createOfflinePage();
  }
}

// Manejar recursos estáticos
async function handleStaticRequest(event) {
  const { request } = event;
  
  // Cache first strategy para recursos estáticos
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    
    // Cachear recurso si es exitoso
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Static request failed:', request.url);
    return new Response('Recurso no disponible offline', { status: 404 });
  }
}

// Crear response offline para datos
function createOfflineResponse() {
  return new Response(
    JSON.stringify({
      error: 'offline',
      message: 'No hay conexión a internet. Mostrando datos guardados.',
      data: []
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    }
  );
}

// Crear página offline
function createOfflinePage() {
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Patitas en Casa - Offline</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          text-align: center;
          padding: 50px;
          background: #FAFAFA;
          color: #424242;
        }
        .offline-container {
          max-width: 400px;
          margin: 0 auto;
        }
        .paw-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        .retry-button {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          margin-top: 20px;
        }
        .retry-button:hover {
          background: #45a049;
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="paw-icon">🐾</div>
        <h1>Sin Conexión</h1>
        <p>No hay conexión a internet. Verifica tu conexión e intenta nuevamente.</p>
        <p>Algunas funcionalidades pueden estar disponibles offline.</p>
        <button class="retry-button" onclick="location.reload()">
          Reintentar
        </button>
      </div>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' },
    status: 200
  });
}

// Crear response de imagen placeholder
function createPlaceholderImageResponse() {
  // SVG placeholder simple
  const svg = `
    <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
            font-family="Arial" font-size="16" fill="#999">
        Imagen no disponible
      </text>
    </svg>
  `;
  
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml' },
    status: 200
  });
}

// Manejar mensajes del main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync para datos pendientes
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-adoption-requests') {
    event.waitUntil(syncAdoptionRequests());
  }
  
  if (event.tag === 'sync-user-data') {
    event.waitUntil(syncUserData());
  }
});

// Sincronizar solicitudes de adopción pendientes
async function syncAdoptionRequests() {
  try {
    // Obtener datos pendientes del IndexedDB o localStorage
    const pendingRequests = getPendingRequests();
    
    for (const request of pendingRequests) {
      try {
        await fetch('/api/adoption-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request)
        });
        
        // Remover de pendientes si fue exitoso
        removePendingRequest(request.id);
      } catch (error) {
        console.error('[SW] Failed to sync request:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Funciones auxiliares para manejo de datos offline
function getPendingRequests() {
  // Implementar obtención de datos pendientes
  return [];
}

function removePendingRequest(id) {
  // Implementar remoción de datos pendientes
  console.log('Removing pending request:', id);
}

function syncUserData() {
  // Implementar sincronización de datos de usuario
  console.log('Syncing user data...');
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push message received');
  
  const options = {
    body: 'Nueva notificación de Patitas en Casa',
    icon: '/assets/icon/icon-192x192.png',
    badge: '/assets/icon/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver',
        icon: '/assets/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/assets/icons/xmark.png'
      }
    ]
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.data = data;
  }
  
  event.waitUntil(
    self.registration.showNotification('Patitas en Casa', options)
  );
});

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    // Abrir la aplicación
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Cerrar notificación
    event.notification.close();
  } else {
    // Click en la notificación principal
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

console.log('[SW] Service Worker loaded successfully');