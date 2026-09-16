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
  - PINs hasheados con SHA-256, salt `INNOVA_SALT_2025_`.
  - Firebase App Check con reCAPTCHA v3 (site key `6Lfd1bMsAAAAAGk4puMSgSLebxVqffk-qsouUIie`).
  - Reglas de Firebase por nodo.
  - **NO** usa Firebase Authentication (migración deferida a propósito; el login es por
    usuario + PIN propio contra el nodo `users`).

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
```

`index.html` sigue siendo grande (~4600 líneas). Modularizar más (separar admin/empleado)
se ha diferido por ser **alto riesgo estando en producción**. Es candidato a auditoría,
pero cualquier split debe hacerse con extremo cuidado y en rama aparte.

---

## 4. Estructura de datos en Firebase (nodos principales)

- `users/{uid}`: `{nombre, nombreCorto?, cargo?, username, pin(SHA-256), role, activo,
  empleadosAsig[], sede, dispositivoId?}`
- `registros/{uid}/{key}`: registro diario. Campos según tipo: `{fecha, tipoDia, actividades,
  viatico, he, estadoViatico, estadoHE, estadoEspecial, vacIni?, vacFin?, nota?, ...}`.
  `tipoDia` puede ser: `normal`, `vacaciones`, `incapacidad`, `permiso`, `bienestar`,
  `injustificado`, `asueto`.
- `marcajes/...`: marcajes de entrada/salida por GPS con timestamp de servidor.
- `config/`: configuración varia (incluye `config/vehiculos`, `config/campanias`,
  `config/sabadosLaborales`).
- `programaciones/{fecha}`: `{grupos:[{campania, area, empleados[], empleadosNombres[],
  vehiculo, vehiculoNombre, zona}], noDisponibles:{personal[], vehiculos[]}, ...}`.
- `asuetos/`, `observaciones/`, `suspensiones/`: nodos de apoyo.

**Reglas de Firebase**: todos los nodos anteriores tienen `.read`/`.write: true` (abiertas).
La protección real hoy es App Check + PIN, no las reglas. **Esto es una carencia de seguridad
importante — ver sección 7.**

---

## 5. Decisiones de diseño ya tomadas (no revertir sin consultar)

- **Marcaje GPS**: 3 sedes con radio 100 m — Plantel Central
  (13.688409755143281, -89.27993065477382), Subestación Cucumacayán
  (13.693570433295193, -89.20564341328895), Subestación Zacatecoluca
  (13.508016211954466, -88.86875891706555). Hora de servidor, no del teléfono.
  Horario: L-J 07:00-17:00, V 07:00-16:00, Sáb 06:00-14:00, Dom sin evaluación.
  Tolerancia 0 min (7:00 en punto).
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
  - Las campañas ocupan la pantalla (separadas **Campo** / **Plantel**), cada una con
    botón "+ grupo"; los grupos son cajas.
  - Un **botón flotante "Personal libre (N)"** abre un panel deslizable con la lista
    completa de personal + buscador. Flujo: tocar botón → elegir persona → el botón se
    pone verde "Asignar: X" → tocar la caja del grupo. **No usar drag & drop** (se probó
    y se rechazó; en celular no funciona bien).
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

---

## 6. Rendimiento (ya optimizado, mantener el patrón)

Se detectó lentitud por leer `registros/{uid}` **empleado por empleado** (~30 viajes a
Firebase por render). Se resolvió así:
- `getRegistrosAll()`: lee **todo** el nodo `registros` de una vez y lo cachea ~8 s.
- `getUsers()`: cacheado ~15 s.
- Al escribir se invalida el caché (`invalidarRegsCache()`, `invalidarUsersCache()`).
- Las acciones del tablero (asignar/quitar persona y vehículo, zona, grupos) **renderizan
  de inmediato y guardan en segundo plano** (no esperan la confirmación de Firebase).

**Regla**: no volver al patrón de leer por-empleado en bucle. Usar los cachés.
Queda pendiente un patrón similar en la lectura de **marcajes** día-por-día en el
dashboard (aún no optimizado) — candidato de auditoría.

---

## 7. Carencias conocidas / deuda técnica (buenos objetivos de auditoría)

1. **Reglas de Firebase abiertas** (`.read`/`.write: true` en todos los nodos). Cualquiera
   con la URL puede leer/escribir. Hoy se mitiga con App Check + PIN, pero es la carencia
   de seguridad más seria. Endurecer las reglas es delicado porque no hay Firebase Auth.
2. **Sin Firebase Authentication**: el login es usuario+PIN contra el nodo `users`. Migrar
   a Auth daría seguridad real pero es un proyecto grande; se ha diferido.
3. **`index.html` demasiado grande** (~4600 líneas). Difícil de mantener. Modularizar más
   (separar admin/empleado) es deseable pero de alto riesgo en producción.
4. **Truncamiento al descargar `index.html`**: históricamente, al bajarlo/subirlo por
   GitHub se truncaba (llegaban menos líneas de las reales). Por eso se prefiere entregar
   por zip o pegar fragmentos. Verificar siempre el número de líneas tras subir.
5. **Marcaje: la gente olvida marcar, sobre todo la salida.** Se estudiaron notificaciones:
   - Push reales en PWA: poco fiables (sobre todo iOS) → descartadas.
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

---

## 9. Sobre este documento

Lo mantiene David. Si cambias algo estructural (un nodo nuevo de Firebase, un archivo
nuevo, una decisión de diseño), **actualiza este `Contexto.md`** para que siga siendo la
fuente de verdad del proyecto.
