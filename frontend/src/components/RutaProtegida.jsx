// Envuelve las rutas privadas: sin sesión, redirige a /login (recordando a dónde iba).
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Loader } from './ui/Loader.jsx';

export const RutaProtegida = () => {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Loader texto="Verificando sesión…" />
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  }

  return <Outlet />;
};
