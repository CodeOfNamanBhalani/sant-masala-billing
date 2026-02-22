/**
 * Sant Masala - Service Worker
 * Enables PWA functionality and offline support
 */

const CACHE_NAME = 'sant-masala-v1';
const STATIC_CACHE = 'sant-masala-static-v1';
const DYNAMIC_CACHE = 'sant-masala-dynamic-v1';

// Assets to cache
const STATIC_ASSETS = [
    '/',
    '/pos',
    '/admin',
    '/static/css/style.css',
    '/static/js/app.js',
    '/static/js/api.js',
    '/static/js/i18n.js',
    '/static/js/printer.js',
    '/static/manifest.json',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Noto+Sans+Gujarati:wght@400;500;600;700&display=swap'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('[SW] Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch(err => {
                console.error('[SW] Cache failed:', err);
            })
    );
    
    self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
    console.log('[SW] Activating...');
    
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
                    .map(key => {
                        console.log('[SW] Removing old cache:', key);
                        return caches.delete(key);
                    })
            );
        })
    );
    
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip API requests (we want fresh data)
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(request));
        return;
    }
    
    // For static assets, use cache-first strategy
    event.respondWith(cacheFirst(request));
});

// Cache-first strategy
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) {
        return cached;
    }
    
    try {
        const response = await fetch(request);
        
        // Cache successful responses
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        // Return offline page if available
        const offlinePage = await caches.match('/offline.html');
        if (offlinePage) {
            return offlinePage;
        }
        
        throw error;
    }
}

// Network-first strategy (for API calls)
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        
        // Cache successful API responses
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        // Try to return cached version
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }
        
        throw error;
    }
}

// Background sync for offline orders
self.addEventListener('sync', event => {
    console.log('[SW] Background sync:', event.tag);
    
    if (event.tag === 'sync-orders') {
        event.waitUntil(syncOfflineOrders());
    }
});

async function syncOfflineOrders() {
    // Get offline orders from IndexedDB
    // Sync them to server when online
    console.log('[SW] Syncing offline orders...');
}

// Push notifications (for future use)
self.addEventListener('push', event => {
    const data = event.data?.json() || {};
    
    const options = {
        body: data.body || 'New notification',
        icon: '/static/icons/icon-192.png',
        badge: '/static/icons/icon-72.png',
        vibrate: [100, 50, 100],
        data: data
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'Sant Masala', options)
    );
});

// Notification click
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow(event.notification.data?.url || '/pos')
    );
});
