// Entidad: Métodos de pago aceptados.
export default {
  clave: 'metodos-pago',
  tabla: 'metodos_pago',
  singular: 'Método de pago',
  plural: 'Métodos de pago',
  descripcion: 'Formas de pago que acepta el taller.',
  grupo: 'Finanzas',
  icono: 'CreditCard',
  etiqueta: (a) => `${a}.nombre`,
  orden: 't.nombre',
  campos: [
    { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, min: 2, max: 60, unico: true, enLista: true },
    { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'texto', max: 255, enLista: true, ancho: 'completo' },
    { nombre: 'activo', etiqueta: 'Activo', tipo: 'booleano', porDefecto: true, enLista: true },
  ],
};
