// Entidad: Usuarios del sistema (administración de cuentas y roles). Solo para administradores.
// La contraseña se recibe en "password" y se guarda cifrada en la columna password_hash.
import { AppError } from '../../utils/AppError.js';

export default {
  clave: 'usuarios',
  tabla: 'usuarios',
  singular: 'Usuario',
  plural: 'Usuarios',
  descripcion: 'Cuentas del personal y de los clientes, con su rol y seguridad.',
  grupo: 'Sistema',
  icono: 'UserCog',
  roles: ['admin'],
  etiqueta: (a) => `${a}.nombre`,
  orden: "FIELD(t.rol, 'admin', 'tecnico', 'cliente'), t.nombre",
  marcasTiempo: ['fecha_creacion', 'ultimo_acceso'],
  campos: [
    { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, min: 3, max: 100, enLista: true },
    { nombre: 'correo', etiqueta: 'Correo', tipo: 'email', requerido: true, max: 120, unico: true, enLista: true },
    {
      nombre: 'rol', etiqueta: 'Rol', tipo: 'opcion', opciones: ['admin', 'tecnico', 'cliente'], porDefecto: 'tecnico', enLista: true,
      ayuda: 'admin: todo · tecnico: taller y administración · cliente: tienda y portal',
    },
    { nombre: 'cedula', etiqueta: 'Cédula', tipo: 'cedula', unico: true },
    { nombre: 'telefono', etiqueta: 'Teléfono', tipo: 'telefono' },
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
    { nombre: 'correo_verificado', etiqueta: 'Correo confirmado', tipo: 'booleano', porDefecto: true, enLista: true },
    { nombre: 'dos_pasos', etiqueta: 'Verificación en dos pasos', tipo: 'booleano', porDefecto: false, enLista: true },
  ],
  // Evita que alguien elimine su propia cuenta y se quede sin acceso.
  antesDeEliminar: (id, req) => {
    if (id === req.usuarioId) {
      throw new AppError('No puedes eliminar tu propia cuenta mientras tienes la sesión iniciada', 409, 'SELF_DELETE');
    }
  },
};
