# Contexto del proyecto — Registro de Planilla (INNOVA / DELSUR)

> Este documento le da a Claude Code el contexto completo de la app: qué es, cómo
> está construida, las decisiones ya tomadas, las carencias conocidas y las reglas
> de trabajo. Léelo completo antes de tocar código.

---

## 1. Qué es la app

**Registro de Planilla** (también llamada "Daily-log") es una PWA (aplicación web
instalable) de control de actividad diaria para **~30 empleados de campo** de DELSUR
(distribuidora de electricidad), El Salvador. La usa a diario el equipo de servicios
técnicos y comerciales de INNOVA.

**Qué hace hoy:**
- Registro diario de actividades por empleado.
- Marcaje de entrada/salida por GPS (asistencia).
- Asistencia: tardanzas, salidas tempranas, sábados laborales, alertas del día anterior.
- Viáticos y horas extra (con flujo de aprobación).
- Solicitudes de vacaciones (rangos de fecha), permisos e incapacidades.
- Calculadora de descuentos (ISSS/AFP/Renta) para los empleados.
- **Programación**: los admin arman a diario la asignación de personal + vehículos +
  campañas, y generan una imagen para compartir por WhatsApp.
- Reportes mensuales con exportación a Excel.

**Usuarios y roles:**
- **admin**: Madelyn Osegueda (arma programación, aprueba, ve todo).
- **asistentes**: Patrizzia di Carmen, Luis Alfaro (gestionan un subconjunto de empleados).
- **empleados**: ~30 técnicos de campo.
- **desarrollador**: David García (también es empleado; mantiene la app).

---

## 2. Stack y dónde vive

- **Frontend**: HTML + CSS + JavaScript vanilla (sin framework). Módulos ES6 (`type="module"`).
- **Backend**: Firebase Realtime Database (proyecto `daily-e4f86`,
  `https://daily-e4f86-default-rtdb.firebaseio.com`).
- **Hosting**: GitHub Pages. Repo `github.com/alexgf004-maker/Daily-log`,
  publicado en `https://alexgf004-maker.github.io/Daily-log/`.
- **Seguridad**:
  - **Login por servidor** (Cloud Functions en `functions/`, se publican solas con GitHub
    Actions al cambiar `functions/` en `main`; ver `functions/LEEME.md`). El servidor revisa
    usuario + PIN (con límite de intentos) y entrega un token; la app entra con él a
    **Firebase Authentication** (`signInWithCustomToken`, el uid de Auth = la clave en `users`).
    La app ya **no descarga** la lista de usuarios ni los PIN.
  - Funciones: `login`, `cambiarPin` (el propio usuario), `guardarUsuario` (admin crea/edita,
    PIN opcional al editar), `migrarPines` (se llama sola una vez por teléfono al entrar un admin).
  - Los PIN viven en `pins/{uid}` = `{hash, salt}` (sha256(salt+pin)). Los del formato viejo
    (`users/{uid}/pin` con salt `INNOVA_SALT_2025_`, o `pins_viejos/{uid}`) se convierten al
    primer login correcto. `pins`, `pins_viejos` y `seguridad_intentos` no los debe leer la app.
  - **Usuarios repetidos**: un doble toque en "Guardar" llegó a crear dos fichas con el mismo
    usuario. Ahora el botón se bloquea ("Guardando…", un solo guardado a la vez) y `guardarUsuario`
    aparta el nombre con una transacción en `creando_usuario/{sha256(usuario)}` mientras guarda (si
    ya está apartado: "Ese usuario ya existe"; un apartado de más de 1 min se ignora). Si aun así
    hubiera dos fichas con el mismo usuario, `login` usa la activa (`usuarioPorNombre`), así que
    desactivar la copia nunca deja a nadie afuera. `creando_usuario` tampoco lo lee la app.
  - La sesión guardada (`innova_session`) solo vale si además hay sesión de Firebase Auth con el
    mismo uid; si no, pide entrar de nuevo ("La app se actualizó").
  - Firebase App Check con reCAPTCHA v3 (site key `6Lfd1bMsAAAAAGk4puMSgSLebxVqffk-qsouUIie`).

---

## 3. Estructura de archivos

La app nació como un `index.html` monolítico y se ha ido modularizando. Estructura actual:

```
/index.html            → HTML + el grueso del JS de la app (dentro de <script type="module">)
/css/styles.css        → todos los estilos (cache-bust con ?v=N, subir N en cada cambio de CSS)
/js/utils.js           → fechas, formato, cálculo de HE, asuetos, mes cerrado
/js/marcaje.js         → marcaje GPS, sedes, estados de marcaje
/js/asistencia.js      → sábados laborales, resúmenes de asistencia, alertas
/js/calculadora.js     → cálculo de descuentos ISSS/AFP/Renta
/js/programacion.js    → catálogos de campañas/vehículos, CRUD, guardado de programación
/js/musica.js          → música de fondo (login y app): subida del admin, caché en el teléfono, botón de silencio
/js/avisos.js          → avisos al celular (notificaciones): activar/apagar/probar, token del teléfono
/sw.js                 → service worker: solo muestra los avisos y abre la app al tocarlos (no guarda caché)
/manifest.json, /icono-*.png → app instalable (pantalla de inicio); en iPhone los avisos lo necesitan
/functions/            → servidor (Cloud Functions): login/PIN (index.js) y avisos (avisos.js)
/database.rules.json   → reglas de la base (se publican solas con GitHub Actions)
```

`index.html` sigue siendo grande (~4600 líneas). Modularizar más (separar admin/empleado)
se ha diferido por ser **alto riesgo estando en producción**. Es candidato a auditoría,
pero cualquier split debe hacerse con extremo cuidado y en rama aparte.

---

## 4. Estructura de datos en Firebase (nodos principales)

- `users/{uid}`: `{nombre, nombreCorto?, cargo?, username, role, activo,
  empleadosAsig[], sede, dispositivoId?, avisosVistosEn?, tutoCampanitaV?}`. `avisosVistosEn` = hasta cuándo
  el técnico vio su campanita de novedades (timestamp); `tutoCampanitaV` = versión del
  recorrido de novedades que ya vio (campanita, calendario y detalle; obligatorio la
  primera vez, sale una vez por versión; `tutoCampanita` y
  `tutoCampanita2` quedaron de versiones anteriores).
- `registros/{uid}/{key}`: registro diario. Campos según tipo: `{fecha, tipoDia, actividades,
  viatico, he, estadoViatico, estadoHE, estadoEspecial, vacIni?, vacFin?, nota?, ...}`.
  `tipoDia` puede ser: `normal`, `vacaciones`, `incapacidad`, `permiso`, `bienestar`,
  `injustificado`, `asueto`. Al revisar se guarda la hora en `revisadoHEEn`, `revisadoViaticEn`
  y `revisadoEspEn`; con eso se arman las novedades de la campanita del técnico.
- `marcajes/{uid}/{fecha}/{entrada|salida}`: marcaje GPS con timestamp de servidor
  (`ts, lat, lng, precision, sedeUsada, estado, horaStr, minDiff`). Puede tener además
  `justificado: {por, nombre, nota, ts}` — ver sección 5, "Justificar tardanzas".
- `config/`: configuración varia (incluye `config/vehiculos`, `config/campanias`,
  `config/sabadosLaborales`, `config/musica` y `config/musicaDatos`).
- `config/cierreSesion`: marca (ms) del último "Cerrar sesión a todos" del admin. Al entrar, cada teléfono
  guarda la marca vigente en `localStorage.innova_sesion_cierre`; si en la base aparece otra distinta, la
  sesión se cierra (al abrir la app o al instante con la app abierta) con el aviso "La app se actualizó".
  No compara relojes. Sesiones sin marca guardada (versiones viejas) se cierran si existe un cierre.
  Con la app abierta, después de cerrar la sesión la app **se recarga** (`cerrarSesionForzada`: espera a que
  termine el cierre, máx. 3 s, refresca la copia de la página con `fetch(..., {cache:'reload'})` y recarga),
  así cada teléfono trae la versión nueva sin cerrarla a mano; el aviso se muestra tras recargar
  (`sessionStorage.innova_aviso_cierre`). Sirve para publicar algo importante y que todos lo tengan ya.
  Al salir (`doLogout`) se detiene la escucha en vivo de la programación y se reabre al entrar.
  Al volver a entrar, si hay música que ese teléfono no tiene, el login la espera con una pantalla de
  avance (`retenerParaMusica`; a los 15 s deja "Entrar sin esperar"). El texto no menciona la música:
  con Halloween dice "Preparando la temporada de Halloween" (calabaza); sin tema, "Preparando la app".
- `config/tema`: tema para todos (ver "Temas de temporada").
- `config/musica`: `{version, nombre, tipo, bytes, partes, activa, subidoPor, subidoEn}` de la música de
  fondo; el audio va en `config/musicaDatos/{version}/{i}` como texto base64 en partes de 512 KB (la app no
  usa Firebase Storage). Cada teléfono la baja una vez y la guarda en IndexedDB (`innova-musica`); solo
  vuelve a bajarla si cambia `version`. Al subir otra se escriben primero las partes, luego `config/musica`
  y al final se borra la versión anterior. Tope 6 MB por archivo.
- `programaciones/{fecha}`: `{grupos:[{campania, area, empleados[], empleadosNombres[],
  vehiculo, vehiculoNombre, zona}], noDisponibles:{personal[], vehiculos[]}, actualizado, por, dev}`
  (`por` = uid de quien guardó; `dev` = id del dispositivo, para que la escucha en vivo ignore lo propio).
- `asuetos/`, `observaciones/`, `suspensiones/`: nodos de apoyo.
- `avisos_tokens/{uid}/{id}`: `{token, actualizado, equipo}` un registro por teléfono con los avisos
  activados (lo escribe la app; solo el dueño lo lee). `avisos_enviados/{fecha}/{uid}/{tipo}_{antes|despues}`: control
  de los recordatorios de marcar (cada aviso una vez al día; solo el servidor). `avisos_prueba/`: solo en el emulador.

**Reglas de Firebase**: todos los nodos anteriores tienen `.read`/`.write: true` (abiertas).
La protección real hoy es App Check + PIN, no las reglas. **Esto es una carencia de seguridad
importante — ver sección 7.**

---

## 5. Decisiones de diseño ya tomadas (no revertir sin consultar)

- **Marcaje GPS**: sedes con radio 100 m (Plantel Central: 115 m) — Plantel Central
  (13.688409755143281, -89.27993065477382), Plantel Central · Gestión de la
  medida (13.687696, -89.280831), Subestación Cucumacayán
  (13.693570433295193, -89.20564341328895), Subestación Zacatecoluca
  (13.508016211954466, -88.86875891706555), Subestación San Vicente (13.645885, -88.786376;
  radio 110 m). Hora de servidor, no del teléfono.
  Horario: L-J 07:00-17:00, V 07:00-16:00, Sáb 06:00-14:00, Dom sin evaluación.
  Tolerancia 0 min (7:00 en punto). El horario es global (igual para todas las
  sedes); si más adelante una sede necesita horario propio, se agregará como
  override por sede. Las sedes viven en SEDES (js/marcaje.js) y se listan a mano
  en 3 <select> de index.html (uSede, adPerfilSede, sedeTempSede): agregar una
  requiere tocar los 4 lugares, más la lista `SEDES` de `functions/avisos.js` (recordatorios).
- **Detección automática de sede** (el personal rota): quien tiene sede asignada (fija o
  temporal) puede marcar entrada y salida en CUALQUIER sede oficial; se guarda la que
  detectó el GPS en `sedeUsada` (`ubicarSede` en js/marcaje.js). Si está dentro de dos
  a la vez (Plantel y Gestión de la medida) gana la suya; si no, la más cercana.
  "Prueba" solo vale para quien la tiene asignada. La sede asignada sigue decidiendo
  quién marca y a quién le llegan los recordatorios. En Asistencia se ve dónde marcó
  ("Cucumacayán → Zacatecoluca" si salió de otra) y se resalta si no es la suya.
  Los imports de marcaje.js/asistencia.js llevan `?v=N`: subirlo si cambian sus exports.
- **Vínculo de dispositivo anti-fraude**: cada empleado queda vinculado a un
  `dispositivoId` (UUID en localStorage); si marca desde otro equipo se bloquea. El admin
  puede reiniciar el vínculo.
- **Sesión** en localStorage (el empleado sigue logueado aunque cierre la app).
- **Cierre de mes automático**: a partir del día 1 del mes siguiente, el mes anterior
  queda de solo lectura (`mesCerrado`).
- **Calculadora**: solo cálculo en pantalla, no guarda nada en Firebase. Tramos de renta
  fijos en el código.
