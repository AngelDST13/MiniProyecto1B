// Modelo genérico: genera las consultas SQL de una entidad a partir de su definición.
// Los nombres de tablas y columnas vienen de la definición (código del proyecto, no del usuario);
// los VALORES siempre van parametrizados con "?" para evitar inyección SQL.
import { pool } from '../config/db.js';
import { dependientesDe, resolverReferencia } from './admin/index.js';

export const crearModeloCrud = (entidad) => {
  const { tabla } = entidad;
  const visibles = entidad.campos.filter((campo) => campo.tipo !== 'password');
  const referencias = visibles.filter((campo) => campo.tipo === 'ref');
  const booleanos = visibles.filter((campo) => campo.tipo === 'booleano').map((campo) => campo.nombre);
  const marcasTiempo = entidad.marcasTiempo ?? ['created_at', 'updated_at'];

  // Cada llave foránea trae también un texto legible: cliente_id → cliente_id_etiqueta
  const joins = referencias
    .map((campo, i) => `LEFT JOIN ${resolverReferencia(campo.ref).tabla} r${i} ON r${i}.id = t.${campo.nombre}`)
    .join(' ');
  const columnas = [
    't.id',
    ...visibles.map((campo) => `t.${campo.nombre}`),
    ...marcasTiempo.map((columna) => `t.${columna}`),
    ...referencias.map((campo, i) => `${resolverReferencia(campo.ref).etiqueta(`r${i}`)} AS ${campo.nombre}_etiqueta`),
  ];
  const SELECT = `SELECT ${columnas.join(', ')} FROM ${tabla} t ${joins}`;

  // MySQL guarda booleanos como 0/1; la API responde true/false.
  const mapear = (fila) => {
    for (const nombre of booleanos) fila[nombre] = Boolean(fila[nombre]);
    return fila;
  };

  // Convierte { password: hash } en { password_hash: hash } según "columna".
  const aColumnas = (datos) =>
    Object.fromEntries(
      Object.entries(datos).map(([nombre, valor]) => {
        const campo = entidad.campos.find((c) => c.nombre === nombre);
        return [campo?.columna ?? nombre, valor];
      }),
    );

  return {
    async findAll() {
      const [filas] = await pool.execute(`${SELECT} ORDER BY ${entidad.orden}`);
      return filas.map(mapear);
    },

    async findById(id) {
      const [filas] = await pool.execute(`${SELECT} WHERE t.id = ?`, [id]);
      return filas[0] ? mapear(filas[0]) : null;
    },

    async create(datos) {
      const registro = aColumnas(datos);
      const nombres = Object.keys(registro);
      const [resultado] = await pool.execute(
        `INSERT INTO ${tabla} (${nombres.join(', ')}) VALUES (${nombres.map(() => '?').join(', ')})`,
        Object.values(registro),
      );
      return this.findById(resultado.insertId);
    },

    async update(id, datos) {
      const registro = aColumnas(datos);
      const asignaciones = Object.keys(registro).map((columna) => `${columna} = ?`);
      await pool.execute(`UPDATE ${tabla} SET ${asignaciones.join(', ')} WHERE id = ?`, [...Object.values(registro), id]);
      return this.findById(id);
    },

    async remove(id) {
      const [resultado] = await pool.execute(`DELETE FROM ${tabla} WHERE id = ?`, [id]);
      return resultado.affectedRows > 0;
    },

    // ¿Otro registro ya usa este valor en una columna única?
    async existeDuplicado(columna, valor, excluirId = 0) {
      const [filas] = await pool.execute(
        `SELECT id FROM ${tabla} WHERE ${columna} = ? AND id <> ? LIMIT 1`,
        [valor, excluirId],
      );
      return filas.length > 0;
    },
  };
};

// ¿Existe el registro referenciado por una llave foránea?
export const existeReferencia = async (clave, id) => {
  const { tabla } = resolverReferencia(clave);
  const [filas] = await pool.execute(`SELECT 1 FROM ${tabla} WHERE id = ? LIMIT 1`, [id]);
  return filas.length > 0;
};

// Cuenta los registros de otras tablas que apuntan a este (para responder 409).
export const contarDependientes = async (clave, id) => {
  const resultados = await Promise.all(
    dependientesDe(clave).map(async ({ tabla, columna, plural }) => {
      const [filas] = await pool.execute(`SELECT COUNT(*) AS total FROM ${tabla} WHERE ${columna} = ?`, [id]);
      return { plural, total: filas[0].total };
    }),
  );
  return resultados.filter((dependencia) => dependencia.total > 0);
};

// Mensaje legible: "2 registro(s) en Pagos y 1 en Garantías"
export const describirDependencias = (dependencias) =>
  dependencias.map(({ total, plural }) => `${total} en ${plural}`).join(', ');

// Lista { id, etiqueta } para llenar los <select> de llaves foráneas.
export const listarOpciones = async (clave) => {
  const { tabla, etiqueta, orden } = resolverReferencia(clave);
  // "orden" siempre usa el alias t. (por ejemplo "t.nombre" o "t.fecha DESC")
  const [filas] = await pool.execute(`SELECT t.id, ${etiqueta('t')} AS etiqueta FROM ${tabla} t ORDER BY ${orden}`);
  return filas;
};

export const contarRegistros = async (tabla) => {
  const [filas] = await pool.execute(`SELECT COUNT(*) AS total FROM ${tabla}`);
  return filas[0].total;
};
