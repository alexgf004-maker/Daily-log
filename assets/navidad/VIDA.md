# Gestos autónomos de la mascota

La iniciativa usa `navidad-vida.js`, compartido por el login y los encabezados.
El primer gesto puede empezar tras 2,4 segundos disponibles. Después de cada
gesto hay una pausa de 4–7 segundos; una escena en curso pospone el siguiente.
Un toque del usuario también aplaza la iniciativa para dejar terminar la reacción.

En Pre-Navidad alterna observar a los lados, presionar el hielo con las manos,
resoplar y adormecerse antes de despertar. El cuerpo conserva su posición y el
calendario del deshielo no avanza. Los ojos pasan del CSS al motor durante cada
gesto y vuelven al CSS cuando termina; el motor descansa entre escenas.

Libre alterna observar, intentar una acción sobre una luz o adorno reales,
acomodar el gorro, tramar una travesura, dormitar, reírse y estirarse. Si no hay
objetos alcanzables pasa a un gesto propio, por lo que no depende de encontrar
una botita o un foco. También recupera la respiración y los pequeños movimientos
del reposo. Año Nuevo utiliza su propia secuencia sin gorro ni soplo automático.

El foco de un campo normal ya no bloquea la iniciativa para siempre: al dejar de
escribir durante 2,5 segundos puede volver a actuar. Se observan únicamente
eventos de foco y edición, sin leer valores. El PIN mantiene su privacidad
durante todo el tiempo que permanece enfocado.

La iniciativa se suspende con movimiento reducido, la pestaña oculta, una escena
inactiva y los bloqueos de la interfaz. En los encabezados también se suspende
fuera de pantalla y ante un modal. Solo hay un temporizador pendiente por
mascota; se cancela al suspender o destruir el controlador. No se acumulan
escenas en segundo plano.

Las pruebas usan el reloj del planificador y los controladores reales con un
DOM simulado: verifican secuencias sin toques ni decoraciones, regreso al reposo,
campos normales inactivos, PIN, modales, segundo plano y limpieza. La comparación
del motor con y sin caché cubre 7.680 cuadros de las 32 escenas.
