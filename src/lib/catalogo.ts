// ===========================================================
// Loaders + queries del catalogo.
// Importa los JSON una sola vez (node json loader via Astro).
// ===========================================================

import propiedadesData from '@/data/propiedades.json';
import agentesData from '@/data/agentes.json';
import zonasData from '@/data/zonas.json';
import type {
  Propiedad,
  Agente,
  Ciudad,
  FiltrosCatalogo,
  TipoPropiedad,
  Operacion,
} from '@/types/catalogo';
import type { Zona } from '@/types/zona';

const propiedades = propiedadesData.propiedades as Propiedad[];
const agentes = agentesData.agentes as Agente[];
const zonas = zonasData.zonas as Zona[];

/** Todas las propiedades (referencia estable en runtime). */
export function getPropiedades(): Propiedad[] {
  return propiedades;
}

/** Una propiedad por slug. null si no existe. */
export function getPropiedadBySlug(slug: string): Propiedad | null {
  return propiedades.find((p) => p.slug === slug) ?? null;
}

/** Todos los agentes. */
export function getAgentes(): Agente[] {
  return agentes;
}

/** Un agente por id. */
export function getAgenteById(id: string): Agente | null {
  return agentes.find((a) => a.id === id) ?? null;
}

/** Lista de ciudades cubiertas (derivada de propiedades). */
export function getCiudades(): Ciudad[] {
  const set = new Set<Ciudad>();
  for (const p of propiedades) set.add(p.ciudad as Ciudad);
  return Array.from(set).sort();
}

/** Lista de barrios unicos (todos los barrios disponibles). */
export function getBarrios(): string[] {
  const set = new Set<string>();
  for (const p of propiedades) set.add(p.barrio);
  return Array.from(set).sort();
}

/** Lista de zonas (definidas en zonas.json, fuente de verdad). */
export function getZonas(): Zona[] {
  return zonas;
}

/** Una zona por slug (kebab-case). null si no existe. */
export function getZonaBySlug(slug: string): Zona | null {
  return zonas.find((z) => z.slug === slug) ?? null;
}

/** Una zona por nombre (display). null si no existe. */
export function getZonaByNombre(nombre: string): Zona | null {
  return zonas.find((z) => z.nombre.toLowerCase() === nombre.toLowerCase()) ?? null;
}

/** Propiedades filtradas por zona (por nombre o ciudad). */
export function getPropiedadesByZona(zona: Zona): Propiedad[] {
  return propiedades.filter(
    (p) =>
      p.barrio.toLowerCase() === zona.nombre.toLowerCase() ||
      p.ciudad.toLowerCase() === zona.ciudad.toLowerCase(),
  );
}

/** Propiedades destacadas (para la landing). */
export function getDestacadas(): Propiedad[] {
  return propiedades.filter((p) => p.destacada);
}

/** Similares a una propiedad: misma operacion + mismo tipo + distinta, maximo n. */
export function getSimilares(prop: Propiedad, n = 3): Propiedad[] {
  return propiedades
    .filter((p) => p.slug !== prop.slug)
    .filter((p) => p.tipo === prop.tipo || p.barrio === prop.barrio)
    .slice(0, n);
}

/** Precio comparable para filtros/orden (venta -> precioUSD, alquiler -> alquilerUSD * 240 como proxy). */
export function precioComparable(p: Propiedad): number {
  if (p.operacion === 'venta' && typeof p.precioUSD === 'number') return p.precioUSD;
  if (p.operacion === 'alquiler' && typeof p.alquilerUSD === 'number') return p.alquilerUSD * 240;
  return 0;
}

/** Aplica filtros en cliente. Predicate puro (sin IO). */
export function filtrarPropiedades(items: Propiedad[], f: FiltrosCatalogo): Propiedad[] {
  return items.filter((p) => {
    if (f.zona && p.barrio !== f.zona && p.ciudad !== f.zona) return false;
    if (f.tipo && p.tipo !== f.tipo) return false;
    if (f.operacion && p.operacion !== f.operacion) return false;
    if (typeof f.dormitorios === 'number' && p.dormitorios < f.dormitorios) return false;
    if (typeof f.cocheras === 'number' && p.cocheras < f.cocheras) return false;
    if (typeof f.m2Min === 'number' && p.m2Cubiertos < f.m2Min) return false;
    if (typeof f.precioMin === 'number' && precioComparable(p) < f.precioMin) return false;
    if (typeof f.precioMax === 'number' && precioComparable(p) > f.precioMax) return false;
    return true;
  });
}

/** Parsea FiltrosCatalogo desde URLSearchParams (cliente). */
export function filtrosFromSearchParams(sp: URLSearchParams): FiltrosCatalogo {
  const f: FiltrosCatalogo = {};
  const zona = sp.get('zona');
  if (zona) f.zona = zona;
  const tipo = sp.get('tipo') as TipoPropiedad | null;
  if (tipo && ['casa', 'departamento', 'ph', 'local', 'oficina', 'terreno'].includes(tipo)) f.tipo = tipo;
  const op = sp.get('operacion') as Operacion | null;
  if (op && ['venta', 'alquiler'].includes(op)) f.operacion = op;
  const dorm = sp.get('dormitorios');
  if (dorm) {
    const n = Number(dorm);
    if (Number.isFinite(n)) f.dormitorios = n;
  }
  const coch = sp.get('cocheras');
  if (coch) {
    const n = Number(coch);
    if (Number.isFinite(n)) f.cocheras = n;
  }
  const m2 = sp.get('m2Min');
  if (m2) {
    const n = Number(m2);
    if (Number.isFinite(n)) f.m2Min = n;
  }
  const pmin = sp.get('precioMin');
  if (pmin) {
    const n = Number(pmin);
    if (Number.isFinite(n)) f.precioMin = n;
  }
  const pmax = sp.get('precioMax');
  if (pmax) {
    const n = Number(pmax);
    if (Number.isFinite(n)) f.precioMax = n;
  }
  return f;
}

/** Serializa filtros a URLSearchParams (omite defaults). */
export function filtrosToSearchParams(f: FiltrosCatalogo): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.zona) sp.set('zona', f.zona);
  if (f.tipo) sp.set('tipo', f.tipo);
  if (f.operacion) sp.set('operacion', f.operacion);
  if (typeof f.dormitorios === 'number') sp.set('dormitorios', String(f.dormitorios));
  if (typeof f.cocheras === 'number') sp.set('cocheras', String(f.cocheras));
  if (typeof f.m2Min === 'number') sp.set('m2Min', String(f.m2Min));
  if (typeof f.precioMin === 'number') sp.set('precioMin', String(f.precioMin));
  if (typeof f.precioMax === 'number') sp.set('precioMax', String(f.precioMax));
  return sp;
}

/** Cuenta filtros activos (para badge en UI). */
export function countFiltrosActivos(f: FiltrosCatalogo): number {
  let n = 0;
  if (f.zona) n++;
  if (f.tipo) n++;
  if (f.operacion) n++;
  if (typeof f.dormitorios === 'number') n++;
  if (typeof f.cocheras === 'number') n++;
  if (typeof f.m2Min === 'number') n++;
  if (typeof f.precioMin === 'number') n++;
  if (typeof f.precioMax === 'number') n++;
  return n;
}

/** Slugify basico: "Pilar Centro" -> "pilar-centro". */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
