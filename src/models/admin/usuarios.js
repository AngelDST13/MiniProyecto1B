// Entidad: Usuarios del sistema (administración de cuentas).
// La contraseña se recibe en "password" y se guarda cifrada en la columna password_hash.
import { AppError } from '../../utils/AppError.js';

export default {
  clave: 'usuarios',
  tabla: 'usuarios',
  singular: 'Usuario',
  plural: 'Usuarios',
  descripcion: 'Cuentas con acceso al sistema.',
  grupo: 'Sistema',
  icono: 'UserCog',
  etiqueta: (a) => `${a}.nombre`,
  orden: 't.nombre',
  marcasTiempo: ['fecha_creacion'],
  campos: [
    { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, min: 3, max: 100, enLista: true },
    { nombre: 'correo', etiqueta: 'Correo', tipo: 'email', requerido: true, max: 120, unico: true, enLista: true },
    {
      nombre: 'password',
      columna: 'password_hash',
      etiqueta: 'Contraseña',
      tipo: 'password',
      requerido: true, // solo al crear; al editar, vacía = se conserva la actual
      min: 8,
      max: 72,
      ayuda: 'Mínimo 8 caracteres. Al editar, déjala vacía para conservar la actual.',
    },
  ],
  // Evita que alguien elimine su propia cuenta y se quede sin acceso.
  antesDeEliminar: (id, req) => {
    if (id === req.usuarioId) {
      throw new AppError('No puedes eliminar tu propia cuenta mientras tienes la sesión iniciada', 409, 'SELF_DELETE');
    }
  },
};
