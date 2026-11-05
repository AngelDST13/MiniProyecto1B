// Valores del negocio compartidos por toda la interfaz.
// Deben coincidir con los ENUM de la base de datos y los validadores del backend.
import { Cpu, HardDrive, Laptop, MemoryStick, Microchip, Monitor, Plug } from 'lucide-react';

export const ESTADOS = ['Recibido', 'En Diagnóstico', 'Reparado', 'Entregado'];

// Clases de Tailwind por estado (strings completos para que Tailwind las detecte).
export const ESTADO_ESTILO = {
  Recibido: {
    dot: 'bg-st-recibido',
    text: 'text-st-recibido',
    soft: 'bg-st-recibido-soft',
    border: 'border-st-recibido',
    descripcion: 'Equipo ingresado, en espera de revisión',
  },
  'En Diagnóstico': {
    dot: 'bg-st-diagnostico',
    text: 'text-[#8a5d00]',
    soft: 'bg-st-diagnostico-soft',
    border: 'border-st-diagnostico',
    descripcion: 'Un técnico está evaluando la falla',
  },
  Reparado: {
    dot: 'bg-st-reparado',
    text: 'text-st-reparado',
    soft: 'bg-st-reparado-soft',
    border: 'border-st-reparado',
    descripcion: 'Listo para que el cliente lo retire',
  },
  Entregado: {
    dot: 'bg-st-entregado',
    text: 'text-st-entregado',
    soft: 'bg-st-entregado-soft',
    border: 'border-st-entregado',
    descripcion: 'Proceso cerrado',
  },
};

export const siguienteEstado = (estado) => ESTADOS[ESTADOS.indexOf(estado) + 1] ?? null;

export const TIPOS_EQUIPO = ['Laptop', 'Desktop', 'GPU'];

export const TIPO_EQUIPO_ICONO = {
  Laptop,
  Desktop: Monitor,
  GPU: Cpu,
};

export const CATEGORIAS = ['RAM', 'SSD', 'GPU', 'Pantalla', 'Fuente'];

export const CATEGORIA_ICONO = {
  RAM: MemoryStick,
  SSD: HardDrive,
  GPU: Microchip,
  Pantalla: Monitor,
  Fuente: Plug,
};

// A partir de cuántas unidades se considera "stock bajo".
export const STOCK_BAJO = 3;
