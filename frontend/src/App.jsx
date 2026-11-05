// Mapa de rutas de la aplicación.
import { Route, Routes } from 'react-router-dom';
import { RutaProtegida } from './components/RutaProtegida.jsx';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { Login } from './pages/Login.jsx';
import { Registro } from './pages/Registro.jsx';
import { Panel } from './pages/Panel.jsx';
import { Ordenes } from './pages/Ordenes.jsx';
import { Clientes } from './pages/Clientes.jsx';
import { Componentes } from './pages/Componentes.jsx';
import { NotFound } from './pages/NotFound.jsx';
import { Administracion } from './pages/Administracion.jsx';
import { AdminEntidad } from './pages/AdminEntidad.jsx';

export const App = () => (
  <Routes>
    {/* Públicas */}
    <Route path="/login" element={<Login />} />
    <Route path="/registro" element={<Registro />} />

    {/* Protegidas: sin token redirigen a /login */}
    <Route element={<RutaProtegida />}>
      <Route element={<AppLayout />}>
        <Route index element={<Panel />} />
        <Route path="ordenes" element={<Ordenes />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="repuestos" element={<Componentes />} />
        <Route path="admin" element={<Administracion />} />
        <Route path="admin/:clave" element={<AdminEntidad />} />
      </Route>
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
);
