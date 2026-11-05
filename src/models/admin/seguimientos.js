// Entidad: Bitácora de seguimiento de cada orden (notas del técnico).
export default {
  clave: 'seguimientos',
  tabla: 'seguimientos',
  singular: 'Seguimiento',
  plural: 'Seguimientos',
  descripcion: 'Bitácora de avances escrita por los técnicos.',
  grupo: 'Atención y servicio',
  icono: 'NotebookPen',
  etiqueta: (a) => `CONCAT('Nota #', ${a}.id)`,
  orden: 't.fecha DESC',
  campos: [
    { nombre: 'orden_id', etiqueta: 'Orden de servicio', tipo: 'ref', ref: 'ordenes', requerido: true, enLista: true },
    { nombre: 'tecnico_id', etiqueta: 'Técnico', tipo: 'ref', ref: 'tecnicos', requerido: true, enLista: true },
    { nombre: 'fecha', etiqueta: 'Fecha', tipo: 'fechaHora', requerido: true, enLista: true },
    { nombre: 'nota', etiqueta: 'Nota', tipo: 'textoLargo', requerido: true, min: 3, max: 2000, enLista: true, ancho: 'completo' },
  ],
};
