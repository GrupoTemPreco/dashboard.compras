import type { PeriodRange } from '../utils/period';

/** Ético / Bonificado: faturado (período) + pedidos Confirmado (snapshot). */
export function usesCompraFaturadoMaisConfirmado(classificacaoCodigo: string): boolean {
  const c = classificacaoCodigo.trim().toUpperCase();
  return c === 'ETICO' || c === 'BONIFICADO';
}

/** Perfumaria / Oficinais: filtram por mes_referencia_final no período (escorrega já no banco). */
export function usesRegraPrazoMesAnterior(classificacaoCodigo: string): boolean {
  const c = classificacaoCodigo.trim().toUpperCase();
  return c === 'PERFUMARIA' || c === 'OFICINAIS';
}

export function isPedidoInPeriod(dataIso: string, period: PeriodRange): boolean {
  return dataIso >= period.start && dataIso <= period.end;
}

/** Filtro exclusivo do KPI (compraMesNaoFaturado no StoreData). */
export function pedidoContaNoKpiNaoFaturado(
  row: {
    mes_referencia_final: string | null | undefined;
    status: string | null | undefined;
  },
  classificacaoCodigo: string,
  period: PeriodRange,
): boolean {
  const cls = classificacaoCodigo.trim().toUpperCase();
  const mes = row.mes_referencia_final?.trim();

  if (usesCompraFaturadoMaisConfirmado(cls)) {
    if (!mes) return false;
    return isPedidoInPeriod(mes, period) && isPedidoConfirmado(row.status);
  }

  if (usesRegraPrazoMesAnterior(cls)) {
    if (!mes) return false;
    return isPedidoInPeriod(mes, period);
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
  _compraMesNaoFaturadoConfirmado: number,
): number {
  if (usesCompraFaturadoMaisConfirmado(classificacaoCodigo)) {
    return compraMesFaturado;
  }
  return compraMesNaoFaturadoTotal;
}