- **Programación** (sección grande, muy iterada — el diseño actual es el aprobado tras
  varios rechazados):
  - Solo admin arma la sección.
  - **Guardado** (`persistProg`): cada cambio guarda el día completo en segundo plano, en orden (si llega
    otro cambio mientras se guarda, se vuelve a guardar al terminar) y limpiando valores vacíos
    (`limpiarGrupoProg`). Indicador bajo la fecha (`#progGuardado`, `htmlGuardadoProg`): "Guardando…",
    "✓ Guardado · hora", "Guardando… revisa tu señal" a los 6 s, y si falla un aviso rojo con el motivo
    (`motivoErrorProg`: permiso → "sal y vuelve a entrar"; sin internet) + botón **Reintentar** y un toast.
    Si se cierra la app con algo sin guardar, el navegador pregunta. Antes los fallos no se avisaban
    (reporte de la admin: "no guarda los cambios").
  - **En vivo** (`escucharProgEnVivo`): el tablero escucha el día abierto; si otra persona (u otro dispositivo)
    guarda, se actualiza solo y avisa "Actualizado con cambios de X". Antes cada pantalla pisaba a la otra.
    Si se está escribiendo una zona, se aplica al salir del campo.
  - **Carga de un día** (`cargarProgramacionFecha`): el tablero queda bloqueado y no se guarda nada hasta que
    termine (antes un cambio en ese momento guardaba los grupos del día anterior en el nuevo); vale solo la
    última carga; si falla, queda bloqueado con "No se pudo cargar este día · Reintentar".
  - Las campañas ocupan la pantalla (separadas **Campo** / **Plantel**), cada una con
    botón "+ grupo"; los grupos son cajas.
  - Un **botón flotante "Personal libre (N)"** abre un panel deslizable con la lista
    completa de personal + buscador. Flujo: tocar botón → elegir persona → el botón se
    pone verde "Asignar: X" → tocar la caja del grupo. **No usar drag & drop** (se probó
    y se rechazó; en celular no funciona bien).
  - **Ausentes y "Copiar de…"**: quien tiene ausencia ese día (vacaciones —también por rango—,
    incapacidad, permiso, bienestar, injustificado; `ausenciaEnFecha`) no sale en "Libres" y **no se
    copia** al copiar otro día (`quitarAusentesDeGrupos`): sale un aviso "No se copió a X (vacaciones)…".
    Si alguien asignado tiene ausencia (p. ej. se registró después de armar), arriba del tablero sale
    "X está en un grupo pero tiene … este día" con "Quitar" (`progQuitarAusente`). Registrar o quitar
    una ausencia actualiza el tablero sin recargar (`refrescarAusentesProg`). `progAusTipo` = uid → tipo.
    Al copiar se conserva la lista "No disponibles" del día destino (no se trae la del otro día).
  - Vehículo se elige DENTRO del grupo (botón "+ Asignar vehículo"): pick-ups y motos
    disponibles en verde, no-disponibles (mantenimiento/prestado/baja) en rojo y no
    seleccionables.
  - **Zona/detalle**: texto libre, opcional, solo en grupos de campo.
  - **Imagen para WhatsApp**: dibujada en canvas. Cada grupo en tarjeta con fondo suave
    (zona en chip azul, personal al centro, vehículo en chip verde). Campañas con título.
    "Verificación de factibilidad" siempre al final de Campo. Sección "No disponibles"
    con etiquetas: Vacaciones, Incapacidad, Permiso, Día de bienestar, Permiso injustificado.
  - **Ausencias** (sub-pestaña, atajo de admin): registra incapacidad (inicio + días),
    vacaciones (inicio + fin), permiso/bienestar/injustificado (un día). Escribe en la
    planilla del empleado cada día del rango, **respetando meses cerrados y días ya
    registrados** (no duplica ni pisa). Saca a la persona de "Personal libre" esos días.
- **Aprendizaje transversal de diseño**: en celular no caben "personal fijo + campañas"
  a la vez; validar el enfoque antes de construir. La app se usa **mayormente en celular**.
- **Justificar tardanzas/salidas tempranas** (para que no ensucien el recuento del mes):
  solo el **admin** puede justificar (los asistentes ven el detalle pero no el botón).
  Se hace desde el detalle mensual de Asistencia (clic en un empleado → junto a cada
  tardanza/salida temprana hay un enlace "Justificar" / "Quitar justificación"). Guarda
  `justificado:{por, nombre, nota, ts}` dentro del propio `marcajes/{uid}/{fecha}/{tipo}`
  (no se borra ni se mueve el marcaje original — el dato crudo se conserva siempre).
  Una marca justificada **no cuenta** en `diasTarde`/`minTarde`/`salidasTemp`/`minTemp`
  (mensual) ni en las listas/contadores del día (`asistenciaHoy`/`asistenciaDia`), pero
  sigue mostrándose en el detalle y en el Excel exportado con el badge "Justificado", en
  vez de ocultarse — es trazabilidad, no borrado.
- **Asistencia · Comportamiento** (pestaña junto a "Por colaborador"): gráficas del mes
  hechas solo con `asistCache` (no hace lecturas extra a Firebase). Arriba hay un selector
  "Todo el grupo / persona" (`agSel`).
  - Grupo: ranking "¿quién llega tarde / sale antes más seguido?" (con selector
    Entradas/Salidas, `agFoco`), día por día, mapa del mes y por día de la semana.
  - Persona: frase de resumen, totales, "hora de entrada / salida cada día" contra la
    línea de `horarioOficial` (exportado de marcaje.js) y por día de la semana.
  Usa los mismos colores del calendario de Asistencia (verde a tiempo, rojo tarde, ámbar
  salió antes). Las marcas justificadas cuentan como a tiempo en los totales y se
  dibujan como círculo hueco. La pestaña elegida se recuerda en `localStorage.asistModo`.
- **Ventanas (modales)**: todas usan el estilo de hoja de "aprobar horas extra" (`.mo.sx-mo` +
  `.modal.ds.sx`, clases `he-*` y `sx-*`). En celular suben desde abajo y en PC quedan centradas.
  Un `<select class="sx-oculto">` se muestra como tarjetas en su `.sx-ops[data-for]` (`sxPintarOps`,
  se redibuja solo al abrir la ventana). Los atajos de fecha son `.he-chips[data-fecha]` + `sxFecha`.
  Si agregas una ventana nueva, usa ese mismo patrón.
- **Excel de Asistencia** (`exportarAsistencia`): usa ExcelJS + html2canvas (cdnjs, se cargan solo al
  exportar; el resto de exports sigue con SheetJS). Hojas: Gráficas (capturas de las tarjetas del
  grupo con `agCapturar`), Mapa del mes (celdas de colores con letra T/S/X/J/F y nota con las horas),
  Por persona (frase + gráficas de entrada/salida), Resumen y Detalle.

---

- **Música de fondo**: el admin la sube en Perfil → Administración → "Música de la app" (también puede
  apagarla para todos o quitarla). Suena en el login y dentro de la app, en bucle y a volumen bajo, con un
  botón flotante abajo a la izquierda para silenciarla (cada persona; se recuerda en `innova_musica_silencio`).
  Los navegadores no dejan sonar audio sin un toque: si no puede arrancar sola, empieza con el primer toque o
  tecla. Se pausa cuando la app queda en segundo plano.

- **Asistencia, horas de cualquier día**: pestaña "Por día" (elige el día; entrada y salida de todos, ordenados por
  hora de llegada, con estado y sede; tocar a alguien abre su detalle en ese día). En el detalle de cada persona,
  "Día por día" (todos los días con entrada y salida, también días no laborales con marca) o "Solo incidencias".
  Usa los marcajes y registros del mes que ya baja el resumen (`asistCache.marcs`/`regs`): sin lecturas extra.
- **Compañeros del día en un registro** (solo admin y asistente): "Anduvo con" en el detalle de un registro y en
  el día por día del perfil del empleado. Sale del grupo de la Programación de ese día y de los nombres escritos
  en las actividades (nombre + apellido, o solo el nombre si es único y va después de "con"/"y"). Tocar a uno
  abre al momento lo que esa persona registró ese día y su marcaje (`verCompanero`).
- **Actividades prellenadas** (empleado, Nuevo Registro): al elegir el día (Normal o asueto trabajado), si está
  en la Programación de esa fecha, Actividades empieza con "Campaña en zona, con A y B." (`prellenarActividades`,
  `textoDeProgramacion`; "e" antes de i/hi). Solo si el campo está vacío o aún tiene el texto de la app: nunca
  pisa lo que escribió; al cambiar de día se reemplaza (o se vacía si ese día no tiene programación). Aviso
  "Tomado de tu programación" (`#empActsProg`) mientras no lo edite. Se puede guardar tal cual (decisión de
  la admin). Lee la programación con `progDelDia` (caché por fecha): una lectura por día elegido.
- **Viático automático** (mismo momento): si el grupo del técnico en la programación de ese día es de
  `area:'campo'`, el viático viene encendido ("encendido por tu programación de campo"). Si en Actividades
  aparece una de `PALABRAS_OFICINA` (sellado, oficina, bodega, "no salí"; palabra completa, sin importar
  tildes ni mayúsculas) se apaga solo y dice por qué; si la borra, vuelve. Si el técnico toca el interruptor
  (`viatTocado`), manda él en ese registro. "plantel" no apaga a propósito ("salí del plantel a…").
- **Pantalla "Novedades en tu registro"** (`#novReg`, estilo del anuncio de avisos): explica las actividades
  prellenadas y el viático automático; una sola vez por celular (`localStorage.innova_novedad_registro_1`),
  solo técnicos, "Entendido" a los 6 s. Nunca sale encima del anuncio de avisos (cada uno espera al otro).
  Para una novedad futura: cambiar el texto y subir el número de la clave.

### Avisos al celular (notificaciones)
- Al entrar sale un anuncio a pantalla completa ("Ya te pueden llegar avisos al celular") a todos
  (empleados, admin y asistente). Si ya los tienen activados sale una sola vez (`innova_avisos_anuncio_activo`)
  con "Mandarme un aviso de prueba". Si no los tienen activados: "Activar avisos" funciona al instante y "Ahora no"
  se habilita a los 10 s; si lo saltan no vuelve a salir ese día (`innova_avisos_anuncio`). No se encima
  con el recorrido de novedades. En iPhone sin instalar explica cómo agregar la app a inicio.
- Cada persona los activa en su teléfono: tarjeta "Activa los avisos" en el inicio del empleado
  (se puede posponer 7 días) o fila "Avisos al celular" en Mi Perfil (empleado y admin), con
  "Mandarme un aviso de prueba" y "Apagar". Al cerrar sesión el teléfono deja de recibir los avisos de
  esa persona; al volver a entrar se reactivan solos si el permiso ya estaba dado.
- Avisos (servidor, `functions/avisos.js`):
  1. **Recordatorios de marcar** (`recordatorioMarcaje`, cada 5 min de 5–7 a.m. y 1–9 p.m., lun–sáb):
     dos avisos por marca, 5 min antes de la hora oficial y, si sigue sin marcar, 5 min después.
     - Entrada (6:55 y 7:05 lun–vie; 5:55 y 6:05 sáb): a quien está activo, tiene sede, le toca trabajar
       (sábado solo si está en ese sábado laboral), no es asueto (fijos + `asuetos/`), no tiene
       vacaciones/incapacidad/permiso/bienestar/injustificado ese día (salvo rechazado), no está
       suspendido y no ha marcado entrada.
     - Salida (4:55 y 5:05 lun–jue, 3:55 y 4:05 vie, 1:55 y 2:05 sáb): a quien marcó entrada y no salida.
     Cada aviso una vez al día (`avisos_enviados/{fecha}/{uid}/{entrada|salida}_{antes|despues}`).
     Les llegan a los empleados y también a la admin si tiene "Sede para marcar" (la asistente no marca).
  2. **Aprobaciones/rechazos**: al revisar HE, viático o día especial (cambia `revisadoHEEn`,
     `revisadoViaticEn` o `revisadoEspEn`); mismos textos que la campanita.
  3. **Programación**: botón "Avisar al equipo" en Programar (no se manda sola porque la programación
     se guarda con cada cambio). Avisa a cada asignado su campaña, zona, compañeros y vehículo, y dice
     quiénes no tienen los avisos activados.
  4. **Cierre de mes** (`avisoCierreMes`, todos los días 08:00; solo actúa 3 días antes del último
     día del mes y el último día, p. ej. 28 y 31 de octubre): cuenta horas extra y solicitudes
     pendientes con el mismo criterio que `loadPend` (`contarPendientesCierre`), solo con fecha hasta
     fin de mes (incluye meses anteriores aún pendientes; no las solicitudes de meses futuros). Si hay,
     avisa a cada admin activa: "Faltan revisar 4 días con horas extra y 2 solicitudes. Octubre se
     cierra el sábado 31." (el último día: "se cierra mañana"). Fijo, botón "Ver pendientes", abre
     `./?pend=1` (o con la app abierta el SW manda `ir-pend`) y etiqueta `cierre-YYYY-MM` (el del 31
     reemplaza al del 28). Botón "Probar aviso de cierre" en Mi Perfil del admin (`probarAvisoCierre`:
     solo admin, manda ya y solo a quien lo pide; si no hay pendientes responde "No hay pendientes").
     En la app, Pendientes muestra el aviso fijo "El mes se cierra el [día]…" a la admin en esos mismos
     días (del 3.er día antes del último al último) si quedan pendientes hasta fin de mes; usa los
     datos de `loadPend`, sin lecturas extra.
