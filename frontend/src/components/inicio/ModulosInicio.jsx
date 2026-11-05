// Sección "Módulos": los 20 CRUDs agrupados por área. Un número grande rompe la grilla.
import { ICONOS } from '../../constants/admin.js';

const GRUPOS = [
  { area: 'Atención y servicio', modulos: [['Órdenes de servicio', 'ClipboardList'], ['Clientes', 'Users'], ['Citas', 'CalendarClock'], ['Cotizaciones', 'FileText'], ['Seguimientos', 'NotebookPen'], ['Garantías', 'ShieldCheck']] },
  { area: 'Compras e inventario', modulos: [['Repuestos', 'Cpu'], ['Proveedores', 'Truck'], ['Compras', 'ShoppingCart'], ['Herramientas', 'Hammer']] },
  { area: 'Personal y sedes', modulos: [['Técnicos', 'HardHat'], ['Especialidades', 'GraduationCap'], ['Sucursales', 'Building2']] },
  { area: 'Finanzas', modulos: [['Pagos', 'Wallet'], ['Métodos de pago', 'CreditCard'], ['Gastos', 'Receipt'], ['Categorías de gasto', 'Tags']] },
  { area: 'Catálogos y sistema', modulos: [['Servicios', 'Wrench'], ['Marcas', 'Tag'], ['Usuarios', 'UserCog']] },
];

export const ModulosInicio = () => (
  <section id="modulos" className="scroll-mt-20 py-24 lg:py-32">
    <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-10">
      <div className="revelar lg:sticky lg:top-28 lg:col-span-4 lg:self-start">
        <p className="font-mono text-xs font-bold tracking-[0.2em] text-signal-deep uppercase">03 · Administración</p>
        <p className="mt-4 font-display text-[clamp(6rem,14vw,11rem)] leading-[0.8] font-extrabold text-ink">20</p>
        <h2 className="mt-4 text-3xl leading-tight font-extrabold">módulos para administrar todo el taller.</h2>
        <p className="mt-3 text-[15px] text-muted">
          Cada uno permite crear, consultar, editar y eliminar, con validaciones y relaciones entre registros.
        </p>
      </div>

      <div className="space-y-8 lg:col-span-8">
        {GRUPOS.map(({ area, modulos }, indice) => (
          <div key={area} className="revelar" style={{ '--retraso': `${indice * 60}ms` }}>
            <div className="mb-3 flex items-center gap-3">
              <h3 className="font-mono text-[11px] font-bold tracking-[0.18em] text-ink-soft uppercase">{area}</h3>
              <span className="h-px flex-1 bg-line" aria-hidden />
            </div>
            <ul className="flex flex-wrap gap-2">
              {modulos.map(([nombre, icono]) => {
                const Icono = ICONOS[icono];
                return (
                  <li key={nombre} className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3.5 py-2 text-sm font-semibold">
                    {Icono && <Icono className="size-4 text-signal-deep" aria-hidden />}
                    {nombre}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </section>
);
