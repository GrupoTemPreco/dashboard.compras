export interface PeriodRange {
  start: string;
  end: string;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getCurrentMonthPeriod(): PeriodRange {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: toIsoDate(start), end: toIsoDate(end) };
}

/** Período selecionado corresponde ao mês calendário atual. */
export function isCurrentCalendarMonth(period: PeriodRange, ref: Date = new Date()): boolean {
  const [y, m] = period.start.split('-').map(Number);
  return y === ref.getFullYear() && m === ref.getMonth() + 1;
}

/** Total de dias do mês calendário de `period.start`. */
export function getDaysInMonth(period: PeriodRange): number {
  const [y, m] = period.start.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

/**
 * Dias de venda no período:
 * - mês atual → dia de hoje (inclusive)
 * - mês passado/fechado → total de dias do mês
 */
export function getElapsedSaleDaysInMonth(period: PeriodRange, ref: Date = new Date()): number {
  const diasDoMes = getDaysInMonth(period);
  if (isCurrentCalendarMonth(period, ref)) {
    return ref.getDate();
  }
  return diasDoMes;
}

/** `null` = mês calendário atual (padrão do dashboard). */
export function resolvePeriod(range: PeriodRange | null): PeriodRange {
  return range ?? getCurrentMonthPeriod();
}

export function formatPeriodLabel(range: PeriodRange | null): string {
  const effective = resolvePeriod(range);
  const s = formatDateBr(effective.start);
  const e = formatDateBr(effective.end);
  if (s === e) return s;
  return `${s} – ${e}`;
}

export function formatDateBr(iso: string): string {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function isValidPeriod(range: PeriodRange): boolean {
  if (!range.start || !range.end) return false;
  return range.start <= range.end;
}

/** Mês calendário imediatamente anterior ao de `period.start`. */
export function getPreviousMonthPeriod(period: PeriodRange): PeriodRange {
  const [y, m] = period.start.split('-').map(Number);
  const ref = new Date(y, m - 1, 1);
  const prevStart = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);
  const prevEnd = new Date(ref.getFullYear(), ref.getMonth(), 0);
  return { start: toIsoDate(prevStart), end: toIsoDate(prevEnd) };
}
