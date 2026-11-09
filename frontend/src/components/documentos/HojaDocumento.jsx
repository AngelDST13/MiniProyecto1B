// Hoja tamaño carta para facturas, informes y cotizaciones. En pantalla se ve como papel;
// al imprimir (o "Guardar como PDF") solo sale la hoja, sin la barra de acciones.
import { Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { LogoMark } from '../layout/Logo.jsx';
import { formatMoneyExacto } from '../../utils/format.js';
import { montoEnLetras } from '../../utils/numeroALetras.js';

export const BarraDocumento = ({ volver = '/', etiquetaVolver = 'Volver', children }) => (
  <div className="no-imprimir sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur">
    <div className="mx-auto flex max-w-204 flex-wrap items-center gap-2 px-4 py-3">
      <Link to={volver} className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-ink-soft hover:bg-paper-deep">
        <ArrowLeft className="size-4" aria-hidden /> {etiquetaVolver}
      </Link>
      <div className="ml-auto flex flex-wrap gap-2">
        {children}
        <button type="button" onClick={() => window.print()}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-paper transition hover:bg-ink-soft">
          <Printer className="size-4" aria-hidden /> Imprimir o guardar PDF
        </button>
      </div>
    </div>
  </div>
);

/**
 * @param {{ empresa, tipo: string, numero: string, meta: [string, string][], anulada?: boolean, children }} props
 */
export const HojaDocumento = ({ empresa, tipo, numero, meta = [], anulada = false, children }) => (
  <article className="hoja relative mx-auto my-6 max-w-204 overflow-hidden bg-white px-6 py-8 text-[13px] leading-relaxed text-ink shadow-lift sm:my-10 sm:px-12 sm:py-12">
    {anulada && (
      <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden>
        <span className="rotate-[-24deg] rounded-2xl border-8 border-danger/40 px-8 py-3 font-display text-7xl font-extrabold tracking-widest text-danger/30 sm:text-8xl">ANULADA</span>
      </div>
    )}

    <header className="flex flex-col gap-6 border-b-2 border-ink pb-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex gap-3">
        <LogoMark className="size-12 shrink-0 text-ink" />
        <div>
          <p className="font-display text-xl leading-tight font-extrabold">{empresa?.nombre}</p>
          <p className="text-muted">Cédula jurídica {empresa?.cedulaJuridica}</p>
          <p className="text-muted">{empresa?.direccion}</p>
          <p className="text-muted">Tel. {empresa?.telefono} · {empresa?.correo}</p>
        </div>
      </div>
      <div className="min-w-56 rounded-xl border-2 border-ink text-right">
        <p className="bg-ink px-4 py-1.5 font-mono text-xs font-bold tracking-[0.25em] text-white uppercase">{tipo}</p>
        <p className="px-4 pt-2 font-mono text-lg font-bold">{numero}</p>
        <dl className="px-4 pb-3 text-xs">
          {meta.map(([clave, valor]) => (
            <div key={clave} className="flex justify-between gap-4"><dt className="text-muted">{clave}</dt><dd className="font-medium">{valor}</dd></div>
          ))}
        </dl>
      </div>
    </header>

    <div className="relative">{children}</div>
  </article>
);

export const BloqueDatos = ({ titulo, filas }) => (
  <section className="rounded-xl bg-paper/60 p-4">
    <p className="mb-2 font-mono text-[10px] font-bold tracking-[0.2em] text-muted uppercase">{titulo}</p>
    <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
      {filas.filter(([, v]) => v).map(([clave, valor], i) => (
        <div key={`${clave}-${i}`} className="flex gap-2"><dt className="shrink-0 text-muted">{clave}:</dt><dd className="font-medium">{valor}</dd></div>
      ))}
    </dl>
  </section>
);

/** @param {{ lineas: { codigo?, descripcion, cantidad, precio_unitario }[] }} props */
export const TablaLineas = ({ lineas }) => (
  <div className="relative mt-6 overflow-x-auto">
    <table className="w-full min-w-130 border-collapse">
      <thead>
        <tr className="border-y-2 border-ink text-left font-mono text-[10px] tracking-[0.12em] uppercase">
          <th className="py-2 pr-2 font-bold">Código</th>
          <th className="py-2 pr-2 font-bold">Descripción</th>
          <th className="py-2 pr-2 text-right font-bold">Cant.</th>
          <th className="py-2 pr-2 text-right font-bold">Precio unit.</th>
          <th className="py-2 text-right font-bold">Total</th>
        </tr>
      </thead>
      <tbody>
        {lineas.map((l, i) => (
          <tr key={`${l.codigo}-${i}`} className="border-b border-line align-top">
            <td className="py-2 pr-2 font-mono text-[11px] text-muted">{l.codigo ?? '—'}</td>
            <td className="py-2 pr-2">{l.descripcion}</td>
            <td className="py-2 pr-2 text-right font-mono">{l.cantidad}</td>
            <td className="py-2 pr-2 text-right font-mono">{formatMoneyExacto(l.precio_unitario)}</td>
            <td className="py-2 text-right font-mono font-semibold">{formatMoneyExacto(l.cantidad * l.precio_unitario)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const Totales = ({ subtotal, iva, total, ivaPorcentaje = 13 }) => (
  <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <p className="max-w-sm rounded-xl border border-line p-3 text-xs">
      <span className="block font-mono text-[10px] font-bold tracking-[0.2em] text-muted uppercase">Son</span>
      <span className="font-semibold">{montoEnLetras(total)}</span>
    </p>
    <dl className="w-full space-y-1 sm:w-64">
      <div className="flex justify-between"><dt className="text-muted">Subtotal (sin IVA)</dt><dd className="font-mono">{formatMoneyExacto(subtotal)}</dd></div>
      <div className="flex justify-between"><dt className="text-muted">IVA {ivaPorcentaje}%</dt><dd className="font-mono">{formatMoneyExacto(iva)}</dd></div>
      <div className="flex justify-between border-t-2 border-ink pt-2 text-base font-bold"><dt>Total</dt><dd className="font-mono">{formatMoneyExacto(total)}</dd></div>
    </dl>
  </div>
);

export const PieDocumento = ({ children }) => (
  <footer className="mt-10 border-t border-line pt-4 text-[11px] text-muted">
    {children}
    <p className="mt-2">Documento generado por el sistema de gestión Bancada. No sustituye al comprobante electrónico del Ministerio de Hacienda.</p>
  </footer>
);
