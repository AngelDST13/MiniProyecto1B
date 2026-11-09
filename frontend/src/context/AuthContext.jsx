// Estado global de la sesión: usuario actual, inicio de sesión (con o sin código de dos pasos),
// Google, registro y cierre de sesión.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './contextos.js';
import { authService } from '../services/authService.js';
import { EVENTO_SESION_VENCIDA, tokenStorage } from '../services/api.js';
import { VigilanteSesion } from '../components/auth/VigilanteSesion.jsx';

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  // Si hay token guardado, primero se verifica con /auth/me antes de mostrar la app.
  const [cargando, setCargando] = useState(() => Boolean(tokenStorage.get()));
  // Motivo del último cierre automático: 'vencida' (401) o 'inactividad' (15 min sin uso)
  const [motivoCierre, setMotivoCierre] = useState(null);
  const [inactividadMinutos, setInactividadMinutos] = useState(15);

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
      setMotivoCierre((motivo) => motivo ?? 'vencida');
    };
    window.addEventListener(EVENTO_SESION_VENCIDA, alVencer);
    return () => window.removeEventListener(EVENTO_SESION_VENCIDA, alVencer);
  }, []);

  // Guarda la sesión que devuelve el backend (contraseña, código o Google).
  const guardarSesion = useCallback((respuesta) => {
    tokenStorage.set(respuesta.token);
    setUsuario(respuesta.usuario);
    setMotivoCierre(null);
    if (respuesta.inactividadMinutos) setInactividadMinutos(respuesta.inactividadMinutos);
    return { usuario: respuesta.usuario };
  }, []);

  /** Devuelve { usuario } o, si la cuenta tiene verificación en dos pasos, { requiere2fa, desafio, correo }. */
  const login = useCallback(
    async (correo, password, recordar = false) => {
      const respuesta = await authService.login(correo, password, recordar);
      return respuesta.requiere2fa ? respuesta : guardarSesion(respuesta);
    },
    [guardarSesion],
  );

  const completarDosPasos = useCallback(
    async (desafio, codigo) => guardarSesion(await authService.dosPasos(desafio, codigo)),
    [guardarSesion],
  );

  const loginGoogle = useCallback(
    async (credential) => {
      const respuesta = await authService.google(credential);
      return respuesta.requiere2fa ? respuesta : guardarSesion(respuesta);
    },
    [guardarSesion],
  );

  // El registro ya no inicia sesión: primero hay que confirmar el correo.
  const register = useCallback((datos) => authService.register(datos), []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUsuario(null);
  }, []);

  const cerrarPorInactividad = useCallback(() => {
    tokenStorage.clear();
    setMotivoCierre('inactividad');
    setUsuario(null);
  }, []);

  const value = useMemo(
    () => ({ usuario, cargando, motivoCierre, sesionVencida: Boolean(motivoCierre), login, completarDosPasos, loginGoogle, register, logout, actualizarUsuario: setUsuario }),
    [usuario, cargando, motivoCierre, login, completarDosPasos, loginGoogle, register, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {usuario && <VigilanteSesion minutos={inactividadMinutos} onCerrar={cerrarPorInactividad} />}
    </AuthContext.Provider>
  );
};
