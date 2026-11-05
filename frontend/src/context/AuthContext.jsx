// Estado global de la sesión: usuario actual, token, login, registro y logout.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './contextos.js';
import { authService } from '../services/authService.js';
import { EVENTO_SESION_VENCIDA, tokenStorage } from '../services/api.js';


export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  // Si hay token guardado, primero se verifica con /auth/me antes de mostrar la app.
  const [cargando, setCargando] = useState(() => Boolean(tokenStorage.get()));
  const [sesionVencida, setSesionVencida] = useState(false);

  useEffect(() => {
    if (!tokenStorage.get()) return undefined;
    let activo = true;

    authService
      .me()
      .then((respuesta) => activo && setUsuario(respuesta.data))
      .catch(() => tokenStorage.clear())
      .finally(() => activo && setCargando(false));

    return () => { activo = false; };
  }, []);

  // El cliente HTTP avisa cuando la API responde 401 (token vencido o inválido).
  useEffect(() => {
    const alVencer = () => {
      setUsuario(null);
      setSesionVencida(true);
    };
    window.addEventListener(EVENTO_SESION_VENCIDA, alVencer);
    return () => window.removeEventListener(EVENTO_SESION_VENCIDA, alVencer);
  }, []);

  const login = useCallback(async (correo, password) => {
    const { token, usuario: datosUsuario } = await authService.login(correo, password);
    tokenStorage.set(token);
    setUsuario(datosUsuario);
    setSesionVencida(false);
    return datosUsuario;
  }, []);

  // Registra la cuenta y entra directamente.
  const register = useCallback(
    async (datos) => {
      await authService.register(datos);
      return login(datos.correo, datos.password);
    },
    [login],
  );

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUsuario(null);
  }, []);

  const value = useMemo(
    () => ({ usuario, cargando, sesionVencida, login, register, logout }),
    [usuario, cargando, sesionVencida, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
