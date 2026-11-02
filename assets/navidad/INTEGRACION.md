# Mascota verde animada — integración navideña (borrador)

Implementación preparada para revisar y continuar con Claude, sin modificar la rama principal.

## Estructura
- `assets/navidad/personaje-animable.svg`: SVG vectorial transparente por capas.
- `js/green-actor.js`: motor de 14 escenas; expone `GreenActor`.
- `js/navidad-mascota.js`: carga, montaje, limpieza, clics y coordinación con el tema de Daily-log.
- `css/navidad-mascota.css`: posición móvil y escritorio.
- `index.html`: carga de recursos y sincronización después de `__escenaNavidad`.

## Comportamiento y restricciones
- Solo se monta si `window.__temas.activo.id === 'navidad'`. Si se cambia a Día de Muertos, Halloween o al tema normal, se destruye el motor y se elimina el contenedor.
- No activa temas ni modifica `config/tema` en Firebase. No modifica los métodos de login ni la autenticación.
- El modo **Ver ahora** del perfil sigue siendo local al dispositivo.
- Por defecto se reproduce `idle`; cada 19 segundos (solo si está el login a la vista) puede iniciar una acción aleatoria: sigilo, robar, esconderse, trepar o sorpresa.
- Al tocar el personaje, alterna tres reacciones. La Nochebuena real (24 diciembre) reproduce `xmas`, y el 31 de diciembre se activa `nye`.
- Respeta la preferencia de movimiento reducido, detiene el movimiento cuando el documento queda oculto.

## API manual
```js
window.__mascotaNavidadPlay('steal');
window.__mascotaNavidadPlay('caught');
window.__mascotaNavidadPlay('drop');
window.__mascotaNavidadTap();
```
Además del resto de escenas disponibles en `GreenActor.SCENES`.

## Próximos pasos y límites
- Este paso incluye la integración inicial, **no equivale a aprobar el tema navideño terminado**.
- Revisar posición del personaje en teléfonos pequeños y cómo se solapa con la tarjeta, sin bloquear campos ni botones.
- Adaptar las secuencias del personaje a las luces y objetos reales que dibuja `js/navidad.js` (la animación de robar usa sus propios elementos SVG).
- Agregar disparadores específicos del marcaje si se desea, cuidando no cambiar el resultado del marcaje.
- Mantener esta rama sin fusionar hasta revisión visual y funcional.

## Historia añadida: personaje congelado (Pre-Navidad)

- Archivo `js/navidad-hielo.js` genera una **cápsula SVG vectorial de hielo** con reflejos, grietas y goteo.
- **1 de diciembre:** personaje inmóvil, dentro del hielo completo.
- **2–21 de diciembre:** el borde de hielo desciende progresivamente según el **día del calendario** y los indicios de derretimiento aumentan. El personaje permanece inmóvil, no hace travesuras mientras está atrapado.
- **22 de diciembre:** la etapa cambia a `casa`, la cápsula desaparece y comienza su comportamiento animado.
- **24 de diciembre:** la escena `xmas` se reproduce al cargar el login navideño real.
- La visualización anticipada de Pre-Navidad fuera de diciembre usa el día 10 a modo de demostración, sin alterar fechas reales.
- Solo en modo **Mi Perfil → Ver ahora** se puede probar cualquier día del 1 al 21 desde la consola del navegador con `window.__mascotaNavidadPreviewDia(1)`, `window.__mascotaNavidadPreviewDia(12)` o `window.__mascotaNavidadPreviewDia(21)`. El avance en producción se decide por la fecha, no por el almacenamiento local.
- Se consulta el tema activo en `window.__temas`; no escribe datos a Firebase ni cambia la configuración global de temporadas.
- La capa de hielo tiene `pointer-events:none` y no cubre campos de login. Los toques sobre la mascota congelada solo provocan una sacudida del hielo.

**Pendiente de validación visual en navegadores reales:** ajuste fino de tamaño/ubicación móvil y del contorno del hielo respecto al personaje, antes de fusionar.
