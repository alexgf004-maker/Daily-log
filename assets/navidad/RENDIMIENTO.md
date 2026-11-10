# Rendimiento de la mascota

La optimización mantiene el SVG, los filtros, la frecuencia de animación y las
28 escenas. Se limita a `GreenActor`, compartido por el login y los encabezados.

## Cambios

- Al pausar el motor se cancela su solicitud de fotograma. Reanudar programa
  una sola solicitud y reinicia la referencia de tiempo para evitar saltos.
- El diálogo puede despertar la animación facial con el cuerpo congelado.
  Cuando termina la transición de la expresión, vuelve a detener el bucle.
  La expresión estática de movimiento reducido no solicita fotogramas.
- Las asignaciones de cada dibujo se agrupan y solo se escribe el valor final
  de cada atributo que cambió. Esto evita volver a ocultar/mostrar capas y
  reescribir geometría inmóvil en cada cuadro.
- El texto de los globos SVG originales tampoco se reasigna si sigue igual.

## Medición reproducible

```sh
node --test tests/*.test.cjs
node --check js/green-actor.js
git diff --check
```

La prueba de reposo usa el motor real con un DOM simulado que cuenta llamadas
a `setAttribute`: 600 cuadros a pasos de 1/60 s, en modo integrado contextual.
La referencia aplica directamente cada asignación, como el motor anterior.
Se excluyen de los conteos la construcción y la pose inicial.

| Medida | Antes | Optimizado |
| --- | ---: | ---: |
| Escrituras SVG durante 600 cuadros de reposo | 57.600 | 3.180 |
| Callbacks pendientes al pausar sin diálogo | 1 | 0 |

La reducción de escrituras en ese reposo es **94,48 %**. Esto no significa
94,48 % menos CPU o batería del dispositivo.

Las 28 escenas se comparan con la referencia sin caché en 120 momentos por
escena, tanto en modo original como integrado: **6.720 cuadros con los mismos
atributos y textos finales**. La comparación incluye hablar y retirar la
expresión. Otra comparación local contra el archivo anterior del commit
`214576a` también coincidió en 6.720 cuadros sin diálogo.

Las pruebas cubren la reanudación, la destrucción desde un callback,
el diálogo con el cuerpo pausado, el final de su transición y el movimiento
reducido, además de las pruebas existentes del hielo, calendario, PIN,
interacciones y cambio de tema.

## Límites de la evaluación

No se obtuvo una medición nueva de pintura, CPU, memoria o batería en un
navegador ni en un teléfono físico. Chrome no pudo iniciarse en este entorno.
Por tanto, los resultados cuantifican solicitudes de fotogramas y escrituras
del motor, no el coste total del tema ni el consumo de un teléfono real.

El hielo, sus ojos animados por CSS, las sombras, los filtros y los lienzos del
resto del tema conservan su coste. Para conocer el impacto real hay que comparar
el mismo equipo y escena con la mascota visible y oculta, y luego con el motor
anterior y el optimizado, manteniendo brillo, red y tiempo de prueba iguales.
No se ha reducido calidad visual para obtener estos resultados.
