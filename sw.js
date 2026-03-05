const cacheName = "cache"; // Change value to force update

self.addEventListener("install", event => {
	// Kick out the old service worker
	self.skipWaiting();

	event.waitUntil(
		caches.open(cacheName).then(cache => {
			return cache.addAll([
				"/",
				"android-chrome-36x36.png", // Favicon, Android Chrome M39+ with 0.75 screen density
				"android-chrome-48x48.png", // Favicon, Android Chrome M39+ with 1.0 screen density
				"android-chrome-72x72.png", // Favicon, Android Chrome M39+ with 1.5 screen density
				"android-chrome-96x96.png", // Favicon, Android Chrome M39+ with 2.0 screen density
				"android-chrome-144x144.png", // Favicon, Android Chrome M39+ with 3.0 screen density
				"android-chrome-192x192.png", // Favicon, Android Chrome M39+ with 4.0 screen density
				"android-chrome-256x256.png", // Favicon, Android Chrome M47+ Splash screen with 1.5 screen density
				"android-chrome-384x384.png", // Favicon, Android Chrome M47+ Splash screen with 3.0 screen density
				"android-chrome-512x512.png", // Favicon, Android Chrome M47+ Splash screen with 4.0 screen density
				"apple-touch-icon.png", // Favicon, Apple default
				"apple-touch-icon-57x57.png", // Apple iPhone, Non-retina with iOS6 or prior
				"apple-touch-icon-60x60.png", // Apple iPhone, Non-retina with iOS7
				"apple-touch-icon-72x72.png", // Apple iPad, Non-retina with iOS6 or prior
				"apple-touch-icon-76x76.png", // Apple iPad, Non-retina with iOS7
				"apple-touch-icon-114x114.png", // Apple iPhone, Retina with iOS6 or prior
				"apple-touch-icon-120x120.png", // Apple iPhone, Retina with iOS7
				"apple-touch-icon-144x144.png", // Apple iPad, Retina with iOS6 or prior
				"apple-touch-icon-152x152.png", // Apple iPad, Retina with iOS7
				"apple-touch-icon-180x180.png", // Apple iPhone 6 Plus with iOS8
				"browserconfig.xml", // IE11 icon configuration file
				"favicon.ico", // Favicon, IE and fallback for other browsers
				"favicon-16x16.png", // Favicon, default
				"favicon-32x32.png", // Favicon, Safari on Mac OS
				"index.html", // Main HTML file
				"logo.png", // Logo
				"main.js", // Main Javascript file
				"manifest.json", // Manifest file
				"maskable_icon.png", // Favicon, maskable https://web.dev/maskable-icon
				"mstile-70x70.png", // Favicon, Windows 8 / IE11
				"mstile-144x144.png", // Favicon, Windows 8 / IE10
				"mstile-150x150.png", // Favicon, Windows 8 / IE11
				"mstile-310x150.png", // Favicon, Windows 8 / IE11
				"mstile-310x310.png", // Favicon, Windows 8 / IE11
				"safari-pinned-tab.svg", // Favicon, Safari pinned tab
				"share.jpg", // Social media sharing
				"pico.css", // Main CSS file
                "custom.css", // Custom CSS file
			]);
		})
	);
});

self.addEventListener("activate", event => {
    self.clients.claim();
	// Delete any non-current cache
	event.waitUntil(
		caches.keys().then(keys => {
			return Promise.all(
				keys.map(key => {
					if (![cacheName].includes(key)) {
						return caches.delete(key);
					}
				})
			)
		})
	);
});

self.addEventListener("fetch", event => {
    // We only handle GET requests
    if (event.request.method !== 'GET') return;

    // F5 triggers a reload, in this case we want to skip the cache match and go to network
    // This allows for "instant update" on F5 during development.
    // 'no-cache' is sometimes used by browsers during reloads or when bypassing cache.
    // We also check for 'navigate' to ensure the main document reload is caught.
    const isNavigation = event.request.mode === 'navigate';
    const isReload = event.request.cache === 'reload' || 
                     event.request.cache === 'no-cache' ||
                     (isNavigation && event.request.cache !== 'only-if-cached');

    // For navigations or reloads, we want to try the network first with a 15-second timeout
    if (isNavigation || isReload) {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error('Network timeout after 15 seconds'));
            }, 15000); // 15 seconds
        });

        const fetchOptions = isReload ? { cache: 'no-store' } : {};
        const fetchPromise = fetch(event.request, fetchOptions).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(cacheName).then(cache => {
                    cache.put(event.request, responseClone);
                });
            }
            return networkResponse;
        });

        event.respondWith(
            Promise.race([fetchPromise, timeoutPromise]).catch(() => {
                // If network fails or times out, try to return from cache
                return caches.match(event.request).then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // If no cache, throw original error to show browser's offline page
                    throw new Error('Network failed/timed out and no cached version available');
                });
            })
        );
        return;
    }

    // For other requests, use a standard stale-while-revalidate or cache-first approach
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            const fetchPromise = fetch(event.request).then(networkResponse => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(cacheName).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(error => {
                // If the network request fails (e.g., offline)
                if (cachedResponse) {
                    return cachedResponse;
                }
                throw error;
            });

            // Return the cached response immediately if it exists,
            // while the fetchPromise updates the cache in the background
            return cachedResponse || fetchPromise;
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close(); // Close the notification

    // Define where the user should go
    const urlToOpen = '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // If the app is already open, focus it
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not open, open a new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});