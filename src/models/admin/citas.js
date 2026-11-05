// Entidad: Citas agendadas con clientes (recepción o retiro de equipos).
export default {
  clave: 'citas',
  tabla: 'citas',
  femenino: true,
  singular: 'Cita',
  plural: 'Citas',
  descripcion: 'Agenda de recepción y entrega de equipos.',
  grupo: 'Atención y servicio',
  icono: 'CalendarClock',
  etiqueta: (a) => `CONCAT('Cita #', ${a}.id)`,
  orden: 't.fecha_hora DESC',
  campos: [
    { nombre: 'cliente_id', etiqueta: 'Cliente', tipo: 'ref', ref: 'clientes', requerido: true, enLista: true, ancho: 'completo' },
    { nombre: 'fecha_hora', etiqueta: 'Fecha y hora', tipo: 'fechaHora', requerido: true, enLista: true },
    { nombre: 'sucursal_id', etiqueta: 'Sucursal', tipo: 'ref', ref: 'sucursales', enLista: true },
    { nombre: 'motivo', etiqueta: 'Motivo', tipo: 'texto', requerido: true, min: 3, max: 200, enLista: true, ancho: 'completo' },
    { nombre: 'estado', etiqueta: 'Estado', tipo: 'opcion', opciones: ['Programada', 'Atendida', 'Cancelada'], porDefecto: 'Programada', enLista: true },
  ],
};
