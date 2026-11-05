// Constantes visuales de la tienda.
import { Cpu, HardDrive, Headphones, Keyboard, Laptop, Monitor, MonitorSmartphone, Package, Wifi } from 'lucide-react';

export const ICONOS_CATEGORIA = { Laptop, Monitor, Cpu, HardDrive, MonitorSmartphone, Keyboard, Headphones, Wifi, Package };

// Fondo de la ilustración de cada categoría (cuando el producto no tiene foto)
export const FONDO_CATEGORIA = {
  Laptop: 'from-[#1f2a44] to-st-recibido',
  Monitor: 'from-[#2a1f3d] to-[#8a5cc4]',
  Cpu: 'from-ink to-[#e8520f]',
  HardDrive: 'from-[#13322a] to-st-reparado',
  MonitorSmartphone: 'from-[#1c2b3a] to-[#2a8fb8]',
  Keyboard: 'from-[#3a2a12] to-st-diagnostico',
  Headphones: 'from-[#3a1830] to-[#c43d7a]',
  Wifi: 'from-[#132a33] to-[#1ba39c]',
  Package: 'from-ink-soft to-muted',
};

export const ORDENES_TIENDA = [
  { valor: 'relevancia', etiqueta: 'Más relevantes' },
  { valor: 'precio_asc', etiqueta: 'Precio: menor a mayor' },
  { valor: 'precio_desc', etiqueta: 'Precio: mayor a menor' },
  { valor: 'descuento', etiqueta: 'Mayor descuento' },
  { valor: 'nuevos', etiqueta: 'Más nuevos' },
  { valor: 'nombre', etiqueta: 'Nombre (A–Z)' },
];

export const ESTADO_PEDIDO_ESTILO = {
  Pendiente: 'bg-st-diagnostico-soft text-[#8a5d00]',
  Confirmado: 'bg-st-recibido-soft text-st-recibido',
  Preparando: 'bg-st-recibido-soft text-st-recibido',
  'Listo para retirar': 'bg-st-reparado-soft text-st-reparado',
  Enviado: 'bg-st-reparado-soft text-st-reparado',
  Entregado: 'bg-paper-deep text-ink-soft',
  Cancelado: 'bg-danger-soft text-danger',
};

export const descuento = (producto) =>
  producto.precio_anterior && Number(producto.precio_anterior) > Number(producto.precio)
    ? Math.round((1 - Number(producto.precio) / Number(producto.precio_anterior)) * 100)
    : 0;

export const codigoPedido = (id) => `PED-${String(id).padStart(5, '0')}`;
