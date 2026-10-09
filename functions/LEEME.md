# Servidor de Registro de Planilla (Cloud Functions)

El login y los PIN pasan por aquí: el servidor revisa el PIN (con límite de
intentos) y entrega un token de acceso a Firebase Auth. Así la base puede exigir
haber iniciado sesión y separar lo que puede hacer cada rol. Detalle en `index.js`.

Funciones: `login`, `cambiarPin`, `guardarUsuario` (admin), `migrarPines` (admin).
Los PIN viven en `pins/{uid}` (y los de formato viejo, hasta su primer login, en
`pins_viejos/{uid}`): las reglas de la base las cierran a la app.

## Publicación

Se publican solas desde GitHub Actions (`.github/workflows/firebase-funciones.yml`)
cuando cambia algo de `functions/` en `main`. Necesita el secreto
`FIREBASE_SERVICE_ACCOUNT` (JSON de la cuenta de servicio `github-despliegue` del
proyecto daily-e4f86, rol Propietario). Después de publicar, prueba el login con
un usuario temporal que se borra solo (`prueba-despliegue.test.js`).

En la consola de Firebase, **Authentication** tiene que estar iniciado (botón
"Comenzar"); no hace falta activar ningún método de acceso. Si no, la prueba falla con
`CONFIGURATION_NOT_FOUND`.

En GitHub → Actions → "Publicar funciones de Firebase": verde = publicado y el
login responde; rojo = abrir el intento para ver el paso que falló.

## Probar en local

```
cd functions && npm install && cd ..
npx firebase-tools emulators:exec --project demo-planilla --only auth,database,functions "node prueba.mjs"
```
