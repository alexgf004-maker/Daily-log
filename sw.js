// Service worker de Registro de Planilla.
// Solo muestra los avisos que manda el servidor (functions/avisos.js) y abre la app al
// tocarlos. No guarda nada en caché: la app siempre se carga de internet.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Patrones de vibración (Android): 'fuerte' para el segundo recordatorio de marcar
const VIBRAR = { normal: [250, 120, 250], fuerte: [500, 150, 500, 150, 500, 150, 900] };

// Cómo se muestra un aviso (aparte para poder probarlo): { titulo, cuerpo, url, tag } y opcionales
// fijo ('1' = se queda en pantalla hasta que lo toquen), vibrar, imagen y boton
function opcionesAviso(d) {
  const o = {
    body: d.cuerpo || '',
    tag: d.tag || 'innova',
    renotify: true,
    icon: 'icono-192.png',
    badge: 'badge-96.png',           // ícono blanco de la barra de arriba (Android)
    vibrate: VIBRAR[d.vibrar] || VIBRAR.normal,
    requireInteraction: d.fijo === '1',
    data: { url: d.url || './' },
  };
  if (d.imagen) o.image = d.imagen;
  if (d.boton) o.actions = [{ action: 'abrir', title: d.boton }];
  return o;
}

// Llega un aviso (mensaje "solo datos" de Firebase)
self.addEventListener('push', e => {
  let d = {};
  try { const p = e.data ? e.data.json() : {}; d = p.data || p; } catch (_) {}
  e.waitUntil(self.registration.showNotification(d.titulo || 'INNOVA · Registro de Planilla', opcionesAviso(d)));
});

// Al tocar el aviso (o su botón): si la app ya está abierta se trae al frente y se le pide
// ir a lo que dice el aviso (p. ej. el marcaje); si no, se abre en esa dirección
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || './', self.registration.scope).href;
  e.waitUntil((async () => {
    const abiertas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const app = abiertas.find(c => c.url.startsWith(self.registration.scope));
    if (app) {
      if (/[?&]marcar=1/.test(url)) app.postMessage({ tipo: 'ir-marcar' });
      return app.focus();
    }
    return self.clients.openWindow(url);
  })());
});
