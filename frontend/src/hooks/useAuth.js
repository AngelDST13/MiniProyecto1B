// Acceso a la sesión: { usuario, cargando, sesionVencida, login, register, logout }
import { useContext } from 'react';
import { AuthContext } from '../context/contextos.js';

export const useAuth = () => {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return contexto;
};
