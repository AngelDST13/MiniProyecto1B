// Documentos imprimibles: factura, informe técnico del equipo y cotización del armador de PC.
import { useCallback, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { documentoService, tiendaService } from '../../services/tiendaService.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useCargaAsync } from '../../hooks/useCargaAsync.js';
import { esPersonal } from '../../utils/roles.js';
import { formatDate, formatDateTime, formatMoneyExacto } from '../../utils/format.js';
import { formatearCedula } from '../../utils/cedula.js';
import {
  PASOS, consumoEstimado, faltantes, fuenteRecomendada, problemasSeleccion, seleccionDesdeParams, totalSeleccion,
} from '../../utils/armador.js';
import { BarraDocumento, BloqueDatos, HojaDocumento, PieDocumento, TablaLineas, Totales } from '../../components/documentos/HojaDocumento.jsx';
import { ErrorState } from '../../components/ui/Feedback.jsx';
import { Loader } from '../../components/ui/Loader.jsx';

const Cargando = () => <div className="grid min-h-dvh place-items-center"><Loader texto="Preparando documento…" /></div>;
const Fallo = ({ mensaje, onRetry }) => <div className="mx-auto max-w-xl px-4 py-20"><ErrorState mensaje={mensaje} onRetry={onRetry} /></div>;

const ESTADOS_ORDEN = ['Recibido', 'En Diagnóstico', 'Reparado', 'Entregado'];

const DatosPago = ({ empresa }) => (
  <BloqueDatos titulo="Formas de pago" filas={[['SINPE Móvil', empresa.sinpe], ['Cuenta IBAN', empresa.iban], ['A nombre de', empresa.nombre]]} />
);

// ---------------------------------------------------------------------
// Factura
// ---------------------------------------------------------------------
export const DocumentoFactura = () => {
  const { id } = useParams();
  const { usuario } = useAuth();
  const cargar = useCallback(() => documentoService.factura(id), [id]);
  const { datos, error, cargando, recargar } = useCargaAsync(cargar);
  if (cargando) return <Cargando />;
  if (error) return <Fallo mensaje={error} onRetry={recargar} />;
  const { factura, empresa } = datos.data;

  return (
    <div className="min-h-dvh bg-paper-deep">
      <BarraDocumento volver={esPersonal(usuario) ? '/gestion/facturas' : '/mi-cuenta/facturas'} etiquetaVolver="Facturas" />
      <HojaDocumento
        empresa={empresa}
        tipo="Factura"
        numero={factura.consecutivo}
        anulada={factura.estado === 'Anulada'}
        meta={[
          ['Fecha', formatDate(factura.created_at)],
          ['Condición', 'Contado'],
          ['Moneda', 'Colones (CRC)'],
          ['Medio de pago', factura.metodo_pago ?? '—'],
        ]}
      >
        <div className="mt-6 grid gap-3">
          <BloqueDatos titulo="Cliente" filas={[
            ['Nombre', factura.cliente_nombre],
            ['Identificación', factura.cliente_identificacion ? formatearCedula(factura.cliente_identificacion) : 'Consumidor final'],
            ['Correo', factura.cliente_correo],
            ['Teléfono', factura.cliente_telefono],
            ['Dirección', factura.cliente_direccion],
            ['Referencia', factura.notas],
          ]} />
        </div>
        <TablaLineas lineas={factura.lineas} />
        <Totales subtotal={factura.subtotal} iva={factura.iva} total={factura.total} ivaPorcentaje={empresa.iva} />
        <div className="mt-6"><DatosPago empresa={empresa} /></div>
        <PieDocumento>
          <p>Gracias por su compra. Los productos tienen la garantía indicada por el fabricante; conserve este documento para cualquier reclamo.
            {factura.emisor ? ` Emitida por ${factura.emisor}.` : ' Emitida automáticamente.'}</p>
        </PieDocumento>
      </HojaDocumento>
    </div>
  );
};

// ---------------------------------------------------------------------
// Informe técnico del equipo (orden de servicio)
// ---------------------------------------------------------------------
const Seccion = ({ titulo, children }) => (
  <section className="mt-6">
    <h2 className="mb-2 border-b border-ink pb-1 font-mono text-[11px] font-bold tracking-[0.2em] uppercase">{titulo}</h2>
    {children}
  </section>
);

export const DocumentoInformeOrden = () => {
  const { id } = useParams();
  const { usuario } = useAuth();
  const cargar = useCallback(() => documentoService.informeOrden(id), [id]);
  const { datos, error, cargando, recargar } = useCargaAsync(cargar);
  if (cargando) return <Cargando />;
  if (error) return <Fallo mensaje={error} onRetry={recargar} />;
  const { orden, repuestos, cotizaciones, pagos, garantias, seguimientos, empresa } = datos.data;
  const etapa = ESTADOS_ORDEN.indexOf(orden.estado);
  const totalRepuestos = repuestos.reduce((s, r) => s + Number(r.subtotal), 0);
  const pagado = pagos.reduce((s, p) => s + Number(p.monto), 0);

  return (
    <div className="min-h-dvh bg-paper-deep">
      <BarraDocumento volver={esPersonal(usuario) ? '/ordenes' : '/mi-cuenta/equipos'} etiquetaVolver={esPersonal(usuario) ? 'Órdenes' : 'Mis equipos'} />
      <HojaDocumento
        empresa={empresa}
        tipo="Informe técnico"
        numero={orden.codigo}
        meta={[['Ingreso', formatDate(orden.fecha_ingreso)], ['Emitido', formatDate(new Date().toISOString())], ['Estado', orden.estado]]}
      >
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <BloqueDatos titulo="Cliente" filas={[['Nombre', orden.cliente], ['Cédula', formatearCedula(orden.cedula)], ['Teléfono', orden.telefono], ['Correo', orden.email]]} />
          <BloqueDatos titulo="Equipo" filas={[['Tipo', orden.tipo_equipo], ['Marca y modelo', orden.marca_modelo], ['Serie', orden.serial]]} />
        </div>

        <Seccion titulo="Avance">
          <ol className="grid grid-cols-4 gap-1 text-center text-[11px]">
            {ESTADOS_ORDEN.map((estado, i) => (
              <li key={estado}>
                <span className={`block h-1.5 rounded-full ${i <= etapa ? 'bg-signal' : 'bg-line'}`} />
                <span className={`mt-1 block ${i <= etapa ? 'font-semibold' : 'text-muted'}`}>{estado}</span>
              </li>
            ))}
          </ol>
        </Seccion>

        <Seccion titulo="Diagnóstico">
          <p className="whitespace-pre-line">{orden.diagnostico || 'Sin diagnóstico registrado todavía.'}</p>
        </Seccion>

        <Seccion titulo="Repuestos utilizados">
          {repuestos.length ? (
            <>
              <TablaLineas lineas={repuestos.map((r) => ({ codigo: r.categoria, descripcion: r.nombre, cantidad: r.cantidad, precio_unitario: Number(r.precio_unitario) }))} />
              <p className="mt-2 text-right">Total repuestos: <strong className="font-mono">{formatMoneyExacto(totalRepuestos)}</strong></p>
            </>
          ) : <p className="text-muted">No se han utilizado repuestos.</p>}
        </Seccion>

        {cotizaciones.length > 0 && (
          <Seccion titulo="Cotizaciones">
            <ul className="space-y-1">
              {cotizaciones.map((c, i) => (
                <li key={i} className="flex justify-between gap-4"><span>{c.descripcion} <span className="text-muted">· {c.estado} · válida hasta {formatDate(c.valida_hasta)}</span></span><span className="font-mono">{formatMoneyExacto(c.monto)}</span></li>
              ))}
            </ul>
          </Seccion>
        )}

        {seguimientos.length > 0 && (
          <Seccion titulo="Bitácora del técnico">
            <ol className="space-y-2 border-l-2 border-line pl-4">
              {seguimientos.map((s, i) => (
                <li key={i}><span className="font-mono text-[11px] text-muted">{formatDateTime(s.fecha)} · {s.tecnico}</span><p>{s.nota}</p></li>
              ))}
            </ol>
          </Seccion>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <BloqueDatos titulo="Pagos" filas={pagos.length ? [['Total pagado', formatMoneyExacto(pagado)], ...pagos.map((p) => [`${formatDate(p.fecha_pago)} · ${p.metodo}`, formatMoneyExacto(p.monto)])] : [['Estado', 'Sin pagos registrados']]} />
          <BloqueDatos titulo="Garantía" filas={garantias.length ? garantias.map((g) => [g.estado, `${formatDate(g.fecha_inicio)} al ${formatDate(g.fecha_fin)} · ${g.cobertura}`]) : [['Estado', 'Se emite al entregar el equipo']]} />
        </div>

        <div className="mt-14 grid grid-cols-2 gap-10 text-center text-xs">
          <div className="border-t border-ink pt-2">Técnico responsable</div>
          <div className="border-t border-ink pt-2">Recibido conforme · cliente</div>
        </div>
        <PieDocumento><p>Este informe describe el estado del equipo a la fecha de emisión. Consultas: {empresa.telefono} · {empresa.correo}.</p></PieDocumento>
      </HojaDocumento>
    </div>
  );
};

// ---------------------------------------------------------------------
// Cotización del armador de PC (pública: se arma desde la URL)
// ---------------------------------------------------------------------
const cargarCotizacion = () => Promise.all([tiendaService.armador(), tiendaService.empresa()]);

export const DocumentoCotizacion = () => {
  const [params] = useSearchParams();
  const { datos, error, cargando, recargar } = useCargaAsync(cargarCotizacion);
  const [hoy] = useState(() => new Date());
  const sel = useMemo(() => seleccionDesdeParams(params, datos?.[0].data), [params, datos]);
  // Número estable para la misma selección del día: COT-AAAAMMDD-XXXX
  const numero = useMemo(() => {
    const fecha = hoy.toISOString().slice(0, 10).replaceAll('-', '');
    const huella = [...params.toString()].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 10000, 7);
    return `COT-${fecha}-${String(huella).padStart(4, '0')}`;
  }, [params, hoy]);

  if (cargando) return <Cargando />;
  if (error) return <Fallo mensaje={error} onRetry={recargar} />;
  const empresa = datos[1].data;
  const total = totalSeleccion(sel);
  const subtotal = Math.round((total / (1 + empresa.iva / 100)) * 100) / 100;
  const problemas = problemasSeleccion(sel);
  const pendientes = faltantes(sel);
  const validaHasta = new Date(hoy.getTime() + 7 * 86_400_000).toISOString();

  return (
    <div className="min-h-dvh bg-paper-deep">
      <BarraDocumento volver={`/tienda/arma-tu-pc?${params}`} etiquetaVolver="Volver al armador" />
      <HojaDocumento empresa={empresa} tipo="Cotización" numero={numero}
        meta={[['Fecha', formatDate(hoy.toISOString())], ['Válida hasta', formatDate(validaHasta)], ['Moneda', 'Colones (CRC)']]}>
        <p className="mt-6 text-base font-semibold">Computadora a la medida · {Object.keys(sel).length} componentes</p>
        <TablaLineas lineas={PASOS.filter((p) => sel[p.clave]).map((p) => ({
          codigo: sel[p.clave].sku, descripcion: `${p.titulo}: ${sel[p.clave].nombre}`, cantidad: 1, precio_unitario: Number(sel[p.clave].precio),
        }))} />
        <Totales subtotal={subtotal} iva={total - subtotal} total={total} ivaPorcentaje={empresa.iva} />
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <BloqueDatos titulo="Revisión técnica" filas={[
            ['Compatibilidad', problemas.length ? `${problemas.length} problema(s): ${problemas.map((p) => p.motivo).join('; ')}` : 'Todas las piezas son compatibles'],
            ['Piezas faltantes', pendientes.length ? pendientes.map((p) => p.titulo).join(', ') : 'Ninguna'],
            ['Consumo estimado', `${consumoEstimado(sel)} W (fuente recomendada ${fuenteRecomendada(sel)} W)`],
          ]} />
          <DatosPago empresa={empresa} />
        </div>
        <PieDocumento>
          <p>Precios con IVA incluido, sujetos a disponibilidad de inventario al momento de la compra. El armado y la instalación del sistema operativo se cotizan aparte en el taller.</p>
        </PieDocumento>
      </HojaDocumento>
    </div>
  );
};
