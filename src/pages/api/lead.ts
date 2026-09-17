import type { APIRoute } from 'astro';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type {
  LeadPayload,
  LeadRecord,
  LeadValidationError,
  LeadApiResponse,
} from '@/types/lead';

export const prerender = false;

// ===========================================================
// Validation
// ===========================================================

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+()\d\s.-]{6,24}$/;
const ALLOWED_OPERATIONS = ['compra', 'alquiler'] as const;
const ALLOWED_PROPERTY_TYPES = ['casa', 'departamento', 'ph', 'terreno', 'local'] as const;

function asString(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0].trim();
  return '';
}

function asNumber(v: unknown): number | undefined {
  if (typeof v === 'string' && v.trim() === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function validate(body: Record<string, unknown>): {
  data?: LeadPayload;
  errors: LeadValidationError[];
} {
  const errors: LeadValidationError[] = [];

  const nombre = asString(body.nombre);
  if (nombre.length < 2 || nombre.length > 80) {
    errors.push({ field: 'nombre', message: 'Ingresa tu nombre completo (entre 2 y 80 caracteres).' });
  }

  const email = asString(body.email).toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 120) {
    errors.push({ field: 'email', message: 'Ingresa un correo electronico valido.' });
  }

  const telefono = asString(body.telefono);
  if (!PHONE_RE.test(telefono)) {
    errors.push({ field: 'telefono', message: 'Ingresa un telefono con codigo de area.' });
  }

  const operacion = asString(body.operacion).toLowerCase();
  if (!ALLOWED_OPERATIONS.includes(operacion as (typeof ALLOWED_OPERATIONS)[number])) {
    errors.push({ field: 'operacion', message: 'Elegi una operacion valida.' });
  }

  const tipoPropiedad = asString(body.tipoPropiedad).toLowerCase();
  if (!ALLOWED_PROPERTY_TYPES.includes(tipoPropiedad as (typeof ALLOWED_PROPERTY_TYPES)[number])) {
    errors.push({ field: 'tipoPropiedad', message: 'Elegi un tipo de propiedad valido.' });
  }

  const zona = asString(body.zona);
  if (zona.length < 2 || zona.length > 80) {
    errors.push({ field: 'zona', message: 'Indica la zona de tu interes.' });
  }

  const mensaje = asString(body.mensaje);
  if (mensaje.length > 1000) {
    errors.push({ field: 'mensaje', message: 'El mensaje no puede superar los 1000 caracteres.' });
  }

  const presupuesto = asNumber(body.presupuesto);
  if (presupuesto !== undefined && (presupuesto < 0 || presupuesto > 1_000_000_000)) {
    errors.push({ field: 'presupuesto', message: 'El presupuesto parece invalido.' });
  }

  // Honeypot: must be empty.
  const website = asString(body.website);
  if (website.length > 0) {
    errors.push({ field: 'nombre', message: 'Solicitud rechazada.' });
  }

  if (errors.length > 0) return { errors };

  const data: LeadPayload = {
    nombre,
    email,
    telefono,
    operacion: operacion as LeadPayload['operacion'],
    tipoPropiedad: tipoPropiedad as LeadPayload['tipoPropiedad'],
    zona,
    mensaje: mensaje || undefined,
    presupuesto,
    website: undefined,
    source: asString(body.source) || undefined,
  };
  return { data, errors: [] };
}

// ===========================================================
// Persistence (JSON file)
// ===========================================================

const DATA_DIR = path.resolve(process.cwd(), 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

async function ensureFile(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(LEADS_FILE);
  } catch {
    await fs.writeFile(LEADS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

async function appendLead(record: LeadRecord): Promise<void> {
  await ensureFile();
  const raw = await fs.readFile(LEADS_FILE, 'utf-8').catch(() => '[]');
  const list: LeadRecord[] = JSON.parse(raw);
  list.push(record);
  // Atomic-ish write: write to .tmp then rename.
  const tmp = LEADS_FILE + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(list, null, 2), 'utf-8');
  await fs.rename(tmp, LEADS_FILE);
}

// ===========================================================
// Webhook dispatch (simulated if URL is empty)
// ===========================================================

async function dispatchWebhook(record: LeadRecord): Promise<{ simulated: boolean; status?: number }> {
  const url = import.meta.env.PUBLIC_LEAD_WEBHOOK_URL ?? process.env.PUBLIC_LEAD_WEBHOOK_URL ?? '';
  if (!url) {
    console.log('[lead] webhook simulado: sin PUBLIC_LEAD_WEBHOOK_URL configurada');
    return { simulated: true };
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    return { simulated: false, status: res.status };
  } catch (err) {
    console.error('[lead] webhook fallo:', err);
    return { simulated: false };
  }
}

// ===========================================================
// Handlers
// ===========================================================

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // Accept JSON or form-encoded bodies.
  let body: Record<string, unknown> = {};
  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      const fd = await request.formData();
      body = Object.fromEntries(fd.entries());
    }
  } catch {
    return jsonResponse(
      { ok: false, message: 'Cuerpo de la solicitud invalido.' } satisfies LeadApiResponse,
      400,
    );
  }

  const { data, errors } = validate(body);
  if (!data || errors.length > 0) {
    return jsonResponse(
      {
        ok: false,
        errors,
        message: 'Revisa los campos marcados.',
      } satisfies LeadApiResponse,
      422,
    );
  }

  const record: LeadRecord = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ip: clientAddress ?? null,
    userAgent: request.headers.get('user-agent'),
  };

  // Persist + webhook. Persistence is critical; webhook is best-effort.
  try {
    await appendLead(record);
  } catch (err) {
    console.error('[lead] persistencia fallo:', err);
    return jsonResponse(
      { ok: false, message: 'No pudimos guardar tu consulta. Intenta nuevamente.' } satisfies LeadApiResponse,
      500,
    );
  }

  // Fire-and-forget webhook. We do not block the response on it.
  void dispatchWebhook(record).then((r) => {
    if (r.simulated) {
      console.log(`[lead] ${record.id} persistido, webhook simulado`);
    } else if (r.status) {
      console.log(`[lead] ${record.id} webhook status ${r.status}`);
    }
  });

  return jsonResponse(
    { ok: true, id: record.id, message: 'Consulta recibida.' } satisfies LeadApiResponse,
    201,
  );
};

// Some clients (and Astro) might probe OPTIONS during dev.
export const ALL: APIRoute = async ({ request }) => {
  if (request.method === 'POST') return POST({ request } as Parameters<typeof POST>[0]);
  return new Response(null, { status: 405, headers: { Allow: 'POST' } });
};

export const GET: APIRoute = async () => {
  return jsonResponse(
    { ok: false, message: 'Use POST para enviar una consulta.' },
    405,
  );
};

function jsonResponse(body: LeadApiResponse, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
