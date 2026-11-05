// Validación de entrada para ComponenteRepuesto.
import { aNumero, estaVacio, limpiarTexto, validarOpcion, validarTextoObligatorio } from './helpers.js';

export const CATEGORIAS = ['RAM', 'SSD', 'GPU', 'Pantalla', 'Fuente'];

const PRECIO_MAXIMO = 99_999_999.99;
const STOCK_MAXIMO = 1_000_000;

export const validarComponente = (body = {}) => {
  const datos = {
    nombre: limpiarTexto(body.nombre),
    categoria: limpiarTexto(body.categoria),
    precio_unitario: aNumero(body.precio_unitario),
    stock: aNumero(body.stock),
  };

  const errores = {};

  validarTextoObligatorio(errores, 'nombre', datos.nombre, { min: 2, max: 120 });
  validarOpcion(errores, 'categoria', datos.categoria, CATEGORIAS);

  if (estaVacio(body.precio_unitario)) {
    errores.precio_unitario = 'El campo "precio_unitario" es obligatorio';
  } else if (!Number.isFinite(datos.precio_unitario) || datos.precio_unitario < 0 || datos.precio_unitario > PRECIO_MAXIMO) {
    errores.precio_unitario = 'El precio debe ser un número mayor o igual a 0';
  } else {
    datos.precio_unitario = Math.round(datos.precio_unitario * 100) / 100; // 2 decimales
  }

  if (estaVacio(body.stock)) {
    errores.stock = 'El campo "stock" es obligatorio';
  } else if (!Number.isInteger(datos.stock) || datos.stock < 0 || datos.stock > STOCK_MAXIMO) {
    errores.stock = 'El stock debe ser un número entero mayor o igual a 0';
  }

  return { datos, errores };
};
