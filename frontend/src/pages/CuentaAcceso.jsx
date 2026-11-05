// Pantallas de acceso que llegan desde un correo: confirmar correo, olvidé mi contraseña,
// restablecer contraseña y completar el perfil (cuentas de Google sin cédula).
import { useCallback, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { CircleCheck, TriangleAlert } from 'lucide-react';
import { authService } from '../services/authService.js';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { useFormState } from '../hooks/useFormState.js';
import { useCargaAsync } from '../hooks/useCargaAsync.js';
import { cedulaValida } from '../utils/cedula.js';
import { rutaInicio } from '../utils/roles.js';
import { AuthShell } from '../components/layout/AuthShell.jsx';
import { FormError, TextInput } from '../components/ui/Field.jsx';
import { PasswordInput } from '../components/ui/PasswordInput.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Loader } from '../components/ui/Loader.jsx';
import { MedidorPassword } from '../components/auth/MedidorPassword.jsx';
import { AvisoCorreoSimulado } from '../components/auth/AvisoCorreoSimulado.jsx';

const Resultado = ({ ok, mensaje, accion }) => (
  <div className="animate-rise text-center">
    <span className={`mx-auto grid size-16 place-items-center rounded-2xl ${ok ? 'bg-st-reparado-soft text-st-reparado' : 'bg-danger-soft text-danger'}`}>
      {ok ? <CircleCheck className="size-7" aria-hidden /> : <TriangleAlert className="size-7" aria-hidden />}
    </span>
    <p className="mt-5 text-[15px] text-ink-soft">{mensaje}</p>
    <div className="mt-6">{accion}</div>
  </div>
);

const BotonIr = ({ a, children }) => (
  <Link to={a} className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-ink text-[15px] font-semibold text-paper transition hover:bg-ink-soft">{children}</Link>
);

/** /verificar-correo?token=… */
export const VerificarCorreo = () => {
  const [parametros] = useSearchParams();
  const token = parametros.get('token') ?? '';
  const verificar = useCallback(() => authService.verificarCorreo(token), [token]);
  const { datos, error, cargando } = useCargaAsync(verificar);

  return (
    <AuthShell titulo="Confirmación de correo" subtitulo="Estamos activando tu cuenta.">
      {cargando && <Loader texto="Confirmando…" />}
      {datos && <Resultado ok mensaje={datos.message} accion={<BotonIr a="/login">Iniciar sesión</BotonIr>} />}
      {error && <Resultado mensaje={error} accion={<BotonIr a="/login">Ir al inicio de sesión</BotonIr>} />}
    </AuthShell>
  );
};

/** /olvide-contrasena */
export const OlvideContrasena = () => {
  const [enviado, setEnviado] = useState(null);
  const { valores, errores, enviando, cambiar, enviar } = useFormState({ correo: '' });
  const alEnviar = enviar(async ({ correo }) => setEnviado(await authService.olvideContrasena(correo)));

  return (
    <AuthShell titulo="Recupera tu acceso" subtitulo="Te enviaremos un enlace para crear una contraseña nueva.">
      {enviado ? (
        <>
          <Resultado ok mensaje={enviado.message} accion={<BotonIr a="/login">Volver a iniciar sesión</BotonIr>} />
          <AvisoCorreoSimulado visible={enviado.correoSimulado} />
        </>
      ) : (
        <form onSubmit={alEnviar} className="space-y-4" noValidate>
          <TextInput id="correo" name="correo" type="email" label="Correo de tu cuenta" autoComplete="email"
            value={valores.correo} onChange={cambiar} error={errores.correo} required />
          <FormError mensaje={errores._form} />
          <Button type="submit" variante="senal" tamano="lg" cargando={enviando} className="w-full">Enviar enlace</Button>
          <p className="text-center text-sm"><Link to="/login" className="font-semibold text-signal-deep hover:underline">Volver</Link></p>
        </form>
      )}
    </AuthShell>
  );
};

/** /restablecer-contrasena?token=… */
export const RestablecerContrasena = () => {
  const [parametros] = useSearchParams();
  const [listo, setListo] = useState(null);
  const { valores, errores, enviando, cambiar, enviar } = useFormState({ password: '', confirmar: '' });

  const alEnviar = enviar(async ({ password, confirmar }) => {
    if (password !== confirmar) throw Object.assign(new Error('Las contraseñas no coinciden'), { details: { confirmar: 'Las contraseñas no coinciden' } });
    setListo(await authService.restablecerContrasena(parametros.get('token') ?? '', password));
  });

  return (
    <AuthShell titulo="Nueva contraseña" subtitulo="Elige una contraseña segura que no uses en otros sitios.">
      {listo ? (
        <Resultado ok mensaje={listo.message} accion={<BotonIr a="/login">Iniciar sesión</BotonIr>} />
      ) : (
        <form onSubmit={alEnviar} className="space-y-4" noValidate>
          <PasswordInput id="password" name="password" label="Contraseña nueva" autoComplete="new-password"
            value={valores.password} onChange={cambiar} error={errores.password} required />
          <MedidorPassword password={valores.password} />
          <PasswordInput id="confirmar" name="confirmar" label="Repítela" autoComplete="new-password"
            value={valores.confirmar} onChange={cambiar} error={errores.confirmar} required />
          {!errores.password && !errores.confirmar && <FormError mensaje={errores._form} />}
          {errores._codigo === 'TOKEN_INVALIDO' && <Link to="/olvide-contrasena" className="block text-sm font-semibold text-signal-deep hover:underline">Pedir un enlace nuevo</Link>}
          <Button type="submit" variante="senal" tamano="lg" cargando={enviando} className="w-full">Guardar contraseña</Button>
        </form>
      )}
    </AuthShell>
  );
};

/** /completar-perfil — cuentas creadas con Google: falta la cédula y el teléfono */
export const CompletarPerfil = () => {
  const { usuario, actualizarUsuario } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { valores, errores, enviando, cambiar, enviar } = useFormState({ nombre: usuario?.nombre ?? '', cedula: '', telefono: usuario?.telefono ?? '' });

  if (!usuario) return <Navigate to="/login" replace />;
  if (usuario.perfil_completo) return <Navigate to={rutaInicio(usuario)} replace />;

  const alEnviar = enviar(async (datos) => {
    const { data } = await authService.actualizarPerfil(datos);
    actualizarUsuario(data);
    toast.exito('¡Listo! Tu cuenta está completa.');
    navigate(location.state?.desde ?? rutaInicio(data), { replace: true });
  });

  return (
    <AuthShell titulo="Completa tu perfil" subtitulo="Necesitamos tu cédula para vincular tus compras y equipos.">
      <form onSubmit={alEnviar} className="space-y-4" noValidate>
        <TextInput id="nombre" name="nombre" label="Nombre completo" value={valores.nombre} onChange={cambiar} error={errores.nombre} required />
        <TextInput id="cedula" name="cedula" label="Cédula" inputMode="numeric" maxLength={10} value={valores.cedula} onChange={cambiar} required
          error={errores.cedula ?? (valores.cedula.length === 10 && !cedulaValida(valores.cedula) ? 'Esta cédula no es válida' : undefined)} />
        <TextInput id="telefono" name="telefono" type="tel" label="Teléfono" value={valores.telefono} onChange={cambiar} error={errores.telefono} required />
        {!errores.cedula && !errores.telefono && !errores.nombre && <FormError mensaje={errores._form} />}
        <Button type="submit" variante="senal" tamano="lg" cargando={enviando} className="w-full">Guardar y continuar</Button>
      </form>
    </AuthShell>
  );
};
