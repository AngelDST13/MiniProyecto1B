// Controlador de Cliente: traduce la petición HTTP en llamadas al modelo
// y devuelve respuestas JSON con un formato consistente.
import { ClienteModel } from '../models/clienteModel.js';
import { OrdenModel } from '../models/ordenModel.js';
import { validarCliente } from '../validators/clienteValidator.js';
import { AppError } from '../utils/AppError.js';
import { assertValido } from '../utils/assertValido.js';
import { parseId } from '../utils/parseId.js';

// 409 si otra persona ya usa la cédula o el email.
const verificarDuplicados = async (datos, excluirId) => {
  const existente = await ClienteModel.findDuplicado(datos, excluirId);
  if (existente?.cedula === datos.cedula) {
    throw new AppError(`Ya existe un cliente con la cédula ${datos.cedula}`, 409, 'DUPLICATE_CEDULA');
  }
  if (existente) {
    throw new AppError(`Ya existe un cliente con el email ${datos.email}`, 409, 'DUPLICATE_EMAIL');
  }
};

const buscarOFallar = async (id) => {
  const cliente = await ClienteModel.findById(id);
  if (!cliente) throw new AppError(`No existe un cliente con id ${id}`, 404, 'NOT_FOUND');
  return cliente;
};

/** GET /api/clientes */
export const getClientes = async (req, res) => {
  const clientes = await ClienteModel.findAll();
  res.status(200).json({ total: clientes.length, data: clientes });
};

/** GET /api/clientes/:id */
export const getClienteById = async (req, res) => {
  const cliente = await buscarOFallar(parseId(req.params.id));
  res.status(200).json({ data: cliente });
};

/** POST /api/clientes */
export const createCliente = async (req, res) => {
  const { datos, errores } = validarCliente(req.body);
  assertValido(errores, 'Datos de cliente inválidos');
  await verificarDuplicados(datos);

  const nuevoCliente = await ClienteModel.create(datos);
  res.status(201).json({ message: 'Cliente creado correctamente', data: nuevoCliente });
};

/** PUT /api/clientes/:id */
export const updateCliente = async (req, res) => {
  const id = parseId(req.params.id);
  await buscarOFallar(id);

  const { datos, errores } = validarCliente(req.body);
  assertValido(errores, 'Datos de cliente inválidos');
  await verificarDuplicados(datos, id);

  const cliente = await ClienteModel.update(id, datos);
  res.status(200).json({ message: 'Cliente actualizado correctamente', data: cliente });
};

/** DELETE /api/clientes/:id — 409 si el cliente tiene órdenes registradas */
export const deleteCliente = async (req, res) => {
  const id = parseId(req.params.id);
  await buscarOFallar(id);

  const totalOrdenes = await OrdenModel.countByCliente(id);
  if (totalOrdenes > 0) {
    throw new AppError(
      `No se puede eliminar: el cliente tiene ${totalOrdenes} orden(es) de servicio registradas`,
      409,
      'HAS_DEPENDENCIES',
    );
  }

  await ClienteModel.remove(id);
  res.status(200).json({ message: 'Cliente eliminado correctamente' });
};
