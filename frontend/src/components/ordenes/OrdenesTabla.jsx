// Vista de lista (tabla) de órdenes para escritorio.
import { Pencil, Trash2 } from 'lucide-react';
import { codigoOrden, formatDate, formatMoney } from '../../utils/format.js';
import { EstadoBadge } from '../ui/Badges.jsx';
import { IconButton } from '../ui/Button.jsx';

export const OrdenesTabla = ({ ordenes, onAbrir, onEditar, onEliminar }) => (
  <div className="scrollbar-fino relative overflow-x-auto rounded-3xl border border-line bg-panel shadow-ticket">
    <table className="w-full min-w-190 text-left text-[15px]">
      <thead className="border-b border-line bg-paper/60 font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
        <tr>
          <th className="px-5 py-3.5 font-bold">Orden</th>
          <th className="px-5 py-3.5 font-bold">Equipo</th>
          <th className="px-5 py-3.5 font-bold">Cliente</th>
          <th className="px-5 py-3.5 font-bold">Estado</th>
          <th className="px-5 py-3.5 font-bold">Ingreso</th>
          <th className="px-5 py-3.5 text-right font-bold">Repuestos</th>
          <th className="px-5 py-3.5"><span className="sr-only">Acciones</span></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {ordenes.map((orden) => (
          <tr key={orden.id} className="transition hover:bg-paper/50">
            <td className="px-5 py-3.5">
              <button type="button" onClick={() => onAbrir(orden)} className="font-mono text-sm font-bold text-signal-deep hover:underline">
                {codigoOrden(orden.id)}
              </button>
            </td>
            <td className="px-5 py-3.5">
              <p className="font-semibold">{orden.marca_modelo}</p>
              <p className="font-mono text-xs text-muted">{orden.tipo_equipo} · {orden.serial}</p>
            </td>
            <td className="px-5 py-3.5 text-ink-soft">{orden.cliente.nombre}</td>
            <td className="px-5 py-3.5"><EstadoBadge estado={orden.estado} /></td>
            <td className="px-5 py-3.5 font-mono text-sm text-muted">{formatDate(orden.fecha_ingreso)}</td>
            <td className="px-5 py-3.5 text-right font-mono text-sm font-bold">
              {orden.total_repuestos > 0 ? formatMoney(orden.total_repuestos) : '—'}
            </td>
            <td className="px-5 py-3.5">
              <div className="flex justify-end gap-1">
                <IconButton icono={Pencil} etiqueta={`Editar ${codigoOrden(orden.id)}`} onClick={() => onEditar(orden)} />
                <IconButton icono={Trash2} etiqueta={`Eliminar ${codigoOrden(orden.id)}`} className="hover:bg-danger-soft! hover:text-danger!" onClick={() => onEliminar(orden)} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
