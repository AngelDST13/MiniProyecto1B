// Envuelve las rutas privadas:
//  - sin sesión → /login (recordando a dónde iba)
//  - con un rol que no corresponde → a su página de inicio
//  - cliente sin cédula (cuenta de Google) → /completar-perfil
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { rutaInicio } from '../utils/roles.js';
import { Loader } from './ui/Loader.jsx';

export const RutaProtegida = ({ roles }) => {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Loader texto="Verificando sesión…" />
      </div>
    );
  }

  if (!usuario) return <Navigate to="/login" replace state={{ desde: location.pathname + location.search }} />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to={rutaInicio(usuario)} replace />;
  if (!usuario.perfil_completo && location.pathname !== '/completar-perfil') {
    return <Navigate to="/completar-perfil" replace state={{ desde: location.pathname }} />;
  }

  return <Outlet />;
};
