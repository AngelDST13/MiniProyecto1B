// Controlador de ComponenteRepuesto (inventario de repuestos).
import { ComponenteModel } from '../models/componenteModel.js';
import { OrdenModel } from '../models/ordenModel.js';
import { CATEGORIAS, validarComponente } from '../validators/componenteValidator.js';
import { AppError } from '../utils/AppError.js';
import { assertValido } from '../utils/assertValido.js';
import { parseId } from '../utils/parseId.js';

const buscarOFallar = async (id) => {
  const componente = await ComponenteModel.findById(id);
  if (!componente) throw new AppError(`No existe un repuesto con id ${id}`, 404, 'NOT_FOUND');
  return componente;
};

/** GET /api/componentes?categoria=RAM */
export const getComponentes = async (req, res) => {
  const { categoria } = req.query;
  if (categoria && !CATEGORIAS.includes(categoria)) {
    throw new AppError(`Categoría no válida. Opciones: ${CATEGORIAS.join(', ')}`, 400, 'VALIDATION_ERROR');
  }
  const componentes = await ComponenteModel.findAll({ categoria });
  res.status(200).json({ total: componentes.length, data: componentes });
};

/** GET /api/componentes/:id */
export const getComponenteById = async (req, res) => {
  const componente = await buscarOFallar(parseId(req.params.id));
  res.status(200).json({ data: componente });
};

/** POST /api/componentes */
export const createComponente = async (req, res) => {
  const { datos, errores } = validarComponente(req.body);
  assertValido(errores, 'Datos de repuesto inválidos');

  const componente = await ComponenteModel.create(datos);
  res.status(201).json({ message: 'Repuesto creado correctamente', data: componente });
};

/** PUT /api/componentes/:id */
export const updateComponente = async (req, res) => {
  const id = parseId(req.params.id);
  await buscarOFallar(id);

  const { datos, errores } = validarComponente(req.body);
  assertValido(errores, 'Datos de repuesto inválidos');

  const componente = await ComponenteModel.update(id, datos);
  res.status(200).json({ message: 'Repuesto actualizado correctamente', data: componente });
};

/** DELETE /api/componentes/:id — 409 si el repuesto ya se usó en alguna orden */
export const deleteComponente = async (req, res) => {
  const id = parseId(req.params.id);
  await buscarOFallar(id);

  const usos = await OrdenModel.countByComponente(id);
  if (usos > 0) {
    throw new AppError(
      `No se puede eliminar: el repuesto está registrado en ${usos} orden(es) de servicio`,
      409,
      'HAS_DEPENDENCIES',
    );
  }

  await ComponenteModel.remove(id);
  res.status(200).json({ message: 'Repuesto eliminado correctamente' });
};
