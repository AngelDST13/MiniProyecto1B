// Controlador genérico: los 5 endpoints REST (listar, ver, crear, actualizar, eliminar)
// para cualquier entidad del módulo de Administración.
import bcrypt from 'bcryptjs';
import { contarDependientes, crearModeloCrud, describirDependencias, existeReferencia } from '../models/crudModel.js';
import { validarEntidad } from '../validators/crudValidator.js';
import { AppError } from '../utils/AppError.js';
import { assertValido } from '../utils/assertValido.js';
import { parseId } from '../utils/parseId.js';

const SALT_ROUNDS = 10;

export const crearControladorCrud = (entidad) => {
  const modelo = crearModeloCrud(entidad);
  const { singular } = entidad;
  // Concordancia de género en los mensajes: "Sucursal creada", "Técnico creado".
  const o = entidad.femenino ? 'a' : 'o';
  const un = entidad.femenino ? 'una' : 'un';

  const buscarOFallar = async (id) => {
    const registro = await modelo.findById(id);
    if (!registro) throw new AppError(`No existe ${un} ${singular.toLowerCase()} con id ${id}`, 404, 'NOT_FOUND');
    return registro;
  };

  // Reglas que necesitan la base de datos: valores únicos y llaves foráneas existentes.
  const verificarIntegridad = async (datos, excluirId) => {
    const errores = {};
    for (const campo of entidad.campos) {
      const valor = datos[campo.nombre];
      if (valor === null || valor === undefined) continue;

      if (campo.unico && (await modelo.existeDuplicado(campo.nombre, valor, excluirId))) {
        errores[campo.nombre] = `Ya existe un registro con ese valor de ${campo.etiqueta.toLowerCase()}`;
      }
      if (campo.tipo === 'ref' && !(await existeReferencia(campo.ref, valor))) {
        errores[campo.nombre] = `${campo.etiqueta}: el registro seleccionado no existe`;
      }
    }
    if (Object.keys(errores).length > 0) {
      const hayDuplicado = Object.values(errores).some((mensaje) => mensaje.startsWith('Ya existe'));
      throw hayDuplicado
        ? new AppError('Hay valores que ya están registrados', 409, 'DUPLICATE_ENTRY', errores)
        : new AppError('Algún registro relacionado no existe', 400, 'INVALID_REFERENCE', errores);
    }
  };

  // Las contraseñas nunca se guardan en texto plano.
  const cifrarContrasenas = async (datos) => {
    for (const campo of entidad.campos.filter((c) => c.tipo === 'password')) {
      if (datos[campo.nombre]) datos[campo.nombre] = await bcrypt.hash(datos[campo.nombre], SALT_ROUNDS);
    }
    return datos;
  };

  return {
    list: async (req, res) => {
      const registros = await modelo.findAll();
      res.status(200).json({ total: registros.length, data: registros });
    },

    get: async (req, res) => {
      const registro = await buscarOFallar(parseId(req.params.id));
      res.status(200).json({ data: registro });
    },

    create: async (req, res) => {
      const { datos, errores } = validarEntidad(entidad, req.body, { esCreacion: true });
      assertValido(errores, `Datos de ${singular.toLowerCase()} inválidos`);
      await verificarIntegridad(datos);

      const registro = await modelo.create(await cifrarContrasenas(datos));
      res.status(201).json({ message: `${singular} cread${o} correctamente`, data: registro });
    },

    update: async (req, res) => {
      const id = parseId(req.params.id);
      await buscarOFallar(id);

      const { datos, errores } = validarEntidad(entidad, req.body, { esCreacion: false });
      assertValido(errores, `Datos de ${singular.toLowerCase()} inválidos`);
      await verificarIntegridad(datos, id);

      const registro = await modelo.update(id, await cifrarContrasenas(datos));
      res.status(200).json({ message: `${singular} actualizad${o} correctamente`, data: registro });
    },

    remove: async (req, res) => {
      const id = parseId(req.params.id);
      await buscarOFallar(id);
      await entidad.antesDeEliminar?.(id, req);

      const dependencias = await contarDependientes(entidad.clave, id);
      if (dependencias.length > 0) {
        throw new AppError(
          `No se puede eliminar: tiene registros relacionados (${describirDependencias(dependencias)})`,
          409,
          'HAS_DEPENDENCIES',
        );
      }

      await modelo.remove(id);
      res.status(200).json({ message: `${singular} eliminad${o} correctamente` });
    },
  };
};
