// Tienda en línea: catálogo público y creación de pedidos (cliente autenticado).
import { ORDENES_VALIDOS, ProductoModel } from '../models/productoModel.js';
import { PedidoModel } from '../models/pedidoModel.js';
import { UsuarioModel } from '../models/usuarioModel.js';
import { configuracion } from '../services/configuracionService.js';
import { enviarCorreo } from '../services/correo/correoService.js';
import { correoPedidoRecibido } from '../services/correo/plantillas.js';
import { alertarStock } from '../jobs/automatizaciones.js';
import { AppError } from '../utils/AppError.js';
import { assertValido } from '../utils/assertValido.js';
import { limpiarTexto } from '../validators/helpers.js';

const METODOS_PAGO = ['SINPE Móvil', 'Transferencia', 'Pago en tienda', 'Contra entrega'];
const TIPOS_ENTREGA = ['Retiro en tienda', 'Envío a domicilio'];
const REGEX_TELEFONO = /^\+?[0-9\s-]{7,15}$/;

const enteroPositivo = (valor, maximo) => {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 && n <= maximo ? n : null;
};
const decimal = (valor) => {
  if (valor === undefined || valor === '') return undefined;
  const n = Number(valor);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

/** GET /api/tienda/productos?q=&categoria=&marca=1,2&precio_min=&precio_max=&stock=1&oferta=1&orden=&pagina= */
export const getProductos = async (req, res) => {
  const { q, categoria, marca, precio_min: precioMin, precio_max: precioMax, stock, oferta, orden, pagina, por_pagina: porPagina } = req.query;
  const resultado = await ProductoModel.buscar({
    q: limpiarTexto(q).slice(0, 80),
    categoria: limpiarTexto(categoria).slice(0, 80) || undefined,
    marcas: String(marca ?? '').split(',').map((m) => enteroPositivo(m, 1e9)).filter(Boolean).slice(0, 20),
    precioMin: decimal(precioMin),
    precioMax: decimal(precioMax),
    soloStock: stock === '1',
    enOferta: oferta === '1',
    orden: ORDENES_VALIDOS.includes(orden) ? orden : 'relevancia',
    pagina: enteroPositivo(pagina, 1000) ?? 1,
    porPagina: enteroPositivo(porPagina, 48) ?? 12,
  });
  res.status(200).json(resultado);
};

/** GET /api/tienda/productos/:slug — incluye productos relacionados */
export const getProducto = async (req, res) => {
  const producto = await ProductoModel.porSlug(String(req.params.slug));
  if (!producto) throw new AppError('Producto no encontrado', 404, 'NOT_FOUND');
  res.status(200).json({ data: producto, relacionados: await ProductoModel.relacionados(producto) });
};

/** GET /api/tienda/catalogo — categorías, marcas, rango de precios y condiciones de envío */
export const getCatalogo = async (req, res) => {
  const [categorias, marcas, precios, costoEnvio, envioGratisDesde] = await Promise.all([
    ProductoModel.categorias(),
    ProductoModel.marcas(),
    ProductoModel.rangoPrecios(),
    configuracion.obtener('tienda_costo_envio', '2500.00'),
    configuracion.obtener('tienda_envio_gratis_desde', '75000.00'),
  ]);
  res.status(200).json({
    categorias,
    marcas,
    precios,
    envio: { costo: Number(costoEnvio), gratisDesde: Number(envioGratisDesde) },
    metodosPago: METODOS_PAGO,
    tiposEntrega: TIPOS_ENTREGA,
  });
};

// Valida el checkout. Junta líneas repetidas del mismo producto.
const validarPedido = (body = {}) => {
  const errores = {};
  const porProducto = new Map();
  for (const item of Array.isArray(body.items) ? body.items : []) {
    const id = enteroPositivo(item?.producto_id, 1e9);
    const cantidad = enteroPositivo(item?.cantidad, 20);
    if (!id || !cantidad) {
      errores.items = 'Cada producto debe tener una cantidad entre 1 y 20';
      continue;
    }
    porProducto.set(id, Math.min(20, (porProducto.get(id) ?? 0) + cantidad));
  }
  if (!porProducto.size) errores.items = errores.items ?? 'El carrito está vacío';
  if (porProducto.size > 30) errores.items = 'Máximo 30 productos distintos por pedido';

  const datos = {
    items: [...porProducto].map(([producto_id, cantidad]) => ({ producto_id, cantidad })),
    metodo_pago: limpiarTexto(body.metodo_pago),
    tipo_entrega: limpiarTexto(body.tipo_entrega),
    direccion: limpiarTexto(body.direccion).slice(0, 255) || null,
    ciudad: limpiarTexto(body.ciudad).slice(0, 80) || null,
    telefono: limpiarTexto(body.telefono),
    notas: limpiarTexto(body.notas).slice(0, 500) || null,
  };
  if (!METODOS_PAGO.includes(datos.metodo_pago)) errores.metodo_pago = 'Elige un método de pago';
  if (!TIPOS_ENTREGA.includes(datos.tipo_entrega)) errores.tipo_entrega = 'Elige cómo quieres recibir tu pedido';
  if (datos.tipo_entrega === 'Envío a domicilio') {
    if (!datos.direccion || datos.direccion.length < 8) errores.direccion = 'Escribe la dirección de entrega completa';
    if (!datos.ciudad) errores.ciudad = 'Indica la ciudad';
  }
  if (datos.metodo_pago === 'Contra entrega' && datos.tipo_entrega !== 'Envío a domicilio') {
    errores.metodo_pago = 'El pago contra entrega solo aplica para envíos a domicilio';
  }
  if (!REGEX_TELEFONO.test(datos.telefono)) errores.telefono = 'Escribe un teléfono de contacto válido';
  return { datos, errores };
};

/** POST /api/tienda/pedidos (requiere sesión) */
export const crearPedido = async (req, res) => {
  const usuario = await UsuarioModel.findById(req.usuarioId);
  if (!usuario.correo_verificado) throw new AppError('Confirma tu correo antes de comprar', 403, 'CORREO_NO_VERIFICADO');

  const { datos, errores } = validarPedido(req.body);
  assertValido(errores, 'Revisa los datos del pedido');

  const pedido = await PedidoModel.crear(usuario.id, datos, {
    costoEnvio: Number(await configuracion.obtener('tienda_costo_envio', '2500.00')),
    envioGratisDesde: Number(await configuracion.obtener('tienda_envio_gratis_desde', '75000.00')),
  });
  const empresa = await configuracion.empresa();
  enviarCorreo({ para: usuario.correo, tipo: 'pedido_recibido', ...correoPedidoRecibido({ nombre: usuario.nombre, pedido, empresa }) });
  alertarStock(datos.items.map((i) => i.producto_id));

  res.status(201).json({ message: `Pedido ${pedido.codigo} recibido`, data: pedido });
};

// Orden de los pasos del armador de PC
const PASOS_ARMADOR = ['cpu', 'motherboard', 'ram', 'gpu', 'almacenamiento', 'fuente', 'gabinete', 'enfriamiento'];

/** GET /api/tienda/armador — componentes activos agrupados por tipo, con sus datos de compatibilidad */
export const getArmador = async (req, res) => {
  const componentes = await ProductoModel.componentesPc();
  const porTipo = Object.fromEntries(PASOS_ARMADOR.map((tipo) => [tipo, componentes.filter((c) => c.pc_tipo === tipo)]));
  res.status(200).json({ pasos: PASOS_ARMADOR, data: porTipo });
};

/** GET /api/tienda/empresa — datos públicos del negocio (pie de página, datos de pago, documentos) */
export const getEmpresa = async (req, res) => {
  res.status(200).json({ data: await configuracion.empresa() });
};
