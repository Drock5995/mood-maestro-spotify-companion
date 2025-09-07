self.addEventListener('push', function(event) {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico', // A small monochrome icon for the notification tray
    data: {
      url: data.url // URL to open when the notification is clicked
    }
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});