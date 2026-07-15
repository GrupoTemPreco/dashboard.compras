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

/** Exibe data/hora literal do ISO — importado_em já é horário de Brasília (mesmo com +00:00 no banco). */
export function formatDateTimeBr(iso: string): string {
  const m = iso.trim().match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!m) return iso;
  const [, year, month, day, hour, minute] = m;
  return `${day}/${month}/${year.slice(-2)} às ${hour}:${minute}`;
}

export function isValidPeriod(range: PeriodRange): boolean {
  if (!range.start || !range.end) return false;
  return range.start <= range.end;
}

/** Normaliza ISO date/datetime para o 1º dia do mês (`YYYY-MM-01`). */
export function toFirstOfMonthIso(iso: string): string {
  const m = iso.trim().match(/^(\d{4})-(\d{2})/);
  if (!m) return iso.trim().slice(0, 10);
  return `${m[1]}-${m[2]}-01`;
}

/** Soma (ou subtrai) meses a uma data ISO; resultado sempre no 1º dia. */
export function addMonthsIso(iso: string, deltaMonths: number): string {
  const base = toFirstOfMonthIso(iso);
  const [y, m] = base.split('-').map(Number);
  const d = new Date(y, m - 1 + deltaMonths, 1);
  return toIsoDate(d);
}

/** Label curto de mês: `jul/2026`. */
export function formatMesCurto(iso: string): string {
  const base = toFirstOfMonthIso(iso);
  const [y, m] = base.split('-').map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString('pt-BR', {
    month: 'short',
    year: 'numeric',
  });
  return label.replace(/\s*de\s*/i, '/').replace(/\./g, '').replace(/\s+/g, '').toLowerCase();
}
