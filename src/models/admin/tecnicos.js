// Entidad: Técnicos del taller (pertenecen a una especialidad y a una sucursal).
export default {
  clave: 'tecnicos',
  tabla: 'tecnicos',
  singular: 'Técnico',
  plural: 'Técnicos',
  descripcion: 'Personal que diagnostica y repara los equipos.',
  grupo: 'Personal y sedes',
  icono: 'HardHat',
  etiqueta: (a) => `${a}.nombres`,
  orden: 't.nombres',
  campos: [
    { nombre: 'nombres', etiqueta: 'Nombres completos', tipo: 'texto', requerido: true, min: 3, max: 100, enLista: true },
    { nombre: 'cedula', etiqueta: 'Cédula', tipo: 'cedula', requerido: true, unico: true, enLista: true },
    { nombre: 'telefono', etiqueta: 'Teléfono', tipo: 'telefono', requerido: true },
    { nombre: 'email', etiqueta: 'Email', tipo: 'email', requerido: true, max: 120, unico: true },
    { nombre: 'especialidad_id', etiqueta: 'Especialidad', tipo: 'ref', ref: 'especialidades', requerido: true, enLista: true },
    { nombre: 'sucursal_id', etiqueta: 'Sucursal', tipo: 'ref', ref: 'sucursales', enLista: true },
    { nombre: 'fecha_ingreso', etiqueta: 'Fecha de ingreso', tipo: 'fecha', requerido: true },
    { nombre: 'activo', etiqueta: 'Activo', tipo: 'booleano', porDefecto: true, enLista: true },
  ],
};
