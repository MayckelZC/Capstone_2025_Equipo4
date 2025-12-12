// Service Worker Mejorado para Patitas en Casa
// Versión: 2.0.0 - Optimizado para rendimiento

const CACHE_VERSION = 'v2.0.0';
const CACHE_NAME = `patitas-cache-${CACHE_VERSION}`;
const DATA_CACHE_NAME = `patitas-data-${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `patitas-images-${CACHE_VERSION}`;

// ==================== CONFIGURACIÓN ====================

// Assets críticos para precachear (App Shell)
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/icon/favicon.png',
  '/assets/icon/icon-192x192.png',
  '/assets/icon/icon-512x512.png',
  '/assets/imgs/placeholder.png',
  '/assets/imgs/paw.png'
];

// Límites de caché
const MAX_IMAGE_CACHE_SIZE = 50; // Máximo 50 imágenes en caché
const MAX_DATA_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 horas
const IMAGE_CACHE_EXPIRATION = 7 * 24 * 60 * 60 * 1000; // 7 días

// ==================== INSTALACIÓN ====================

self.addEventListener('install', (event) => {
  console.log('[SW v2] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW v2] Precaching app shell');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
      .catch(error => console.error('[SW v2] Install failed:', error))
  );
});

// ==================== ACTIVACIÓN ====================

self.addEventListener('activate', (event) => {
  console.log('[SW v2] Activating...');

  event.waitUntil(
    Promise.all([
      // Limpiar cachés antiguos
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name.startsWith('patitas-') && name !== CACHE_NAME &&
              name !== DATA_CACHE_NAME && name !== IMAGE_CACHE_NAME)
            .map(name => {
              console.log('[SW v2] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      }),
      // Limpiar imágenes antiguas
      cleanImageCache(),
      // Tomar control inmediato
      self.clients.claim()
    ])
  );
});

// ==================== FETCH HANDLER ====================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests no-HTTP
  if (!request.url.startsWith('http')) {
    return;
  }

  // Estrategia según tipo de recurso
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
  } else if (url.origin.includes('firestore.googleapis.com') ||
    url.origin.includes('firebase')) {
    event.respondWith(handleFirebaseRequest(request));
  } else if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
  } else {
    event.respondWith(handleStaticRequest(request));
  }
});

// ==================== ESTRATEGIAS DE CACHÉ ====================

/**
 * Stale-While-Revalidate para imágenes
 * Sirve desde caché pero actualiza en background
 */
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // Fetch en background para actualizar caché
  const fetchPromise = fetch(request).then(response => {
    if (response && response.status === 200) {
      cache.put(request, response.clone());
      // Limpiar caché si excede el límite
      limitCacheSize(IMAGE_CACHE_NAME, MAX_IMAGE_CACHE_SIZE);
    }
    return response;
  }).catch(() => null);

  // Retornar caché inmediatamente si existe, sino esperar fetch
  return cachedResponse || fetchPromise || createPlaceholderImage();
}

/**
 * Network-First para datos de Firebase
 * Intenta red primero, fallback a caché
 */
async function handleFirebaseRequest(request) {
  try {
    const response = await fetch(request);

    // Cachear respuestas exitosas
    if (response.status === 200) {
      const cache = await caches.open(DATA_CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[SW v2] Network failed, trying cache');

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Verificar si el caché no está muy antiguo
      const cacheDate = new Date(cachedResponse.headers.get('date') || 0);
      const now = new Date();

      if (now.getTime() - cacheDate.getTime() < MAX_DATA_CACHE_AGE) {
        return cachedResponse;
      }
    }

    return createOfflineResponse();
  }
}

/**
 * Network-First para navegación
 * Fallback a index.html cacheado
 */
async function handleNavigationRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cachedResponse = await caches.match('/index.html');
    return cachedResponse || createOfflinePage();
  }
}

/**
 * Cache-First para recursos estáticos
 * CSS, JS, fonts, etc.
 */
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);

    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// ==================== UTILIDADES ====================

/**
 * Limita el tamaño del caché eliminando entradas antiguas
 */
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxSize) {
    // Eliminar las más antiguas (primeras en el array)
    const keysToDelete = keys.slice(0, keys.length - maxSize);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
  }
}

/**
 * Limpia imágenes expiradas del caché
 */
async function cleanImageCache() {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  const requests = await cache.keys();
  const now = Date.now();

  const deletePromises = requests.map(async (request) => {
    const response = await cache.match(request);
    if (response) {
      const cacheDate = new Date(response.headers.get('date') || 0);
      if (now - cacheDate.getTime() > IMAGE_CACHE_EXPIRATION) {
        return cache.delete(request);
      }
    }
  });

  await Promise.all(deletePromises);
}

/**
 * Crea una respuesta offline para datos
 */
function createOfflineResponse() {
  return new Response(
    JSON.stringify({
      offline: true,
      message: 'Sin conexión. Mostrando datos guardados.',
      data: []
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    }
  );
}

/**
 * Crea una página offline
 */
function createOfflinePage() {
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Patitas en Casa - Sin Conexión</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          text-align: center;
          max-width: 400px;
        }
        .icon {
          font-size: 80px;
          margin-bottom: 20px;
          animation: bounce 2s infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        h1 { font-size: 32px; margin-bottom: 16px; }
        p { font-size: 18px; opacity: 0.9; margin-bottom: 30px; }
        button {
          background: white;
          color: #667eea;
          border: none;
          padding: 12px 32px;
          border-radius: 25px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }
        button:hover { transform: scale(1.05); }
        button:active { transform: scale(0.95); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">🐾</div>
        <h1>Sin Conexión</h1>
        <p>No hay conexión a internet. Verifica tu conexión e intenta nuevamente.</p>
        <button onclick="location.reload()">Reintentar</button>
      </div>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

/**
 * Crea una imagen placeholder SVG
 */
function createPlaceholderImage() {
  const svg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
            font-family="Arial" font-size="18" fill="#999">
        🐾 Imagen no disponible
      </text>
    </svg>
  `;

  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml' }
  });
}

// ==================== BACKGROUND SYNC ====================

self.addEventListener('sync', (event) => {
  console.log('[SW v2] Background sync:', event.tag);

  if (event.tag === 'sync-data') {
    event.waitUntil(syncPendingData());
  }
});

async function syncPendingData() {
  // Implementar lógica de sincronización
  console.log('[SW v2] Syncing pending data...');
}

// ==================== PUSH NOTIFICATIONS ====================

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.body || 'Nueva notificación',
    icon: '/assets/icon/icon-192x192.png',
    badge: '/assets/icon/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: data,
    actions: [
      { action: 'open', title: 'Ver' },
      { action: 'close', title: 'Cerrar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Patitas en Casa', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(clients.openWindow('/'));
  }
});

console.log('[SW v2] Service Worker loaded successfully');