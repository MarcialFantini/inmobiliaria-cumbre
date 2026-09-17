// ===========================================================
// Calculo de hipoteca - sistema frances (cuota fija).
// Cuota = P * (i * (1+i)^n) / ((1+i)^n - 1)
// Donde:
//   P = principal (monto del prestamo en USD)
//   i = tasa mensual (tasa anual / 12 / 100)
//   n = numero total de cuotas (plazo * 12)
// ===========================================================

export interface MortgageInput {
  principal: number;
  /** Tasa anual en porcentaje (ej: 6 = 6%). */
  tasaAnualPct: number;
  /** Plazo en anios. */
  plazoAnios: number;
}

export interface MortgageResult {
  cuotaMensual: number;
  totalPagado: number;
  totalIntereses: number;
  /** Para tabla: cuanto se paga de capital vs intereses en cada cuota. */
  cronograma: Array<{
    mes: number;
    cuota: number;
    interes: number;
    capital: number;
    saldo: number;
  }>;
}

/** Calcula hipoteca francesa. Edge cases: principal<=0 o plazo<=0 => zeros. */
export function calcularHipoteca(input: MortgageInput): MortgageResult {
  const { principal, tasaAnualPct, plazoAnios } = input;
  if (principal <= 0 || plazoAnios <= 0) {
    return { cuotaMensual: 0, totalPagado: 0, totalIntereses: 0, cronograma: [] };
  }

  const n = plazoAnios * 12;
  const i = tasaAnualPct / 100 / 12;

  // Caso degenerado: tasa 0 -> cuota = P / n.
  let cuota: number;
  if (i === 0) {
    cuota = principal / n;
  } else {
    const pow = Math.pow(1 + i, n);
    cuota = (principal * i * pow) / (pow - 1);
  }

  let saldo = principal;
  let totalPagado = 0;
  const cronograma: MortgageResult['cronograma'] = [];

  for (let mes = 1; mes <= n; mes++) {
    const interes = saldo * i;
    const cap = cuota - interes;
    saldo = Math.max(0, saldo - cap);
    totalPagado += cuota;
    cronograma.push({
      mes,
      cuota,
      interes,
      capital: cap,
      saldo,
    });
  }

  return {
    cuotaMensual: cuota,
    totalPagado,
    totalIntereses: totalPagado - principal,
    cronograma,
  };
}

/** Clamp util para inputs. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
