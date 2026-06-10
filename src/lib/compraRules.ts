import type { PeriodRange } from '../utils/period';

/** Ético / Bonificado: faturado (período) + pedidos Confirmado (snapshot). */
export function usesCompraFaturadoMaisConfirmado(classificacaoCodigo: string): boolean {
  const c = classificacaoCodigo.trim().toUpperCase();
  return c === 'ETICO' || c === 'BONIFICADO';
}

/** Perfumaria / Oficinais: regra de pedidos do fim do mês com prazo 63–90. */
export function usesRegraPrazoMesAnterior(classificacaoCodigo: string): boolean {
  const c = classificacaoCodigo.trim().toUpperCase();
  return c === 'PERFUMARIA' || c === 'OFICINAIS';
}

export function isPedidoInPeriod(dataIso: string, period: PeriodRange): boolean {
  return dataIso >= period.start && dataIso <= period.end;
}

function isPrazoEntre63e90(prazo: number): boolean {
  return prazo >= 63 && prazo <= 90;
}

function isDia28OuPosterior(dataIso: string): boolean {
  const day = Number(dataIso.split('-')[2]);
  return day >= 28;
}

function isPedidoFimMesComPrazoLongo(dataIso: string, prazo: number): boolean {
  return isDia28OuPosterior(dataIso) && isPrazoEntre63e90(prazo);
}

/** Filtro exclusivo do KPI (compraMesNaoFaturado no StoreData). */
export function pedidoContaNoKpiNaoFaturado(
  row: { data: string | null | undefined; prazo: number | null | undefined; status: string | null | undefined },
  classificacaoCodigo: string,
  period: PeriodRange,
  previousPeriod: PeriodRange,
): boolean {
  const cls = classificacaoCodigo.trim().toUpperCase();
  const data = row.data?.trim();
  const prazo = Number(row.prazo) || 0;

  if (usesCompraFaturadoMaisConfirmado(cls)) {
    if (!data) return false;
    return isPedidoInPeriod(data, period) && isPedidoConfirmado(row.status);
  }

  if (usesRegraPrazoMesAnterior(cls)) {
    if (!data) return false;
    if (isPedidoInPeriod(data, period)) {
      if (isPedidoFimMesComPrazoLongo(data, prazo)) return false;
      return true;
    }
    if (isPedidoInPeriod(data, previousPeriod)) {
      return isPedidoFimMesComPrazoLongo(data, prazo);
    }
    return false;
  }

  return true;
}

export function isPedidoConfirmado(status: string | null | undefined): boolean {
  return (status ?? '').trim().toLowerCase() === 'confirmado';
}

/** Valor da coluna Compras na tabela (níveis 1–3). */
export function computeCompraMesColuna(
  classificacaoCodigo: string,
  compraMesFaturado: number,
  compraMesNaoFaturadoTotal: number,
  compraMesNaoFaturadoConfirmado: number,
): number {
  if (usesCompraFaturadoMaisConfirmado(classificacaoCodigo)) {
    return compraMesFaturado + compraMesNaoFaturadoConfirmado;
  }
  return compraMesNaoFaturadoTotal;
}
