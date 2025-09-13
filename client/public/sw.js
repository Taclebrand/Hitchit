const CACHE_NAME = 'hitchit-v2';
const STATIC_CACHE = 'hitchit-static-v2';
const RUNTIME_CACHE = 'hitchit-runtime-v2';

// Pre-cache essential files only (no hardcoded asset paths)
const urlsToCache = [
  '/',
  '/manifest.json'
];

// Route patterns for different caching strategies
const API_ROUTES = /^\/api\//;
const SENSITIVE_ROUTES = /^\/api\/(auth|user|profile|payment)/;
const STATIC_ASSETS = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/;
const APP_ROUTES = /^\/(?!api\/|sw\.js|manifest\.json)/;

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching essential files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Skip waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Cache failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE && 
                cacheName !== RUNTIME_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event with route-aware caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle different route types with appropriate caching strategies
  if (SENSITIVE_ROUTES.test(url.pathname)) {
    // Never cache sensitive routes (auth, user data, payments)
    event.respondWith(
      fetch(request).catch(() => {
        // Return offline page or error response for sensitive routes
        return new Response('Offline: Authentication required', {
          status: 401,
          statusText: 'Offline - Authentication Required'
        });
      })
    );
  } else if (API_ROUTES.test(url.pathname)) {
    // Network-first strategy for API routes
    event.respondWith(networkFirst(request));
  } else if (STATIC_ASSETS.test(url.pathname)) {
    // Cache-first strategy for static assets
    event.respondWith(cacheFirst(request));
  } else if (APP_ROUTES.test(url.pathname)) {
    // Navigation fallback for SPA routes
    event.respondWith(navigationFallback(request));
  } else {
    // Default network-first for everything else
    event.respondWith(networkFirst(request));
  }
});

// Network-first strategy (for API routes)
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Only cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      // Clone the response before caching
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API routes
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'No network connection available'
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Cache-first strategy (for static assets)
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then(response => {
      if (response.ok) {
        caches.open(STATIC_CACHE).then(cache => {
          cache.put(request, response);
        });
      }
    }).catch(() => {
      // Ignore background update failures
    });
    
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Failed to load asset:', request.url);
    throw error;
  }
}

// Navigation fallback (for SPA routes)
async function navigationFallback(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('Navigation failed, serving index.html:', request.url);
    
    // Try to serve cached index.html for offline navigation
    const cache = await caches.open(STATIC_CACHE);
    const cachedIndex = await cache.match('/');
    
    if (cachedIndex) {
      return cachedIndex;
    }
    
    // Fallback offline page
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>HitchIt - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
              text-align: center; 
              padding: 50px; 
              color: #333;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
            .offline-icon { font-size: 64px; margin-bottom: 20px; }
            h1 { margin-bottom: 20px; }
            p { margin-bottom: 30px; opacity: 0.9; }
            .retry-btn {
              background: rgba(255,255,255,0.2);
              border: 2px solid white;
              color: white;
              padding: 12px 24px;
              border-radius: 25px;
              cursor: pointer;
              font-size: 16px;
              transition: all 0.3s ease;
            }
            .retry-btn:hover {
              background: rgba(255,255,255,0.3);
              transform: translateY(-2px);
            }
          </style>
        </head>
        <body>
          <div class="offline-icon">🚗</div>
          <h1>You're Offline</h1>
          <p>HitchIt needs an internet connection to work properly.</p>
          <button class="retry-btn" onclick="location.reload()">Try Again</button>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'You have a new notification from HitchIt',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-96x96.png'
      }
    ],
    requireInteraction: false,
    tag: 'hitchit-notification'
  };

  event.waitUntil(
    self.registration.showNotification('HitchIt', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync for offline requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle offline requests when connection is restored
      handleBackgroundSync()
    );
  }
});

async function handleBackgroundSync() {
  console.log('Background sync triggered - processing offline requests');
  
  // Here you could implement queued request processing
  // For example, sync pending ride requests, messages, etc.
  
  try {
    // Example: Send any queued requests
    const queuedRequests = await getQueuedRequests();
    
    for (const request of queuedRequests) {
      try {
        await fetch(request.url, request.options);
        await removeFromQueue(request.id);
      } catch (error) {
        console.log('Failed to sync request:', request.url, error);
      }
    }
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}

// Helper functions for background sync (implement as needed)
async function getQueuedRequests() {
  // Implement: get requests from IndexedDB or similar storage
  return [];
}

async function removeFromQueue(requestId) {
  // Implement: remove request from queue after successful sync
  console.log('Removing synced request:', requestId);
}