- Se mandan mensajes "solo datos" y `sw.js` los muestra (igual en Android e iPhone). Los tokens que
  ya no sirven se borran solos.
- Los recordatorios de marcar son más notorios (Android): se quedan en pantalla hasta que los toquen
  (`requireInteraction`), imagen grande (`aviso-entrada.jpg` / `aviso-salida.jpg`), botón "Abrir para marcar"
  (abre `./?marcar=1`, o con la app abierta el SW le manda `ir-marcar`: va a la tarjeta de marcaje y la
  resalta) y vibración fuerte en el segundo aviso. `badge-96.png` = ícono blanco de la barra de arriba.
  Sonido propio y "mostrar en pantalla" no los controla la web: en Mi Perfil hay una ayuda
  ("Que los avisos se noten más") para configurarlo en Android e iPhone.

## 6. Rendimiento (ya optimizado, mantener el patrón)

Se detectó lentitud por leer `registros/{uid}` **empleado por empleado** (~30 viajes a
Firebase por render). Se resolvió así:
- `getRegistrosAll()`: lee **todo** el nodo `registros` de una vez y lo cachea ~8 s.
- `getUsers()`: cacheado ~15 s.
- Al escribir se invalida el caché (`invalidarRegsCache()`, `invalidarUsersCache()`).
- Las acciones del tablero (asignar/quitar persona y vehículo, zona, grupos) **renderizan
  de inmediato y guardan en segundo plano** (no esperan la confirmación de Firebase).

**Regla**: no volver al patrón de leer por-empleado en bucle. Usar los cachés.

**Espejo en vivo (admin y asistente)**: `get` y `ref` del módulo principal envuelven a los de
Firebase. Al entrar un admin se abre una escucha `onValue` sobre `registros` (y sobre `marcajes`
la primera vez que se pide el historial de alguien, `marcajes/{uid}`). Las lecturas bajo esos nodos
se contestan con `snap.child(ruta)` del espejo: mismo resultado que un `get`, al día y sin volver a
descargar. Firebase baja el nodo una vez y luego solo los cambios. Se cierra en `doLogout`. Si la
escucha falla o tarda más de 8 s, se lee normal. Los técnicos no usan espejo (leen solo lo suyo).
Antes, el Dashboard abierto (refresco cada 30 s) descargaba del orden de 1–2 GB por jornada; con el
espejo, unos pocos MB. Medición y comparación de pantallas antes/después en las pruebas locales.

---

## Temas de temporada

- **Tema para todos** (Perfil del admin → Administración → "Tema para todos"): Por fecha → Encendido →
  Apagado. Se guarda en `config/tema` (`{modo:'on'|'off', tema, por, en}`; sin nodo = por fecha) y cada
  teléfono lo escucha en vivo, también en el login, y lo copia en `localStorage.innova_tema_global` para
  aplicarlo al abrir sin parpadeo. Prioridad: el modo de ESE dispositivo (Ver ahora / Apagado, `innova_tema`)
  > para todos > por fecha. Al apagarse se quitan del login la escena, la sangre y los ojos (`aplicarTema`).
  Lo "para todos" **vence solo** al terminar la temporada de ese tema (la primera que termina después de
  `en`; `globalVigente` en el `<head>`): un "Encendido" de Halloween no sigue en noviembre. Sin `en`
  (dato viejo) solo vale dentro de su temporada.
- **Temporadas que cruzan el año y etapas** (`enRango`, `etapaDe`, `clasesDe`, `claveDe` en el `<head>`): un tema
  puede ir de `'12-01'` a `'01-04'` y tener `etapas` con sus propias fechas, clases y color de barra. En `<html>` va
  la clase del tema más la de la etapa (`tema-navidad nav-pre`). `aplicarTema` compara por clave (tema + etapa),
  así el cambio de etapa (21→22 dic) se aplica solo. Fuera de temporada ("Ver ahora"), la etapa es la guardada en
  `localStorage.innova_tema_etapa` o la primera.
