// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://inmobiliaria-cumbre.example',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [preact({ compat: false }), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
