self.addEventListener('fetch', event => {
  // simple no-cache service worker – just makes the app installable
  event.respondWith(fetch(event.request));
});