- **Tema Navidad** (1 dic – 4 ene, `js/navidad.js` + `css/temas/navidad.css`). Login por etapa:
  - `pre` (1–21 dic) invierno mágico: aurora (canvas), copos de cristal, montañas y lago al ancho real de la
    pantalla, pinos con moños y esferas rojas, trineo; cordón de foquitos congelados que prenden más cada día (el
    17 todos); casita a lo lejos que se acerca y enciende ventanas; camino "Rumbo a Navidad" (24 huellitas y el
    trineo en el día de hoy) bajo el nombre de la app; tarjeta envuelta con cinta, moño y "Se abre el 24".
  - `casa` (22–27 dic) «Llegamos a la casita» (`js/navidad-casa.js`, `window.__nvCasa(capa)` lo llama `armarCasa`): es
    el final de la historia de Pre-Navidad. Mismo mundo (aurora, montañas nevadas, lago congelado, pinos escarchados
    con moño rojo); la casita roja que se acercaba, ya de cerca, con humo; el trineo del «Rumbo a Navidad» estacionado
    con regalos; el cordón de foquitos arriba ya todo encendido; y el árbol de Navidad grande (estilo clásico: 8 pisos
    de agujas, luz cálida desde dentro, cuentas doradas, esferas, bastones, moñitos, estrellitas, estrella facetada
    con rayos y falda de terciopelo) junto a la mascota; en teléfono se asoma la mitad por la orilla derecha.
    El cordón es SVG del DOM (`.nv-guirnalda .nv-luz`): lo usa la travesura de la mascota (`js/navidad-historia.js`).
    La mascota no se toca: se lee su posición (piso a la altura de sus pies, su luz, la falda del árbol) y la escena se
    rehace si cambia de lugar o de tamaño.
    Easter eggs al tocar fuera de la tarjeta, campos y mascota: estrella del árbol (destello y lluvia de oro; al tercer
    toque «¡Feliz Navidad!»), chimenea (humo en forma de corazón), puerta (se abre con luz), trineo (confeti) y cualquier
    foquito del cordón (ola de luz por todo el cordón). Ambiente: estrellas fugaces en la aurora y Santa a lo lejos
    cada 40–70 s.
    Rendimiento: la escena pesada se pinta una vez (≈25 ms; ≈100 ms con el procesador 4× más lento); la capa viva usa
    brillos precalculados por color (solo se escalan), resolución tope 1.5×, y se detiene del todo fuera del login o con
    la app en segundo plano (se reanuda sola). Medido: ~57 cuadros/s en teléfono con CPU ÷4. Con movimiento reducido
    queda quieta (los toques siguen funcionando). El 24 se sigue abriendo el regalo de la tarjeta.
    Elegida entre 3 que siguen la historia (afuera de la casita, dentro de la casita, árbol al centro); antes se
    descartaron una versión de dibujos planos, una sala con árbol, el pueblito de jengibre y símbolos sueltos.
  - Login `pre` en tablet y PC: el cordón de foquitos se dibuja al ancho y alto reales (`focos()`, se rehace al
    cambiar el tamaño; antes se estiraba y los focos quedaban aplastados) y lleva más tramos en pantallas anchas. Las
    montañas se repiten alternando el sentido en vez de estirarse; hay bosquecitos de 2–3 pinos hacia el centro (sin
    llegar debajo de la tarjeta ni tapar la casita); la casita crece con el ancho y el trineo va sobre el lago a un
    lado. En pantallas de PC bajas (≤860 px de alto) el panel sube y el logo se achica para que quepa sin moverse.
    El acomodo del personaje del login y del letrero "¿Olvidaste tu PIN?" en teléfono/tablet es de
    `css/navidad-mascota.css` (no se tocó).
  - Detalles del login en `pre`: "Recordar mi usuario" en rojo con copito; campos con borde escarcha y brillo helado;
    avisos (`#loginAlert .mk-av`) escarchados con foquito apagado (error) o copo (info); con un error la tarjeta tiembla
    (`form.animate`, para no reiniciar `.lg-anim`) y un foquito encendido falla; botón con destello y chispitas al
    tocarlo; escarcha en dos esquinas; los foquitos se pueden tocar; al entrar, foquitos y copos de bienvenida sobre la
    app (`.nv-bienvenida`: guirnalda que baja y se enciende, copos y "¡Qué gusto verte, Alex!", ~1.6 s). La cinta va
    por el borde derecho (sin pasar por los campos); la escarcha son helechos de hielo (`escarcha()`). Nada de esto toca
    la lógica del login.
  - Dentro de la app en `pre`: colores generados por `herramientas/tema-colores.py` (bloque AUTO-COLORES-NAVIDAD de
    `css/temas/navidad.css`, `:where(.nav-pre)`): encabezados de azul noche a azul hielo, acentos en rojo navideño,
    datos del calendario en azul noche; estados sin cambiar. A mano: cordón de foquitos arriba de los encabezados,
    barra de la marca roja y nieve suave en las pantallas (`.nv-amb`, la crea `js/navidad.js`; no sale en el login).
  - **Cordón personal de foquitos** (Pre-Navidad, `js/navidad-app.js`, lo pinta `navidadApp()` en index.html): en el
    encabezado de "Registro de actividades" del técnico, un foquito por día hábil del 1 al 21 dic (sin domingos ni
    asuetos; sábados solo si le tocan). Encendido si ese día marcó la entrada a tiempo o la justificó; congelado si no;
    tenue si todavía no llega. Una sola lectura de `marcajes/<uid>`. Fuera de diciembre muestra un ejemplo.
  - **Calendario de Adviento** (1–24 dic, técnico y dashboard del admin): 24 puertitas; se abre la de hoy y las pasadas.
    Cada una trae una sorpresa propia (`ADVIENTO` en `js/navidad-app.js`), una línea personal (foquitos) y el mensaje
    que el admin escriba en Mi Perfil → "Mensajes del Adviento" (`config/navidad/adviento/<día>` = {texto, por, en};
    lo permite la regla `config/$otro`). Las puertas abiertas se recuerdan en el teléfono (`innova_adviento_<uid>_<año>`).
  - **Marcaje «Bola de nieve»** (Pre-Navidad; reemplazó a "Escarcha viva", que se sentía "meh"; elegida entre 3
    escenas con el mismo muñeco: se derrite / bola de nieve / en trineo). Escena en `js/navidad-muneco.js`
    (`bolaDeNieveNV`), la llama `escenaMarcajeNV` de `js/navidad-marcaje.js` (en `renderMarcajeCard` y en "Probar
    animaciones"). Un muñeco de nieve original, estilo ilustración (no caricatura, no copia de la escena de Santa:
    la usuaria pidió algo original): bolas con textura de nieve, ojos/boca/botones de carbón, cejas de ramita (para
    los gestos), zanahoria, brazos de rama, bufanda escocesa y sombrero de copa con acebo. Sale de un montículo de
    nieve encima de la tarjeta (un `<svg class="nvm-esc">` que sobresale 250 px hacia arriba; durante la escena la
    tarjeta queda con `overflow:visible` y se restaura al final). A tiempo: te ve, arma una bola, cierra un ojo para
    apuntar y la lanza al punto (estallido de nieve y destellos, aparece la esfera roja) y brinca el sombrero.
    Tarde (que se note que está mal): saca un reloj de bolsillo que suena, frunce las cejas, dice que no, le sale
    vapor del sombrero y lanza fuerte una bola de aguanieve sucia que se embarra en el punto y escurre hasta dejar
    ver la ✕. Dura 4.8 s (tarde 6.2 s). Cuando la bola llega se pinta el tramo nuevo (`.nvp-tr.nuevo` → `.va`); al
    final queda la guirnalda fija. Rendimiento: las bolas de nieve (lo único con filtro `feTurbulence`) se pasan una
    sola vez a imágenes (blob SVG → `<image>`) para no recalcular el filtro en cada cuadro. Con movimiento reducido
    sale directo el estado final. Punto: esfera roja con ✓ o gris con ✕ (`adornoNV`). Línea por tramos (`tramosNV`).
  - **Guirnalda del marcaje** (`canvas.nvp-guir`, `pintarGuirnaldaNV`): prendida si la entrada fue a tiempo y la
    salida no fue antes, congelada si no. Cuelga de dos clavitos dorados con acebo metidos 16 px de las orillas y los
    foquitos van entre ellos (antes el cable y los foquitos de las orillas quedaban mordidos por las esquinas
    redondeadas). El lienzo mide 56 px aunque la guirnalda ocupa ~38 px, para que el brillo de los foquitos se
    apague solo (antes terminaba en una línea recta: "se ven como cortadas").
  - **Etiqueta de estado "de regalo"** (Pre-Navidad, `etiquetaRegaloNV` en `js/navidad-marcaje.js`, `.nvp-et`): en la
    tarjeta del marcaje del técnico, en vez de la píldora: etiquetita de regalo con agujero, colgando de un cordón de
    bastón de dulce (`.nvp-cordel`) y ladeada. A tiempo papel crema y letras rojas (foquito en la entrada; en la salida
    dice "Jornada completa" con estrella); tarde/salida antes escarchada en azul con copo; justificado en gris. Los
    minutos se dicen igual ("12 min tarde"). Elegida entre 3 diseños (regalo, listón, placa). Reportes, Excel y
    pantallas del admin siguen con el texto normal.
  - **"¡Listo, guardado!" — la ventana empañada** (Pre-Navidad, `escenaVentanaNV` en `js/navidad-guardado.js`, clase
    `.fx-ok.nv` + `.fxn`): ventana de madera con foquitos y un pueblito nevado afuera; el vidrio se empaña como con un
    aliento y la mano de la mascota escribe "¡Listo!" trazo por
    trazo (`LETRAS`, en orden de la mano, se levanta entre letras) y una palomita; se limpia el vaho con perlitas en la
    orilla y algunas gotas resbalan a tirones. Al terminar de escribir sale "¡Listo, guardado! · Lo escribiste en tu
    historial" con los datos (`.nv-txt`) y se cierra 3 s después (o al tocar). Elegida tras varias rondas: la usuaria
    pidió ideas planas pero creativas y bien animadas (no 3D). Con movimiento reducido sale la ventana ya escrita.
    **Mano de la mascota (13 nov 2026, opción «Se asoma»)**: el dedo peludo con uña se cambió por la mano del personaje
    (`manoMascota`): los mismos colores y trazo que su SVG en index.html (degradado `furLight` #d4eb84→#608f3d,
    contorno #466c35, rayitas #5a7941, brazo #486c3b), índice estirado en la orilla del puño y pulgar cruzado (no
    debe parecer otro gesto), brazo que entra desde la esquina y sombra suave en el vidrio. Al terminar, la cabeza del
    personaje se asoma por la orilla derecha (`asomar`, lienzo encima del marco): se clona `#nv-green-character`, se le
    pone la sonrisa y el rubor, se quitan accesorios y se le mira hacia el texto; sube, se mece y se esconde (~2.6 s)
    sin tapar el texto ni los datos. Con movimiento reducido no aparece. Elegida entre 3 (A solo la mano, B se asoma,
    C deja su huellita en el vaho).
  - **Interior «Cristal escarchado»** (Pre-Navidad, `js/navidad-dentro.js` + bloque «Cristal escarchado» al final de
    `css/temas/navidad.css`): carámbanos bajo la barra de arriba (`.nvd-car`, de los largos cae una gota de vez en
    cuando), aurora boreal que se mece en los encabezados (`.nvd-au` dentro de `.page-header`, `.dash-hero`, `.rg-hero`,
    `.pg-hero`, `.ps-hero`) y escarcha en helechos que crece desde dos esquinas de las tarjetas (`.fx-card`, `.mk3`,
    `.nvp-adv`, `#dashAsistCard`, `.rban`; blanca en los cuadros de color `.dtile`). Los dibujos de escarcha se generan una
    vez y llegan al CSS como variables en `<html>` (`--nvd-e1…3`, `--nvd-f1…3`, `--nvd-b1/b2`); el CSS decide dónde van.
    Fondo celeste helado, pestaña activa escarchada, botón "Guardar registro" azul hielo. No cambia colores de estado.
    El script vigila la clase `nav-pre` y los encabezados que se vuelven a pintar; al salir del tema quita todo. Cada copia
    de SVG lleva sus propios `id` (un degradado definido en una pantalla oculta no se pinta en otra). Elegida entre 3
    (pueblito nevado, suéter tejido, cristal escarchado) mostradas sobre la app real.
    Actualización: las esquinas de escarcha se cambiaron por adornos de **pino y acebo** (`adornos()` en
    `js/navidad-dentro.js`): 6 variaciones para tarjetas (ramita con esferita dorada; acebo con bastón; solo acebo;
    ramita con piña y moño; ramita que sube desde abajo; ramita con esferas roja y plateada) y 4 en blanco para los
    cuadros de color. `repartir()` le pone a cada tarjeta `data-nvd` (0–5, en orden 0,3,1,5,2,4 para que no se
    repitan seguidas; las que tienen algo arriba a la derecha, `.fx-hd` como «8 h extra», van con uno de abajo) y a
    cada cuadro `data-nvdt` (0–3); el CSS pone la imagen y la esquina. La sección «HOY» del panel (`#dashAsistCard`)
    ya no lleva fondo de tarjeta ni adorno (se veía como recuadro forzado). El cordón de foquitos de los encabezados
    pasó a 34 px de alto (con 24 se cortaban los focos) y se repite encima de la aurora (`.nvd-au::after`, variable
    `--nvp-cordon`).
  - **«Responde al toque»** (Pre-Navidad, mismo `js/navidad-dentro.js`, lienzo `.nvd-toque`): al tocar una tarjeta
    (`.fx-card`, `.mk3`, `.nvp-adv`, `#dashAsistCard`, `.rban`, `.dtile`) florece escarcha donde tocas y se derrite en
    ~2 s (blanca en los cuadros de color); los botones `.mk3-btn`, `.fx-save` y `.btn-p` se hunden y sueltan migajas de
    nieve; al cambiar de pestaña sale un soplo de copos; al deslizar, los foquitos del cordón del encabezado del
    técnico se mecen con un resorte (se envuelven en `g.nvd-mece`). Solo con toques reales (`isTrusted`, no teclado);
    no se activa al tocar campos de texto ni enlaces. El lienzo solo dibuja mientras hay algo animándose. Con
    movimiento reducido no hace nada. Elegida entre 3 (responde al toque, el invierno pasa, lo que haces enciende).
  - **Fondo «Valle nevado»** (Pre-Navidad, `js/navidad-dentro.js`, lienzo fijo `.nvd-valle` con `z-index:-1` y clase
    `html.nvd-con-valle`, que deja `.content` sin fondo propio): cielo celeste con luz cálida, montañas con nieve,
    lomas con pinos y pueblito con humo, banco de nieve con pinos cerca y nieve cayendo. Al deslizar, cada capa se
    mueve a distinta velocidad (con tope). Las 3 capas se dibujan una vez (y al cambiar el tamaño); en cada cuadro solo
    se acomodan y se pintan nieve y humo. Se detiene con la pantalla oculta o en el login (ahí no se ve). Con movimiento
    reducido queda quieto. Elegido entre 3 (valle nevado, noche de invierno, luces detrás del cristal) tras descartar
    cielos según la hora y estilos de letra/tarjetas.
  - **Descuadre horizontal en el teléfono (Dashboard)**: el encabezado con el compañero (`.nv-con-companero`, de
    `css/navidad-mascota.css`) usa `overflow:visible` para que asome el bloque de hielo, y el círculo decorativo
    `::after` de `.dash-hero`/`.ps-hero` (con `right` negativo) empujaba la página ~50 px a la derecha. En `navidad.css`
    se oculta ese círculo cuando hay compañero y `html.tema-navidad body{overflow-x:clip}` evita cualquier otro
    desplazamiento lateral (clip no rompe la barra sticky). No se tocó el CSS de la mascota.
  - **La mascota pisa el suelo en Navidad en casa** (`medir()`/`dibujar()` en `js/navidad-casa.js`): el SVG de la mascota
    trae aire bajo los pies (~17 px en teléfono, ~25 en PC), así que el suelo y la sombra puestos al borde de su recuadro
    la hacían flotar. La escena lee el borde inferior de `#foot-left`/`#foot-right` (solo lectura, sin tocar la mascota)
    y pone ahí el suelo, la falda del árbol y la sombra.
  - **Casita sobre una loma en el teléfono** (`dibujar()` en `js/navidad-casa.js`): en el teléfono la casita queda a la
    altura del horizonte y el suelo (pies de la mascota) mucho más abajo, así que parecía flotar. Ahora una loma nevada
    baja desde la base de la casita hasta el suelo (curva suave, sombra azulada y brillo en la cresta) y los pinitos se
    paran en su ladera. En PC no cambia (ahí la casita ya está sobre el suelo).
  - **Un solo dibujo de Santa**: `santaSVG()` en `js/navidad-casa-marcaje.js` (marcaje, PIN equivocado y bienvenida)
    usa el mismo Santa redibujado de la lista de «¡Listo, guardado!» (banda de piel que abraza la frente, punta del gorro
    con pompón, mechones sobre las orejas, barba con rizos, bigote de dos lóbulos), con sus piezas de gesto (ojos
    felices, guiño, enojo, cejas, boca en y=23, rubor y marquita). Antes el gorro no asentaba en la cabeza.
  - **Login de Navidad en casa: error y bienvenida con Santa** (`window.__nvSantaLogin` en `js/navidad-casa-marcaje.js`;
    los llama `vigilar()` en `js/navidad.js` cuando `armada==='casa'`). PIN equivocado: la tarjeta tiembla y Santa se
    asoma por detrás de ella con el ceño fruncido, niega con la mano y dice «Mmm… ese PIN no es» (SVG
    `.nvc-login-santa` dentro de la tarjeta; ojo: necesita `html.nav-casa #loginScreen .login-form>…{position:absolute}`
    porque `.nav-casa .login-form>:not(.nv-extra)` pone `position:relative`). Al entrar: Santa sale de la esquina de
    abajo, saluda y dice «¡Hola, <primer nombre>!» (de `innova_session`), guiña y se va (`.nvc-bienvenida-santa`, fijo,
    sin bloquear toques). Movimiento reducido: sin escenas. El 24 de dic el listón y el moño quedan dentro de la tarjeta
    de galleta.
  - **«¡Listo, guardado!» de Navidad en casa: «Enciende el árbol», con la mascota de protagonista** (13 nov 2026;
    `js/navidad-casa-mascota.js`, `escenaMascotaCasaNV(cont,{alTexto})` → `{detener,duracion}`; la llama
    `mostrarGuardadoOK` con clase `.fx-ok.nvl`, frase «Tu foquito ya brilla en el árbol»). Sala cálida (la misma de
    antes: madera, luces desenfocadas, piso y guirnalda, pintada una vez). La mascota es el personaje animado del login
    (con su gorro de Santa): se copia el SVG de `#loginScreen .nv-mascota` con prefijo `nvmg-` (como el compañero) y la
    mueve su propio `GreenActor` (`embedded`, 30 cps). Entra de puntillas (`sneak`) con un foquito encendido en la mano
    derecha (se dibuja en el lienzo siguiendo `hand-right` solo mientras lo carga), lo coloca en el árbol apagado
    estirando la mano (`offer` + `reachFor` al punto del árbol: su brazo llega ~735 unidades del SVG con el paso que
    da), el árbol se enciende en onda desde ese foco, se prende la estrella con chispas y ella lo mira y se sonroja
    (`tap3`). Sombra en el piso como elipse SVG (no `filter` sobre la mascota que se mueve). ~6.8 s; el texto sale a los
    4.2 s. Movimiento reducido: escena final quieta, sin animar a la mascota. Elegida entre 3 (árbol, regalo en la bota
    con su nombre, huellita en el registro). Reemplazó a «Santa lo anota en su lista» (`js/navidad-casa-guardado.js`,
    borrado; está en el historial de git si se quiere volver).
  - **Marcaje de Navidad en casa «Santa se asoma»** (`js/navidad-casa-marcaje.js`, módulo importado por index.html:
    `adornoSantaNV(tono,hora)` para el punto y `escenaSantaNV(card,pt,{tarde,hora,cual})` al marcar; estilos en
    `navidad.css` «Navidad en casa · marcaje»). Santa ilustrado en SVG (lentes, barba, gorro) se asoma por detrás de la
    tarjeta (un clipPath lo corta en su orilla). A tiempo: lanza un regalo girando al punto, se ríe «¡Jo, jo, jo!»,
    saluda y guiña; el punto queda con el regalito. Tarde (o «Saliste antes»): saca el reloj de bolsillo, las manecillas
    corren hasta la hora marcada, se molesta (cejas fruncidas, ojos entrecerrados, boca hacia abajo, rubor y marquita de
    enojo), golpea el reloj, niega con la cabeza y dice «¡Ejem! Llegaste tarde»; deja el reloj (abierto, con la hora) en
    el punto, sin chispas. La escena es un SVG `.nvc-mk-santa` absoluto dentro de la tarjeta (se desplaza con ella;
    ojo: `.nvc-santa` ya es el lienzo de Santa cruzando en `navidad-casa-dentro.js`). Mientras corre (3.8 s), punto,
    hora y etiqueta esperan con `.nvc-espera`. Ids únicos por copia (`propio()`); se detiene sola si la tarjeta se
    vuelve a pintar. «Probar animaciones» ya sale en la etapa casa (solo marcaje: el botón de guardar se oculta hasta
    que tenga su escena). Movimiento reducido: sin escena. Elegido entre Santa, Rodolfo y la botita (y antes entre
    regalo/galleta/bola de nieve, descartadas por «chafas»); la llegada tarde se pidió con Santa molesto.
  - **Login de Navidad en casa «Galleta de jengibre»** (`navidad.css`, bloque del mismo nombre, solo CSS): tarjeta
    crema con glaseado blanco que escurre arriba (sigue las esquinas redondeadas; reemplaza la franja de rayas recta que
    se salía de la tarjeta), campos con borde de galleta tostada y costura de glaseado, botón de galleta con glaseado
    arriba y abajo y cuatro dulces (capas `radial-gradient` del fondo, sin elementos extra) e interruptor de bastón de
    caramelo. El borde de galleta suma 10px por campo, así que el campo por dentro mide 10px menos (40/34/32px según
    la altura) y la tarjeta ocupa lo mismo que antes: cabe completa de 560 a 768px de alto. Elegida entre regalos por
    abrir, galleta y suéter; la tarjeta entre glaseado que escurre, tarjeta-galleta y limpia con muñequito.
  - **Navidad en casa dentro de la app «Noche en la casita»** (`js/navidad-casa-dentro.js`, estilos en `navidad.css`
    «Navidad en casa dentro de la app»): detrás de las pantallas de adentro, la misma noche del login (aurora, luna,
    montañas, la casita con luces, el árbol clásico y el plato de galletas con leche para Santa en la nieve), dibujada
    con el motor de `navidad-casa.js` (expuesto como `window.__nvMotor`). En PC, si sobra margen, la casita y el árbol
    van en los márgenes. Cordón de foquitos encendido arriba del contenido (clases propias `.nvc-guirnalda/.nvc-luz`
    para no chocar con la historia de la mascota). Encabezados rojo terciopelo con gorrito de Santa y la botita con
    el primer nombre de quien entró (de `innova_session`). Cada 40–70 s Santa y sus renos cruzan con estela dorada en
    su propio lienzo `.nvc-santa` (z-index 90: encima del contenido, debajo de la barra; sin bloquear toques). Para
    probar: `__nvcSanta()` en la consola. Rendimiento: paisaje pintado una vez (y al cambiar tamaño o pantalla); la
    capa viva (luces, nieve, Santa) a ~30 cps solo con una pantalla de adentro a la vista; movimiento reducido: quieto
    y sin Santa. Elegida entre 3 (noche en la casita, junto al árbol y la chimenea, papel de regalo de galletitas)
    después de pedir los elementos clásicos (gorrito, botita, galletas, Santa).
  - **Login Pre-Navidad «Congelado»** (`navidad.css` bloque «Congelado», `js/navidad.js` `hieloCampos`/`revisarHielo`):
    los campos y el botón empiezan cubiertos de hielo (degradado celeste, grietas y carámbanos colgando). Cada campo se
    descongela al llenarlo (fondo crema, borde dorado, ícono rojo); el botón «Ingresar» está atrapado en hielo (capa
    `.nv-hielo-btn` con `z-index:-1` dentro de `isolation:isolate`, debajo del texto) y se libera rojo y brillante con
    usuario + PIN de 4 o más. Se revisa con `input`/`change`, al volver al login (cerrar sesión limpia los campos sin
    evento) y por el autollenado. Solo en Pre-Navidad; `quitar()` limpia las clases. Elegida entre 3 (carta a Santa,
    suéter navideño, congelado) después de descartar 3 más discretas (foquitos del PIN, hielo que se derrite, nieve).
  - **Carga de Navidad en casa sin «primer tema»** (`comun.css`, `navidad.css`, `js/navidad-casa.js`): la pantalla
    de carga (corona) y el fondo del login de la etapa casa seguían en el café del primer diseño, y la escena del lienzo
    se pintaba hasta ~200-700 ms después de mostrarse el login (esperaba al ResizeObserver o al temporizador de 700 ms).
    Se veía el diseño viejo y luego el nuevo encima. Ahora la carga y el fondo usan la misma noche nevada de la escena, y
    al activarse el login el MutationObserver dibuja la escena en ese mismo cuadro (`if(!C) armar()`).
  - **Login en laptops bajas** (Pre-Navidad y Navidad en casa, `navidad.css`): en una laptop 1366×768 el navegador y
    la barra de tareas dejan ~600px útiles y el login pedía ~730px, así que «Ingresar», la mascota y el suelo de la
    escena quedaban abajo del pliegue (se veía «incompleto»). Dos escalones solo para PC (`min-width:901px`):
    `max-height:760px` achica logo, nombre, camino, rellenos, campos (44px) y botón (46px); `max-height:640px` además
    oculta «Registro de planilla» y aprieta un poco más. Medido sin desplazamiento a 1366×600, 1366×650, 1536×700 y
    1280×560. No toca la mascota: baja junto con el panel porque se ancla a su borde inferior.
  - **"Probar animaciones"** se muestra solo con Halloween, Muertos y Pre-Navidad (regla en `comun.css`; antes vivía en
    `halloween.css` y fuera de Halloween el botón salía sin hacer nada).
  - `casa` (22–27 dic): sala con tapiz, árbol con luces, ventana nevada, guirnalda, chimenea con fuego y medias
    (la primera con el nombre del usuario recordado). El 24 la tarjeta se "abre" (moño y cinta caen, confeti) una
    vez por teléfono (`innova_nav_regalo`).
  - `ano` (28 dic–4 ene): «Pólvora en la terraza» (`js/navidad-ano.js`, `window.__nvAno(capa)`; elegida entre 3:
    gala negro y dorado / terraza / brindis con champán; reemplazó a «ciudad + banderines + borde arcoíris», que a la
    usuaria no le gustaba). Volcán de San Salvador (cima achatada y El Picacho) con la ciudad encendida al pie, pólvora
    continua de colores y un cohete donde se toque el cielo (al estallar avisa a la mascota con `navidad:entorno`
    «destello», máx. cada 6 s). Primer plano: terraza con piso de barro, baranda, guirnaldas de bombillos y mesa con las
    12 uvas, frasco de estrellitas chisporroteando y cajita de cohetillos. El piso queda a la altura de los pies de la
    mascota (la baranda detrás de ella); la escena se rearma si cambian el tamaño, la tarjeta o la mascota. Tarjeta
    crema con cordón de foquitos (`.nva-foquitos`), «Recordar» como estrellita, mecha prendida que recorre «Ingresar».
    CSS en `css/temas/navidad.css` («Año Nuevo: Pólvora en la terraza»). Canvas a 1.5× tope, solo con el login a la
    vista; con movimiento reducido no hay cohetes automáticos (los tuyos sí).
  - Saludo del login con el nombre (de `innova_usuario_recordado`, "alex.gonzalez" → "Alex"); el 24, 25 y 1 de
    enero cambia ("Feliz Nochebuena"…). Cuenta regresiva bajo el nombre de la app en `casa` y `ano`.
  - El canvas solo dibuja con el login a la vista y la app en primer plano; con movimiento reducido no anima.
    Todo vive en `.nv-capa` / `.nv-extra` y se quita al cambiar de etapa o de tema.
