// ===========================================================
// Favoritos y busquedas guardadas. Persistencia 100% cliente.
// Namespace: 'inmobiliaria-cumbre:'
// ===========================================================

import type { Favorito, BusquedaGuardada, FiltrosCatalogo } from '@/types/catalogo';
import { filtrosToSearchParams } from './catalogo';

const NS = 'inmobiliaria-cumbre';
const KEY_FAV = `${NS}:favoritos`;
const KEY_SEARCH = `${NS}:busqueda`;

// --- Favoritos ---

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / disabled storage */
  }
}

export function getFavoritos(): Favorito[] {
  return readJSON<Favorito[]>(KEY_FAV, []);
}

export function esFavorito(slug: string): boolean {
  return getFavoritos().some((f) => f.slug === slug);
}

export function toggleFavorito(slug: string): boolean {
  const current = getFavoritos();
  const idx = current.findIndex((f) => f.slug === slug);
  if (idx >= 0) {
    current.splice(idx, 1);
    writeJSON(KEY_FAV, current);
    return false;
  }
  current.push({ slug, timestamp: Date.now() });
  writeJSON(KEY_FAV, current);
  return true;
}

export function clearFavoritos(): void {
  writeJSON(KEY_FAV, []);
}

// --- Busqueda guardada ---

export function getBusquedaGuardada(): BusquedaGuardada | null {
  return readJSON<BusquedaGuardada | null>(KEY_SEARCH, null);
}

export function setBusquedaGuardada(
  filtros: FiltrosCatalogo,
  label?: string,
): BusquedaGuardada {
  const payload: BusquedaGuardada = { filtros, timestamp: Date.now(), label };
  writeJSON(KEY_SEARCH, payload);
  return payload;
}

export function clearBusquedaGuardada(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY_SEARCH);
  } catch {
    /* noop */
  }
}

/** Sincroniza la busqueda actual con la URL del navegador. */
export function shareBusqueda(filtros: FiltrosCatalogo, path = '/propiedades'): string {
  const sp = filtrosToSearchParams(filtros);
  const url = new URL(path, typeof window !== 'undefined' ? window.location.origin : '');
  sp.forEach((v, k) => url.searchParams.set(k, v));
  return url.toString();
}
