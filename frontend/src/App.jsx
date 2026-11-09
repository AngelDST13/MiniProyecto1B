// Mapa de rutas de la aplicación.
//   públicas        → inicio, tienda, carrito, acceso (login, registro, correo, contraseña)
//   cualquier sesión → checkout y portal del cliente (/mi-cuenta)
//   personal        → panel del taller y administración
//   solo admin      → /gestion (dashboard, pedidos, facturas, solicitudes, automatización)
//   documentos      → factura e informe técnico (con sesión), cotización del armador (pública)
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Loader } from './components/ui/Loader.jsx';
import { RutaProtegida } from './components/RutaProtegida.jsx';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { LayoutPublico } from './components/publico/LayoutPublico.jsx';
import { PERSONAL } from './utils/roles.js';
import { Inicio } from './pages/Inicio.jsx';
import { Login } from './pages/Login.jsx';
import { NotFound } from './pages/NotFound.jsx';

// Carga diferida: cada página se descarga solo cuando se visita (la app abre más rápido).
const perezoso = (cargar, nombre) => lazy(() => cargar().then((modulo) => ({ default: modulo[nombre] })));
const Registro = perezoso(() => import('./pages/Registro.jsx'), 'Registro');
const CompletarPerfil = perezoso(() => import('./pages/CuentaAcceso.jsx'), 'CompletarPerfil');
const OlvideContrasena = perezoso(() => import('./pages/CuentaAcceso.jsx'), 'OlvideContrasena');
const RestablecerContrasena = perezoso(() => import('./pages/CuentaAcceso.jsx'), 'RestablecerContrasena');
const VerificarCorreo = perezoso(() => import('./pages/CuentaAcceso.jsx'), 'VerificarCorreo');
const Tienda = perezoso(() => import('./pages/tienda/Tienda.jsx'), 'Tienda');
const Producto = perezoso(() => import('./pages/tienda/Producto.jsx'), 'Producto');
const Carrito = perezoso(() => import('./pages/tienda/Carrito.jsx'), 'Carrito');
const Checkout = perezoso(() => import('./pages/tienda/Checkout.jsx'), 'Checkout');
const MiCuenta = perezoso(() => import('./pages/cuenta/MiCuenta.jsx'), 'MiCuenta');
const MisEquipos = perezoso(() => import('./pages/cuenta/SeccionesCuenta.jsx'), 'MisEquipos');
const MisPedidos = perezoso(() => import('./pages/cuenta/SeccionesCuenta.jsx'), 'MisPedidos');
const ResumenCuenta = perezoso(() => import('./pages/cuenta/SeccionesCuenta.jsx'), 'ResumenCuenta');
const SeguridadCuenta = perezoso(() => import('./pages/cuenta/SeccionesCuenta.jsx'), 'SeguridadCuenta');
const Panel = perezoso(() => import('./pages/Panel.jsx'), 'Panel');
const Ordenes = perezoso(() => import('./pages/Ordenes.jsx'), 'Ordenes');
const Clientes = perezoso(() => import('./pages/Clientes.jsx'), 'Clientes');
const Componentes = perezoso(() => import('./pages/Componentes.jsx'), 'Componentes');
const Administracion = perezoso(() => import('./pages/Administracion.jsx'), 'Administracion');
const AdminEntidad = perezoso(() => import('./pages/AdminEntidad.jsx'), 'AdminEntidad');
const Dashboard = perezoso(() => import('./pages/gestion/Dashboard.jsx'), 'Dashboard');
const PedidosGestion = perezoso(() => import('./pages/gestion/PedidosGestion.jsx'), 'PedidosGestion');
const SolicitudesGestion = perezoso(() => import('./pages/gestion/SolicitudesGestion.jsx'), 'SolicitudesGestion');
const Automatizacion = perezoso(() => import('./pages/gestion/Automatizacion.jsx'), 'Automatizacion');
const FacturasGestion = perezoso(() => import('./pages/gestion/FacturasGestion.jsx'), 'FacturasGestion');
const MisFacturas = perezoso(() => import('./pages/cuenta/SeccionesCuenta.jsx'), 'MisFacturas');
const Armador = perezoso(() => import('./pages/tienda/Armador.jsx'), 'Armador');
const DocumentoFactura = perezoso(() => import('./pages/documentos/Documentos.jsx'), 'DocumentoFactura');
const DocumentoInformeOrden = perezoso(() => import('./pages/documentos/Documentos.jsx'), 'DocumentoInformeOrden');
const DocumentoCotizacion = perezoso(() => import('./pages/documentos/Documentos.jsx'), 'DocumentoCotizacion');

export const App = () => (
  <Suspense fallback={<div className="grid min-h-[60dvh] place-items-center"><Loader /></div>}>
  <Routes>
    {/* Públicas */}
    <Route index element={<Inicio />} />
    <Route path="/login" element={<Login />} />
    <Route path="/registro" element={<Registro />} />
    <Route path="/verificar-correo" element={<VerificarCorreo />} />
    <Route path="/olvide-contrasena" element={<OlvideContrasena />} />
    <Route path="/restablecer-contrasena" element={<RestablecerContrasena />} />
    <Route element={<RutaProtegida />}>
      <Route path="/completar-perfil" element={<CompletarPerfil />} />
      <Route path="/documentos/factura/:id" element={<DocumentoFactura />} />
      <Route path="/documentos/orden/:id" element={<DocumentoInformeOrden />} />
    </Route>
    <Route path="/documentos/cotizacion" element={<DocumentoCotizacion />} />

    {/* Tienda y portal del cliente */}
    <Route element={<LayoutPublico />}>
      <Route path="/tienda" element={<Tienda />} />
      <Route path="/tienda/producto/:slug" element={<Producto />} />
      <Route path="/tienda/arma-tu-pc" element={<Armador />} />
      <Route path="/carrito" element={<Carrito />} />
      <Route element={<RutaProtegida />}>
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/mi-cuenta" element={<MiCuenta />}>
          <Route index element={<ResumenCuenta />} />
          <Route path="pedidos" element={<MisPedidos />} />
          <Route path="equipos" element={<MisEquipos />} />
          <Route path="facturas" element={<MisFacturas />} />
          <Route path="seguridad" element={<SeguridadCuenta />} />
        </Route>
      </Route>
    </Route>

    {/* Panel interno: personal del taller */}
    <Route element={<RutaProtegida roles={PERSONAL} />}>
      <Route element={<AppLayout />}>
        <Route path="/panel" element={<Panel />} />
        <Route path="/ordenes" element={<Ordenes />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/repuestos" element={<Componentes />} />
        <Route path="/admin" element={<Administracion />} />
        <Route path="/admin/:clave" element={<AdminEntidad />} />
        <Route element={<RutaProtegida roles={['admin']} />}>
          <Route path="/gestion" element={<Dashboard />} />
          <Route path="/gestion/pedidos" element={<PedidosGestion />} />
          <Route path="/gestion/solicitudes" element={<SolicitudesGestion />} />
          <Route path="/gestion/automatizacion" element={<Automatizacion />} />
          <Route path="/gestion/facturas" element={<FacturasGestion />} />
        </Route>
      </Route>
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
  </Suspense>
);