- **Pantalla de carga con el tema** (`#bootScreen`, solo CSS en `css/temas/comun.css`): con tema,
  en vez de la ruedita va el logo con un detalle animado: cempasúchil que gira y pétalos (Muertos), copo de nieve
  (Pre-Navidad), corona navideña (Sala), cohete que estalla (Año Nuevo), luna con murciélagos (Halloween). Sin tema,
  presentación de la marca (`.boot-marca`): con los colores del login, el logo se dibuja solo (la I crece, la N se
  traza, el punto verde aparece con una onda), luego "INNOVA" y "Registro de Planilla", y luces suaves que flotan detrás. La pantalla del sistema al tocar el ícono (Android, `manifest.json`) no se puede cambiar por tema.
- **Imagen de la programación con el tema** (`progGenerarImagen`): además de Halloween, tiene versión de Día de los
  Muertos y de cada etapa de Navidad (paletas en `PALETAS`; encabezado en `encabezadoTemaProg`, con una franja de
  abajo solo para los adornos para no tapar fecha ni cifras; detalle del pie en `pieTemaProg`). Mismos datos y orden.
  La de Muertos es la más trabajada (`ofrendaProg`): papel picado en dos hileras con recortes de calaverita, flor y
  rombo (`papelPicadoProg`, cada banderita en su propia capa para que los recortes dejen ver el fondo), con su
  propio espacio arriba (`TOPB`, el texto baja), y abajo una ofrenda con arco de cempasúchil (`cempasuchilProg`),
  velas, pan de muerto, floreros, calaverita de azúcar al centro (`calaveritaProg`), mantel con picos y pétalos.
  **Pre-Navidad y Navidad en casa** llevan una ilustración vectorial de encabezado completo (`js/navidad-prog-ilu.js`,
  importado solo al generar la imagen en esas etapas; `encabezadoIluProg` la dibuja, oscurece la izquierda para el
  texto y pone el listón dorado; `BANDA` 236, `TOPB` 0 y las cifras siempre debajo de la fecha):
  Pre-Navidad = paisaje de Nochebuena (casita roja con foquitos, árbol grande, muñeco de nieve, trineo, bastones,
  cerca con luces, faroles, pueblito con iglesia, luna; Santa la cruza con `__nvMotor.trineo`); Navidad en casa = la
  sala por dentro (ventana nevada, árbol con regalos y tren, chimenea con las botitas, leche y galletas, sillón, flor
  de pascua, gatito). Son SVG que se arman al ancho justo: con programación larga la escena se extiende hacia la
  izquierda en vez de estirarse. Si el módulo no carga queda el dibujo anterior (`puebloNocheProg` / la repisa);
  si la ilustración no se puede dibujar, un fondo liso. Cuidado: el SVG va como imagen, así que tiene que ser XML
  válido (un atributo repetido hace que no cargue). Elegidas tras varias rondas (3D descartado: «siempre 2D»).
  La sala lleva además guirnalda con foquitos en el techo, corona sobre la chimenea, cascanueces, banquito con chocolate
  y libros, osito, galleta de jengibre, esfera de nieve y un **gatito naranja con gorrito de Santa** jugando con una esfera.
  Con el texto largo en la imagen de 1080 la sala sale «compacta» (sin la ventana; con un cuadro nevado en la pared).
  Navidad en casa también cambia el cuerpo («acebo y costura»): costura punteada y ramita de acebo en cada tarjeta y en
  las barras de área, y el número de cada grupo es una esfera con tapita dorada (`decoTarjetaCasaProg`,
  `decoRielCasaProg`, `numeroCasaProg`). Mismo acomodo y datos.
- **Imagen de la programación compacta:** con pocos grupos va a 1080 de ancho (campañas de un grupo en 2
  columnas, las demás a todo lo ancho). Si así saldría más de ~1.5 veces más alta que ancha, pasa a 1620 de ancho
  y TODAS las tarjetas van en 3 columnas (`armarTodo(3)`), en orden de lectura columna por columna y repartidas
  para que queden parejas (`repartir`). Los adornos de Muertos se reparten según el ancho.
- **Diseño principal sin señal** (script en el `<head>` junto a `css/styles.css`, `id="cssBase"`): si el archivo no
  llega (se cortó la conexión), antes la app salía sin tamaños ni colores, con todas las pantallas encimadas y la de
  mantenimiento arriba con sus engranes gigantes (le pasó a un técnico el 4 nov con el tema de Muertos). Ahora: un
  `<style>` mínimo garantiza que solo se vea la pantalla activa; el script revisa que exista `--sans` (solo la define
  styles.css), si no, vuelve a pedir el archivo hasta 2 veces y, si no llega, muestra un aviso "No se pudo cargar la
  app" con "Reintentar". Si se cambia `?v=` de styles.css, cambiarlo también en ese script.
- **El tema por fecha se recalcula** (`__temas.recalcular()`) en cada `aplicarTema`: al volver a la app
  (`visibilitychange`), cada 30 min y al cerrar la sesión a todos. Antes se calculaba solo al abrir, y un
  teléfono con la app abierta desde octubre seguía con Halloween en noviembre.

