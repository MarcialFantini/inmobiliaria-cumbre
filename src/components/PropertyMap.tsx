/** @jsxImportSource preact */
import { useEffect, useRef, useState } from 'preact/hooks';
import type { Map as LMap, Marker as LMarker, DivIcon, LatLngBoundsExpression } from 'leaflet';
import type { Propiedad, FiltrosCatalogo } from '@/types/catalogo';
import { filtrarPropiedades } from '@/lib/catalogo';

// ===========================================================
// Mapa interactivo de Leaflet con todas las propiedades.
// Solo client-side: Leaflet toca window/document y rompe en SSR.
// ===========================================================

interface Props {
  propiedades: Propiedad[];
  filtrosIniciales: FiltrosCatalogo;
}

export default function PropertyMap({ propiedades, filtrosIniciales }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LMap | null>(null);
  const markersRef = useRef<LMarker[]>([]);
  const tileCssMountedRef = useRef(false);

  const [filtros, setFiltros] = useState<FiltrosCatalogo>(filtrosIniciales);

  const filtered = filtrarPropiedades(propiedades, filtros);

  // Inicializa el mapa una sola vez.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;

      if (cancelled || !containerRef.current) return;

      if (!tileCssMountedRef.current) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);
        tileCssMountedRef.current = true;
      }

      const map: LMap = L.map(containerRef.current, {
        center: [-34.46, -58.65],
        zoom: 11,
        scrollWheelZoom: false,
        attributionControl: true,
        zoomControl: true,
      });

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19,
        },
      ).addTo(map);

      mapRef.current = map;

      map.on('focus', () => map.scrollWheelZoom.enable());
      map.on('blur', () => map.scrollWheelZoom.disable());
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Render markers cuando cambia la lista filtrada.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      const map = mapRef.current;
      if (!map || cancelled) return;

      // Limpia markers anteriores.
      markersRef.current.forEach((m) => map.removeLayer(m));
      markersRef.current = [];

      // Custom icon forest (cuadrante rotado con $ centrado).
      const forestIcon: DivIcon = L.divIcon({
        className: 'cumbre-marker',
        html: `<span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:999px 999px 2px 999px;transform:rotate(-45deg);background:#1F4D3A;border:2px solid #F5F1E8;box-shadow:0 6px 14px -4px rgba(26,26,26,0.45);"><span style="transform:rotate(45deg);color:#F5F1E8;font-family:monospace;font-size:11px;font-weight:600;letter-spacing:-0.02em;">$</span></span>`,
        iconSize: [32, 32],
        iconAnchor: [16, 30],
        popupAnchor: [0, -28],
      });

      const bounds: Array<[number, number]> = [];

      for (const p of filtered) {
        const marker: LMarker = L.marker([p.lat, p.lng], { icon: forestIcon, title: p.titulo });
        const precioStr =
          p.operacion === 'venta' && typeof p.precioUSD === 'number'
            ? `USD ${p.precioUSD.toLocaleString('es-AR')}`
            : `USD ${(p.alquilerUSD ?? 0).toLocaleString('es-AR')}/mes`;

        marker.bindPopup(`
          <div style="min-width:220px;font-family:system-ui,-apple-system,sans-serif;">
            <p style="margin:0 0 6px;font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:0.16em;color:#5C5852;">
              ${p.operacion === 'venta' ? 'Venta' : 'Alquiler'}
            </p>
            <h3 style="margin:0 0 4px;font-size:15px;font-weight:600;color:#1A1A1A;line-height:1.2;">${p.titulo}</h3>
            <p style="margin:0 0 10px;font-size:12px;color:#5C5852;">${p.barrio}, ${p.ciudad}</p>
            <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#1F4D3A;">${precioStr}</p>
            <p style="margin:0 0 14px;font-size:11px;color:#9E9892;">
              ${p.m2Cubiertos} m&sup2; &middot; ${p.dormitorios} dorm. &middot; ${p.banos} ba&ntilde;os
            </p>
            <a href="/propiedades/${p.slug}"
               style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:#1F4D3A;color:#F5F1E8;border-radius:999px;font-size:12px;text-decoration:none;font-weight:500;">
              Ver detalle &rarr;
            </a>
          </div>
        `);
        marker.addTo(map);
        markersRef.current.push(marker);
        bounds.push([p.lat, p.lng]);
      }

      if (bounds.length > 1) {
        const expr: LatLngBoundsExpression = bounds;
        map.fitBounds(expr, { padding: [40, 40], maxZoom: 13 });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], 14);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [filtered]);

  return (
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
      <aside class="lg:col-span-3 lg:sticky lg:top-28 self-start">
        <div class="bezel">
          <div class="bezel__core p-5">
            <p class="text-eyebrow text-ink-500">Filtrar mapa</p>
            <div class="field mt-4">
              <label class="field__label" for="m-zona">Zona o ciudad</label>
              <select
                id="m-zona"
                class="field__select"
                value={filtros.zona ?? ''}
                onChange={(e) => {
                  const v = (e.currentTarget as HTMLSelectElement).value;
                  setFiltros((f) => ({ ...f, zona: v || undefined }));
                }}
              >
                <option value="">Todas</option>
                <option value="Vicente Lopez">Vicente L&oacute;pez</option>
                <option value="San Isidro">San Isidro</option>
                <option value="San Fernando">San Fernando</option>
                <option value="Tigre">Tigre</option>
                <option value="Pilar">Pilar</option>
              </select>
            </div>

            <div class="field mt-4">
              <label class="field__label" for="m-operacion">Operaci&oacute;n</label>
              <select
                id="m-operacion"
                class="field__select"
                value={filtros.operacion ?? ''}
                onChange={(e) => {
                  const v = (e.currentTarget as HTMLSelectElement).value as 'venta' | 'alquiler' | '';
                  setFiltros((f) => ({ ...f, operacion: v || undefined }));
                }}
              >
                <option value="">Venta y alquiler</option>
                <option value="venta">Venta</option>
                <option value="alquiler">Alquiler</option>
              </select>
            </div>

            <p class="mt-5 text-sm text-ink-700">
              <span class="font-mono tabular-nums text-cumbre-ink">{filtered.length}</span>{' '}
              {filtered.length === 1 ? 'propiedad visible' : 'propiedades visibles'}
            </p>
            <a href="/propiedades" class="mt-4 inline-flex items-center gap-2 text-sm text-cumbre-forest hover:underline">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 12h14" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="m13 5 7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Volver al cat&aacute;logo
            </a>
          </div>
        </div>
      </aside>

      <div class="lg:col-span-9">
        <div
          ref={containerRef}
          class="w-full rounded-[1.25rem] overflow-hidden border border-ink-100 bg-bone-100"
          style={{
            height: 'min(75vh, 700px)',
            minHeight: '480px',
            boxShadow:
              '0 0 0 1px rgba(168, 138, 78, 0.55), 0 0 0 4px #F5F1E8, 0 12px 28px -16px rgba(26, 26, 26, 0.18)',
          }}
          aria-label="Mapa de propiedades en zona norte GBA"
        />
        <p class="mt-3 text-xs text-ink-500">
          Hacé click en el mapa para activar el zoom con scroll. Marcadores personalizados con la paleta de Cumbre.
        </p>
      </div>
    </div>
  );
}
