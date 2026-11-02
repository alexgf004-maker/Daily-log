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
