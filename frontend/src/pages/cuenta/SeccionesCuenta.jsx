// Secciones del portal del cliente.
import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Laptop, PackageOpen, Receipt, ShieldCheck, ShoppingBag } from 'lucide-react';
import { portalService } from '../../services/tiendaService.js';
import { authService } from '../../services/authService.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import { useCargaAsync } from '../../hooks/useCargaAsync.js';
import { useFormState } from '../../hooks/useFormState.js';
import { ESTADO_PEDIDO_ESTILO } from '../../constants/tienda.js';
import { formatDate, formatDateTime, formatMoney } from '../../utils/format.js';
import { EstadoBadge } from '../../components/ui/Badges.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { EmptyState, ErrorState } from '../../components/ui/Feedback.jsx';
import { FormError, TextArea, TextInput } from '../../components/ui/Field.jsx';
import { PasswordInput } from '../../components/ui/PasswordInput.jsx';
import { Skeleton } from '../../components/ui/Loader.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Toggle } from '../../components/ui/Toggle.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { MedidorPassword } from '../../components/auth/MedidorPassword.jsx';
import { ProductoImagen } from '../../components/tienda/ProductoImagen.jsx';

const Tarjeta = ({ children, className = '' }) => <section className={`rounded-3xl border border-line bg-panel p-5 shadow-ticket sm:p-6 ${className}`}>{children}</section>;
export const EstadoPedido = ({ estado }) => <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${ESTADO_PEDIDO_ESTILO[estado]}`}>{estado}</span>;
const ESTILO_SOLICITUD = { Pendiente: 'bg-st-diagnostico-soft text-[#8a5d00]', Aprobada: 'bg-st-reparado-soft text-st-reparado', Rechazada: 'bg-danger-soft text-danger' };

const cargarPedidos = () => portalService.pedidos();
const cargarEquipos = async () => {
  const [ordenes, solicitudes] = await Promise.all([portalService.ordenes(), portalService.solicitudes()]);
  return { ordenes: ordenes.data, solicitudes: solicitudes.data };
};

// ---------------------------------------------------------------------
export const ResumenCuenta = () => {
  const pedidos = useCargaAsync(cargarPedidos);
  const equipos = useCargaAsync(cargarEquipos);
  const activos = pedidos.datos?.data.filter((p) => !['Entregado', 'Cancelado'].includes(p.estado)) ?? [];
  const enTaller = equipos.datos?.ordenes.filter((o) => o.estado !== 'Entregado') ?? [];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Tarjeta>
        <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Pedidos en curso</h2><ShoppingBag className="size-5 text-signal-deep" aria-hidden /></div>
        <p className="mt-3 font-display text-5xl font-extrabold">{pedidos.datos ? activos.length : '–'}</p>
        <Link to="/mi-cuenta/pedidos" className="mt-3 inline-block text-sm font-semibold text-signal-deep hover:underline">Ver mis pedidos →</Link>
      </Tarjeta>
      <Tarjeta>
        <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Equipos en el taller</h2><Laptop className="size-5 text-signal-deep" aria-hidden /></div>
        <p className="mt-3 font-display text-5xl font-extrabold">{equipos.datos ? enTaller.length : '–'}</p>
        <Link to="/mi-cuenta/equipos" className="mt-3 inline-block text-sm font-semibold text-signal-deep hover:underline">Seguir mis equipos →</Link>
      </Tarjeta>
      <Tarjeta className="md:col-span-2">
        <h2 className="text-lg font-bold">¿Buscas algo nuevo?</h2>
        <p className="mt-1 text-sm text-muted">Componentes, laptops y accesorios con garantía de taller.</p>
        <Link to="/tienda" className="mt-4 inline-flex h-11 items-center rounded-xl bg-signal px-5 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#f04c12]">Ir a la tienda</Link>
      </Tarjeta>
    </div>
  );
};

// ---------------------------------------------------------------------
export const MisPedidos = () => {
  const toast = useToast();
  const { datos, error, recargar } = useCargaAsync(cargarPedidos);
  const [abierto, setAbierto] = useState(null);
  const [cancelar, setCancelar] = useState(null);
  const [cancelando, setCancelando] = useState(false);
  const cargarDetalle = useCallback(() => (abierto ? portalService.pedido(abierto) : Promise.resolve(null)), [abierto]);
  const detalle = useCargaAsync(cargarDetalle);

  const confirmarCancelacion = async () => {
    setCancelando(true);
    try {
      toast.exito((await portalService.cancelarPedido(cancelar.id)).message);
      setAbierto(null);
      recargar();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCancelando(false);
      setCancelar(null);
    }
  };

  if (error) return <ErrorState mensaje={error} onRetry={recargar} />;
  if (!datos) return <Skeleton className="h-48" />;
  if (!datos.data.length) {
    return <EmptyState icono={PackageOpen} titulo="Aún no tienes pedidos" texto="Cuando compres en la tienda, aquí verás su estado." accion={<Link to="/tienda" className="inline-flex h-10 items-center rounded-xl bg-ink px-4 text-sm font-semibold text-paper">Ir a la tienda</Link>} />;
  }

  const pedido = detalle.datos?.data;
  return (
    <>
      <ul className="space-y-3">
        {datos.data.map((p, i) => (
          <li key={p.id} style={{ animationDelay: `${i * 40}ms` }} className="animate-rise">
            <button type="button" onClick={() => setAbierto(p.id)}
              className="flex w-full flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-line bg-panel p-4 text-left shadow-ticket transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift">
              <span className="font-mono text-sm font-bold text-signal-deep">{p.codigo}</span>
              <span className="text-sm text-muted">{formatDate(p.created_at)}</span>
              <span className="text-sm text-muted">{p.unidades} producto(s)</span>
              <span className="ml-auto font-display text-lg font-extrabold">{formatMoney(p.total)}</span>
              <EstadoPedido estado={p.estado} />
            </button>
          </li>
        ))}
      </ul>

      {abierto && (
        <Modal abierto onClose={() => setAbierto(null)} titulo={pedido ? `Pedido ${pedido.codigo}` : 'Pedido'} descripcion={pedido ? formatDateTime(pedido.created_at) : undefined}
          pie={pedido?.estado === 'Pendiente' && <Button variante="fantasma" className="text-danger" onClick={() => setCancelar(pedido)}>Cancelar pedido</Button>}>
          {!pedido ? <Skeleton className="h-40" /> : (
            <div className="space-y-5">
              <EstadoPedido estado={pedido.estado} />
              <ul className="divide-y divide-line rounded-2xl border border-line">
                {pedido.items.map((it) => (
                  <li key={it.producto_id} className="flex items-center gap-3 p-3">
                    <ProductoImagen producto={it} tamano="sm" className="size-12 shrink-0 rounded-xl" />
                    <span className="min-w-0 flex-1 text-sm"><span className="line-clamp-1 font-medium">{it.nombre_producto}</span><span className="font-mono text-xs text-muted">{it.cantidad} × {formatMoney(it.precio_unitario)}</span></span>
                    <span className="font-mono text-sm font-bold">{formatMoney(it.cantidad * it.precio_unitario)}</span>
                  </li>
                ))}
              </ul>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div><dt className="text-muted">Entrega</dt><dd className="font-medium">{pedido.tipo_entrega}{pedido.direccion ? ` · ${pedido.direccion}, ${pedido.ciudad}` : ''}</dd></div>
                <div><dt className="text-muted">Pago</dt><dd className="font-medium">{pedido.metodo_pago}</dd></div>
                <div><dt className="text-muted">Envío</dt><dd className="font-mono">{Number(pedido.costo_envio) ? formatMoney(pedido.costo_envio) : 'Gratis'}</dd></div>
                <div><dt className="text-muted">Total</dt><dd className="font-display text-xl font-extrabold">{formatMoney(pedido.total)}</dd></div>
              </dl>
            </div>
          )}
        </Modal>
      )}
      <ConfirmDialog abierto={Boolean(cancelar)} onCancel={() => setCancelar(null)} onConfirm={confirmarCancelacion} cargando={cancelando}
        titulo="¿Cancelar el pedido?" textoConfirmar="Sí, cancelar" mensaje={<p>Se cancelará el pedido <strong>{cancelar?.codigo}</strong>.</p>} />
    </>
  );
};

// ---------------------------------------------------------------------
const SolicitarInforme = ({ orden, onCerrar, onEnviado }) => {
  const { valores, errores, enviando, cambiar, enviar } = useFormState({ mensaje: '' });
  const alEnviar = enviar(async ({ mensaje }) => onEnviado((await portalService.solicitarInforme(orden.id, mensaje)).message));
  return (
    <Modal abierto onClose={onCerrar} titulo={`Solicitar informe · ${orden.codigo}`} descripcion="El taller revisará tu solicitud y te enviará el informe completo por correo.">
      <form onSubmit={alEnviar} className="space-y-4">
        <TextArea id="mensaje" name="mensaje" label="¿Qué necesitas saber?" hint="Opcional. Por ejemplo: costo final, fecha estimada, repuestos usados…" maxLength={500}
          value={valores.mensaje} onChange={cambiar} error={errores.mensaje} />
        <FormError mensaje={errores._form} />
        <div className="flex justify-end gap-2"><Button variante="borde" onClick={onCerrar}>Cancelar</Button><Button type="submit" variante="senal" cargando={enviando}>Enviar solicitud</Button></div>
      </form>
    </Modal>
  );
};

export const MisEquipos = () => {
  const toast = useToast();
  const { datos, error, recargar } = useCargaAsync(cargarEquipos);
  const [solicitando, setSolicitando] = useState(null);

  if (error) return <ErrorState mensaje={error} onRetry={recargar} />;
  if (!datos) return <Skeleton className="h-48" />;

  return (
    <div className="space-y-8">
      {datos.ordenes.length === 0 ? (
        <EmptyState icono={Laptop} titulo="No tienes equipos en el taller" texto="Cuando dejes un equipo, aparecerá aquí con su estado (se vincula por tu cédula)." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {datos.ordenes.map((o, i) => (
            <li key={o.id} style={{ animationDelay: `${i * 50}ms` }} className="animate-rise rounded-3xl border border-line bg-panel p-5 shadow-ticket transition hover:shadow-lift">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs font-bold text-signal-deep">{o.codigo}</p>
                  <h3 className="mt-1 text-lg font-bold">{o.marca_modelo}</h3>
                  <p className="font-mono text-xs text-muted">{o.tipo_equipo} · S/N {o.serial}</p>
                </div>
                <EstadoBadge estado={o.estado} />
              </div>
              <p className="mt-4 text-sm text-muted">Ingresó el {formatDate(o.fecha_ingreso)} · actualizado {formatDate(o.updated_at)}</p>
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-4">
                {o.ultima_solicitud && <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ESTILO_SOLICITUD[o.ultima_solicitud]}`}>Informe: {o.ultima_solicitud}</span>}
                {o.ultima_solicitud === 'Aprobada' && (
                  <Link to={`/documentos/orden/${o.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold text-signal-deep hover:bg-signal-soft">Ver informe</Link>
                )}
                <Button variante="borde" tamano="sm" icono={FileText} className="ml-auto" disabled={o.ultima_solicitud === 'Pendiente'} onClick={() => setSolicitando(o)}>
                  {o.ultima_solicitud === 'Pendiente' ? 'Solicitud en revisión' : 'Solicitar informe'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {datos.solicitudes.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">Mis solicitudes de informe</h2>
          <ul className="divide-y divide-line rounded-3xl border border-line bg-panel">
            {datos.solicitudes.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4 text-sm">
                <span className="font-mono font-bold">{s.orden}</span>
                <span className="text-muted">{formatDateTime(s.created_at)}</span>
                <span className={`ml-auto rounded-full px-2.5 py-1 text-xs font-semibold ${ESTILO_SOLICITUD[s.estado]}`}>{s.estado}</span>
                {s.respuesta_admin && <p className="w-full text-ink-soft">Taller: {s.respuesta_admin}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {solicitando && (
        <SolicitarInforme orden={solicitando} onCerrar={() => setSolicitando(null)} onEnviado={(mensaje) => { toast.exito(mensaje); setSolicitando(null); recargar(); }} />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------
export const SeguridadCuenta = () => {
  const { usuario, actualizarUsuario } = useAuth();
  const toast = useToast();
  const [guardando2fa, setGuardando2fa] = useState(false);
  const perfil = useFormState({ nombre: usuario.nombre, telefono: usuario.telefono ?? '' });
  const clave = useFormState({ actual: '', nueva: '' });

  const cambiar2fa = async (activo) => {
    setGuardando2fa(true);
    try {
      const r = await authService.configurarDosPasos(activo);
      actualizarUsuario(r.data);
      toast.exito(r.message);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setGuardando2fa(false);
    }
  };

  const guardarPerfil = perfil.enviar(async (datos) => {
    const r = await authService.actualizarPerfil(datos);
    actualizarUsuario(r.data);
    toast.exito(r.message);
  });

  const guardarClave = clave.enviar(async ({ actual, nueva }) => {
    toast.exito((await authService.cambiarPassword(actual, nueva)).message);
    clave.setValores({ actual: '', nueva: '' });
  });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Tarjeta className="lg:col-span-2">
        <div className="flex flex-wrap items-start gap-4">
          <span className="grid size-11 place-items-center rounded-2xl bg-ink text-signal"><ShieldCheck className="size-5" aria-hidden /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold">Verificación en dos pasos</h2>
            <p className="text-sm text-muted">Al iniciar sesión te pediremos un código que enviamos a <strong>{usuario.correo}</strong>.</p>
          </div>
          <div className={`w-full sm:w-72 ${guardando2fa ? 'pointer-events-none opacity-60' : ''}`}>
            <Toggle id="dos-pasos" label={usuario.dos_pasos ? 'Activada' : 'Desactivada'} checked={usuario.dos_pasos} onChange={cambiar2fa} />
          </div>
        </div>
      </Tarjeta>

      <Tarjeta>
        <h2 className="mb-4 text-lg font-bold">Datos personales</h2>
        <form onSubmit={guardarPerfil} className="space-y-4">
          <TextInput id="perfil-nombre" name="nombre" label="Nombre" value={perfil.valores.nombre} onChange={perfil.cambiar} error={perfil.errores.nombre} />
          <TextInput id="perfil-telefono" name="telefono" type="tel" label="Teléfono" value={perfil.valores.telefono} onChange={perfil.cambiar} error={perfil.errores.telefono} />
          <TextInput id="perfil-cedula" label="Cédula" value={usuario.cedula ?? '—'} disabled hint="La cédula no se puede cambiar." />
          <TextInput id="perfil-correo" label="Correo" value={usuario.correo} disabled />
          <FormError mensaje={perfil.errores.nombre || perfil.errores.telefono ? null : perfil.errores._form} />
          <Button type="submit" cargando={perfil.enviando}>Guardar cambios</Button>
        </form>
      </Tarjeta>

      <Tarjeta>
        <h2 className="mb-4 text-lg font-bold">{usuario.con_google ? 'Contraseña (opcional con Google)' : 'Cambiar contraseña'}</h2>
        <form onSubmit={guardarClave} className="space-y-4">
          <PasswordInput id="clave-actual" name="actual" label="Contraseña actual" autoComplete="current-password" value={clave.valores.actual} onChange={clave.cambiar} error={clave.errores.actual} />
          <PasswordInput id="clave-nueva" name="nueva" label="Contraseña nueva" autoComplete="new-password" value={clave.valores.nueva} onChange={clave.cambiar} error={clave.errores.nueva} />
          <MedidorPassword password={clave.valores.nueva} />
          <FormError mensaje={clave.errores.actual || clave.errores.nueva ? null : clave.errores._form} />
          <Button type="submit" cargando={clave.enviando}>Actualizar contraseña</Button>
        </form>
      </Tarjeta>
    </div>
  );
};

// ---------------------------------------------------------------------
const cargarFacturas = () => portalService.facturas();

export const MisFacturas = () => {
  const { datos, error, recargar } = useCargaAsync(cargarFacturas);
  if (error) return <ErrorState mensaje={error} onRetry={recargar} />;
  if (!datos) return <Skeleton className="h-48" />;
  if (!datos.data.length) {
    return <EmptyState icono={Receipt} titulo="Aún no tienes facturas" texto="Cuando recibas un pedido o retires tu equipo del taller, tu factura aparecerá aquí y en tu correo." />;
  }
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {datos.data.map((f, i) => (
        <li key={f.id} style={{ animationDelay: `${i * 40}ms` }} className="animate-rise">
          <Link to={`/documentos/factura/${f.id}`} className="group flex items-center gap-4 rounded-3xl border border-line bg-panel p-5 shadow-ticket transition hover:-translate-y-0.5 hover:shadow-lift">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-paper-deep text-ink-soft transition group-hover:bg-signal-soft group-hover:text-signal-deep"><Receipt className="size-5" aria-hidden /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-mono text-sm font-bold">{f.consecutivo}</span>
              <span className="block truncate text-sm text-muted">{f.tipo === 'pedido' ? 'Compra en la tienda' : 'Servicio técnico'} · {formatDate(f.created_at)}</span>
            </span>
            <span className="text-right">
              <span className="block font-mono font-semibold">{formatMoney(f.total)}</span>
              {f.estado === 'Anulada' && <span className="text-xs font-semibold text-danger">Anulada</span>}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
};
