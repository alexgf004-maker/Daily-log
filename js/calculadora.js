// ── CALCULADORA DE DESCUENTOS (ISSS / AFP / RENTA) ─────
// Lógica pura, sin dependencia de estado compartido (me, db, etc).
// Basada en la normativa vigente para El Salvador:
//   - ISSS: 3% sobre base gravable, tope $30.00/mes
//   - AFP: 7.25% sobre base gravable, sin tope práctico
//   - Renta: tabla de tramos vigente (Decreto No. 10, mayo 2025)
// Base gravable = Salario + Extras (D/N). Los viáticos NO forman parte
// de la base gravable: no pagan ISSS, AFP ni Renta.

const ISSS_TASA = 0.03;
const ISSS_TOPE = 30.00;
const AFP_TASA  = 0.0725;

// Tabla de tramos de renta (mensual), vigente desde Decreto No. 10 (mayo 2025)
const TRAMOS_RENTA = [
  { n: 1, hasta: 550.00,   cuotaFija: 0.00,   tasa: 0.00, exceso: 0.00,    label: 'Tramo I — Exento' },
  { n: 2, hasta: 895.24,   cuotaFija: 17.67,  tasa: 0.10, exceso: 550.00,  label: 'Tramo II — 10%'   },
  { n: 3, hasta: 2038.10,  cuotaFija: 60.00,  tasa: 0.20, exceso: 895.24,  label: 'Tramo III — 20%'  },
  { n: 4, hasta: Infinity, cuotaFija: 288.57, tasa: 0.30, exceso: 2038.10, label: 'Tramo IV — 30%'   },
];

function round2(n){ return Math.round((n + Number.EPSILON) * 100) / 100; }

export function tramoDe(baseRenta){
  return TRAMOS_RENTA.find(t => baseRenta <= t.hasta) || TRAMOS_RENTA[0];
}

export function calcularRenta(baseRenta){
  if (baseRenta <= 0) return 0;
  const t = tramoDe(baseRenta);
  return round2(t.cuotaFija + (baseRenta - t.exceso) * t.tasa);
}

/**
 * Calcula el desglose completo de descuentos de un período.
 * @param {number} salario  - Salario base devengado
 * @param {number} extras   - Suma de horas extra (D y/o N) devengadas
 * @param {number} viaticos - Viáticos devengados (no gravables)
 * @returns {object} desglose con base gravable, cada descuento, detalle del
 *                   tramo de renta aplicado y líquido a recibir
 */
export function calcularDescuentos({ salario = 0, extras = 0, viaticos = 0 }){
  const baseGravable   = round2(salario + extras);
  const totalDevengado = round2(baseGravable + viaticos);

  const isss = round2(Math.min(baseGravable * ISSS_TASA, ISSS_TOPE));
  const afp  = round2(baseGravable * AFP_TASA);

  const baseRenta = round2(baseGravable - isss - afp);
  const renta     = calcularRenta(baseRenta);

  const t = tramoDe(baseRenta);
  const excedente = baseRenta > t.exceso ? round2(baseRenta - t.exceso) : 0;

  const totalDescuentos = round2(isss + afp + renta);
  const liquidoARecibir = round2(totalDevengado - totalDescuentos);

  return {
    baseGravable,
    totalDevengado,
    isss,
    isssTope: baseGravable * ISSS_TASA > ISSS_TOPE,
    afp,
    baseRenta,
    renta,
    tramo: {
      n: t.n,
      label: t.label,
      exento: t.tasa === 0,
      cuotaFija: t.cuotaFija,
      tasa: t.tasa,
      exceso: t.exceso,
      excedente,
    },
    totalDescuentos,
    liquidoARecibir,
  };
}
