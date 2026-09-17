/** @jsxImportSource preact */
import { useMemo, useState } from 'preact/hooks';
import { calcularHipoteca, clamp } from '@/lib/mortgage';
import { formatUSD } from '@/lib/format';

// ===========================================================
// Calculadora de hipoteca - sistema frances.
// Componente Preact (interactivo) usado como isla con client:load.
// ===========================================================

const PLAZOS = [10, 15, 20, 25, 30] as const;
const TASAS = [4, 5, 6, 7, 8] as const;

interface Props {
  /** Precio inicial en USD. Si no se pasa, default 200000. */
  defaultPrecio?: number;
  /** Slug o titulo de la propiedad (solo display). */
  propertyLabel?: string;
}

export default function MortgageCalculator({
  defaultPrecio = 200000,
  propertyLabel,
}: Props) {
  const [precio, setPrecio] = useState<number>(defaultPrecio);
  const [plazo, setPlazo] = useState<(typeof PLAZOS)[number]>(20);
  const [tasa, setTasa] = useState<(typeof TASAS)[number]>(6);
  const [showCronograma, setShowCronograma] = useState(false);

  const result = useMemo(
    () =>
      calcularHipoteca({
        principal: Math.max(0, precio),
        tasaAnualPct: tasa,
        plazoAnios: plazo,
      }),
    [precio, tasa, plazo],
  );

  // Resumen anual (12 cuotas) en lugar de las 240/360 filas para no abrumar.
  const resumenAnual = useMemo(() => {
    const c = result.cronograma;
    if (!c.length) return [];
    const grupos: Array<{ anio: number; pagado: number; interes: number; capital: number; saldo: number }> = [];
    for (let i = 0; i < c.length; i += 12) {
      const slice = c.slice(i, i + 12);
      const interes = slice.reduce((acc, m) => acc + m.interes, 0);
      const capital = slice.reduce((acc, m) => acc + m.capital, 0);
      grupos.push({
        anio: Math.floor(i / 12) + 1,
        pagado: interes + capital,
        interes,
        capital,
        saldo: slice[slice.length - 1].saldo,
      });
    }
    return grupos;
  }, [result]);

  return (
    <div class="bezel">
      <div class="bezel__core p-6 sm:p-8 md:p-10">
        <header class="mb-8">
          <p class="text-eyebrow text-ink-500">Calculadora</p>
          <h3 class="mt-3 text-display-3 text-cumbre-ink">
            {propertyLabel ? `Cuota estimada para ${propertyLabel}` : 'Cuota mensual estimada'}
          </h3>
          <p class="mt-2 text-sm text-ink-500">
            Sistema franc&eacute;s, c&aacute;lculo referencial. La cuota real depende del banco y de tu historial crediticio.
          </p>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Precio */}
          <div class="field">
            <label class="field__label" for="mc-precio">Precio (USD)</label>
            <input
              id="mc-precio"
              type="number"
              min={0}
              step={1000}
              class="field__input"
              value={precio}
              onInput={(e) =>
                setPrecio(clamp(Number((e.currentTarget as HTMLInputElement).value) || 0, 0, 10_000_000))
              }
            />
            <p class="field__hint">Ingres&aacute; el valor total de la propiedad.</p>
          </div>

          {/* Plazo */}
          <div class="field">
            <label class="field__label" for="mc-plazo">Plazo (a&ntilde;os)</label>
            <select
              id="mc-plazo"
              class="field__select"
              value={plazo}
              onChange={(e) =>
                setPlazo(Number((e.currentTarget as HTMLSelectElement).value) as (typeof PLAZOS)[number])
              }
            >
              {PLAZOS.map((p) => (
                <option value={p}>{p} a&ntilde;os</option>
              ))}
            </select>
            <p class="field__hint">{plazo * 12} cuotas mensuales.</p>
          </div>

          {/* Tasa */}
          <div class="field">
            <label class="field__label" for="mc-tasa">Tasa anual (%)</label>
            <select
              id="mc-tasa"
              class="field__select"
              value={tasa}
              onChange={(e) =>
                setTasa(Number((e.currentTarget as HTMLSelectElement).value) as (typeof TASAS)[number])
              }
            >
              {TASAS.map((t) => (
                <option value={t}>{t}% anual</option>
              ))}
            </select>
            <p class="field__hint">Tasa nominal anual de referencia.</p>
          </div>
        </div>

        {/* Resumen destacado */}
        <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="rounded-2xl bg-cumbre-ink text-cumbre-bone p-5 sm:p-6">
            <p class="text-[11px] font-mono uppercase tracking-[0.18em] text-accent-200">
              Cuota mensual
            </p>
            <p class="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight tabular-nums">
              {formatUSD(result.cuotaMensual, true)}
            </p>
          </div>
          <div class="rounded-2xl bg-bone-100 p-5 sm:p-6 border border-ink-100">
            <p class="text-[11px] font-mono uppercase tracking-[0.18em] text-ink-500">
              Total a pagar
            </p>
            <p class="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums text-ink-900">
              {formatUSD(result.totalPagado)}
            </p>
          </div>
          <div class="rounded-2xl bg-bone-100 p-5 sm:p-6 border border-ink-100">
            <p class="text-[11px] font-mono uppercase tracking-[0.18em] text-ink-500">
              Total intereses
            </p>
            <p class="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums text-ink-900">
              {formatUSD(result.totalIntereses)}
            </p>
          </div>
        </div>

        {/* Disclaimer + toggle cronograma */}
        <div class="mt-8 pt-6 border-t border-ink-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p class="text-xs text-ink-500 max-w-[60ch]">
            C&aacute;lculo referencial. La cuota real depende del banco, tu historial crediticio y las condiciones del solicitante.
            No incluye seguros ni gastos administrativos.
          </p>
          <button
            type="button"
            class="text-sm text-cumbre-forest font-medium hover:underline self-start"
            onClick={() => setShowCronograma((s) => !s)}
            aria-expanded={showCronograma}
          >
            {showCronograma ? 'Ocultar' : 'Ver'} detalle por a&ntilde;o
          </button>
        </div>

        {/* Cronograma anual */}
        {showCronograma && resumenAnual.length > 0 && (
          <div class="mt-6 overflow-x-auto rounded-2xl border border-ink-100">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-bone-100 text-ink-500 text-[11px] font-mono uppercase tracking-[0.16em]">
                  <th class="text-left py-3 px-4 font-medium">A&ntilde;o</th>
                  <th class="text-right py-3 px-4 font-medium">Cuota anual</th>
                  <th class="text-right py-3 px-4 font-medium">Capital</th>
                  <th class="text-right py-3 px-4 font-medium">Inter&eacute;s</th>
                  <th class="text-right py-3 px-4 font-medium">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {resumenAnual.map((row, i) => (
                  <tr
                    key={row.anio}
                    class={`border-t border-ink-100 ${i % 2 === 0 ? 'bg-cumbre-bone' : 'bg-bone-50'}`}
                  >
                    <td class="py-2.5 px-4 font-mono tabular-nums">{String(row.anio).padStart(2, '0')}</td>
                    <td class="py-2.5 px-4 text-right tabular-nums">{formatUSD(row.pagado)}</td>
                    <td class="py-2.5 px-4 text-right tabular-nums text-cumbre-forest">
                      {formatUSD(row.capital)}
                    </td>
                    <td class="py-2.5 px-4 text-right tabular-nums text-ink-500">{formatUSD(row.interes)}</td>
                    <td class="py-2.5 px-4 text-right tabular-nums text-ink-700">{formatUSD(row.saldo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
