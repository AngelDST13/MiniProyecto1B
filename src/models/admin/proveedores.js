// Entidad: Proveedores de repuestos e insumos.
export default {
  clave: 'proveedores',
  tabla: 'proveedores',
  singular: 'Proveedor',
  plural: 'Proveedores',
  descripcion: 'Empresas que abastecen repuestos e insumos.',
  grupo: 'Compras e inventario',
  icono: 'Truck',
  etiqueta: (a) => `${a}.razon_social`,
  orden: 't.razon_social',
  campos: [
    { nombre: 'razon_social', etiqueta: 'Razón social', tipo: 'texto', requerido: true, min: 3, max: 150, enLista: true, ancho: 'completo' },
    {
      nombre: 'ruc', etiqueta: 'Cédula jurídica', tipo: 'texto', requerido: true, unico: true, enLista: true, mono: true,
      patron: '^[2-5][0-9]{9}$', mensajePatron: 'La cédula jurídica tiene 10 dígitos sin guiones (ej. 3101234567)',
    },
    { nombre: 'contacto', etiqueta: 'Persona de contacto', tipo: 'texto', max: 100, enLista: true },
    { nombre: 'telefono', etiqueta: 'Teléfono', tipo: 'telefono', requerido: true, enLista: true },
    { nombre: 'email', etiqueta: 'Email', tipo: 'email', max: 120 },
    { nombre: 'direccion', etiqueta: 'Dirección', tipo: 'texto', max: 200, ancho: 'completo' },
  ],
};
