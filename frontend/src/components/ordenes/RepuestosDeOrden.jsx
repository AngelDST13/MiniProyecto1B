// Repuestos usados en una orden: lista con subtotales y formulario para agregar.
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { formatMoney } from '../../utils/format.js';
import { CategoriaBadge } from '../ui/Badges.jsx';
import { Button, IconButton } from '../ui/Button.jsx';

const FormAgregar = ({ inventario, onAgregar, ocupado }) => {
  const disponibles = inventario.filter((c) => c.stock > 0);
  const [componenteId, setComponenteId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const seleccionado = disponibles.find((c) => c.id === Number(componenteId));

  const alEnviar = async (evento) => {
    evento.preventDefault();
    if (!seleccionado) return;
    const agregado = await onAgregar(seleccionado.id, Number(cantidad));
    if (agregado) {
      setComponenteId('');
      setCantidad(1);
    }
  };

  if (disponibles.length === 0) {
    return <p className="rounded-xl bg-paper px-4 py-3 text-sm text-muted">No hay repuestos con stock disponible.</p>;
  }

  return (
    <form onSubmit={alEnviar} className="grid gap-2 rounded-2xl bg-paper p-3 sm:grid-cols-[1fr_92px_auto]">
      <label className="sr-only" htmlFor="repuesto">Repuesto</label>
      <select
        id="repuesto"
        value={componenteId}
        onChange={(e) => { setComponenteId(e.target.value); setCantidad(1); }}
        className="h-10 rounded-xl border border-line bg-panel px-3 text-sm focus:border-signal focus:ring-4 focus:ring-signal/15 focus:outline-none"
      >
        <option value="">Elegir repuesto del inventario…</option>
        {disponibles.map((c) => (
          <option key={c.id} value={c.id}>{c.nombre} · {formatMoney(c.precio_unitario)} · stock {c.stock}</option>
        ))}
      </select>
      <label className="sr-only" htmlFor="cantidad">Cantidad</label>
      <input
        id="cantidad"
        type="number"
        min="1"
        max={seleccionado?.stock ?? 1}
        value={cantidad}
        onChange={(e) => setCantidad(e.target.value)}
        className="h-10 rounded-xl border border-line bg-panel px-3 text-sm focus:border-signal focus:ring-4 focus:ring-signal/15 focus:outline-none"
      />
      <Button type="submit" icono={Plus} disabled={!seleccionado} cargando={ocupado}>Agregar</Button>
    </form>
  );
};

export const RepuestosDeOrden = ({ orden, inventario, onAgregar, onQuitar, ocupado }) => (
  <section>
    <div className="mb-3 flex items-baseline justify-between">
      <h3 className="text-base font-bold">Repuestos utilizados</h3>
      <span className="font-mono text-xs text-muted">{orden.componentes.length} ítem(s)</span>
    </div>

    {orden.componentes.length > 0 && (
      <ul className="mb-3 divide-y divide-line rounded-2xl border border-line">
        {orden.componentes.map((item) => (
          <li key={item.componente_id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{item.nombre}</p>
              <div className="mt-1 flex items-center gap-2">
                <CategoriaBadge categoria={item.categoria} />
                <span className="font-mono text-xs text-muted">{item.cantidad} × {formatMoney(item.precio_unitario)}</span>
              </div>
            </div>
            <span className="font-mono text-sm font-bold">{formatMoney(item.subtotal)}</span>
            <IconButton
              icono={Trash2}
              etiqueta={`Quitar ${item.nombre}`}
              disabled={ocupado}
              className="hover:bg-danger-soft! hover:text-danger!"
              onClick={() => onQuitar(item)}
            />
          </li>
        ))}
        <li className="flex items-center justify-between bg-paper/60 px-4 py-3">
          <span className="text-sm font-semibold text-muted">Total repuestos</span>
          <span className="font-display text-xl font-extrabold">{formatMoney(orden.total_repuestos)}</span>
        </li>
      </ul>
    )}

    <FormAgregar inventario={inventario} onAgregar={onAgregar} ocupado={ocupado} />
    <p className="mt-2 text-xs text-muted">Al agregar un repuesto se descuenta del stock; al quitarlo, las unidades regresan al inventario.</p>
  </section>
);
