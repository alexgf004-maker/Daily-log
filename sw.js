// Service worker de Registro de Planilla.
// Solo muestra los avisos que manda el servidor (functions/avisos.js) y abre la app al
// tocarlos. No guarda nada en caché: la app siempre se carga de internet.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Llega un aviso: { titulo, cuerpo, url, tag } (mensaje "solo datos" de Firebase)
self.addEventListener('push', e => {
  let d = {};
  try { const p = e.data ? e.data.json() : {}; d = p.data || p; } catch (_) {}
  const titulo = d.titulo || 'INNOVA · Registro de Planilla';
  e.waitUntil(self.registration.showNotification(titulo, {
    body: d.cuerpo || '',
    tag: d.tag || 'innova',
    renotify: true,
    icon: 'icono-192.png',
    badge: 'icono-192.png',
    data: { url: d.url || './' },
  }));
});

// Al tocar el aviso: si la app ya está abierta se trae al frente; si no, se abre
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || './', self.registration.scope).href;
  e.waitUntil((async () => {
    const abiertas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const app = abiertas.find(c => c.url.startsWith(self.registration.scope));
    if (app) return app.focus();
    return self.clients.openWindow(url);
  })());
});
