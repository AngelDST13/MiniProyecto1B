// Registro de clientes: datos + cédula ecuatoriana validada. Después hay que confirmar el correo.
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowRight, MailCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { useFormState } from '../hooks/useFormState.js';
import { authService } from '../services/authService.js';
import { cedulaValida } from '../utils/cedula.js';
import { rutaInicio } from '../utils/roles.js';
import { AuthShell } from '../components/layout/AuthShell.jsx';
import { FormError, TextInput } from '../components/ui/Field.jsx';
import { PasswordInput } from '../components/ui/PasswordInput.jsx';
import { Button } from '../components/ui/Button.jsx';
import { MedidorPassword } from '../components/auth/MedidorPassword.jsx';
import { BotonGoogle } from '../components/auth/BotonGoogle.jsx';
import { AvisoCorreoSimulado } from '../components/auth/AvisoCorreoSimulado.jsx';

const RevisaTuCorreo = ({ correo, simulado }) => {
  const toast = useToast();
  const [enviando, setEnviando] = useState(false);
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
  return (
    <div className="animate-rise text-center">
      <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-st-reparado-soft text-st-reparado">
        <MailCheck className="size-7" aria-hidden />
      </span>
      <p className="mt-5 text-[15px] text-ink-soft">
        Enviamos un enlace de confirmación a <strong>{correo}</strong>. Ábrelo para activar tu cuenta (vence en 24 horas).
      </p>
      <AvisoCorreoSimulado visible={simulado} />
      <div className="mt-6 flex flex-col gap-2">
        <Link to="/login" className="inline-flex h-12 items-center justify-center rounded-xl bg-ink text-[15px] font-semibold text-paper hover:bg-ink-soft">Ir a iniciar sesión</Link>
        <Button variante="fantasma" cargando={enviando} onClick={reenviar}>No me llegó: reenviar enlace</Button>
      </div>
    </div>
  );
};

export const Registro = () => {
  const { usuario, register, loginGoogle } = useAuth();
  const toast = useToast();
  const [listo, setListo] = useState(null);
  const { valores, errores, enviando, cambiar, enviar } = useFormState({ nombre: '', cedula: '', telefono: '', correo: '', password: '', confirmar: '' });

  if (usuario) return <Navigate to={rutaInicio(usuario)} replace />;

  const alEnviar = enviar(async ({ confirmar, ...datos }) => {
    if (datos.password !== confirmar) {
      throw Object.assign(new Error('Las contraseñas no coinciden'), { details: { confirmar: 'Las contraseñas no coinciden' } });
    }
    const respuesta = await register(datos);
    setListo({ correo: datos.correo, simulado: respuesta.correoSimulado });
  });

  const conGoogle = async (credencial) => {
    try {
      await loginGoogle(credencial);
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (listo) {
    return (
      <AuthShell titulo="Revisa tu correo" subtitulo="Solo falta confirmar tu dirección de correo.">
        <RevisaTuCorreo correo={listo.correo} simulado={listo.simulado} />
      </AuthShell>
    );
  }

  // Aviso inmediato mientras se escribe la cédula (el backend la vuelve a validar)
  const avisoCedula = valores.cedula.replace(/\D/g, '').length >= 9 && !cedulaValida(valores.cedula) ? 'Usa tu cédula física (9 dígitos), jurídica (10) o DIMEX' : undefined;
  const hayErrorDeCampo = ['nombre', 'cedula', 'telefono', 'correo', 'password', 'confirmar'].some((c) => errores[c]);

  return (
    <AuthShell titulo="Crea tu cuenta" subtitulo="Compra en la tienda y sigue la reparación de tus equipos.">
      <form onSubmit={alEnviar} className="space-y-3.5" noValidate>
        <TextInput id="nombre" name="nombre" label="Nombre completo" autoComplete="name" placeholder="Ana Martínez"
          value={valores.nombre} onChange={cambiar} error={errores.nombre} required />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput id="cedula" name="cedula" label="Cédula" inputMode="numeric" maxLength={14} placeholder="1-0234-0567"
            value={valores.cedula} onChange={cambiar} error={errores.cedula ?? avisoCedula} required />
          <TextInput id="telefono" name="telefono" type="tel" label="Teléfono" autoComplete="tel" placeholder="8888-8888"
            value={valores.telefono} onChange={cambiar} error={errores.telefono} required />
        </div>
        <TextInput id="correo" name="correo" type="email" label="Correo" autoComplete="email" placeholder="ana@correo.com"
          value={valores.correo} onChange={cambiar} error={errores.correo} required />
        <PasswordInput id="password" name="password" label="Contraseña" autoComplete="new-password" placeholder="Letras y números, mín. 8"
          value={valores.password} onChange={cambiar} error={errores.password} required />
        <MedidorPassword password={valores.password} />
        <PasswordInput id="confirmar" name="confirmar" label="Repite la contraseña" autoComplete="new-password"
          value={valores.confirmar} onChange={cambiar} error={errores.confirmar} required />

        {!hayErrorDeCampo && <FormError mensaje={errores._form} />}

        <Button type="submit" variante="senal" tamano="lg" cargando={enviando} className="w-full">
          Crear cuenta <ArrowRight className="size-4" aria-hidden />
        </Button>
      </form>

      <BotonGoogle onCredencial={conGoogle} texto="signup_with" />

      <p className="mt-6 text-center text-sm text-muted">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-semibold text-signal-deep underline-offset-4 hover:underline">Inicia sesión</Link>
      </p>
    </AuthShell>
  );
};
