// ===========================================================
// Helpers de formato. Compartidos por SSR + cliente (Preact).
// ===========================================================

const usdFmt = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const usdFmtDec = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFmt = new Intl.DateTimeFormat('es-AR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

/** Formato: USD 285.000 */
export function formatUSD(value: number, decimals = false): string {
  return decimals ? usdFmtDec.format(value) : usdFmt.format(value);
}

/** Precio formateado segun operacion: USD 285.000 (venta) o USD 1.850/mes (alquiler). */
export function formatPrecio(opts: {
  operacion: 'venta' | 'alquiler';
  precioUSD?: number;
  alquilerUSD?: number;
}): string {
  if (opts.operacion === 'venta' && typeof opts.precioUSD === 'number') {
    return formatUSD(opts.precioUSD);
  }
  if (opts.operacion === 'alquiler' && typeof opts.alquilerUSD === 'number') {
    return `${formatUSD(opts.alquilerUSD)}/mes`;
  }
  return 'Consultar';
}

/** m2 con unidad tipografica. */
export function formatM2(value: number): string {
  return `${value.toLocaleString('es-AR')} m\u00B2`;
}

/** "Pilar Centro, Pilar" */
export function formatUbicacion(barrio: string, ciudad: string): string {
  return `${barrio}, ${ciudad}`;
}

/** Tipo capitalizado: casa -> Casa. */
export function formatTipo(tipo: string): string {
  return tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase();
}

/** Operacion capitalizada: venta -> Venta. */
export function formatOperacion(op: string): string {
  return op.charAt(0).toUpperCase() + op.slice(1).toLowerCase();
}

/** "12 de marzo de 2026" */
export function formatFecha(iso: string): string {
  try {
    return dateFmt.format(new Date(iso));
  } catch {
    return iso;
  }
}

/** "hace 3 dias" / "hace 2 semanas" / "hace 1 mes" */
export function formatRelativo(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Date.now() - t;
  const day = 24 * 60 * 60 * 1000;
  if (diff < day) return 'hoy';
  const days = Math.floor(diff / day);
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days} d\u00EDas`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return 'hace 1 semana';
  if (weeks < 5) return `hace ${weeks} semanas`;
  const months = Math.floor(days / 30);
  if (months === 1) return 'hace 1 mes';
  if (months < 12) return `hace ${months} meses`;
  return formatFecha(iso);
}
