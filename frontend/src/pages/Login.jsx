// Inicio de sesión en dos etapas: credenciales y, si la cuenta lo tiene activo, código de verificación.
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MailCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { useFormState } from '../hooks/useFormState.js';
import { authService } from '../services/authService.js';
import { rutaInicio } from '../utils/roles.js';
import { AuthShell } from '../components/layout/AuthShell.jsx';
import { FormError, TextInput } from '../components/ui/Field.jsx';
import { PasswordInput } from '../components/ui/PasswordInput.jsx';
import { Button } from '../components/ui/Button.jsx';
import { CodigoInput } from '../components/auth/CodigoInput.jsx';
import { BotonGoogle } from '../components/auth/BotonGoogle.jsx';
import { AvisoCorreoSimulado } from '../components/auth/AvisoCorreoSimulado.jsx';

const CUENTA_DEMO = { correo: 'demo@bancada.com', password: 'Demo12345' };

// Acciones extra según el tipo de error (correo sin confirmar, cuenta bloqueada)
const AccionError = ({ codigo, correo }) => {
  const toast = useToast();
  const [enviando, setEnviando] = useState(false);
  if (codigo === 'CORREO_NO_VERIFICADO') {
    const reenviar = async () => {
      setEnviando(true);
      try {
        toast.info((await authService.reenviarVerificacion(correo)).message);
      } catch (e) {
        toast.error(e.message);
      } finally {
        setEnviando(false);
      }
    };
    return <Button variante="borde" tamano="sm" icono={MailCheck} cargando={enviando} onClick={reenviar} className="mt-2">Reenviar enlace de confirmación</Button>;
  }
  if (codigo === 'CUENTA_BLOQUEADA') {
    return <Link to="/olvide-contrasena" className="mt-2 inline-block text-sm font-semibold text-signal-deep hover:underline">Restablecer mi contraseña</Link>;
  }
  return null;
};

const PasoCodigo = ({ desafio, onVolver, onListo }) => {
  const { completarDosPasos } = useAuth();
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const verificar = async (valor = codigo) => {
    if (valor.length !== 6 || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      onListo((await completarDosPasos(desafio.desafio, valor)).usuario);
    } catch (e) {
      setError(e.message);
      setCodigo('');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="animate-rise">
      <p className="mb-5 text-[15px] text-ink-soft">
        Enviamos un código de 6 dígitos a <strong className="font-mono">{desafio.correo ?? 'tu correo'}</strong>. Vence en 10 minutos.
      </p>
      <CodigoInput valor={codigo} onChange={setCodigo} onCompleto={verificar} deshabilitado={enviando} error={Boolean(error)} />
      {error && <div className="mt-4"><FormError mensaje={error} /></div>}
      <AvisoCorreoSimulado visible={desafio.correoSimulado} />
      <Button variante="senal" tamano="lg" className="mt-5 w-full" cargando={enviando} disabled={codigo.length !== 6} onClick={() => verificar()}>
        Verificar y entrar
      </Button>
      <button type="button" onClick={onVolver} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Usar otra cuenta
      </button>
    </div>
  );
};

export const Login = () => {
  const { usuario, login, loginGoogle, motivoCierre } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [desafio, setDesafio] = useState(null);
  const { valores, errores, enviando, cambiar, enviar, setValores } = useFormState({ correo: '', password: '', recordar: false });

  const entrar = (datos) => {
    toast.exito(`¡Hola, ${datos.nombre.split(' ')[0]}!`);
    navigate(location.state?.desde ?? rutaInicio(datos), { replace: true });
  };

  if (usuario && !desafio) return <Navigate to={location.state?.desde ?? rutaInicio(usuario)} replace />;

  const alEnviar = enviar(async ({ correo, password, recordar }) => {
    const resultado = await login(correo, password, recordar);
    if (resultado.requiere2fa) setDesafio(resultado);
    else entrar(resultado.usuario);
  });

  const conGoogle = async (credencial) => {
    try {
      const resultado = await loginGoogle(credencial);
      if (resultado.requiere2fa) setDesafio(resultado);
      else entrar(resultado.usuario);
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (desafio) {
    return (
      <AuthShell titulo="Verifica que eres tú" subtitulo="Tu cuenta tiene activada la verificación en dos pasos.">
        <PasoCodigo desafio={desafio} onVolver={() => setDesafio(null)} onListo={entrar} />
      </AuthShell>
    );
  }

  return (
    <AuthShell titulo="Iniciar sesión" subtitulo="Accede a tu cuenta de Bancada.">
      {motivoCierre && (
        <p role="status" className="mb-5 rounded-xl border border-st-diagnostico/40 bg-st-diagnostico-soft px-3.5 py-2.5 text-sm text-[#7a5200]">
          {motivoCierre === 'inactividad'
            ? 'Cerramos tu sesión tras 15 minutos sin actividad para proteger tu cuenta. Inicia sesión de nuevo para continuar.'
            : 'Tu sesión venció. Vuelve a iniciar sesión para continuar.'}
        </p>
      )}

      <form onSubmit={alEnviar} className="space-y-4" noValidate>
        <TextInput id="correo" name="correo" type="email" label="Correo" autoComplete="email" placeholder="tu@correo.com"
          value={valores.correo} onChange={cambiar} error={errores.correo} required />
        <PasswordInput id="password" name="password" label="Contraseña" autoComplete="current-password" placeholder="••••••••"
          value={valores.password} onChange={cambiar} error={errores.password} required />

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <label className="inline-flex cursor-pointer items-center gap-2 text-ink-soft select-none">
            <input
              type="checkbox"
              checked={valores.recordar}
              onChange={(e) => setValores((v) => ({ ...v, recordar: e.target.checked }))}
              className="size-4 rounded border-line-strong accent-signal"
            />
            Recordarme 30 días
          </label>
          <Link to="/olvide-contrasena" className="font-semibold text-signal-deep underline-offset-4 hover:underline">¿Olvidaste tu contraseña?</Link>
        </div>

        {!errores.correo && !errores.password && errores._form && (
          <div>
            <FormError mensaje={errores._form} />
            <AccionError codigo={errores._codigo} correo={valores.correo} />
          </div>
        )}

        <Button type="submit" variante="senal" tamano="lg" cargando={enviando} className="w-full">
          Entrar <ArrowRight className="size-4" aria-hidden />
        </Button>
      </form>

      <BotonGoogle onCredencial={conGoogle} />

      <p className="mt-6 text-center text-sm text-muted">
        ¿No tienes cuenta?{' '}
        <Link to="/registro" className="font-semibold text-signal-deep underline-offset-4 hover:underline">Regístrate gratis</Link>
      </p>

      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-dashed border-line-strong p-4 text-[13px] text-muted bajo:mt-4">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] font-bold tracking-[0.18em] uppercase">Cuenta de demostración (admin)</p>
          <p className="mt-1.5 break-all">
            <span className="font-mono text-ink">{CUENTA_DEMO.correo}</span> · <span className="font-mono text-ink">{CUENTA_DEMO.password}</span>
          </p>
        </div>
        <Button variante="borde" tamano="sm" onClick={() => setValores((v) => ({ ...v, ...CUENTA_DEMO }))}>Usar cuenta</Button>
      </div>
    </AuthShell>
  );
};