`css/temas/<tema>.css` (uno por tema; solo se descarga el del tema activo) + `css/temas/comun.css` (lo que va siempre: pantalla de carga, "Probar animaciones" y reglas compartidas) + un script corto en el `<head>` de `index.html` (lista `TEMAS`, cada tema con `css:`; `TEMAS_V` es el número de versión de esos archivos). Cada tema
tiene fechas `desde`/`hasta` en formato mes-día y se aplica solo cada año poniendo clases en
`<html>` (Halloween: 26 – 31 oct, clases `tema-halloween fuerte`; versión "terror": negro y rojo sangre, luna roja, cementerio, cuervos, sangre en los encabezados.
Día de los Muertos: 1 – 5 nov, clase `tema-muertos`; sencillo: fondo claro de siempre, rosa mexicano en los acentos,
degradados de ciruela a cempasúchil y papel picado en el borde de los encabezados de color. El login tiene su escena
(`__escenaMuertos`, capa `.mu-capa`): dos guirnaldas de papel picado con vaivén, ofrenda abajo con velas que titilan,
flores, pan de muerto y calaverita (en PC va en la esquina), pétalos de cempasúchil cayendo, coronita de flores en el
logo y la leyenda "Día de los Muertos"; sin animación con `prefers-reduced-motion`. Dentro de la app caen
siempre 6 pétalos lentos y transparentes (`.mu-amb`, z-index 90: debajo de la barra, hojas y ventanas; sin toques;
no salen en el login). Marcaje "los pétalos arman tu flor" (`florMarcajeMU`, `petalosLineaMU`, `armarFlorMU`; elegida entre
varias muestras, ni muy sencilla ni muy producida): al marcar llegan pétalos desde las orillas de la tarjeta y la flor
se arma capa por capa; a tiempo, un destello dorado pasa por la hora (`.mu-brillo`). Tarde: llegan pocos y lentos, la
flor queda a medias, se marchita (pierde color y se ladea), se le caen dos pétalos y lleva ✕. La línea se pinta por
tramo (entrada 0–50 %, salida 50–100 %): naranja a tiempo, apagada si fue tarde. La tarjeta recorta los pétalos
(`overflow:hidden`). Con movimiento reducido la flor sale armada directo. "¡Listo, guardado!"
(`ESCENA_GUARDADO_MU`, `confetiGuardadoMU`, clase `.fx-ok.mu`): cae una calaverita, le estampan el sello "✓ GUARDADO"
con un temblor y confeti de papel picado, y guiña; se cierra a los 4.2 s. El xolo (`xoloAdentro`, `.mu-xolo`, el equivalente al
fantasma de Halloween) pasea por la parte de abajo de las pantallas de adentro: llega como perrito normal (capa
`.mx-normal`) y al detenerse se transforma en alebrije (`transformar`: destello y chispas `.mx-chispas`, capa
`.mx-alebrije` de diseño propio con cuerpo de colores, puntos, rayas y lunitas, orejas de distinto color, lengua de
fuera y alas de plumas que brotan y aletean); luego vuela 15–25 s por toda la pantalla (`volar`/`sigVuelo`: 5–8
puntos al azar en el aire, a veces fuera de la pantalla, así que sale y vuelve a entrar), se va y regresa en
25–60 s, otra vez normal. Si lo tocan
brinca y, si aún no, se transforma (sin quitar el toque al botón de abajo); se esconde con ventanas abiertas y no sale en el login ni con "reducir movimiento". No cambia marcaje, "¡Listo,
guardado!" ni colores de estado).
Sus colores los genera `herramientas/tema-colores.py` (bloque `AUTO-COLORES-MUERTOS`, solo azules).
Mi Perfil y "Ver ahora" usan el tema de la fecha o, si no hay, el próximo del año (`__temas.ref`).
"Probar animaciones" (Mi Perfil del técnico y de la admin, solo con tema): vista previa con datos de ejemplo, sin
marcar ni guardar (`probarMarcajeTema`): marcaje a tiempo / tarde, "¡Listo, guardado!" (si la pantalla no lo tiene,
como en la oficina, inserta `FX_OK_HTML`) y, en el Día de los Muertos, "Llamar al xolo" (`__llamarXolo`).
Las barras del celular (hora/batería arriba y navegación abajo) las pinta Android con `<meta name="theme-color">`:
cada tema tiene su `barra` y `__temas.colorBarra` la aplica al abrir y al cambiar de tema (sin tema, `#1e3a5f`). En Mi Perfil del admin,
"Tema de temporada" cambia entre Automático / Ver ahora / Apagado, solo en ese dispositivo
(`localStorage.innova_tema`). Para un tema nuevo: agregar la entrada en `TEMAS` y sus estilos.
Los colores de estado (verde a tiempo, rojo tarde, etc.) no se tocan en los temas.

---

- **Halloween, login y fondo**: el login conserva su escena (luna roja con murciélagos, árbol enraizado en el
  cementerio, figura encapuchada, relámpago) y un fantasma de sábana como el de la opción "La mansión" (`fantasma()` en el script del
  head, `.hw-fantasma`) que pasea por el cielo sin pasar por la tarjeta, el logo ni los textos (en celular solo por el cielo, arriba de la tarjeta); se acerca a donde tocas o
  pasas el mouse, cierra los ojos mientras el PIN tiene el foco y, si lo tocas, se deshace y reaparece en otro
  lado. Con cada relámpago (lee la animación de `.hw-flash`) se asusta, tiembla y se esconde detrás del logo (opaco en el tema);
  al rato regresa. Se apaga con `prefers-reduced-motion` y no dibuja si el login no está activo. Ya no hay telaraña ni araña. La sangre de la tarjeta es un SVG con
  filtro de líquido y brillo que arma `__escenaHalloween` (`.hw-sangre`). Dentro de la app el fondo es negro
  ("Penumbra") y las tarjetas siguen claras.
- Fantasma de las pantallas de adentro (`fantasmaAdentro()`, `.hw-fant-in`): más chico, capa que no recibe toques
  (si lo tocas se desvanece pero el toque llega al botón de abajo), pasea por las orillas y a ratos cruza; aparece a los
  8–15 s, después de 3–6 paradas se va y regresa en 30–90 s; se esconde con ventanas abiertas encima y se asusta si
  mueves la pantalla muy rápido. Se quita al apagar el tema.
- **Programación, vehículo del grupo**: "+ Vehículo" abre una hoja (`progAbrirVeh`, `#moVehGrupo`, estilo sx) con
  tarjetas por pick-up y moto: libres primero, luego los restringidos a otra campaña ("Solo …"), los que ya van en
  otro grupo ("En CPT MT · Grupo 1") y al final los no disponibles con su estado; los de baja no se muestran.
- **Halloween, "¡Listo, guardado!"**: con el tema, `mostrarGuardadoOK` pone la escena `ESCENA_GUARDADO_HW` en
  `#fxOk` (clase `hw`): latido rojo, la Muerte con calavera bajo la capucha da un tajo que abre una herida en forma
  de cheque, salpica y gotea, y la pantalla sangra desde arriba (`sangreTopHW`, armada al ancho de la pantalla). La sangre pasa por un filtro
  de líquido con brillo (`FILTRO_SANGRE_HW`): tallos que se alargan y cabezas que bajan (`chorroHW`) se unen como gotas. Dura ~4.4 s. `#fxOk` se mueve a
  `body` al mostrarse para quedar encima de la barra y la niebla del tema. Estilos `.fxh-*` en `css/temas/halloween.css`.
- **Halloween, coherencia (revisión)**: dentro de la app no hay telarañas ni arañazos en los encabezados (esa
  capa se salía del encabezado y dibujaba arañazos al fondo de la página); la niebla y el oscurecido de orillas
  solo van en el login (encima de la app ensuciaban las tarjetas). Sin morados fuera de estados (perfil, "Ver
  ahora"). El viático apagado usa el tono del tema; encendido sigue verde como el resto de los viáticos.
  Los colores de estado (verde a tiempo, rojo tarde, naranja horas extra) se mantienen; los avisos del
  Dashboard (`.rban`, `.dt-extra`) van en ámbar oscuro.
- **Halloween, colores de estado**: `herramientas/tema-colores.py` también convierte los colores de estado de
  `styles.css` (verde → verde veneno, rojo → sangre, ámbar → calabaza, morado → morado bruja; en degradados el
  primer tono sale de la oscuridad) y `html.tema-halloween` redefine `--green`, `--danger`, `--warn`. Mismo
  significado, paleta del tema. La imagen que se comparte de Programación no cambia (se dibuja en canvas).
- **Halloween, rendimiento del login**: evitar lo que repinta en cada cuadro. Las brasas se mueven con
  `transform` (no `background-position`), la sangre es estática (su filtro de líquido se calcula una vez), los
  murciélagos no llevan `filter` y aletean con CSS (los lejanos no aletean), y el brillo del fantasma es un
  degradado detrás, no `drop-shadow`. El bucle del fantasma solo toca el DOM cuando algo cambia.
- **Halloween, marcaje**: en la tarjeta "Mi marcaje" el punto es una Muerte con guadaña (`parcaMini`, ojos
  pálidos a tiempo y rojos si es tarde o salida antes) y, si fue tarde, la hora queda partida en dos con una
  herida (`horaPartida`). Al marcar, `tajoHalloween` oscurece la tarjeta y cruza una guadaña a la altura de la
  hora: a tiempo la hora se agacha; tarde la parte y la tarjeta tiembla. Estilos `.hw-tajo`, `.hw-parca`,
  `.hw-partida` en `css/temas/halloween.css`. Fuera del tema todo sigue igual (cheque verde / signo de alerta).
  Para verla sin marcar: Perfil (técnico o admin) → "Probar animación de marcaje" (`probarMarcajeTema`, `.tema-probar` solo se ve con el tema activo;
  usa datos de ejemplo y no guarda nada). Al cambiar el tema se vuelve a dibujar la tarjeta de marcaje.
- **Colores del tema sobre lo nuevo**: `herramientas/tema-colores.py` lee `css/styles.css`, toma cada
  regla que usa los azules de la app y escribe su versión en tonos del tema entre las marcas
  `AUTO-COLORES` de `css/temas/halloween.css` y `css/temas/muertos.css` (con `:where(.tema-halloween)` para no subir especificidad).
  **Correrlo después de cambiar styles.css** (`python3 herramientas/tema-colores.py`) y subir `TEMAS_V` en el `<head>` de `index.html`.
  Lo decorativo hecho a mano (login, sangre en encabezados, barra, cementerio) va arriba en `css/temas/halloween.css`.

### Navidad: «Mi programación» y Calendario de Adviento
- **Mi programación** (`.pe` del técnico) en Pre-Navidad y Navidad en casa va «envuelta en listón»: azul noche con listón
  plateado (Pre) o rojo terciopelo con listón dorado (casa), copitos de fondo y un moño arriba; la placa se corre a la
  izquierda del listón. Estilos en `css/temas/navidad.css` («Mi programación envuelta en listón…»).
- **Calendario de Adviento** con el mismo fondo y, bajo el texto, dos cordones de 12 foquitos numerados
  (`cordonesAdviento` en `js/navidad-app.js`): encendidos los días que ya llegaron y el de hoy parpadea. El texto dice
  «Faltan N días para Nochebuena», «¡Mañana es Nochebuena!» el 23 y «¡Hoy es Nochebuena!» el 24 (igual el saludo de
  casa en `js/navidad.js`).
  En pantallas anchas (PC) se ven enormes si se estiran los dos cordones de 12: la tarjeta es contenedor
  (`container-type:inline-size`) y desde 620 px de ancho se muestra un solo cordón de 24 (`.adv-uno`) en vez de los
  dos (`.adv-dos`).
- **Rendimiento de los temas (análisis nov 2026)** — medido en un «celular económico» (Chromium con CPU ×4, pantalla
  390×844 a 2.75×; scripts de medición en el scratchpad de la sesión: ocupado %, cuadros, tareas largas, perfiles).
  Lección general: casi todo el gasto es **repintar/componer**, no JavaScript. Reglas que se aplicaron y que hay que
  seguir en lo nuevo:
  - Nada se anima DENTRO de un SVG grande (cualquier animación de un hijo obliga a repintar el SVG entero en cada
    cuadro). Lo que se mueve va en su propio elemento HTML (ej. las gotas de los carámbanos `.nvd-gota` ahora son
    `<i>` fuera del SVG de 1600 px) o se quita (el trineo del login ya no se mece dentro de las montañas).
  - Los parpadeos que sí van dentro de SVG (halos de las luces `.lz .halo`, `.nvq-halo`, `.nvp-f .vid`, estrellas,
    luces de la ciudad y bombillos de Año Nuevo, `.adv-hoy`) usan `steps(4,jump-none)` y fases en múltiplos del paso
    (`(i*3)%8*.3 s` con ciclo de 2.4 s): todos cambian a la vez unas 3 veces por segundo en vez de 60.
  - Sin `backdrop-filter` ni `filter` animado encima/sobre algo que se mueve: las pestañas de Navidad en casa y la
    tarjeta del login de Pre-Navidad usan fondo más opaco; la aurora de los encabezados trae el desenfoque dentro del
    SVG (`feGaussianBlur`) en vez de `filter:blur` del CSS.
  - Ninguna capa transparente a pantalla completa encima del contenido si no está dibujando: el lienzo de Santa
    (`.nvc-santa`) solo se muestra mientras Santa vuela; la nieve `.nv-amb` no sale cuando ya está el «Valle nevado».
  - Lienzos a 30 cuadros por segundo y resolución tope ≤1.5× (la pólvora de Año Nuevo iba a 60 y 1.5×: ahora 30 y
    1.25×). La mecha del botón de Año Nuevo se mueve con `transform` (usaba `left`).
  - **Entrada limpia** (`entradaConTema` en index.html + `html.nv-entrando`): al abrir la app con Navidad, el contenido
    espera a que los módulos terminen de decorar (220 ms sin cambios, tope 1.3 s) y aparece de una vez; antes se veía
    la app normal, luego la Navidad encima y luego las luces («se abre un tema sobre otro»).
  - Resultado (×4, app quieta, ocupado %): Pre login 86→76, Pre adentro 76→~68, Casa login 80→65, Año login 99→97
    (34→44 cps; a ×2: 77→58 %). Con la app en reposo (25 s sin tocar) todo lo nuestro queda en 0 %.
  - **La mascota** (green-actor/navidad-companero, de Codex; cambios mínimos autorizados por la usuaria): animaba a 60 cps
    siempre, también en reposo, y sola consumía 62–64 % (×4) con la app quieta. Ahora: el compañero de adentro se pausa
    en el reposo de la app (`__nvReposo`; su «vida propia» no lanza gestos en reposo y al terminar uno se vuelve a
    regular), y `GreenActor.frame` dibuja a 30 cps siempre en el compañero (`embedded`) y en el login solo en «idle»
    (sus gestos van a 60). En reposo: Casa 64→0 %, Pre 64→6 %. Al tocar la pantalla despierta y sigue con sus gestos.
    Pruebas ajustadas a 30 cps (green-actor-performance y navidad.test) más una nueva que lo comprueba.
  - Escenas en lienzo: los trazos repetidos se juntan en un `Path2D` por color/grosor (agujas y ramitas del árbol de
    `N.arbol`: −40 % de tiempo, se ve igual porque el azar se pide en el mismo orden; copos del valle de Pre-Navidad y
    copos chicos de `vivo` en 3 trazos por brillo) y en lo que corre en cada cuadro no se arman textos «rgba(…)» (colores
    guardados + `globalAlpha`). Al abrir (×4): Navidad en casa login 941→715 ms bloqueado, adentro 709→483 ms; Pre
    login 633→471 ms.
  - **Aurora del login de Pre-Navidad** (`auroraHTML` en js/navidad.js, CSS «Aurora del login»): antes se pintaba en el
    lienzo ~11 veces por segundo (se veía a saltos). Ahora son listones SVG con el desenfoque dentro, que se deslizan y
    respiran (y ondulan: se estiran e inclinan) con transform/opacity, en 11–16 s: fluida a 60 cps y el login de
    Pre-Navidad gasta 75→53 % (×4). La primera versión se movía tan lento (26–39 s) que casi no se notaba.
  - Al abrir aún hay ~1 s de trabajo pesado en Navidad en casa (dibujar el árbol aguja por aguja ~0.3 s ×4 en el login
    y la noche de adentro); idea para después: guardar la escena ya dibujada (Cache Storage) para no rehacerla.
- **Convivencia con el compañero en los encabezados** (`css/temas/navidad.css`, al final; el compañero es de
  `js/navidad-companero.js` y no se toca): su encabezado (`.nv-con-companero`) le reserva 112 px a la derecha en toda la
  altura. En el teléfono eso partía la fecha de Programación en dos renglones y apretaba sus 4 botones, y dejaba corta
  la franja azul del gafete del perfil. Ahora en Programación (≤700 px) la columna solo se reserva abajo: fecha y
  «Guardado» a todo lo ancho, números y botones (2×2) a la izquierda del compañero. En el gafete la franja va completa
  (también en PC) y en el teléfono el avatar, el nombre y la marca se centran en el espacio que queda.
- **Mantenimiento de transición «Una nueva época está llegando»** (`js/navidad-transicion.js`, CSS al final de
  `css/temas/comun.css`): para el cambio de temporada (tema normal → Pre-Navidad). Se prende en el perfil del admin con
  «Pantalla de transición a Navidad» (`config/mantenimientoTransicion = 'navidad'`, lectura pública como
  `config/mantenimiento`); con el modo mantenimiento activo, la pantalla de mantenimiento arranca con el azul de siempre,
  se congela desde las orillas (escarcha en canvas, centro libre), se hace de noche con aurora y nieve, y una luz cálida
  derrite una ventana redonda por la que se ve el mundo de Pre-Navidad (montañas, pinos con moño, casita con humo).
  Título palabra por palabra con «nueva época» en dorado y una línea de estado que cambia («Encendiendo la chimenea…»).
  Elegida entre 3 (cae la noche / escarcha / rumbo a la nueva época). Con movimiento reducido sale el final directo.
- **«Revisión de ayer» en Navidad** (`.rban` del Dashboard admin, CSS al final de `css/temas/navidad.css`): elegida
  entre 3 (etiqueta de regalo / lista de Santa / campanita). Campanita con cinta de bastón de dulce arriba: roja y
  dorada en casa y Año Nuevo, azul y plateada en Pre-Navidad, verde si no hubo incidencias; la campana (icono SVG en
  `background`, el «!» se oculta) se mece cada ~3 s, pausada con `nv-reposo` y sin movimiento con movimiento reducido.

### Navidad en casa · «Todo se enciende» (`js/navidad-casa-luces.js`)
Lo que se usa a diario se ilumina con foquitos de colores según lo que hace la persona (solo con `html.nav-casa`; al salir
del tema se quita todo; no toca la mascota). Estilos en `css/temas/navidad.css` («Navidad en casa · Todo se enciende»).
- Pestañas del técnico: un foquito colgando sobre cada una; se enciende el de la pestaña abierta.
- «Mi marcaje» (técnico y admin): la barra entre entrada y salida es un cordón que se enciende conforme avanza la jornada,
  de la hora de entrada a la salida oficial (`horarioOficial`). index.html deja los datos en la tarjeta: `data-ent` (ts de
  la entrada), `data-fin` (fecha y hora oficial de salida) y `data-sal` (ya marcó salida → todo encendido). Antes de marcar,
  el primer foquito parpadea. Se refresca cada minuto.
- Hoy / Ayer / Antier / Otra: foquito arriba de cada uno; se enciende el elegido.
- Títulos: estrella (Mi marcaje), campana (Día), vela (Horario), esfera (Actividades), apagadas hasta que esa parte está
  lista; se encienden con un saltito.
- Actividades: rodeado de foquitos que se encienden mientras se escribe (todos a los 90 caracteres; entonces titilan más rápido).
- Viático: la perilla del interruptor es un foquito. Guardar registro: cordón encima que se llena con lo escrito; al
  presionarlo las luces corren.
- Admin: menú con un foquito por sección (en compu, cordón vertical a la orilla de la barra lateral; en celular, sobre las
  pestañas); se enciende la sección abierta y parpadea Pendientes/Observaciones si tienen aviso. Tiras con cordón
  (`.lz-tira`): Dashboard «X de N ya marcaron entrada» (un foquito por persona, de las cajas A tiempo + Tarde + Sin marcar),
  Pendientes «Revisaste X de N» (el total del día se guarda en sessionStorage; sin pendientes «¡Todo al día!») y
  Programación «X de N con grupo» (de Asignados y Libres del encabezado). La barra lateral es `position:fixed`: la capa
  de luces solo le pone `position:relative` a contenedores sin posición propia (`fijar()`).
- El contenido también va vestido: Guardar en rojo terciopelo con acebo, «Marcar entrada» verde pino, «Hoy» en rojo,
  campos crema con costura, cajas del Dashboard en verde, rojo, azul noche y dorado con su ícono; el «HOY» del Dashboard se lee.
- Cuidado: el módulo escucha cambios con MutationObserver y **nunca** redibuja en el mismo instante (siempre con
  `setTimeout`): redibujar de inmediato al cambiar una clase de `<html>` hacía un ciclo con otros módulos y congelaba la app.
  No escucha cambios de `style` (la mascota los cambia sin parar). Las luces son SVG con brillo por opacidad (CSS); se
  pausan en reposo y con movimiento reducido quedan fijas. Cada capa SVG tiene sus propios degradados (ids únicos).

### Sorpresas escondidas de Navidad (`js/navidad-sorpresas.js`)
Detallitos que nadie anuncia, para que la gente los descubra y se los cuente. Solo con el tema de Navidad activo y
adentro de la app (técnico o admin); con «reducir movimiento» no salen. Estilos `.nvs-*` en `css/temas/navidad.css`.
1. **Bola de nieve**: agitar el celular (3 tirones fuertes en menos de 1 s; espera 8 s entre una y otra). Toda la pantalla
   se vuelve el vidrio de una bola de nieve (orilla azulada, reflejo) y la nieve gira y se asienta abajo en ~5 s; si la
   vuelven a agitar se alborota más. Solo Android/Chrome: en iPhone el sensor pide permiso con un botón, así que ahí no sale.
2. **Chocolatito**: dejar presionado ~0.65 s el encabezado de la página (`.page-header`, `.dash-hero`, etc., no sus botones
   ni la mascota). Sale una taza con malvaviscos, vapor y un corazón, y un mensaje con el primer nombre que cambia por
   etapa (`MENSAJES.pre/casa/ano`). Se cancela si mueve el dedo o desliza. En los encabezados no sale el menú de copiar.
3. **Barra sacudida**: tres toques seguidos (en menos de 0.7 s) sobre «INNOVA · Registro de Planilla». La barra se sacude y le
   cae nieve (en Pre-Navidad también gotitas de los carámbanos).
4. **Mediodía**: a las 12:00 en punto, si la app está abierta y visible, el trineo (`__nvMotor.trineo`) cruza con
   «🍗 ¡Buen provecho!». Una vez al día (`localStorage.innova_nv_mediodia`); se revisa cada 20 s.
Para probarlas en el navegador: `__nvSorpresa.probar('globo'|'chocolate'|'barra'|'mediodia')`. Lienzos efímeros (se
borran al terminar); no hay nada corriendo mientras no se disparan, salvo el `setInterval` de 20 s del mediodía.

### Navidad: «Mi Perfil» como postal (las tres etapas)
Sin esto «Mi Perfil» se veía como el tema base. Ahora el gafete es una postal: marco por dentro (`box-shadow` inset),
arriba una escena de 66 px (`.pf-gafete-top`, variable `--pf-escena`) y el círculo de las iniciales dentro de una corona
con moño (`.pf-av::before`, variable `--pf-corona`); nombre en Georgia. Las tarjetas de abajo toman el fondo y los
colores de la etapa. Pre-Navidad: marco plateado, aurora y luces congeladas, corona escarchada; Navidad en casa: marco
dorado, techitos con cordón de colores, corona de pino; Año Nuevo: volcán y pólvora, corona dorada con estrellas.
Todo es CSS estático (SVG en data-URI, nada animado) al final de `css/temas/navidad.css`. Las SVG se generan con un
script de Python (`postal.py`, fuera del repo): para cambiarlas, editar los colores/dibujos en el CSS o regenerar.
La escena se repite a lo ancho (`auto 100% repeat-x`) y está hecha para empatar sin costura (aurora con tres copias
desplazadas 400 px), así que en PC no se agranda ni se recorta.

### Mascota: globito de diálogo y textos (13 nov 2026)
Plan pedido por la usuaria (la mascota debe actuar según el escenario, interactuar con él y no ser tan quieta), por
partes: 1) globito y textos (esto), 2) login de Navidad en casa (esferas del árbol, esconderse tras el árbol, hurgar en
el trineo, bola de nieve), 3) Pre-Navidad en el hielo (dibujar en el vaho, raspar un agujerito, golpe y grietas,
tiritar y estornudar), 4) adentro (reaccionar a lo que hace la persona, asomarse al hacer scroll, sacar algo de la
bota, jugar con la guirnalda).
- Globito estilo cómic (`.nv-dialogo` en `css/navidad-mascota.css`): blanco, contorno grueso `--nv-tinta` (azul noche;
  azul hielo en Pre, morado en Año Nuevo, rojo cuando está enojado), letra gruesa, colita curva; aparece con rebote y
  enojado tiembla. Elegido entre 3 (cómic, de la escena, burbuja oscura).
