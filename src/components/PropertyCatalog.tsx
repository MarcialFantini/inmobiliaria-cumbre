/** @jsxImportSource preact */
import { useEffect, useMemo, useState } from 'preact/hooks';
import type { Propiedad, FiltrosCatalogo, BusquedaGuardada } from '@/types/catalogo';
import {
  filtrarPropiedades,
  filtrosFromSearchParams,
  filtrosToSearchParams,
  countFiltrosActivos,
} from '@/lib/catalogo';
import {
  formatPrecio,
  formatM2,
  formatOperacion,
  formatRelativo,
} from '@/lib/format';
import {
  getBusquedaGuardada,
  setBusquedaGuardada,
  clearBusquedaGuardada,
  shareBusqueda,
} from '@/lib/favoritos';
import FavoriteButton from './FavoriteButton';

// ===========================================================
// Catalogo interactivo: filtros + grid + URL shareable.
// Todo lo que cambia (filtros, grid, empty state) vive en este island.
// ===========================================================

interface Props {
  propiedades: Propiedad[];
  barrios: string[];
  ciudades: string[];
  filtrosIniciales: FiltrosCatalogo;
}

export default function PropertyCatalog({ propiedades, barrios, ciudades, filtrosIniciales }: Props) {
  const [filtros, setFiltros] = useState<FiltrosCatalogo>(filtrosIniciales);
  const [busquedaGuardada, setBusquedaGuardadaState] = useState<BusquedaGuardada | null>(null);
  const [copiado, setCopiado] = useState(false);

  // Hidratar busqueda guardada al montar.
  useEffect(() => {
    setBusquedaGuardadaState(getBusquedaGuardada());
  }, []);

  // Sincronizar filtros <-> URL (sin disparar navegacion).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = filtrosToSearchParams(filtros);
    const url = new URL(window.location.href);
    const currentKeys = Array.from(url.searchParams.keys());
    currentKeys.forEach((k) => {
      if (!sp.has(k)) url.searchParams.delete(k);
    });
    sp.forEach((v, k) => url.searchParams.set(k, v));
    window.history.replaceState({}, '', url.toString());
  }, [filtros]);

  // Escuchar navegacion del browser (back/forward).
  useEffect(() => {
    const onPop = () => {
      const sp = new URLSearchParams(window.location.search);
      setFiltros(filtrosFromSearchParams(sp));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const filtered = useMemo(
    () => filtrarPropiedades(propiedades, filtros),
    [propiedades, filtros],
  );

  const update = (patch: Partial<FiltrosCatalogo>) =>
    setFiltros((f) => ({ ...f, ...patch }));

  const resetFiltros = () => setFiltros({});

  const totalActivos = countFiltrosActivos(filtros);

  const guardarBusqueda = () => {
    const b = setBusquedaGuardada(filtros);
    setBusquedaGuardadaState(b);
  };

  const aplicarBusquedaGuardada = (b: BusquedaGuardada) => {
    setFiltros(b.filtros);
  };

  const eliminarBusquedaGuardada = () => {
    clearBusquedaGuardada();
    setBusquedaGuardadaState(null);
  };

  const copiarURL = async () => {
    const url = shareBusqueda(filtros, '/propiedades');
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
      {/* Panel de filtros (sticky en desktop) */}
      <aside class="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-28 self-start">
        <div class="bezel">
          <div class="bezel__core p-5 sm:p-6">
            <header class="flex items-center justify-between mb-5">
              <p class="text-eyebrow text-ink-500">
                Filtrar {totalActivos > 0 ? `(${totalActivos})` : ''}
              </p>
              {totalActivos > 0 && (
                <button
                  type="button"
                  onClick={resetFiltros}
                  class="text-[11px] font-mono uppercase tracking-[0.18em] text-cumbre-forest hover:underline"
                >
                  Limpiar
                </button>
              )}
            </header>

            {/* Zona */}
            <div class="field mb-5">
              <label class="field__label" for="f-zona">
                Zona o ciudad
              </label>
              <select
                id="f-zona"
                class="field__select"
                value={filtros.zona ?? ''}
                onChange={(e) => {
                  const v = (e.currentTarget as HTMLSelectElement).value;
                  update({ zona: v || undefined });
                }}
              >
                <option value="">Todas</option>
                <optgroup label="Ciudades">
                  {ciudades.map((c) => (
                    <option value={c}>{c}</option>
                  ))}
                </optgroup>
                <optgroup label="Barrios">
                  {barrios.map((b) => (
                    <option value={b}>{b}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Operacion */}
            <div class="field mb-5">
              <label class="field__label" for="f-operacion">
                Operaci&oacute;n
              </label>
              <select
                id="f-operacion"
                class="field__select"
                value={filtros.operacion ?? ''}
                onChange={(e) => {
                  const v = (e.currentTarget as HTMLSelectElement).value as 'venta' | 'alquiler' | '';
                  update({ operacion: v || undefined });
                }}
              >
                <option value="">Venta y alquiler</option>
                <option value="venta">Venta</option>
                <option value="alquiler">Alquiler</option>
              </select>
            </div>

            {/* Tipo */}
            <div class="field mb-5">
              <label class="field__label" for="f-tipo">
                Tipo de propiedad
              </label>
              <select
                id="f-tipo"
                class="field__select"
                value={filtros.tipo ?? ''}
                onChange={(e) => {
                  const v = (e.currentTarget as HTMLSelectElement).value;
                  update({ tipo: (v || undefined) as FiltrosCatalogo['tipo'] });
                }}
              >
                <option value="">Cualquiera</option>
                <option value="casa">Casa</option>
                <option value="departamento">Departamento</option>
                <option value="ph">PH</option>
                <option value="local">Local comercial</option>
              </select>
            </div>

            {/* Dormitorios */}
            <div class="field mb-5">
              <label class="field__label" for="f-dorm">
                Dormitorios (m&iacute;n.)
              </label>
              <select
                id="f-dorm"
                class="field__select"
                value={String(filtros.dormitorios ?? '')}
                onChange={(e) => {
                  const v = (e.currentTarget as HTMLSelectElement).value;
                  update({ dormitorios: v ? Number(v) : undefined });
                }}
              >
                <option value="">Sin m&iacute;nimo</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5+</option>
              </select>
            </div>

            {/* Cocheras */}
            <div class="field mb-5">
              <label class="field__label" for="f-coch">
                Cocheras (m&iacute;n.)
              </label>
              <select
                id="f-coch"
                class="field__select"
                value={String(filtros.cocheras ?? '')}
                onChange={(e) => {
                  const v = (e.currentTarget as HTMLSelectElement).value;
                  update({ cocheras: v ? Number(v) : undefined });
                }}
              >
                <option value="">Sin m&iacute;nimo</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
              </select>
            </div>

            {/* m2 min */}
            <div class="field mb-5">
              <label class="field__label" for="f-m2">
                Metros cuadrados cubiertos (m&iacute;n.)
              </label>
              <input
                id="f-m2"
                type="number"
                min={0}
                step={10}
                placeholder="Ej: 80"
                class="field__input"
                value={filtros.m2Min ?? ''}
                onInput={(e) => {
                  const v = (e.currentTarget as HTMLInputElement).value;
                  update({ m2Min: v ? Number(v) : undefined });
                }}
              />
            </div>

            {/* Precio rango */}
            <div class="field mb-5">
              <span class="field__label">Rango de precio (USD)</span>
              <div class="grid grid-cols-2 gap-3">
                <label class="sr-only" for="f-pmin">Precio m&iacute;nimo</label>
                <input
                  id="f-pmin"
                  type="number"
                  min={0}
                  step={5000}
                  placeholder="M&iacute;n."
                  class="field__input"
                  value={filtros.precioMin ?? ''}
                  onInput={(e) => {
                    const v = (e.currentTarget as HTMLInputElement).value;
                    update({ precioMin: v ? Number(v) : undefined });
                  }}
                />
                <label class="sr-only" for="f-pmax">Precio m&aacute;ximo</label>
                <input
                  id="f-pmax"
                  type="number"
                  min={0}
                  step={5000}
                  placeholder="M&aacute;x."
                  class="field__input"
                  value={filtros.precioMax ?? ''}
                  onInput={(e) => {
                    const v = (e.currentTarget as HTMLInputElement).value;
                    update({ precioMax: v ? Number(v) : undefined });
                  }}
                />
              </div>
              <p class="field__hint">Para alquiler: USD/mes multiplicado por 240.</p>
            </div>

            {/* Acciones secundarias */}
            <div class="pt-5 border-t border-ink-100 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={guardarBusqueda}
                class="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-full border border-ink-100 text-sm text-ink-900 hover:border-cumbre-forest transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                {busquedaGuardada ? 'Actualizar b&uacute;squeda guardada' : 'Guardar esta b&uacute;squeda'}
              </button>
              <button
                type="button"
                onClick={copiarURL}
                class="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-full border border-ink-100 text-sm text-ink-900 hover:border-cumbre-forest transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                {copiado ? 'URL copiada' : 'Compartir b&uacute;squeda'}
              </button>
            </div>

            {busquedaGuardada && (
              <div class="mt-5 pt-5 border-t border-ink-100">
                <p class="text-eyebrow text-ink-500">B&uacute;squeda guardada</p>
                <div class="mt-3 flex items-start justify-between gap-3">
                  <div class="text-sm text-ink-700">
                    {countFiltrosActivos(busquedaGuardada.filtros)} filtros &middot;{' '}
                    {formatRelativo(new Date(busquedaGuardada.timestamp).toISOString())}
                  </div>
                  <div class="flex gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => aplicarBusquedaGuardada(busquedaGuardada)}
                      class="text-xs text-cumbre-forest font-medium hover:underline"
                    >
                      Aplicar
                    </button>
                    <span class="text-ink-300">&middot;</span>
                    <button
                      type="button"
                      onClick={eliminarBusquedaGuardada}
                      class="text-xs text-ink-500 hover:underline"
                    >
                      Borrar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Grid + resultado */}
      <section class="lg:col-span-8 xl:col-span-9">
        <header class="flex items-baseline justify-between gap-4 mb-6">
          <div>
            <h2 class="text-display-3 text-cumbre-ink">
              {filtered.length} {filtered.length === 1 ? 'propiedad' : 'propiedades'}
            </h2>
            <p class="text-sm text-ink-500 mt-1">
              {totalActivos > 0
                ? `Filtrando por ${totalActivos} ${totalActivos === 1 ? 'criterio' : 'criterios'}.`
                : 'Cat\u00E1logo completo de Inmobiliaria Cumbre.'}
            </p>
          </div>
        </header>

        {filtered.length === 0 ? (
          <EmptyState onReset={resetFiltros} />
        ) : (
          <ul class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-7">
            {filtered.map((p) => (
              <li key={p.slug} class="reveal is-visible">
                <PropertyCardItem p={p} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// ===========================================================
// Card individual (renderiza Preact, no usa .astro).
// ===========================================================

function PropertyCardItem({ p }: { p: Propiedad }) {
  const imagen = p.imagenes[0] ?? '/images/properties/bellavista.svg';
  return (
    <article
      class="group relative h-full"
      style={{
        boxShadow:
          '0 0 0 1px rgba(168, 138, 78, 0.55), 0 0 0 4px #F5F1E8, 0 0 0 5px rgba(225, 217, 197, 0.85), 0 10px 28px -14px rgba(26, 26, 26, 0.18)',
        borderRadius: '1.25rem',
        background: '#F5F1E8',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div class="relative aspect-[4/3] overflow-hidden bg-cumbre-bone-100">
        <a href={`/propiedades/${p.slug}`} aria-label={`Ver ${p.titulo} en ${p.barrio}`}>
          <img
            src={imagen}
            alt={`Render ilustrativo de ${p.titulo} en ${p.barrio}`}
            loading="lazy"
            decoding="async"
            class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.04]"
          />
        </a>
        <div class="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-cumbre-bone/95 backdrop-blur-sm px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.16em] text-cumbre-ink">
          {formatOperacion(p.operacion)}
        </div>
        <div class="absolute top-3 right-3">
          <FavoriteButton slug={p.slug} variant="icon" />
        </div>
      </div>

      <div class="p-5 sm:p-6 flex flex-col flex-1">
        <div class="flex items-start justify-between gap-3">
          <h3 class="text-display-3 text-cumbre-ink leading-[1.05]">
            <a href={`/propiedades/${p.slug}`} class="hover:text-cumbre-forest transition-colors">
              {p.titulo}
            </a>
          </h3>
          <p class="text-[15px] font-semibold text-cumbre-ink whitespace-nowrap tabular-nums">
            {formatPrecio({ operacion: p.operacion, precioUSD: p.precioUSD, alquilerUSD: p.alquilerUSD })}
          </p>
        </div>

        <p class="mt-2 inline-flex items-center gap-1.5 text-sm text-ink-500">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 21s-7-7.5-7-12a7 7 0 0 1 14 0c0 4.5-7 12-7 12Z"/>
            <circle cx="12" cy="9" r="2.5"/>
          </svg>
          {p.barrio}, {p.ciudad}
        </p>

        <p class="mt-3 text-sm text-ink-700 leading-relaxed flex-1 line-clamp-3">
          {p.caracteristicas.slice(0, 3).join(' \u00B7 ')}
        </p>

        <ul class="mt-5 pt-5 border-t border-cumbre-bone-200 grid grid-cols-3 gap-3 text-xs text-ink-500">
          <li class="inline-flex items-center gap-1.5">
            <SpecIcon kind="m2" /> {formatM2(p.m2Cubiertos)}
          </li>
          <li class="inline-flex items-center gap-1.5">
            <SpecIcon kind="bed" /> {p.dormitorios} dorm.
          </li>
          <li class="inline-flex items-center gap-1.5">
            <SpecIcon kind="bath" /> {p.banos} ba&ntilde;os
          </li>
        </ul>

        <a
          href={`/propiedades/${p.slug}`}
          class="mt-6 inline-flex items-center justify-between gap-2 px-4 py-3 rounded-full bg-cumbre-forest text-cumbre-bone text-sm hover:bg-cumbre-accent-700 transition-colors"
          aria-label={`Ver ${p.titulo}`}
        >
          <span>Ver propiedad</span>
          <span class="grid place-items-center w-7 h-7 rounded-full bg-cumbre-bone text-cumbre-forest transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M7 17 17 7" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M8 7h9v9" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </a>
      </div>
    </article>
  );
}

function SpecIcon({ kind }: { kind: 'm2' | 'bed' | 'bath' }) {
  if (kind === 'm2') {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="text-cumbre-ink" aria-hidden="true">
        <path d="m3 17 14-14 4 4L7 21Z"/>
        <path d="m7 13 2 2"/>
        <path d="m10 10 2 2"/>
        <path d="m13 7 2 2"/>
      </svg>
    );
  }
  if (kind === 'bed') {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="text-cumbre-ink" aria-hidden="true">
        <path d="M3 18V8"/>
        <path d="M21 18v-5a3 3 0 0 0-3-3H10v5"/>
        <path d="M3 14h18"/>
        <circle cx="7.5" cy="11.5" r="1.5"/>
      </svg>
    );
  }
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="text-cumbre-ink" aria-hidden="true">
      <path d="M4 12h16v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-5Z"/>
      <path d="M7 12V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/>
      <path d="M5 19v2M19 19v2"/>
    </svg>
  );
}

// ===========================================================
// Estado vacio con sugerencias.
// ===========================================================

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div class="rounded-[1.25rem] border border-dashed border-ink-100 bg-bone-100/40 p-8 sm:p-12 text-center">
      <p class="text-eyebrow text-ink-500">Sin coincidencias</p>
      <h3 class="mt-4 text-display-3 text-cumbre-ink">No encontramos propiedades con esos filtros.</h3>
      <p class="mt-3 text-ink-700 max-w-[44ch] mx-auto">
        Prob&aacute; ampliar el rango de precio, relajar el m&iacute;nimo de dormitorios o explorar otras zonas de zona norte.
      </p>
      <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onReset}
          class="btn-pill btn-forest"
        >
          <span>Limpiar filtros</span>
          <span class="btn-pill__icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M7 17 17 7" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M8 7h9v9" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </button>
        <a href="/propiedades/mapa" class="btn-pill btn-ghost">
          <span>Ver mapa completo</span>
          <span class="btn-pill__icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12h14" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="m13 5 7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </a>
      </div>
    </div>
  );
}
