# Mascota de Navidad

El SVG inline de `index.html` y `assets/navidad/personaje-animable.svg` conservan el personaje original. `GreenActor` mantiene las 14 animaciones originales y añade seis poses para el login: `thaw`, `privacy`, `tug`, `offer`, `grump` y `plot`.

## Calendario e historia

- **1–21 de diciembre:** el cuerpo permanece congelado; los ojos parpadean y miran alrededor. El bloque pierde altura y espesor por día; el 21 conserva una base.
- **Desde el 22:** desaparece el hielo. En la primera visita de la temporada, mira sus manos, se sacude el frío y se estira durante 6,2 segundos. La marca `innova_nv_liberado_<año>` se guarda únicamente en el dispositivo, al terminar la presentación. En Ver ahora se repite sin guardar esa marca.
- **22–23:** tras acumular 24–36 segundos de reposo, camina de puntillas, tira de un cordón y se lleva un foco de la guirnalda real. Si lo tocas, se sobresalta y el foco cae y vuelve a su lugar. Sin intervención también termina devolviéndolo; nunca deja la decoración incompleta entre escenas.
- **24–27:** devuelve una luz a la guirnalda con una sonrisa. El primer acceso de la temporada conserva la presentación de liberación.
- **Año Nuevo:** reacciona a los fuegos artificiales del tema y se tapa los oídos. No dibuja otra escena de fuegos artificiales dentro de su SVG.

La mayor parte del tiempo respira, parpadea y espera en su espacio. En Navidad intercala refunfuños y planes de robo, separados por pausas. Entrecierra los párpados, frunce las cejas, cruza los brazos, resopla, da una pequeña patada y junta las manos con una sonrisa torcida. Al tocarlo primero desconfía, después se enfada y al tercer toque responde con descaro. Estas variantes se limitan al login de Navidad: las 14 escenas originales siguen disponibles fuera del modo integrado. Los gestos no reinician la espera del robo; después de devolver el foco descubierto, adopta una pose de fastidio. Las animaciones autónomas no se ejecutan mientras el formulario tiene el foco.

## Reacción al PIN

Al enfocar el campo del PIN devuelve cualquier foco que estuviera moviendo y se cubre los ojos. Mantiene la pose hasta salir del campo. La interacción escucha `focusin` y `focusout`: no lee valores, credenciales, pulsaciones ni resultados de autenticación.

Con movimiento reducido se muestra directamente la pose final, sin animar las manos. Los movimientos y el reloj de la historia se detienen cuando el login o la pestaña están ocultos. Al cambiar de tema se restauran los objetos y se eliminan escuchadores y capas.

## Integración visual

`js/navidad-historia.js` selecciona un foco existente de `.nv-guirnalda`. Durante su traslado, el foco original queda temporalmente oculto y una representación del mismo color lo acompaña hasta la mano. El cable pasa por el margen exterior de la tarjeta; el último tramo queda debajo del formulario. La capa tiene `pointer-events:none` y se elimina al devolver el foco, enfocar el formulario o abandonar la escena.

Las escenas originales de robar y esconderse incluyen su propia tarjeta y guirnalda. El modo integrado evita dibujar esos decorados duplicados; las seis poses nuevas trabajan con el login real. La silueta del personaje permanece dentro de su espacio durante las reacciones integradas; no sale de pantalla al segundo toque. Los gestos se comunican por la cara y el cuerpo, sin globos de texto. Las animaciones originales siguen disponibles en el motor.

En móvil se conserva la fila reservada a la mascota junto a la ayuda del PIN. El login usa su propio desplazamiento y `100dvh` (respaldo `100vh`) porque `screen()` bloquea el desplazamiento del body. Se reserva espacio bajo los pies. La cabecera de Navidad y Año Nuevo se compacta en ventanas bajas para conservar visible al personaje.

No se modifica el módulo principal de autenticación/marcaje, el registro de temporadas, `config/tema` ni la activación global. Todo el comportamiento depende del tema activo existente.

## Previsualización local

Con Mi Perfil → Ver ahora → Pre-Navidad:

```js
__mascotaNavidadPreviewDia(1);
__mascotaNavidadPreviewDia(12);
__mascotaNavidadPreviewDia(21);
```

Con Ver ahora → Navidad:

```js
__mascotaNavidadHistoria('liberacion');
__mascotaNavidadHistoria('travesura');
__mascotaNavidadHistoria('regalo');
__mascotaNavidadPlay('grump');
__mascotaNavidadPlay('plot');
__mascotaNavidadEstado();
```

Los controles de historia solo funcionan en esa vista local y con movimiento permitido; no alteran fechas ni preferencias globales. El reloj de las escenas usa el tiempo animado del motor, sin cadenas de temporizadores que continúen en segundo plano.

## Validación

```sh
node --test tests/navidad.test.cjs
node --check js/green-actor.js
node --check js/navidad-historia.js
node --check js/navidad-mascota.js
```

Se prueban calendario, vista previa, liberación por temporada, pausa/reanudación, devolución de objetos, limpieza, enfoque del PIN, movimiento reducido y restauración de poses. El motor real se muestrea en cinco momentos de cada una de sus 20 escenas, con y sin integración, verificando transformaciones finitas y restauración de brazos.

La revisión en Chrome utiliza HTML/CSS/SVG y motores reales con el mismo bloqueo del body que producción. Se comprueban escenas completas, foco real, interacción del PIN y acceso al personaje en pantallas cortas. La revisión de los gestos utiliza el reloj real del motor, incluidos el regreso al reposo, las reacciones sucesivas y la interrupción al enfocar el PIN.

**Límite:** App Check rechaza el dominio de prueba. La vista aislada omite módulos Firebase y no equivale a una prueba de autenticación/marcaje contra producción ni a una prueba en un teléfono físico. La rama se prepara para revisión visual antes de fusionar.
