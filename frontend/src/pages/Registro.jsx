// Registro de usuario: POST /api/auth/register y luego inicia sesión automáticamente.
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useFormState } from '../hooks/useFormState.js';
import { AuthShell } from '../components/layout/AuthShell.jsx';
import { FormError, TextInput } from '../components/ui/Field.jsx';
import { PasswordInput } from '../components/ui/PasswordInput.jsx';
import { Button } from '../components/ui/Button.jsx';

export const Registro = () => {
  const { usuario, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { valores, errores, enviando, cambiar, enviar } = useFormState({ nombre: '', correo: '', password: '' });

  if (usuario) return <Navigate to="/panel" replace />;

  const alEnviar = enviar(async (datos) => {
    await register(datos);
    toast.exito('Cuenta creada. ¡Bienvenido al taller!');
    navigate('/panel', { replace: true });
  });

  const hayErrorDeCampo = errores.nombre || errores.correo || errores.password;

  return (
    <AuthShell titulo="Crear cuenta" subtitulo="Registra tu usuario de técnico para entrar al panel.">
      <form onSubmit={alEnviar} className="space-y-4" noValidate>
        <TextInput
          id="nombre"
          name="nombre"
          label="Nombre completo"
          autoComplete="name"
          placeholder="Ana Martínez"
          value={valores.nombre}
          onChange={cambiar}
          error={errores.nombre}
          required
        />
        <TextInput
          id="correo"
          name="correo"
          type="email"
          label="Correo"
          autoComplete="email"
          placeholder="ana@taller.com"
          value={valores.correo}
          onChange={cambiar}
          error={errores.correo}
          required
        />
        <PasswordInput
          id="password"
          name="password"
          label="Contraseña"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          hint="Usa al menos 8 caracteres."
          value={valores.password}
          onChange={cambiar}
          error={errores.password}
          required
        />

        {!hayErrorDeCampo && <FormError mensaje={errores._form} />}

        <Button type="submit" variante="senal" tamano="lg" cargando={enviando} className="w-full">
          Crear cuenta <ArrowRight className="size-4" aria-hidden />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-semibold text-signal-deep underline-offset-4 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  );
};
