// Inicio de sesión: envía correo y contraseña a POST /api/auth/login.
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useFormState } from '../hooks/useFormState.js';
import { AuthShell } from '../components/layout/AuthShell.jsx';
import { FormError, TextInput } from '../components/ui/Field.jsx';
import { PasswordInput } from '../components/ui/PasswordInput.jsx';
import { Button } from '../components/ui/Button.jsx';

const CUENTA_DEMO = { correo: 'demo@bancada.com', password: 'Demo12345' };

export const Login = () => {
  const { usuario, login, sesionVencida } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { valores, errores, enviando, cambiar, enviar, setValores } = useFormState({ correo: '', password: '' });

  // Rellena la cuenta de demostración (creada por database/schema.sql).
  const usarCuentaDemo = () => setValores({ correo: CUENTA_DEMO.correo, password: CUENTA_DEMO.password });

  // Página que el usuario intentaba abrir antes de ser enviado al login.
  const destino = location.state?.desde ?? '/';

  // Al iniciar sesión, "usuario" cambia y este redireccionamiento lleva al destino.
  if (usuario) return <Navigate to={destino} replace />;

  const alEnviar = enviar(async ({ correo, password }) => {
    const datos = await login(correo, password);
    toast.exito(`¡Hola, ${datos.nombre.split(' ')[0]}! Bienvenido a la bancada.`);
    navigate(destino, { replace: true });
  });

  return (
    <AuthShell titulo="Iniciar sesión" subtitulo="Accede al panel del taller para gestionar las órdenes.">
      {sesionVencida && (
        <p className="mb-5 rounded-xl border border-st-diagnostico/40 bg-st-diagnostico-soft px-3.5 py-2.5 text-sm text-[#7a5200]">
          Tu sesión venció. Vuelve a iniciar sesión para continuar.
        </p>
      )}

      <form onSubmit={alEnviar} className="space-y-4" noValidate>
        <TextInput
          id="correo"
          name="correo"
          type="email"
          label="Correo"
          autoComplete="email"
          placeholder="tecnico@taller.com"
          value={valores.correo}
          onChange={cambiar}
          error={errores.correo}
          required
        />
        <PasswordInput
          id="password"
          name="password"
          label="Contraseña"
          autoComplete="current-password"
          placeholder="••••••••"
          value={valores.password}
          onChange={cambiar}
          error={errores.password}
          required
        />

        {!errores.correo && !errores.password && <FormError mensaje={errores._form} />}

        <Button type="submit" variante="senal" tamano="lg" cargando={enviando} className="w-full">
          Entrar <ArrowRight className="size-4" aria-hidden />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        ¿No tienes cuenta?{' '}
        <Link to="/registro" className="font-semibold text-signal-deep underline-offset-4 hover:underline">
          Regístrate
        </Link>
      </p>

      <div className="mt-8 flex items-center gap-3 rounded-2xl border border-dashed border-line-strong p-4 text-[13px] text-muted">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] font-bold tracking-[0.18em] uppercase">Cuenta de demostración</p>
          <p className="mt-1.5 break-all">
            <span className="font-mono text-ink">{CUENTA_DEMO.correo}</span> · <span className="font-mono text-ink">{CUENTA_DEMO.password}</span>
          </p>
        </div>
        <Button variante="borde" tamano="sm" onClick={usarCuentaDemo}>Usar cuenta</Button>
      </div>
    </AuthShell>
  );
};
