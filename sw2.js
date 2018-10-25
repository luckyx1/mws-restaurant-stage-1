var staticCacheName = 'mws-restaurant-stage-v1';
var CACHED_URL = [
	'/',
	'/restaurant.html',
	'js/idb.js',
	'js/idbWrapper.js',
	'js/main.js',
	'js/restaurant_info.js',
	'js/dbhelper.js',
	'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
	'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
	'css/styles.css',
	'https://unpkg.com/leaflet@1.3.1/dist/images/marker-icon.png',
	'img/1.jpg',
	'img/2.jpg',
	'img/3.jpg',
	'img/4.jpg',
	'img/5.jpg',
	'img/6.jpg',
	'img/7.jpg',
	'img/8.jpg',
	'img/9.jpg',
	'img/10.jpg'
];

self.addEventListener('install', function(event){
	console.log("installed SW");
	event.waitUntil(
		caches.open(staticCacheName).then(function(cache){
			console.log("Cached pages");
			return cache.addAll(CACHED_URL);
		})
	)
});

self.addEventListener('activate', function(event){
	console.log("activated SW");
	event.waitUntil(
		caches.keys().then(function(cacheNames) {
			return Promise.all(
				cacheNames.map(function(cacheName){
					if(cacheName !== staticCacheName){
						console.log("Removing old cache", cacheName);
						return caches.delete(cacheName);
					}
				})
			)
		})
	)
})

self.addEventListener('fetch', function(event){
	event.respondWith(
		caches.match(event.request).then(function(response){
			if (response){
				console.log('Found request in cache');
				return response;
			}else if(event.request.url.includes("restaurant.html")){
				return caches.match('/restaurant.html');
			}
			return fetch(event.request);
		})
	)
});