- Adentro (`createDialogue` con `inside`), el globito se monta en la orilla de arriba de la tarjeta de la mascota en vez
  de encima de la cabeza: así no tapa el título de la tarjeta.
- Textos sin groserías (antes decía «Pinche Navidad…»): Pre «¡Sin tocar! Ya bastante tengo con el hielo.», «Brrr… esto no
  se derrite solo.»…; casa «¡Oye, sin tocar!», «Bah… tanta Navidad.»…

### Mascota: escenas con el escenario del login de Navidad en casa (parte 2, 13 nov 2026)
`js/navidad-mascota-escenas.js` (`window.NavidadEscenas.create`), conectado desde `js/navidad-mascota.js` (`escenas`):
- **esfera**: descuelga la esfera del árbol (`tug`), la admira, la vuelve a colgar (`offer`) y la esfera se columpia.
- **escondite** (al tocarla): brinca, corre detrás del árbol, se asoma por la orilla, sale por la izquierda y vuelve. Para
  que quede DETRÁS, `navidad-casa.js` pone encima una copia del árbol recortada con su silueta (`.nv-arbol-frente`, solo
  por debajo del formulario).
- **trineo**: el regalo de arriba del trineo es una pieza aparte (`.nv-regalo-suelto`); lo toma (`mischief`), lo sacude
  junto a la oreja (`lookaround`) y lo regresa. En el teléfono el trineo ahora se estaciona junto a la mascota (a su
  alcance, escala .7).
