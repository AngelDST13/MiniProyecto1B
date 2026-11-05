// Entidad: Especialidades técnicas (microsoldadura, software, hardware...).
export default {
  clave: 'especialidades',
  tabla: 'especialidades',
  femenino: true,
  singular: 'Especialidad',
  plural: 'Especialidades',
  descripcion: 'Áreas de conocimiento de los técnicos.',
  grupo: 'Personal y sedes',
  icono: 'GraduationCap',
  etiqueta: (a) => `${a}.nombre`,
  orden: 't.nombre',
  campos: [
    { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, min: 2, max: 80, unico: true, enLista: true },
    { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'texto', max: 255, enLista: true, ancho: 'completo' },
  ],
};
