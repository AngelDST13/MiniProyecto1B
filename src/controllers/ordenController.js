// Controlador de OrdenServicio y de los repuestos usados en cada orden.
import { OrdenModel } from '../models/ordenModel.js';
import { ClienteModel } from '../models/clienteModel.js';
import {
  ESTADOS,
  validarComponenteDeOrden,
  validarEstado,
  validarOrden,
} from '../validators/ordenValidator.js';
import { AppError } from '../utils/AppError.js';
import { assertValido } from '../utils/assertValido.js';
import { parseId } from '../utils/parseId.js';

const buscarOFallar = async (id) => {
  const orden = await OrdenModel.findById(id);
  if (!orden) throw new AppError(`No existe una orden con id ${id}`, 404, 'NOT_FOUND');
  return orden;
};

// Relación: la orden debe apuntar a un cliente que exista (400 si no).
const verificarCliente = async (clienteId) => {
  const cliente = await ClienteModel.findById(clienteId);
  if (!cliente) {
    throw new AppError(`El cliente con id ${clienteId} no existe`, 400, 'CLIENTE_NO_EXISTE', {
      cliente_id: 'Selecciona un cliente existente',
    });
  }
};

/** GET /api/ordenes?estado=Recibido&cliente_id=1 */
export const getOrdenes = async (req, res) => {
  const { estado, cliente_id: clienteIdTexto } = req.query;
  if (estado && !ESTADOS.includes(estado)) {
    throw new AppError(`Estado no válido. Opciones: ${ESTADOS.join(', ')}`, 400, 'VALIDATION_ERROR');
  }
  const clienteId = clienteIdTexto ? parseId(clienteIdTexto, 'cliente_id') : undefined;

  const ordenes = await OrdenModel.findAll({ estado, clienteId });
  res.status(200).json({ total: ordenes.length, data: ordenes });
};

/** GET /api/ordenes/:id — incluye cliente y repuestos usados */
export const getOrdenById = async (req, res) => {
  const orden = await buscarOFallar(parseId(req.params.id));
  res.status(200).json({ data: orden });
};

/** POST /api/ordenes */
export const createOrden = async (req, res) => {
  const { datos, errores } = validarOrden(req.body);
  assertValido(errores, 'Datos de la orden inválidos');
  await verificarCliente(datos.cliente_id);

  const orden = await OrdenModel.create(datos);
  res.status(201).json({ message: 'Orden de servicio creada correctamente', data: orden });
};

/** PUT /api/ordenes/:id */
export const updateOrden = async (req, res) => {
  const id = parseId(req.params.id);
  await buscarOFallar(id);

  const { datos, errores } = validarOrden(req.body);
  assertValido(errores, 'Datos de la orden inválidos');
  await verificarCliente(datos.cliente_id);

  const orden = await OrdenModel.update(id, datos);
  res.status(200).json({ message: 'Orden actualizada correctamente', data: orden });
};

/** PATCH /api/ordenes/:id/estado — cambio rápido de estado desde el tablero */
export const updateEstadoOrden = async (req, res) => {
  const id = parseId(req.params.id);
  await buscarOFallar(id);

  const { datos, errores } = validarEstado(req.body);
  assertValido(errores, 'Estado inválido');

  const orden = await OrdenModel.updateEstado(id, datos.estado);
  res.status(200).json({ message: `Orden movida a "${datos.estado}"`, data: orden });
};

/** DELETE /api/ordenes/:id — los repuestos asignados regresan al stock */
export const deleteOrden = async (req, res) => {
  const id = parseId(req.params.id);
  await buscarOFallar(id);

  await OrdenModel.remove(id);
  res.status(200).json({ message: 'Orden eliminada correctamente' });
};

/** POST /api/ordenes/:id/componentes — agrega un repuesto y descuenta stock */
export const addComponenteAOrden = async (req, res) => {
  const id = parseId(req.params.id);
  await buscarOFallar(id);

  const { datos, errores } = validarComponenteDeOrden(req.body);
  assertValido(errores, 'Datos del repuesto inválidos');

  const orden = await OrdenModel.addComponente(id, datos);
  res.status(201).json({ message: 'Repuesto agregado a la orden', data: orden });
};

/** DELETE /api/ordenes/:id/componentes/:componenteId — devuelve las unidades al stock */
export const removeComponenteDeOrden = async (req, res) => {
  const id = parseId(req.params.id);
  const componenteId = parseId(req.params.componenteId, 'componenteId');
  await buscarOFallar(id);

  const orden = await OrdenModel.removeComponente(id, componenteId);
  if (!orden) {
    throw new AppError('Ese repuesto no está registrado en la orden', 404, 'NOT_FOUND');
  }
  res.status(200).json({ message: 'Repuesto retirado de la orden', data: orden });
};
