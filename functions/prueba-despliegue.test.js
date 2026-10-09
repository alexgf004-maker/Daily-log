// Prueba después de publicar (la corre GitHub Actions, no se sube a Firebase):
// crea un usuario temporal, entra con el login del servidor y lo borra.
const admin = require('firebase-admin');
const crypto = require('crypto');
const PROYECTO = 'daily-e4f86';
admin.initializeApp({ projectId: PROYECTO, databaseURL: `https://${PROYECTO}-default-rtdb.firebaseio.com` });
const db = admin.database();
const sha = t => crypto.createHash('sha256').update(t).digest('hex');
const URL = `https://us-central1-${PROYECTO}.cloudfunctions.net/login`;
const llamar = data => fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data }) }).then(r => r.json());

(async () => {
  const uid = 'prueba-despliegue-uid', username = 'prueba-despliegue-github';
  const pin = String(1000 + crypto.randomInt(9000)), salt = crypto.randomBytes(8).toString('hex');
  let fallo = false;
  try {
    const malo = await llamar({ username: 'usuario-que-no-existe-xyz', pin: '0000' });
    if (malo?.error?.status !== 'PERMISSION_DENIED') throw new Error('El login no rechazó un usuario inventado: ' + JSON.stringify(malo));
    console.log('Rechaza un usuario inventado: bien.');
    await db.ref().update({
      [`users/${uid}`]: { nombre: 'Prueba automatica (se borra sola)', username, role: 'empleado', activo: true },
      [`pins/${uid}`]: { hash: sha(salt + pin), salt },
    });
    const r = await llamar({ username, pin });
    // Con la app en mantenimiento el servidor revisa el PIN y luego frena al empleado: también vale
    if (!r?.result?.token && r?.error?.status !== 'FAILED_PRECONDITION') throw new Error('El login correcto no entregó el token: ' + JSON.stringify(r));
    console.log('Login correcto: el servidor entregó el token de acceso.');
  } catch (e) {
    fallo = true;
    console.error('::error::' + e.message);
  } finally {
    await db.ref().update({ [`users/${uid}`]: null, [`pins/${uid}`]: null, [`seguridad_intentos/u_${sha('usuario-que-no-existe-xyz')}`]: null }).catch(() => {});
    process.exit(fallo ? 1 : 0);
  }
})();
