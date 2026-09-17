/** @jsxImportSource preact */
import { useEffect, useMemo, useState } from 'preact/hooks';
import type { Propiedad } from '@/types/catalogo';
import { getFavoritos, clearFavoritos, esFavorito, toggleFavorito } from '@/lib/favoritos';
import {
  formatPrecio,
  formatM2,
} from '@/lib/format';

// ===========================================================
// Listado de favoritos. Cliente-only: lee localStorage.
// Si no hay propiedades guardadas, CTA para explorar el catalogo.
// ===========================================================

interface Props {
  propiedades: Propiedad[];
}

export default function FavoritesList({ propiedades }: Props) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setSlugs(getFavoritos().map((f) => f.slug));
    setMounted(true);

    const onUpdate = () => setSlugs(getFavoritos().map((f) => f.slug));
    window.addEventListener('inmobiliaria-cumbre:favoritos', onUpdate);
    return () => window.removeEventListener('inmobiliaria-cumbre:favoritos', onUpdate);
  }, []);

  const propiedadesFavoritas = useMemo(() => {
    const set = new Set(slugs);
    return propiedades.filter((p) => set.has(p.slug));
  }, [slugs, propiedades]);

  if (!mounted) {
    // Placeholder mientras hidrata (no mostrar empty state falso).
    return (
      <div class="rounded-[1.25rem] border border-ink-100 bg-bone-100/40 p-12 text-center">
        <p class="text-sm text-ink-500">Cargando tus favoritos&hellip;</p>
      </div>
    );
  }

  if (propiedadesFavoritas.length === 0) {
    return (
      <div class="rounded-[1.25rem] border border-dashed border-ink-100 bg-bone-100/40 p-10 sm:p-14 text-center">
        <p class="text-eyebrow text-ink-500">Sin favoritos todav&iacute;a</p>
        <h3 class="mt-4 text-display-2 text-cumbre-ink">No guardaste ninguna propiedad a&uacute;n.</h3>
        <p class="mt-4 max-w-[44ch] mx-auto text-ink-700 leading-relaxed">
          Cuando explores el cat&aacute;logo, toc&aacute; el coraz&oacute;n en cualquier propiedad para tenerla siempre a mano.
        </p>
        <div class="mt-7 flex flex-wrap items-center justify-center gap-3">
          <a href="/propiedades" class="btn-pill btn-forest">
            <span>Explorar el cat&aacute;logo</span>
            <span class="btn-pill__icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M7 17 17 7" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8 7h9v9" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
          </a>
          <a href="/propiedades/mapa" class="btn-pill btn-ghost">
            <span>Ver en mapa</span>
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

  const onRemove = (slug: string) => {
    if (esFavorito(slug)) toggleFavorito(slug);
    const next = getFavoritos().map((f) => f.slug);
    setSlugs(next);
    window.dispatchEvent(new CustomEvent('inmobiliaria-cumbre:favoritos'));
  };

  const onClearAll = () => {
    clearFavoritos();
    setSlugs([]);
    window.dispatchEvent(new CustomEvent('inmobiliaria-cumbre:favoritos'));
  };

  return (
    <div>
      <header class="flex items-baseline justify-between gap-4 mb-8">
        <div>
          <h2 class="text-display-3 text-cumbre-ink">
            {propiedadesFavoritas.length} {propiedadesFavoritas.length === 1 ? 'propiedad guardada' : 'propiedades guardadas'}
          </h2>
          <p class="text-sm text-ink-500 mt-1">
            Persistidas en tu navegador. Pod&eacute;s volver cuando quieras.
          </p>
        </div>
        <button
          type="button"
          onClick={onClearAll}
          class="text-sm text-ink-500 hover:text-ink-900 transition-colors"
        >
          Vaciar lista
        </button>
      </header>

      <ul class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-7">
        {propiedadesFavoritas.map((p) => (
          <li key={p.slug}>
            <FavCard p={p} onRemove={() => onRemove(p.slug)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function FavCard({ p, onRemove }: { p: Propiedad; onRemove: () => void }) {
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
        <a href={`/propiedades/${p.slug}`}>
          <img
            src={imagen}
            alt={`Imagen de ${p.titulo}`}
            loading="lazy"
            class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.04]"
          />
        </a>
        <div class="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-cumbre-bone/95 backdrop-blur-sm px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.16em] text-cumbre-ink">
          {p.operacion === 'venta' ? 'Venta' : 'Alquiler'}
        </div>
        <button
          type="button"
          onClick={onRemove}
          class="absolute top-3 right-3 grid place-items-center w-10 h-10 rounded-full bg-cumbre-forest text-cumbre-bone hover:bg-cumbre-accent-700 transition-colors"
          aria-label={`Quitar ${p.titulo} de favoritos`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3.4.8-4.5 2.1C10.9 3.8 9.3 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" />
          </svg>
        </button>
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
        <p class="mt-2 text-sm text-ink-500">{p.barrio}, {p.ciudad}</p>
        <ul class="mt-5 pt-5 border-t border-cumbre-bone-200 grid grid-cols-3 gap-3 text-xs text-ink-500">
          <li>{formatM2(p.m2Cubiertos)}</li>
          <li>{p.dormitorios} dorm.</li>
          <li>{p.banos} ba&ntilde;os</li>
        </ul>
        <a
          href={`/propiedades/${p.slug}`}
          class="mt-6 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-cumbre-forest text-cumbre-bone text-sm hover:bg-cumbre-accent-700 transition-colors"
        >
          Ver propiedad
        </a>
      </div>
    </article>
  );
}
