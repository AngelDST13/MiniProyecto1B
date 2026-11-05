// Secciones principales de la app (usadas por la barra lateral y la navegación móvil).
import { ClipboardList, Cpu, LayoutDashboard, Users } from 'lucide-react';

export const SECCIONES = [
  { to: '/', etiqueta: 'Panel', icono: LayoutDashboard, end: true },
  { to: '/ordenes', etiqueta: 'Órdenes', icono: ClipboardList },
  { to: '/clientes', etiqueta: 'Clientes', icono: Users },
  { to: '/repuestos', etiqueta: 'Repuestos', icono: Cpu },
];
