// Entidad: Garantías otorgadas sobre una orden de servicio.
export default {
  clave: 'garantias',
  tabla: 'garantias',
  femenino: true,
  singular: 'Garantía',
  plural: 'Garantías',
  descripcion: 'Cobertura posterior a la reparación.',
  grupo: 'Atención y servicio',
  icono: 'ShieldCheck',
  etiqueta: (a) => `CONCAT('GAR-', LPAD(${a}.id, 4, '0'))`,
  orden: 't.fecha_fin DESC',
  campos: [
    { nombre: 'orden_id', etiqueta: 'Orden de servicio', tipo: 'ref', ref: 'ordenes', requerido: true, enLista: true, ancho: 'completo' },
    { nombre: 'fecha_inicio', etiqueta: 'Fecha de inicio', tipo: 'fecha', requerido: true, enLista: true },
    { nombre: 'fecha_fin', etiqueta: 'Fecha de fin', tipo: 'fecha', requerido: true, enLista: true },
    { nombre: 'cobertura', etiqueta: 'Cobertura', tipo: 'texto', requerido: true, min: 3, max: 255, enLista: true, ancho: 'completo' },
    { nombre: 'estado', etiqueta: 'Estado', tipo: 'opcion', opciones: ['Vigente', 'Vencida', 'Anulada'], porDefecto: 'Vigente', enLista: true },
  ],
  // Regla entre campos: la garantía no puede terminar antes de empezar.
  validar: (datos, errores) => {
    if (datos.fecha_inicio && datos.fecha_fin && datos.fecha_fin < datos.fecha_inicio) {
      errores.fecha_fin = 'La fecha de fin no puede ser anterior a la fecha de inicio';
    }
  },
};
