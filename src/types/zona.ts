// ===========================================================
// Tipos para zonas (definidas en src/data/zonas.json).
// Cada zona tiene slug kebab-case, nombre (display), ciudad
// e intro/coord para la landing de zona.
// ===========================================================

export interface Zona {
  /** URL-safe identifier. kebab-case. */
  slug: string;
  /** Nombre para mostrar al usuario. */
  nombre: string;
  /** Ciudad / partido al que pertenece. */
  ciudad: string;
  /** Parrafo introductorio (1-2 frases). */
  intro: string;
  /** Perfil comercial (que se encuentra en esa zona). */
  perfil: string;
  /** Coordenadas del centro aproximado de la zona. */
  coordenadas: { lat: number; lng: number };
  /** 3-5 tags cortos para la grilla. */
  iconos: string[];
}
