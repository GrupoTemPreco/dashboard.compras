import { pedidoContaNoKpiNaoFaturado, usesRegraPrazoMesAnterior } from '../compraRules';
import { fetchAllRowsSnapshot } from '../fetchRows';
import { supabase } from '../supabase';
import { toFirstOfMonthIso, type PeriodRange } from '../../utils/period';

export type CompraPedidoDetalheRow = {
  codigo_pedido: string;
  fornecedor: string;
  id_loja: number;
  data: string | null;
  status: string | null;
  prazo: number | null;
  valor: number;
};

type RawLine = {
  codigo_pedido: string | null;
  fornecedor: string | null;
  id_loja: number;
  data: string | null;
  status: string | null;
  prazo: number | null;
  valor: number | null;
  classificacao: string | null;
  mes_referencia_calculado: string | null;
};

const PAGE_SIZE = 1000;

async function fetchPedidosByClassificacao(classificacaoCodigo: string): Promise<{
  rows: RawLine[];
  error: { message: string } | null;
}> {
  const rows: RawLine[] = [];
  let from = 0;
  const cls = classificacaoCodigo.trim().toUpperCase();

  while (true) {
    const { data, error } = await supabase
      .from('pedidos_nao_faturados')
      .select(
        'codigo_pedido, fornecedor, id_loja, data, status, prazo, valor, classificacao, mes_referencia_calculado',
      )
      .eq('classificacao', cls)
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      return { rows: [], error: { message: `pedidos_nao_faturados: ${error.message}` } };
    }

    const page = (data ?? []) as RawLine[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return { rows, error: null };
}

function normalizeMes(iso: string | null | undefined): string {
  if (!iso?.trim()) return '';
  return toFirstOfMonthIso(iso);
}

function normalizeData(iso: string | null | undefined): string | null {
  if (!iso?.trim()) return null;
  return iso.trim().slice(0, 10);
}

/**
 * Busca pedidos da classificação na tabela bruta + ajustes,
 * calcula mes_referencia_final (COALESCE manual/calculado) e filtra
 * com pedidoContaNoKpiNaoFaturado + lojas permitidas.
 */
export async function fetchComprasPedidosDetalhe(params: {
  classificacaoCodigo: string;
  period: PeriodRange;
  allowedLojaIds: number[];
}): Promise<{ rows: CompraPedidoDetalheRow[]; total: number; error: { message: string } | null }> {
  const cls = params.classificacaoCodigo.trim().toUpperCase();
  if (!usesRegraPrazoMesAnterior(cls)) {
    return { rows: [], total: 0, error: { message: 'Classificação não suportada neste detalhe.' } };
  }

  const allowed = new Set(params.allowedLojaIds);

  const [rawRes, ajustesRes] = await Promise.all([
    fetchPedidosByClassificacao(cls),
    fetchAllRowsSnapshot<{ codigo_pedido: string; mes_referencia_manual: string | null }>(
      'pedidos_ajuste_mes_referencia',
      'codigo_pedido, mes_referencia_manual',
      'codigo_pedido',
    ),
  ]);

  if (rawRes.error) return { rows: [], total: 0, error: rawRes.error };
  if (ajustesRes.error) return { rows: [], total: 0, error: ajustesRes.error };

  const manualByCodigo = new Map<string, string>();
  for (const a of ajustesRes.rows) {
    const codigo = String(a.codigo_pedido ?? '').trim();
    const mes = normalizeMes(a.mes_referencia_manual);
    if (codigo && mes) manualByCodigo.set(codigo, mes);
  }

  const agg = new Map<string, CompraPedidoDetalheRow>();

  for (const row of rawRes.rows) {
    const codigo = String(row.codigo_pedido ?? '').trim();
    if (!codigo) continue;
    const id_loja = Number(row.id_loja);
    if (!allowed.has(id_loja)) continue;

    const calculado = normalizeMes(row.mes_referencia_calculado);
    const manual = manualByCodigo.get(codigo) ?? '';
    const mes_referencia_final =
      usesRegraPrazoMesAnterior(String(row.classificacao ?? '')) && manual
        ? manual
        : calculado;

    if (
      !pedidoContaNoKpiNaoFaturado(
        { mes_referencia_final, status: row.status },
        cls,
        params.period,
      )
    ) {
      continue;
    }

    const fornecedor = String(row.fornecedor ?? '').trim();
    const data = normalizeData(row.data);
    const status =
      row.status == null || String(row.status).trim() === ''
        ? null
        : String(row.status).trim();
    const prazo = row.prazo == null ? null : Number(row.prazo);
    const valor = Number(row.valor) || 0;
    const key = `${codigo}|${fornecedor}|${id_loja}|${data ?? ''}|${status ?? ''}|${prazo ?? ''}`;

    const cur = agg.get(key);
    if (cur) cur.valor += valor;
    else {
      agg.set(key, {
        codigo_pedido: codigo,
        fornecedor,
        id_loja,
        data,
        status,
        prazo,
        valor,
      });
    }
  }

  const rows = [...agg.values()].sort((a, b) => {
    const da = a.data ?? '';
    const db = b.data ?? '';
    if (da !== db) return db.localeCompare(da);
    return a.codigo_pedido.localeCompare(b.codigo_pedido, 'pt-BR');
  });

  const total = rows.reduce((s, r) => s + r.valor, 0);
  return { rows, total, error: null };
}
