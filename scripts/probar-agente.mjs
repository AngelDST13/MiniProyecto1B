// Prueba el agente SIN gastar en la API: ejecuta las 7 herramientas contra la base real y
// recorre el bucle de herramientas con un cliente simulado.  Uso: node scripts/probar-agente.mjs
import { pool } from '../src/config/db.js';
import { DEFINICIONES, ejecutarHerramienta } from '../src/services/agente/herramientas.js';
import { conversar } from '../src/services/agente/agenteService.js';

let fallos = 0;
const verificar = (nombre, condicion, detalle = '') => {
  console.log(`${condicion ? 'OK  ' : 'FALLA'} ${nombre}${detalle ? ` · ${detalle}` : ''}`);
  if (!condicion) fallos += 1;
};

// 1. Herramientas contra la base de datos
const casos = {
  resumen_taller: {},
  buscar_ordenes: { estado: 'En Diagnóstico', limite: 5 },
  detalle_orden: { orden_id: 1 },
  buscar_clientes: { texto: 'María' },
  consultar_inventario: { solo_stock_bajo: true },
  resumen_finanzas: { desde: '2026-10-01', hasta: '2026-11-30' },
  agenda_citas: { desde: '2026-11-01' },
};
for (const { name } of DEFINICIONES) {
  const resultado = JSON.parse(await ejecutarHerramienta(name, casos[name]));
  verificar(`herramienta ${name}`, resultado !== null, JSON.stringify(resultado).slice(0, 90));
}

// 2. Entradas maliciosas o inválidas se neutralizan
const inyeccion = JSON.parse(await ejecutarHerramienta('buscar_ordenes', { texto: "'; DROP TABLE clientes; --", limite: 9999 }));
verificar('texto con SQL se trata como dato', Array.isArray(inyeccion) && inyeccion.length === 0);
const [{ total }] = (await pool.query('SELECT COUNT(*) AS total FROM clientes'))[0];
verificar('la tabla clientes sigue intacta', total > 0);
const inexistente = JSON.parse(await ejecutarHerramienta('detalle_orden', { orden_id: 999999 }));
verificar('orden inexistente devuelve un error legible', Boolean(inexistente.error), inexistente.error);
await ejecutarHerramienta('borrar_todo', {}).then(
  () => verificar('herramienta desconocida es rechazada', false),
  () => verificar('herramienta desconocida es rechazada', true),
);

// 3. Bucle del agente con un cliente simulado (pide una herramienta y luego responde)
const peticiones = [];
const clienteFalso = {
  beta: {
    messages: {
      create: async (params) => {
        peticiones.push(structuredClone(params));
        if (peticiones.length === 1) {
          return {
            model: 'simulado', stop_reason: 'tool_use',
            content: [{ type: 'tool_use', id: 'toolu_1', name: 'consultar_inventario', input: { solo_stock_bajo: true } }],
          };
        }
        return { model: 'simulado', stop_reason: 'end_turn', content: [{ type: 'text', text: 'Hay **1 repuesto** con stock bajo.' }] };
      },
    },
  },
};
const respuesta = await conversar([{ rol: 'usuario', texto: '¿Qué repuestos tienen stock bajo?' }], { cliente: clienteFalso });
verificar('el bucle termina con la respuesta final', respuesta.texto.includes('stock bajo'), respuesta.texto);
verificar('registra la herramienta usada', respuesta.herramientas.includes('consultar_inventario'));
const segunda = peticiones[1];
verificar('se envía la respuesta completa del asistente', segunda.messages[1].role === 'assistant' && segunda.messages[1].content[0].type === 'tool_use');
verificar('el resultado vuelve como tool_result', segunda.messages[2].content[0].type === 'tool_result' && segunda.messages[2].content[0].tool_use_id === 'toolu_1');
verificar('usa el modelo configurado con respaldo', peticiones[0].model === 'claude-opus-5-5' && peticiones[0].fallbacks === 'default');

// 4. Rechazo por seguridad
const rechazo = await conversar([{ rol: 'usuario', texto: 'x' }], {
  cliente: { beta: { messages: { create: async () => ({ model: 'simulado', stop_reason: 'refusal', content: [] }) } } },
});
verificar('un rechazo devuelve un mensaje amable', rechazo.texto.startsWith('No puedo ayudar'));

await pool.end();
console.log(fallos ? `\n${fallos} FALLAS` : '\nTODO OK');
process.exit(fallos ? 1 : 0);
