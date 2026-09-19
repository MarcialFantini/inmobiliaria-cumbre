// ===========================================================
// Tipos del catalogo (propiedades + agentes).
// El landing existente sigue usando `Property` (lead.ts).
// ===========================================================

export type TipoPropiedad = 'casa' | 'departamento' | 'ph' | 'local' | 'oficina' | 'terreno';
export type Operacion = 'venta' | 'alquiler';
export type Ciudad =
  | 'Vicente Lopez'
  | 'San Isidro'
  | 'San Fernando'
  | 'Tigre'
  | 'Pilar'
  | 'Escobar';

export interface Propiedad {
  id: string;
  /** URL-safe identifier. */
  slug: string;
  titulo: string;
  tipo: TipoPropiedad;
  operacion: Operacion;
  /** USD total para venta. */
  precioUSD?: number;
  /** USD mensual para alquiler. */
  alquilerUSD?: number;
  direccion: string;
  barrio: string;
  ciudad: Ciudad;
  m2Cubiertos: number;
  m2Terreno: number;
  dormitorios: number;
  banos: number;
  cocheras: number;
  antiguedad: number;
  /** 2-3 parrafos en prosa. */
  descripcion: string;
  /** Lista corta de amenidades / caracteristicas destacadas. */
  caracteristicas: string[];
  lat: number;
  lng: number;
  /** Rutas a imagenes (placeholders SVG o URLs). */
  imagenes: string[];
  /** ISO date (YYYY-MM-DD). */
  publicada: string;
  /** FK al agente responsable. */
  agenteId: string;
  /** Mostrar en la home dentro del bento de destacadas. */
  destacada?: boolean;
}

export interface Agente {
  id: string;
  nombre: string;
  rol: string;
  matricula?: string;
  telefono: string;
  email: string;
  /** Iniciales para avatar cuando no hay foto. */
  iniciales: string;
  bio: string;
}

// ===========================================================
// Filtros / estado de UI
// ===========================================================

/** Filtros del catalogo: estado reflejable en URL. */
export interface FiltrosCatalogo {
  zona?: string;
  precioMin?: number;
  precioMax?: number;
  m2Min?: number;
  dormitorios?: number;
  tipo?: TipoPropiedad;
  operacion?: Operacion;
  cocheras?: number;
}

/** Ultima busqueda guardada en localStorage. */
export interface BusquedaGuardada {
  filtros: FiltrosCatalogo;
  timestamp: number;
  label?: string;
}

// ===========================================================
// Favoritos
// ===========================================================

/** Record en localStorage: slug + timestamp de cuando se guardo. */
export interface Favorito {
  slug: string;
  timestamp: number;
}
