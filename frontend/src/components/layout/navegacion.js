// Secciones principales de la app (usadas por la barra lateral y la navegación móvil).
import { ClipboardList, Cpu, LayoutDashboard, Settings2, Users } from 'lucide-react';

export const SECCIONES = [
  { to: '/panel', etiqueta: 'Panel', icono: LayoutDashboard, end: true },
  { to: '/ordenes', etiqueta: 'Órdenes', icono: ClipboardList },
  { to: '/clientes', etiqueta: 'Clientes', icono: Users },
  { to: '/repuestos', etiqueta: 'Repuestos', icono: Cpu },
  { to: '/admin', etiqueta: 'Admin', etiquetaLarga: 'Administración', icono: Settings2 },
];
