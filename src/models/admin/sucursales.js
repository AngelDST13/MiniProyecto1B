// Entidad: Sucursales del taller.
export default {
  clave: 'sucursales',
  tabla: 'sucursales',
  femenino: true,
  singular: 'Sucursal',
  plural: 'Sucursales',
  descripcion: 'Locales donde opera el taller.',
  grupo: 'Personal y sedes',
  icono: 'Building2',
  etiqueta: (a) => `${a}.nombre`,
  orden: 't.nombre',
  campos: [
    { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, min: 2, max: 100, unico: true, enLista: true },
    { nombre: 'ciudad', etiqueta: 'Ciudad', tipo: 'texto', requerido: true, max: 80, enLista: true },
    { nombre: 'direccion', etiqueta: 'Dirección', tipo: 'texto', requerido: true, max: 200, ancho: 'completo' },
    { nombre: 'telefono', etiqueta: 'Teléfono', tipo: 'telefono', requerido: true, enLista: true },
    { nombre: 'activa', etiqueta: 'Activa', tipo: 'booleano', porDefecto: true, enLista: true },
  ],
};
