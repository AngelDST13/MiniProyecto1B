// Acceso al carrito: { items, unidades, subtotal, agregar, cambiarCantidad, quitar, vaciar, abierto, abrir, cerrar }
import { useContext } from 'react';
import { CarritoContext } from '../context/contextos.js';

export const useCarrito = () => {
  const contexto = useContext(CarritoContext);
  if (!contexto) throw new Error('useCarrito debe usarse dentro de <CarritoProvider>');
  return contexto;
};
