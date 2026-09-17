/** @jsxImportSource preact */
import { useEffect, useState } from 'preact/hooks';
import { esFavorito, toggleFavorito } from '@/lib/favoritos';

// ===========================================================
// Boton de favorito. Cliente-only (lee localStorage).
// ===========================================================

interface Props {
  slug: string;
  variant?: 'icon' | 'pill';
  class?: string;
}

export default function FavoriteButton({ slug, variant = 'icon', class: className = '' }: Props) {
  const [active, setActive] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setActive(esFavorito(slug));
    setMounted(true);
    // Escuchar cambios desde otras islas.
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('inmobiliaria-cumbre:')) {
        setActive(esFavorito(slug));
      }
    };
    const onCustom = () => setActive(esFavorito(slug));
    window.addEventListener('storage', onStorage);
    window.addEventListener('inmobiliaria-cumbre:favoritos', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('inmobiliaria-cumbre:favoritos', onCustom);
    };
  }, [slug]);

  const onClick = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleFavorito(slug);
    setActive(next);
    window.dispatchEvent(new CustomEvent('inmobiliaria-cumbre:favoritos'));
  };

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={onClick}
        class={`inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-colors duration-500 ${
          active
            ? 'bg-cumbre-forest text-cumbre-bone border-cumbre-forest'
            : 'bg-cumbre-bone text-ink-900 border-ink-100 hover:border-cumbre-forest'
        } ${className}`}
        aria-pressed={mounted ? active : undefined}
        aria-label={active ? 'Quitar de favoritos' : 'Guardar como favorito'}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3.4.8-4.5 2.1C10.9 3.8 9.3 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" />
        </svg>
        <span class="text-sm">{active ? 'Guardado' : 'Guardar'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      class={`grid place-items-center w-10 h-10 rounded-full backdrop-blur-sm transition-all duration-500 ${
        active
          ? 'bg-cumbre-forest text-cumbre-bone hover:bg-cumbre-accent-700'
          : 'bg-cumbre-bone/90 text-ink-900 hover:bg-cumbre-bone border border-ink-100'
      } ${className}`}
      aria-pressed={mounted ? active : undefined}
      aria-label={active ? 'Quitar de favoritos' : 'Guardar como favorito'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3.4.8-4.5 2.1C10.9 3.8 9.3 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" />
      </svg>
    </button>
  );
}
