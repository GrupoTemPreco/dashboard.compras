import { fetchAllRowsSnapshot } from '../fetchRows';
import { toFirstOfMonthIso } from '../../utils/period';
import type { AjusteManualRow } from './types';

type RawAjuste = {
  id: number;
  id_loja: number;
  classificacao: string | null;
  fornecedor: string | null;
  prazo: number | null;
  valor: number | null;
  mes_referencia: string | null;
  observacao: string | null;
  criado_por: string | null;
  criado_em: string | null;
};

function mapRow(row: RawAjuste): AjusteManualRow | null {
  const id = Number(row.id);
  const id_loja = Number(row.id_loja);
  const classificacao = String(row.classificacao ?? '').trim().toUpperCase();
  const mes = row.mes_referencia?.trim()
    ? toFirstOfMonthIso(row.mes_referencia)
    : '';
  const observacao = String(row.observacao ?? '').trim();
  if (Number.isNaN(id) || Number.isNaN(id_loja) || !classificacao || !mes || !observacao) {
    return null;
  }
  return {
    id,
    id_loja,
    classificacao,
    fornecedor: row.fornecedor?.trim() ? row.fornecedor.trim() : null,
    prazo: row.prazo == null ? null : Number(row.prazo),
    valor: Number(row.valor) || 0,
    mes_referencia: mes,
    observacao,
    criado_por: row.criado_por?.trim() ? row.criado_por.trim() : null,
    criado_em: row.criado_em ?? '',
  };
}

/** Lista completa para o modal CRUD. */
export async function fetchAjustesManuaisLista(): Promise<{
  rows: AjusteManualRow[];
  error: { message: string } | null;
}> {
  const res = await fetchAllRowsSnapshot<RawAjuste>(
    'ajustes_manuais_compras',
    'id, id_loja, classificacao, fornecedor, prazo, valor, mes_referencia, observacao, criado_por, criado_em',
    'id',
  );
  if (res.error) return { rows: [], error: res.error };

  const rows = res.rows
    .map(mapRow)
    .filter((r): r is AjusteManualRow => r != null)
    .sort((a, b) => {
      const cmpMes = b.mes_referencia.localeCompare(a.mes_referencia);
      if (cmpMes !== 0) return cmpMes;
      return b.id - a.id;
    });

  return { rows, error: null };
}
