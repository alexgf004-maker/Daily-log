// Prueba después de publicar (la corre GitHub Actions, no se sube a Firebase):
// crea un usuario temporal, entra con el login del servidor y lo borra.
const admin = require('firebase-admin');
const crypto = require('crypto');
const PROYECTO = 'daily-e4f86';
admin.initializeApp({ projectId: PROYECTO, databaseURL: `https://${PROYECTO}-default-rtdb.firebaseio.com` });
const db = admin.database();
const sha = t => crypto.createHash('sha256').update(t).digest('hex');
const URL = `https://us-central1-${PROYECTO}.cloudfunctions.net/login`;
const API_KEY = 'AIzaSyCOSdaBxZzAJTio8JDbamR8AP0SDFW1SZE'; // la misma que usa la app (es pública)
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
    // Los permisos recién dados pueden tardar unos minutos en aplicarse: se reintenta
    let r;
    for (let i = 0; i < 6; i++) {
      r = await llamar({ username, pin });
      if (r?.result?.token || r?.error?.status !== 'INTERNAL') break;
      console.log('Aún sin token (los permisos pueden tardar), reintento en 30 s…');
      await new Promise(res => setTimeout(res, 30000));
    }
    // Con la app en mantenimiento el servidor revisa el PIN y luego frena al empleado: también vale
    if (!r?.result?.token && r?.error?.status !== 'FAILED_PRECONDITION') throw new Error('El login correcto no entregó el token: ' + JSON.stringify(r));
    console.log('Login correcto: el servidor entregó el token de acceso.');
    // Canjear el token como lo hace la app (sin esto nadie podría entrar): prueba que Auth está activo
    if (r?.result?.token) {
      const canje = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Referer: 'https://alexgf004-maker.github.io/Daily-log/' },
        body: JSON.stringify({ token: r.result.token, returnSecureToken: true }),
      }).then(x => x.json());
      if (!canje.idToken) throw new Error('La app no podría entrar con el token (¿Authentication activo en Firebase?): ' + JSON.stringify(canje.error || canje));
      console.log('La app puede entrar con el token: bien.');
    }
  } catch (e) {
    fallo = true;
    console.error('::error::' + e.message);
  } finally {
    await db.ref().update({ [`users/${uid}`]: null, [`pins/${uid}`]: null, [`seguridad_intentos/u_${sha('usuario-que-no-existe-xyz')}`]: null }).catch(() => {});
    await admin.auth().deleteUser(uid).catch(() => {});
    process.exit(fallo ? 1 : 0);
  }
})();
