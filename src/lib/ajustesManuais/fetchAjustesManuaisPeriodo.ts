import { fetchAllRowsInPeriod } from '../fetchRows';
import type { PeriodRange } from '../../utils/period';
import type { AjusteManualRow } from './types';

type RawAjustePeriodo = {
  id_loja: number;
  classificacao: string | null;
  valor: number | null;
};

function normalizeCode(v: string | null | undefined): string {
  return (v ?? '').trim().toUpperCase();
}

function storeKey(idLoja: number, classificacao: string): string {
  return `${idLoja}|${normalizeCode(classificacao)}`;
}

/**
 * Soma ajustes_manuais_compras no período por (id_loja + classificacao).
 * mes_referencia filtrado via dateColumn (não a coluna `data`).
 */
export async function fetchAjustesManuaisByStore(
  period: PeriodRange,
): Promise<{
  byStore: Map<string, number>;
  error: { message: string } | null;
}> {
  const res = await fetchAllRowsInPeriod<RawAjustePeriodo>(
    'ajustes_manuais_compras',
    period,
    'id_loja, classificacao, valor',
    'id',
    'mes_referencia',
  );

  if (res.error) return { byStore: new Map(), error: res.error };

  const byStore = new Map<string, number>();
  for (const row of res.rows) {
    const cls = normalizeCode(row.classificacao);
    if (!cls) continue;
    const idLoja = Number(row.id_loja);
    if (Number.isNaN(idLoja)) continue;
    const key = storeKey(idLoja, cls);
    const valor = Number(row.valor) || 0;
    byStore.set(key, (byStore.get(key) ?? 0) + valor);
  }

  return { byStore, error: null };
}

export type { AjusteManualRow };
