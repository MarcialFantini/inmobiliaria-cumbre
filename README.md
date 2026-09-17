# Inmobiliaria Cumbre - Landing de captación

> Landing editorial de captación de leads para una inmobiliaria ficticia de zona norte del Gran Buenos Aires. Stack: Astro 7 SSR + Tailwind CSS v4 + endpoint API que guarda cada consulta en `data/leads.json` y dispara un webhook configurable.

---

## Problema

Una inmobiliaria mediana recibe consultas por WhatsApp, Instagram, mail y el formulario de su sitio actual. Las pierde entre canales: no hay trazabilidad, no hay un historial único, no hay forma de medir qué propiedad o sección trajo cada lead.

## Solución

Una landing única con tres objetivos:

1. **Convertir visitas en consultas calificadas** con un formulario claro de 8 campos.
2. **Centralizar el primer contacto** en una sola fuente: `data/leads.json` local + webhook opcional a Google Sheets, Zapier, Make o n8n.
3. **Dar una imagen profesional y editorial** que diferencie a Cumbre de la competencia genérica de zona norte.

El visitante envía una sola consulta y un asesor real la recibe de punta a punta, con todos los datos que necesita para empezar a buscar.

## Stack

| Capa | Tecnología | Versión | Por qué |
|---|---|---|---|
| Framework | [Astro 7](https://astro.build) (SSR con `@astrojs/node` standalone) | `^7.3.3` | Render híbrido: páginas estáticas + endpoint SSR para el form |
| Estilos | [Tailwind CSS v4](https://tailwindcss.com) vía `@tailwindcss/vite` | `^4.3.3` | Sin PostCSS config; tokens definidos con `@theme` en CSS |
| Tipografía | Geist + Geist Mono + Source Serif 4 | - | Sans moderno para UI, serif editorial para pull-quotes (evita Inter y los serifs AI-default como Fraunces) |
| Lenguaje | TypeScript estricto (extends `astro/tsconfigs/strict`) | - | Tipos compartidos en `src/types/lead.ts` |
| Imágenes | SVG inline (placeholders editoriales) | - | Vectoriales, livianas, sin necesidad de build pipeline |
| Persistencia | JSON local (`data/leads.json`) | - | Cero infraestructura para empezar; suficiente para demo |
| Webhook | `fetch` a `PUBLIC_LEAD_WEBHOOK_URL` | - | Fire-and-forget; no bloquea la respuesta |

## Estructura

```
.
├── public/
│   ├── favicon.svg
│   ├── og-image.svg
│   └── images/
│       ├── hero/property-hero.svg
│       └── properties/{bellavista,virasoro,manzanares,acacias,castores}.svg
├── src/
│   ├── components/
│   │   ├── ContactForm.astro      # form con client-side fetch + validación accesible
│   │   ├── FeaturedProperties.astro
│   │   ├── Footer.astro
│   │   ├── Header.astro
│   │   ├── Hero.astro
│   │   ├── Icon.astro             # set mínimo de iconos inline
│   │   ├── Process.astro
│   │   ├── PropertyCard.astro
│   │   └── Stats.astro
│   ├── data/properties.json       # propiedades y zonas (catálogo simulado)
│   ├── layouts/BaseLayout.astro   # head, SEO, OG, JSON-LD, observer de reveal
│   ├── pages/
│   │   ├── index.astro            # landing principal
│   │   ├── gracias.astro          # confirmación (lee el lead por ID)
│   │   └── api/lead.ts            # endpoint SSR (POST, valida, persiste, webhook)
│   ├── styles/global.css          # tokens + componentes + reveal-on-scroll
│   └── types/lead.ts              # tipos compartidos cliente/servidor
├── data/
│   └── leads.json                 # se crea al primer POST (gitignored)
├── astro.config.mjs               # SSR + node adapter + tailwind vite plugin
├── tsconfig.json                  # extends astro/tsconfigs/strict + alias @/*
└── .env.example                   # variables documentadas
```

## Cómo correrlo

### Requisitos

- Node.js `>= 22.12.0` (definido en `engines`)
- pnpm `>= 9` (exclusivamente pnpm, sin `npm` ni `yarn`)

### Pasos

```bash
# 1. Instalar dependencias
pnpm install

# 2. (Opcional) Configurar webhook
cp .env.example .env
# editar .env si querés apuntar a un endpoint real

# 3. Levantar dev server (en background, como pide AGENTS.md)
pnpm dev --background

# 4. Abrir
# http://localhost:4321
```

### Comandos útiles

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Dev server en `localhost:4321` |
| `pnpm dev --background` | Misma cosa, en background (recomendado por AGENTS.md) |
| `astro dev stop` | Frena el background server |
| `astro dev status` | Estado del background server |
| `astro dev logs` | Logs del background server |
| `pnpm build` | Build de producción (SSR + Node standalone) |
| `pnpm preview` | Sirve el build localmente en `localhost:4321` |
| `pnpm astro check` | Type-check estricto |

### Variables de entorno

| Variable | Default | Descripción |
|---|---|---|
| `PUBLIC_LEAD_WEBHOOK_URL` | (vacía) | URL que recibe un POST JSON con cada lead. Si está vacía, el endpoint loguea `webhook simulado` y sigue. |

## Cómo apuntar el webhook a un endpoint real

El endpoint envía un `POST application/json` con la forma `LeadRecord`:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-09-17T12:34:56.000Z",
  "nombre": "Maria Perez",
  "email": "maria@example.com",
  "telefono": "+54 11 5555-5555",
  "operacion": "compra",
  "tipoPropiedad": "casa",
  "zona": "Pilar Centro",
  "presupuesto": 200000,
  "mensaje": "Busco con jardin y pileta",
  "source": "google / cpc",
  "ip": "190.123.45.67",
  "userAgent": "Mozilla/5.0 ..."
}
```

### Opcion 1: Google Sheets via Apps Script (gratis, sin codigo)

1. Crear una hoja nueva en Google Sheets (nombre sugerido: `Leads Cumbre`).
2. Extensiones > Apps Script. Pegar:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    data.createdAt,
    data.id,
    data.nombre,
    data.email,
    data.telefono,
    data.operacion,
    data.tipoPropiedad,
    data.zona,
    data.presupuesto || '',
    data.mensaje || '',
    data.source || '',
    data.ip || '',
  ]);
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. Implementar > Nueva implementacion > Tipo: Web app > Acceso: Cualquier persona.
4. Copiar la URL `/exec` resultante y ponerla en `PUBLIC_LEAD_WEBHOOK_URL`.

### Opcion 2: Zapier

1. Crear un Zap con trigger **Webhooks by Zapier > Catch Hook**.
2. Copiar la URL del hook.
3. Agregar una action que cree una fila en Google Sheets / Notion / HubSpot / etc.
4. Pegar la URL en `PUBLIC_LEAD_WEBHOOK_URL`.

### Opcion 3: Make.com

1. Crear un nuevo Scenario con modulo **Webhooks > Custom webhook**.
2. Copiar la URL del webhook.
3. Encadenar modulos (Sheets, Email, Slack, CRM).
4. Pegar la URL en `PUBLIC_LEAD_WEBHOOK_URL`.

### Opcion 4: n8n (self-hosted)

1. Crear un nuevo Workflow con nodo **Webhook** (metodo POST).
2. Copiar la URL **Production** (no Test).
3. Encadenar nodos downstream (Sheets, Postgres, Email, Slack, etc.).
4. Pegar la URL en `PUBLIC_LEAD_WEBHOOK_URL`.

## Formulario y endpoint

- Cliente: `src/components/ContactForm.astro` envía `POST /api/lead` con `Content-Type: application/json`.
- Servidor: `src/pages/api/lead.ts` valida, persiste y dispara el webhook en fire-and-forget.
- Respuestas:
  - `201 { ok: true, id }` -> el cliente redirige a `/gracias?id=...`
  - `422 { ok: false, errors: [...] }` -> el cliente pinta errores inline en cada campo
  - `500` -> mensaje generico de error
- Honeypot: el campo `website` debe quedar vacio. Si viene relleno, el endpoint rechaza la solicitud.
- Sanitizacion: el endpoint aplica `trim`, valida longitud maxima y regex (`email`, `telefono`) antes de persistir.

## Accesibilidad

- Skip link al contenido principal (`Tab` desde la URL).
- Todos los inputs tienen `<label>` visible + `aria-live="polite"` en la region de estado.
- Foco visible (`outline: 2px solid var(--color-accent-600)`).
- Contraste: paleta bone + ink supera 4.5:1 en texto body y 3:1 en headings grandes.
- `prefers-reduced-motion: reduce` desactiva reveal-on-scroll y reduce todas las transiciones a 0.001ms.
- Menu mobile con `aria-expanded`, `aria-controls`, cierre con `Escape` y `focus()` de regreso al toggle.

## Performance

- CSS critical inlined via Tailwind v4 (no se carga runtime CSS).
- Sin JS framework para contenido estatico; unico client-side bundle: el listener de submit del form (~3 KB).
- Imagenes SVG inline (vectoriales, escalables, sin necesidad de `<Image>`).
- Reveal-on-scroll via `IntersectionObserver` (no `window.addEventListener('scroll')`).
- Transiciones animan solo `transform` y `opacity` (GPU-safe).
- Sin CSS frameworks extra: solo Tailwind v4 + tokens propios.

## SEO

- `title`, `description`, `canonical`, `og:*`, `twitter:*` por pagina.
- `<html lang="es">` + `og:locale = es_AR`.
- JSON-LD `RealEstateAgent` con direccion, telefono y horarios.
- Semantica: `<header>`, `<main>`, `<section aria-label>`, `<article>`, `<footer>`.

## Diseño

- **Lenguaje visual**: editorial-inmobiliario. Bone + ink + verde profundo como acento (paleta deliberadamente fuera del default AI beige+latón).
- **Tipografía**: Geist para UI y headings sans; Source Serif 4 italica para acentos editoriales. Ni Inter ni los serifs AI-default.
- **Layouts**: editorial split (hero), bento asimétrico 3-celdas (featured), lista numerada con sticky header (proceso), bento dark-band (stats), form full-width split en 2 columnas.
- **Componentes**: doble-bezel (`bezel` + `bezel__core` con sombra interna) para todos los cards y el form; pill CTAs con icono anidado en circulo.
- **Motion**: reveal-on-scroll + transiciones suaves con `cubic-bezier(0.32,0.72,0,1)`; respeta `prefers-reduced-motion`.

## Pendientes / Mejoras futuras

- Integracion real con Sheets / Zapier (solo documentado, no activado por defecto).
- Email transacional de confirmacion al usuario (hoy solo se muestra la pantalla `/gracias`).
- Rate limiting por IP en el endpoint (hoy solo hay honeypot basico).
- Tests E2E con Playwright para el flujo completo.
- CMS para que el equipo de Cumbre pueda editar propiedades sin tocar codigo.

## Licencia

Demo / portfolio personal. Codigo libre para adaptacion.
