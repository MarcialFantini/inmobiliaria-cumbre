// Domain types (used both client and server-side for strict typing).

export type OperationType = 'compra' | 'alquiler';
export type PropertyType = 'casa' | 'departamento' | 'ph' | 'terreno' | 'local';

export interface Property {
  id: string;
  title: string;
  zone: string;
  operation: 'Venta' | 'Alquiler';
  type: 'Casa' | 'Departamento' | 'PH';
  price: number;
  currency: 'USD';
  surface: number;
  covered: number;
  bedrooms: number;
  bathrooms: number;
  garage: number;
  tagline: string;
  image: string;
  featured: boolean;
}

export interface LeadPayload {
  nombre: string;
  email: string;
  telefono: string;
  operacion: OperationType;
  tipoPropiedad: PropertyType;
  zona: string;
  mensaje?: string;
  presupuesto?: number;
  /** Honeypot anti-spam. Must be empty. */
  website?: string;
  /** Marketing source attribution (utm or referrer). Optional. */
  source?: string;
}

export interface LeadRecord extends LeadPayload {
  id: string;
  createdAt: string;
  ip?: string | null;
  userAgent?: string | null;
}

export interface LeadValidationError {
  field: keyof LeadPayload;
  message: string;
}

export interface LeadApiResponse {
  ok: boolean;
  id?: string;
  errors?: LeadValidationError[];
  message?: string;
}
