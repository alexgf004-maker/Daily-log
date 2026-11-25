// Conteo de incidencias del mes (js/asistencia.js): lo usan la oficina y el técnico
import test from 'node:test';
import assert from 'node:assert/strict';
import { resumenMesEmpleado } from '../js/asistencia.js';

const m = (estado, minDiff = 0, horaStr = '07:00') => ({ ts: 1, estado, minDiff, horaStr });
const marcajes = {
  '2026-11-02': { entrada: m('a_tiempo'), salida: m('a_tiempo') },
  '2026-11-03': { entrada: m('tarde', 12, '07:12'), salida: m('a_tiempo') },
  '2026-11-04': { entrada: m('a_tiempo') },                                // olvidó la salida
  '2026-11-05': { salida: m('salida_temprana', 30, '16:30') },             // olvidó la entrada y salió antes
  '2026-11-09': { entrada: m('tarde', 15, '07:15'), salida: m('a_tiempo') },
  '2026-11-10': { entrada: m('a_tiempo') },                                // hoy: aún puede marcar la salida
};
marcajes['2026-11-09'].entrada.justificado = { nota: 'tráfico' };
const regs = { '2026-11-06': { tipoDia: 'permiso' } };

test('cuenta tarde, salidas antes, días sin marcar y marcas olvidadas', () => {
  const r = resumenMesEmpleado('2026-11', 'u1', marcajes, regs, {}, '2026-11-10');
  assert.equal(r.diasTarde, 1);          // el del 9 está justificado
  assert.equal(r.minTarde, 12);
  assert.equal(r.salidasTemp, 1);
  assert.equal(r.minTemp, 30);
  assert.equal(r.noMarco, 0);            // el 6 tiene permiso
  assert.equal(r.olvidoMarca, 2);        // 4 (sin salida) y 5 (sin entrada); el 10 es hoy
  assert.deepEqual(r.detalle.filter(d => d.olvido).map(d => [d.fecha, d.olvido]), [['2026-11-04', 'salida'], ['2026-11-05', 'entrada']]);
});

test('un día hábil sin ninguna marca cuenta como no marcó, no como marca olvidada', () => {
  const r = resumenMesEmpleado('2026-11', 'u1', {}, {}, {}, '2026-11-03');
  assert.equal(r.noMarco, 2);
  assert.equal(r.olvidoMarca, 0);
});

test('una marca olvidada que la oficina justificó se muestra pero no cuenta', () => {
  const ts = 1;
  const r = resumenMesEmpleado('2026-11', 'u1', {
    '2026-11-02': { entrada: { ts, estado: 'a_tiempo', horaStr: '06:55' }, salida: { justificado: { nota: 'se le murió el cel' } } },
    '2026-11-03': { entrada: { ts, estado: 'a_tiempo', horaStr: '06:55' } },
  }, {}, {}, '2026-11-04');
  assert.equal(r.olvidoMarca, 1);
  assert.deepEqual(r.detalle.filter(d => d.olvido).map(d => [d.fecha, d.olvido, !!d.olvidoJust]), [['2026-11-02', 'salida', true], ['2026-11-03', 'salida', false]]);
  assert.equal(r.detalle[0].salida, null);
});