- **nieve**: junta una bola entre las manos (`plot`), la avienta (`mischief` hacia arriba a la izquierda) por debajo del
  formulario al techo de la casita y se deshace en polvo; se ríe (`scoff`).
El escenario se expone en `login.__nvEscena` (`arbol(on)`, `orilla(y)`, `regalo()`, `moverRegalo(p,giro)`, `casita()`).
La vida autónoma de casa (`navidad-vida.js`) intercala esfera, trineo y nieve; el compañero de adentro ignora esos
nombres. En PC (el escenario queda junto al formulario) solo aplica la esfera. Vista previa:
`__mascotaNavidadHistoria('esfera'|'escondite'|'trineo'|'nieve')`.
- Arreglo: la esfera que puede tomar la mascota nunca aparecía en celulares (la prueba `isPointInPath` se hacía sobre un
  lienzo ya escalado por la densidad de pantalla); ahora se prueba en un lienzo sin escala y mide al menos 6 px.
- Frases nuevas en el globito (tono tranquilo): esfera, trineo, nieve, escondite.

### Mascota: gestos en el hielo de Pre-Navidad (parte 3, 13 nov 2026)
Cuatro escenas nuevas en `js/green-actor.js` (solo con `frozen`), con su efecto en el hielo en `js/navidad-hielo-gestos.js`
(`NavidadHieloGestos.create(mount,actor,{idPrefix})`, escucha `greenactor:scenechange` y dibuja dentro del SVG del hielo,
recortado por `nvice-melt`; un rAF a 30 cps solo mientras dura el gesto):
- **icedraw**: empaña con el aliento y dibuja con el dedo una carita enojada en el vaho (trazo `GreenActor.trazoHielo`,
  compartido: la mano lo sigue y el dibujo usa el mismo trazo).
- **icescrape**: raspa con la uña frente a su ojo derecho; una máscara abre un hueco en la escarcha y el cuerpo del hielo,
  caen virutas y se asoma por el agujerito.
- **icepunch**: golpea la pared; el bloque se sacude (`.nv-hielo-sacudon`), cae escarcha y aparece una grieta que se
  queda el resto del día (`localStorage.innova_nv_grietas`, máximo 4).
- **icesneeze**: tirita, toma aire y estornuda: nube de vaho, sacudón y copitos dentro del hielo.
Se intercalan en la vida autónoma de Pre (`navidad-vida.js`) en el login y en el encabezado de adentro. `puede(nombre)`
evita el gesto si el hielo ya bajó de esa altura (con los días se derrite). Vista previa:
`__mascotaNavidadHielo('icedraw'|'icescrape'|'icepunch'|'icesneeze')`.

### Mascota de adentro: reacciona y juega con lo que tiene alrededor (parte 4, 13 nov 2026)
En `js/navidad-companero.js`:
- **Reacciona a lo que haces**: `index.html` emite `document` → `innova:accion` al marcar (`{tipo:'marcaje',estado}`) y al
  guardar (`{tipo:'guardado'}`). A tiempo asiente (`ack`, «Mmm… a tiempo. Qué raro.»), tarde refunfuña (`grump`, «¡Tarde!
  Lo vi todo.»), al guardar se sonroja (`tap3`). En el hielo mira o resopla. Si hay una ventana encima espera a que se
  cierre (hasta 30 s).
- **Saca algo de su bota** (casa, vida autónoma `bota`): mete la mano (`mischief` hacia la bota, sin moverla), saca un
  bastón de dulce (60 %) o un carbón (`.nv-bota-premio`, sigue a la mano) y reacciona (`tap3` / `grump`).
- **Jala la guirnalda** (casa, `guirnalda`): escena nueva del motor `lights` (alza el brazo derecho junto a la cabeza con
  `upReach`, de puntitas, dos jalones); la guirnalda `.nvc-cordon` se columpia y los focos parpadean (`.nvc-jalada`).
- **Se asoma al bajar**: un IntersectionObserver sobre la tarjeta; cuando sale por arriba, una copia quieta del dibujo
  (`button.nv-asoma`, ids `nvs-`) se asoma por la orilla derecha; al tocarla vuelve arriba. En Pre sale dentro de su hielo.
Vista previa: `__nvCompanero('bota'|'guirnalda')`. Frases nuevas en `navidad-entorno.js`.

### Navidad: calendario y registros «Cordón de luces» (14 nov 2026)
Antes el calendario por colores (`.rg-cal`/`.rg-cd`, Mi Historial, perfil del técnico, Asistencia) y la lista del historial
(`.hl`/`.hl-it`/`.hl-c`) y la de Registros del admin (`.rg-emp`) se veían como el tema base. Ahora (bloque al final de
`css/temas/navidad.css`): Navidad en casa, tablero de noche con guirnalda y días como foquitos encendidos del color de su
tipo, focos apagados para los días por venir; la línea del historial es un cable con un foco por día; los títulos de cada
día van en una píldora oscura (antes eran blancos sobre fondo claro) y el aviso «Toca un día con borde rojo…» también
(antes no se leía sobre el dibujo). Pre-Navidad, «luces escarchadas»: aurora en el tablero, guirnalda congelada, focos con
copete de nieve, vidrio congelado y cable escarchado. Elegido entre 3 (cordón de luces, postal y etiquetas, galleta/hielo).
Colores por tipo en variables (`--c`, `--cl`, `--cd`, `--cg`), sin `color-mix`.

### Rendimiento de los temas de Navidad (medido el 10 nov 2026)
Medición en Chromium con un celular de 390×844 (×2.75), app quieta 5 s; «ocupado» = % del hilo principal en uso.
Sin tema la app quieta usa 0 %. Con procesador normal (×1), antes → después de `mejoras/rendimiento`:
Pre-Navidad login 62 → 24 %, Pre-Navidad adentro 33 → 21 % (11 % en reposo), Navidad en casa login 24 → 24 %,
Navidad en casa adentro 33 → 23 % (17 % en reposo). Simulando un celular económico (CPU ×4) todo sale cerca del
100 % (el simulador no tiene tarjeta gráfica: exagera el pintado, pero el orden de lo que pesa es el mismo).
- Lo que pesa: los lienzos animados de pantalla completa (aurora, nieve, luces) y **la mascota**: con la app quieta y en
  reposo, casi todo lo que queda es `js/green-actor.js` (pide ~115 cuadros por segundo sin descanso, también adentro).
  Escondiendo la mascota, adentro en reposo baja a ~3–4 %. Las animaciones CSS decorativas pesan poco.
- Hecho: lienzos de Pre-Navidad y de la casita a 30 cps (el movimiento depende del tiempo; la nieve del login usa
  `ritmo`); la aurora del login se pinta a media resolución ~11 veces por segundo en un lienzo aparte; las capas vivas
  (nieve, luces, humo) a resolución 1×; el valle de adentro en dos lienzos (el paisaje solo se repinta al deslizar);
  el ciclo del login de Pre se detiene con el login oculto; **reposo** (`window.__nvReposo`, clase `html.nv-reposo`):
  tras 25 s sin tocar, los fondos de adentro se detienen y las animaciones decorativas se pausan; al primer toque
  siguen. Visualmente igual (comparado con capturas).
- Pendiente (de la mascota, otro asistente): limitar su ciclo a 30 cps, no animar cuando no se ve y escuchar
  `window.__nvReposo.escuchar(q=>…)` para quedarse quieta en reposo.
- Carga: `index.html` pesa 580 KB (169 KB comprimido; casi todo es el módulo principal en línea) y no se guarda en
  caché (el service worker no cachea); los scripts de Navidad (~100 KB comprimidos) se descargan aunque no sea
  temporada. El login aparece igual de rápido con o sin tema.

## 7. Carencias conocidas / deuda técnica (buenos objetivos de auditoría)

1. *(Resuelto)* Reglas de la base por rol en `database.rules.json` (se publican solas con
   GitHub Actions, con respaldo de las anteriores y prueba después). Resumen:
   - Sin sesión solo se lee `config/mantenimiento`, `mantenimientoTransicion`, `cierreSesion`, `tema`, `musica`, `musicaDatos`.
   - Empleado: lee `users`, `programaciones`, `asuetos`, `config` y solo SUS `registros`,
     `marcajes` y `suspensiones`. Crea sus registros (no los edita ni borra; no puede crearlos
     con HE aprobadas ni con vacaciones/permiso/incapacidad aprobados). Marca entrada/salida
     una sola vez con hora del servidor (`ts` = `now`) y solo completa `estado/horaStr/minDiff`
     una vez. En su ficha solo escribe `avisosVistosEn`, `tutoCampanitaV` y `dispositivoId`
     (este solo si no tenía).
   - Oficina (admin y asistente): lee todo y escribe `registros`, `marcajes`, `observaciones`,
     `suspensiones`, `asuetos`, `programaciones` y el resto de `config`.
   - Solo admin: `users` y `config/mantenimiento|mantenimientoTransicion|cierreSesion|tema|musica|musicaDatos`.
   - `pins`, `pins_viejos`, `seguridad_intentos`: nadie desde la app (solo el servidor).
   - Usuario inactivo = sin acceso aunque tenga sesión.
   Si una función nueva lee o escribe otra ruta, **hay que agregarla a las reglas** o fallará.
2. *(Resuelto)* Login con Firebase Authentication vía servidor (ver §2 Seguridad).
3. **`index.html` demasiado grande** (~4600 líneas). Difícil de mantener. Modularizar más
   (separar admin/empleado) es deseable pero de alto riesgo en producción.
4. **Truncamiento al descargar `index.html`**: históricamente, al bajarlo/subirlo por
   GitHub se truncaba (llegaban menos líneas de las reales). Por eso se prefiere entregar
   por zip o pegar fragmentos. Verificar siempre el número de líneas tras subir.
5. **Marcaje: la gente olvida marcar, sobre todo la salida.**
   - *(Hecho)* **Avisos al celular** (Firebase Cloud Messaging, ver §5 "Avisos al celular").
     En iPhone solo llegan con la app agregada a la pantalla de inicio (iOS 16.4+).
   - Marcaje automático por GPS en segundo plano: **imposible en PWA** (el navegador no
     deja leer GPS con la app cerrada; requeriría app nativa).
   - Opciones viables no implementadas aún: recordatorio fuerte al abrir la app, alarma
     local del teléfono a la hora de salida, panel de "quién no marcó" + aviso por WhatsApp.
   - Nota: convertir a **app nativa** resolvería marcaje automático y notificaciones, pero
     es un proyecto aparte.
6. **Marcajes viejos** guardados con la tolerancia anterior (5 min) no se recalcularon al
   cambiar a tolerancia 0; se corrigen a mano en Firebase si hace falta.
7. **Optimización de marcajes** en el dashboard (lectura día-por-día) aún pendiente (ver §6).

---

## 8. Reglas de trabajo para Claude Code (IMPORTANTE)

Esta app está **en producción con ~30 personas usándola a diario**. Un cambio malo la
puede tumbar. Por eso:

1. **Nunca hagas commit directo a `main`.** Trabaja en una rama aparte (ej.
   `mejoras/<tema>`) y deja que David revise antes de fusionar.
2. **Muestra los cambios antes de aplicarlos.** Explica qué vas a tocar y por qué; espera
   el OK. Cambios quirúrgicos, de uno en uno — no reescrituras masivas.
3. **No cambies las decisiones de diseño de la sección 5** sin consultar; costaron muchas
   iteraciones.
4. **Verifica sintaxis** antes de entregar. Para el JS embebido en `index.html`, extraer el
   `<script type="module">`, quitar/stubear los imports y correr `node --check`.
5. **CSS**: si cambias `css/styles.css`, sube el número de cache-bust (`?v=N`) en el link
   del `index.html`, o el cambio no se verá.
6. **Cuida el rendimiento** (sección 6): usa los cachés, no leas Firebase en bucle por
   empleado.
7. **Respeta meses cerrados** al escribir en `registros`.
8. **Verifica que `index.html` no se truncó** tras subirlo (compara número de líneas).
9. Tras cualquier cambio en el tablero de programación, probar en **vista de celular**
   (es el uso principal).
10. **Propuestas de diseño: siempre 3 opciones, con ejemplos** (video o imágenes de cada una), nunca solo
    texto. Lo que se aprendió con los temas: la idea y el encanto pesan más que la técnica (3D/perspectiva no
    fue lo que se buscaba); cuidar la animación (anticipación, inercia, rebote, trazos en orden, ritmo); en
    Navidad el nivel tiene que ser alto, pero sin saturar ("demasiado producido" tampoco gustó en Muertos).
    Cuando se elige una, la duración aprobada no se cambia sin preguntar.

---

## 9. Sobre este documento

Lo mantiene David. Si cambias algo estructural (un nodo nuevo de Firebase, un archivo
nuevo, una decisión de diseño), **actualiza este `Contexto.md`** para que siga siendo la
fuente de verdad del proyecto.
