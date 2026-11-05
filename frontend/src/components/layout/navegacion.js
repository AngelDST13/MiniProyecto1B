// Secciones del panel interno por rol. La barra lateral las agrupa; la barra inferior del celular
// muestra solo las marcadas como "movil" (máximo 5).
import {
  ClipboardList, Cpu, FileCheck, Gauge, LayoutDashboard, Settings2, ShoppingCart, Store, Users, Zap,
} from 'lucide-react';

const TODOS = ['admin', 'tecnico'];

export const GRUPOS_NAVEGACION = [
  {
    titulo: 'Taller',
    items: [
      { to: '/gestion', etiqueta: 'Dashboard', icono: Gauge, end: true, roles: ['admin'], movil: true },
      { to: '/panel', etiqueta: 'Panel', etiquetaLarga: 'Panel del día', icono: LayoutDashboard, end: true, roles: TODOS, movilRoles: ['tecnico'] },
      { to: '/ordenes', etiqueta: 'Órdenes', icono: ClipboardList, roles: TODOS, movil: true },
      { to: '/clientes', etiqueta: 'Clientes', icono: Users, roles: TODOS, movil: true },
      { to: '/repuestos', etiqueta: 'Repuestos', icono: Cpu, roles: TODOS, movilRoles: ['tecnico'] },
      { to: '/admin', etiqueta: 'Admin', etiquetaLarga: 'Administración', icono: Settings2, roles: TODOS, movil: true },
    ],
  },
  {
    titulo: 'Tienda y clientes',
    items: [
      { to: '/gestion/pedidos', etiqueta: 'Pedidos', icono: ShoppingCart, roles: ['admin'], movil: true },
      { to: '/gestion/solicitudes', etiqueta: 'Informes', etiquetaLarga: 'Solicitudes de informe', icono: FileCheck, roles: ['admin'] },
      { to: '/gestion/automatizacion', etiqueta: 'Automatización', icono: Zap, roles: ['admin'] },
      { to: '/tienda', etiqueta: 'Tienda', etiquetaLarga: 'Ver la tienda', icono: Store, roles: TODOS },
    ],
  },
];

export const seccionesPara = (rol) =>
  GRUPOS_NAVEGACION.map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(rol)) })).filter((g) => g.items.length);

export const seccionesMovil = (rol) =>
  GRUPOS_NAVEGACION.flatMap((g) => g.items).filter((i) => i.roles.includes(rol) && (i.movil || i.movilRoles?.includes(rol))).slice(0, 5);
