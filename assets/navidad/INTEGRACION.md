# Mascota de Navidad y deshielo

La mascota utiliza el SVG inline de `index.html`. `assets/navidad/personaje-animable.svg` conserva el original; `js/green-actor.js` mantiene sus 14 escenas. No se modificó el motor vectorial ni el módulo principal de autenticación y marcaje.

## Comportamiento

- **1 de diciembre:** bloque translúcido completo; cuerpo inmóvil, con parpadeo y movimiento suave de las pupilas.
- **2–21 de diciembre:** las caras, el espesor y la altura del bloque disminuyen según el día del calendario local del dispositivo. Aumentan el charco y las gotas; el 21 queda una base alrededor de los pies. El cuerpo sigue inmóvil; solo se mueven los ojos.
- **22 de diciembre:** la etapa existente cambia a `casa`; desaparece el hielo y se reanudan las animaciones. Se comprueba también cada minuto y al regresar a la pestaña.
- **24 y 31 de diciembre:** se conservan las escenas especiales `xmas` y `nye`.
- La preferencia de movimiento reducido evita las travesuras automáticas. El motor y las animaciones oculares se pausan cuando el login no está visible o la pestaña queda oculta. Con movimiento reducido, los ojos también permanecen estáticos.

El modo **Ver ahora** empieza en el día 1 tanto para la mascota como para el paisaje. Esta consola cambia solo el bloque, mientras se está previsualizando Pre-Navidad:

```js
window.__mascotaNavidadPreviewDia(1);
window.__mascotaNavidadPreviewDia(12);
window.__mascotaNavidadPreviewDia(21);
window.__mascotaNavidadEstado();
```

Para revisar la liberación, seleccionar **Navidad** en el selector de etapa del perfil. El control de día solo acepta enteros de 1 a 21 y no cambia fechas ni preferencias globales.

## Composición

La mascota reside en el panel, después de la tarjeta. Hasta 900 px de ancho, una fila de cuadrícula le reserva espacio junto a la ayuda del PIN. La tarjeta termina 10 px antes de comenzar la caja del SVG. En ventanas cortas, el documento permite desplazarse; el bloque acompaña al contenido y no queda anclado encima de los campos. En escritorio se sitúa junto al panel.

La silueta del hielo y sus caras se recalculan juntas: no se usa un recorte horizontal de la imagen original. El SVG contiene también una forma estática completa como respaldo.

No se escribe en Firebase, no se toca `config/tema` y se conserva el registro y la prioridad de los temas. El calendario automático existente tampoco cambia. La mascota se oculta con otros temas.

## Verificación de esta rama

```sh
node --test tests/navidad.test.cjs
node --check js/navidad-hielo.js
node --check js/navidad-mascota.js
node --check js/navidad.js
```

- 11 pruebas de progresión, límites de la vista previa, liberación al cambiar de fecha, limpieza de escuchadores, tema apagado, otros temas, movimiento reducido y pausa/reanudación de los ojos.
- Chrome: HTML/CSS/SVG y motores reales del login, dentro de vistas de 320×568, 360×640, 390×844, 412×915, 844×390 y 1280×800. Comprobación de escritura, mostrar/ocultar PIN y acceso visual al botón; sin enviar credenciales ni marcajes.
- Las 14 escenas reales se muestrearon en cinco momentos de su duración, sin atributos `NaN` o `Infinity`.
- Capturas reales de los días 1, 12, 21 y 22. Comparación con `main` al iniciar la tarea (`5e2b227`). Con Día de Muertos, la tarjeta conserva exactamente su posición y tamaño.
- El módulo principal y el registro de temas se compararon con `main`: contenido idéntico.

**Límite:** Firebase App Check rechaza el dominio del entorno de prueba. La revisión visual usa una vista aislada del login que omite los módulos de Firebase. No equivale a una prueba de autenticación o marcaje contra producción, ni a una prueba en un teléfono físico.

La rama se entrega para revisión visual, sin fusionar ni publicar en producción.

## Corrección de altura móvil

El flujo real `screen('loginScreen')` aplica `body.style.overflow = 'hidden'`. La primera vista aislada omitía esa condición: permitía desplazar el documento y ocultó un recorte real en teléfonos con menos de 843 px útiles.

En móviles, el login ahora está limitado por `100dvh` (con respaldo `100vh`) y es su propio contenedor desplazable. El panel no se comprime; reserva 24 px más el área segura bajo la escena. En alturas de hasta 850 px, una variante compacta conserva campos y botón, reduce la mascota a 120 px y ajusta la cabecera.

Validación de la corrección: vista aislada con el mismo bloqueo del body que producción. A 393×800, el bloque termina en y=773 y queda completamente visible. A 393×760, el contenedor ofrece 33 px de desplazamiento y se comprobó el acceso a toda la mascota. Se conserva el límite de App Check descrito anteriormente.
