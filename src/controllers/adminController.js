// Endpoints de apoyo del panel de Administración:
// - el "esquema" de cada entidad para que el frontend arme tablas y formularios
// - las opciones de los selectores de llaves foráneas
import { ENTIDADES, MODULOS_PERSONALIZADOS, resolverReferencia } from '../models/admin/index.js';
import { contarRegistros, listarOpciones } from '../models/crudModel.js';
import { AppError } from '../utils/AppError.js';

// Solo se envían propiedades de presentación (nunca funciones ni nombres de tablas).
const describirCampo = ({ nombre, etiqueta, tipo, requerido, unico, min, max, opciones, ref, enLista, ayuda, porDefecto, moneda, ancho, mono }) => ({
  nombre, etiqueta, tipo, requerido: Boolean(requerido), unico: Boolean(unico), min, max, opciones, ref, enLista: Boolean(enLista),
  ayuda, porDefecto, moneda: Boolean(moneda), ancho: ancho ?? 'medio', mono: Boolean(mono),
});

/** GET /api/admin/entidades — los módulos que el rol puede usar, con su conteo de registros */
export const getEntidades = async (req, res) => {
  // Cada rol ve solo los módulos que puede usar (el técnico no ve Usuarios, Pedidos ni Solicitudes).
  const esAdmin = req.usuario?.rol === 'admin';
  const genericas = await Promise.all(
    ENTIDADES.filter((entidad) => (entidad.roles ?? ['admin', 'tecnico']).includes(req.usuario?.rol)).map(async (entidad) => ({
      clave: entidad.clave,
      singular: entidad.singular,
      plural: entidad.plural,
      descripcion: entidad.descripcion,
      grupo: entidad.grupo,
      icono: entidad.icono,
      personalizado: false,
      total: await contarRegistros(entidad.tabla),
      campos: entidad.campos.map(describirCampo),
    })),
  );

  const personalizadas = await Promise.all(
    MODULOS_PERSONALIZADOS.filter((modulo) => esAdmin || !modulo.soloAdmin).map(async ({ tabla, soloAdmin: _soloAdmin, ...modulo }) => ({
      ...modulo,
      personalizado: true,
      total: await contarRegistros(tabla),
    })),
  );

  const data = [...personalizadas, ...genericas];
  res.status(200).json({ total: data.length, data });
};

/** GET /api/admin/opciones/:ref — [{ id, etiqueta }] para los selectores */
export const getOpciones = async (req, res) => {
  const { ref } = req.params;
  if (!resolverReferencia(ref)) {
    throw new AppError(`No existe la entidad "${ref}"`, 404, 'NOT_FOUND');
  }
  const opciones = await listarOpciones(ref);
  res.status(200).json({ total: opciones.length, data: opciones });
};
