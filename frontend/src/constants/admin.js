// Constantes visuales del módulo de Administración.
import {
  Building2, CalendarClock, ClipboardList, Cpu, CreditCard, FileText, GraduationCap, Hammer, HardHat,
  NotebookPen, Receipt, ShieldCheck, ShoppingCart, Tag, Tags, Truck, UserCog, Users, Wallet, Wrench,
} from 'lucide-react';

// El backend envía el nombre del icono; aquí se traduce al componente.
export const ICONOS = {
  Building2, CalendarClock, ClipboardList, Cpu, CreditCard, FileText, GraduationCap, Hammer, HardHat,
  NotebookPen, Receipt, ShieldCheck, ShoppingCart, Tag, Tags, Truck, UserCog, Users, Wallet, Wrench,
};

export const ORDEN_GRUPOS = [
  'Atención y servicio',
  'Compras e inventario',
  'Personal y sedes',
  'Finanzas',
  'Catálogos',
  'Sistema',
];

// Color de las opciones de estado según su significado.
const TONOS = {
  positivo: 'bg-st-reparado-soft text-st-reparado',
  pendiente: 'bg-st-diagnostico-soft text-[#8a5d00]',
  negativo: 'bg-danger-soft text-danger',
  neutro: 'bg-paper-deep text-ink-soft',
};

const TONO_POR_VALOR = {
  Vigente: 'positivo', Aprobada: 'positivo', Atendida: 'positivo', Recibida: 'positivo', Operativa: 'positivo',
  Pendiente: 'pendiente', Programada: 'pendiente', 'En mantenimiento': 'pendiente',
  Anulada: 'negativo', Rechazada: 'negativo', Cancelada: 'negativo', Dañada: 'negativo', Vencida: 'neutro',
};

export const tonoDeOpcion = (valor) => TONOS[TONO_POR_VALOR[valor] ?? 'neutro'];

// Ruta del frontend para un módulo (los personalizados tienen página propia).
export const rutaModulo = (modulo) => modulo.rutaFrontend ?? `/admin/${modulo.clave}`;
