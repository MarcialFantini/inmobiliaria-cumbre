// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  integrations: [preact({ compat: false })],
  vite: {
    plugins: [tailwindcss()],
  },
});
