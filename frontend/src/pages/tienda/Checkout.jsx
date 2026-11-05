// Finalizar compra: entrega, pago, datos de contacto y confirmación del pedido.
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Banknote, CircleCheck, CreditCard, Landmark, Store, Truck } from 'lucide-react';
import { tiendaService } from '../../services/tiendaService.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useCarrito } from '../../hooks/useCarrito.js';
import { useCargaAsync } from '../../hooks/useCargaAsync.js';
import { useFormState } from '../../hooks/useFormState.js';
import { formatMoney } from '../../utils/format.js';
import { FormError, TextArea, TextInput } from '../../components/ui/Field.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ProductoImagen } from '../../components/tienda/ProductoImagen.jsx';

const cargarCatalogo = () => tiendaService.catalogo();

const Opcion = ({ activo, onClick, icono: Icono, titulo, texto, deshabilitado }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={deshabilitado}
    aria-pressed={activo}
    className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
      activo ? 'border-ink bg-ink text-paper shadow-lift' : 'border-line bg-panel hover:-translate-y-0.5 hover:border-line-strong'
    }`}
  >
    <Icono className={`mt-0.5 size-5 shrink-0 ${activo ? 'text-signal' : 'text-ink-soft'}`} aria-hidden />
    <span>
      <span className="block font-semibold">{titulo}</span>
      <span className={`block text-xs ${activo ? 'text-paper/65' : 'text-muted'}`}>{texto}</span>
    </span>
  </button>
);

const Confirmacion = ({ pedido }) => (
  <div className="mx-auto max-w-xl animate-rise px-4 py-16 text-center">
    <span className="mx-auto grid size-20 animate-pop place-items-center rounded-3xl bg-st-reparado-soft text-st-reparado"><CircleCheck className="size-10" aria-hidden /></span>
    <h1 className="mt-6 text-4xl font-extrabold">¡Pedido recibido!</h1>
    <p className="mt-3 text-ink-soft">
      Tu pedido <strong className="font-mono">{pedido.codigo}</strong> por <strong>{formatMoney(pedido.total)}</strong> está registrado. Te enviamos el detalle a tu correo y te avisaremos cada vez que cambie de estado.
    </p>
    {pedido.metodo_pago === 'Transferencia' && (
      <div className="mt-6 rounded-2xl border border-line bg-panel p-5 text-left text-sm">
        <p className="font-semibold">Datos para la transferencia</p>
        <p className="mt-2 text-ink-soft">Banco Pichincha · Cuenta corriente 2100000000 · Bancada S.A. · RUC 1790000000001</p>
        <p className="mt-1 text-ink-soft">Referencia: <span className="font-mono font-bold">{pedido.codigo}</span></p>
      </div>
    )}
    <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
      <Link to="/mi-cuenta/pedidos" className="inline-flex h-12 items-center justify-center rounded-xl bg-ink px-6 font-semibold text-paper hover:bg-ink-soft">Ver mis pedidos</Link>
      <Link to="/tienda" className="inline-flex h-12 items-center justify-center rounded-xl border border-line px-6 font-semibold hover:border-ink">Seguir comprando</Link>
    </div>
  </div>
);

export const Checkout = () => {
  const { usuario } = useAuth();
  const { items, subtotal, vaciar } = useCarrito();
  const { datos: catalogo } = useCargaAsync(cargarCatalogo);
  const [pedido, setPedido] = useState(null);
  const { valores, errores, enviando, cambiar, asignar, enviar } = useFormState({
    tipo_entrega: 'Retiro en tienda',
    metodo_pago: 'Pago en tienda',
    direccion: '',
    ciudad: '',
    telefono: usuario?.telefono ?? '',
    notas: '',
  });

  if (pedido) return <Confirmacion pedido={pedido} />;
  if (items.length === 0) return <Navigate to="/carrito" replace />;

  const envioDomicilio = valores.tipo_entrega === 'Envío a domicilio';
  const gratisDesde = catalogo?.envio.gratisDesde ?? 150;
  const costoEnvio = envioDomicilio && subtotal < gratisDesde ? catalogo?.envio.costo ?? 5 : 0;

  const elegirEntrega = (tipo) => {
    asignar('tipo_entrega', tipo);
    if (tipo === 'Retiro en tienda' && valores.metodo_pago === 'Contra entrega') asignar('metodo_pago', 'Pago en tienda');
    if (tipo === 'Envío a domicilio' && valores.metodo_pago === 'Pago en tienda') asignar('metodo_pago', 'Transferencia');
  };

  const alEnviar = enviar(async (datos) => {
    const { data } = await tiendaService.crearPedido({ ...datos, items: items.map(({ producto_id, cantidad }) => ({ producto_id, cantidad })) });
    vaciar();
    setPedido(data);
    window.scrollTo({ top: 0 });
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-10">
      <h1 className="mb-8 text-4xl font-extrabold">Finalizar compra</h1>
      <form onSubmit={alEnviar} noValidate className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-lg font-bold">1 · ¿Cómo lo recibes?</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Opcion activo={!envioDomicilio} onClick={() => elegirEntrega('Retiro en tienda')} icono={Store} titulo="Retiro en tienda" texto="Gratis · listo en 24 h" />
              <Opcion activo={envioDomicilio} onClick={() => elegirEntrega('Envío a domicilio')} icono={Truck} titulo="Envío a domicilio"
                texto={subtotal >= gratisDesde ? 'Gratis en este pedido' : `${formatMoney(catalogo?.envio.costo ?? 5)} · gratis desde ${formatMoney(gratisDesde)}`} />
            </div>
            {errores.tipo_entrega && <p className="mt-2 text-sm text-danger">{errores.tipo_entrega}</p>}
            {envioDomicilio && (
              <div className="mt-4 grid animate-rise gap-4 sm:grid-cols-[1fr_200px]">
                <TextInput id="direccion" name="direccion" label="Dirección completa" placeholder="Av. Amazonas N24-15 y Colón, casa 3"
                  value={valores.direccion} onChange={cambiar} error={errores.direccion} required />
                <TextInput id="ciudad" name="ciudad" label="Ciudad" placeholder="Quito" value={valores.ciudad} onChange={cambiar} error={errores.ciudad} required />
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">2 · ¿Cómo pagas?</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <Opcion activo={valores.metodo_pago === 'Transferencia'} onClick={() => asignar('metodo_pago', 'Transferencia')} icono={Landmark} titulo="Transferencia" texto="Te enviamos los datos" />
              <Opcion activo={valores.metodo_pago === 'Pago en tienda'} onClick={() => asignar('metodo_pago', 'Pago en tienda')} icono={CreditCard} titulo="Pago en tienda" texto="Efectivo o tarjeta" deshabilitado={envioDomicilio} />
              <Opcion activo={valores.metodo_pago === 'Contra entrega'} onClick={() => asignar('metodo_pago', 'Contra entrega')} icono={Banknote} titulo="Contra entrega" texto="Pagas al recibir" deshabilitado={!envioDomicilio} />
            </div>
            {errores.metodo_pago && <p className="mt-2 text-sm text-danger">{errores.metodo_pago}</p>}
          </section>

          <section className="grid gap-4">
            <h2 className="text-lg font-bold">3 · Contacto</h2>
            <TextInput id="telefono" name="telefono" type="tel" label="Teléfono" value={valores.telefono} onChange={cambiar} error={errores.telefono} required />
            <TextArea id="notas" name="notas" label="Notas para el pedido" hint="Opcional: referencias, horario de entrega…" value={valores.notas} onChange={cambiar} />
          </section>
        </div>

        <aside className="h-fit rounded-3xl border border-line bg-panel p-6 shadow-ticket lg:sticky lg:top-24">
          <h2 className="text-lg font-bold">Tu pedido</h2>
          <ul className="scrollbar-fino mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
            {items.map((item) => (
              <li key={item.producto_id} className="flex items-center gap-3">
                <ProductoImagen producto={item} tamano="sm" className="size-12 shrink-0 rounded-xl" />
                <span className="min-w-0 flex-1 text-sm"><span className="line-clamp-1 font-medium">{item.nombre}</span><span className="font-mono text-xs text-muted">× {item.cantidad}</span></span>
                <span className="font-mono text-sm">{formatMoney(item.precio * item.cantidad)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="font-mono">{formatMoney(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Envío</dt><dd className="font-mono">{costoEnvio ? formatMoney(costoEnvio) : 'Gratis'}</dd></div>
          </dl>
          <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
            <span className="font-semibold">Total</span>
            <span className="font-display text-3xl font-extrabold">{formatMoney(subtotal + costoEnvio)}</span>
          </div>
          {errores._form && !['direccion', 'ciudad', 'telefono', 'metodo_pago', 'tipo_entrega'].some((c) => errores[c]) && <div className="mt-4"><FormError mensaje={errores._form} /></div>}
          <Button type="submit" variante="senal" tamano="lg" cargando={enviando} className="mt-5 w-full">Confirmar pedido</Button>
          <p className="mt-3 text-center text-xs text-muted">Comprando como {usuario?.correo}. El precio y el stock se confirman al enviar.</p>
        </aside>
      </form>
    </div>
  );
};
