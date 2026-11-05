// Carrito de compras. Se guarda en el navegador (localStorage) para no perderlo al recargar;
// el precio y el stock reales los vuelve a verificar el backend al confirmar el pedido.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CarritoContext } from './contextos.js';

const CLAVE = 'bancada.carrito';
const MAX_POR_PRODUCTO = 20;

const leer = () => {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE) ?? '[]');
    return Array.isArray(guardado) ? guardado.filter((i) => i && Number.isInteger(i.producto_id) && i.cantidad > 0) : [];
  } catch {
    return [];
  }
};

export const CarritoProvider = ({ children }) => {
  const [items, setItems] = useState(leer);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(CLAVE, JSON.stringify(items)); } catch { /* sin almacenamiento */ }
  }, [items]);

  const tope = (producto) => Math.max(0, Math.min(MAX_POR_PRODUCTO, producto.stock ?? MAX_POR_PRODUCTO));

  const agregar = useCallback((producto, cantidad = 1) => {
    setItems((actuales) => {
      const existente = actuales.find((i) => i.producto_id === producto.id);
      if (existente) {
        return actuales.map((i) => (i.producto_id === producto.id ? { ...i, cantidad: Math.min(tope(producto), i.cantidad + cantidad), stock: producto.stock } : i));
      }
      return [
        ...actuales,
        {
          producto_id: producto.id,
          slug: producto.slug,
          nombre: producto.nombre,
          marca: producto.marca,
          precio: Number(producto.precio),
          stock: producto.stock,
          imagen_url: producto.imagen_url,
          categoria_icono: producto.categoria_icono,
          cantidad: Math.min(tope(producto), cantidad),
        },
      ];
    });
    setAbierto(true);
  }, []);

  const cambiarCantidad = useCallback((productoId, cantidad) => {
    setItems((actuales) =>
      actuales.map((i) => (i.producto_id === productoId ? { ...i, cantidad: Math.max(1, Math.min(tope(i), cantidad)) } : i)),
    );
  }, []);

  const quitar = useCallback((productoId) => setItems((actuales) => actuales.filter((i) => i.producto_id !== productoId)), []);
  const vaciar = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const unidades = items.reduce((suma, i) => suma + i.cantidad, 0);
    const subtotal = items.reduce((suma, i) => suma + i.precio * i.cantidad, 0);
    return { items, unidades, subtotal, agregar, cambiarCantidad, quitar, vaciar, abierto, abrir: () => setAbierto(true), cerrar: () => setAbierto(false) };
  }, [items, abierto, agregar, cambiarCantidad, quitar, vaciar]);

  return <CarritoContext.Provider value={value}>{children}</CarritoContext.Provider>;
};
