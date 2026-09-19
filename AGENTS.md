# AGENTS — Inmobiliaria Cumbre (proyecto 08)

Stack: Astro 7.3 + Preact 10 + @astrojs/node standalone + Leaflet + sharp + TS estricto.
Output: server (SSR). Adapter: @astrojs/node standalone.
Persistencia de leads: data/leads.json (write atómico via .tmp + rename). Webhook opcional vía env LEAD_WEBHOOK_URL.
Cliente ficticio: Inmobiliaria Cumbre (zona norte GBA).
Single source of truth: src/data/propiedades.json (15 propiedades), src/data/zonas.json, src/data/agentes.json.
Endpoints SSR: src/pages/api/lead.ts (POST con validación + honeypot).
Islands: client:only="preact" para PropertyMap (Leaflet toca window), client:visible para favoritos/mortgage.
