import { usesRegraPrazoMesAnterior } from '../compraRules';
import { fetchAllRowsSnapshot } from '../fetchRows';
import { supabase } from '../supabase';
import { toFirstOfMonthIso } from '../../utils/period';

export type PedidoListaRow = {
  codigo_pedido: string;
  fornecedor: string;
  id_loja: number;
  prazo: number | null;
  data: string | null;
  status: string | null;
  valor_total: number;
  tem_ajuste: boolean;
};

export type PedidoBreakdownRow = {
  classificacao: string;
  prazo: number | null;
  valor: number;
  mes_referencia_final: string;
  /** Valor calculado (antes do override manual), para âncora do select. */
  mes_referencia_calculado: string;
  editavel: boolean;
};

type RawPedidoRow = {
  codigo_pedido: string | null;
  fornecedor: string | null;
  id_loja: number;
  prazo: number | null;
  data: string | null;
  status: string | null;
  classificacao: string | null;
  valor: number | null;
};

type RawBreakdownRow = {
  classificacao: string | null;
  prazo: number | null;
  valor: number | null;
  mes_referencia_calculado: string | null;
};

function normalizeMes(iso: string | null | undefined): string {
  if (!iso?.trim()) return '';
  return toFirstOfMonthIso(iso);
}

function normalizePedidoData(iso: string | null | undefined): string | null {
  if (!iso?.trim()) return null;
  return iso.trim().slice(0, 10);
}

/** Nível 1: só pedidos com Perfumaria/Oficinais; agrega valor de todas as classes + tem_ajuste. */
export async function fetchPedidosListaAjuste(): Promise<{
  pedidos: PedidoListaRow[];
  error: { message: string } | null;
}> {
  const [rawRes, ajustesRes] = await Promise.all([
    fetchAllRowsSnapshot<RawPedidoRow>(
      'pedidos_nao_faturados',
      'codigo_pedido, fornecedor, id_loja, prazo, data, status, classificacao, valor',
      'id',
    ),
    fetchAllRowsSnapshot<{ codigo_pedido: string }>(
      'pedidos_ajuste_mes_referencia',
      'codigo_pedido',
      'codigo_pedido',
    ),
  ]);

  if (rawRes.error) return { pedidos: [], error: rawRes.error };
  if (ajustesRes.error) return { pedidos: [], error: ajustesRes.error };

  const temAjuste = new Set(
    (ajustesRes.rows ?? []).map(r => String(r.codigo_pedido).trim()).filter(Boolean),
  );

  const codigosEditaveis = new Set<string>();
  for (const row of rawRes.rows) {
    const codigo = String(row.codigo_pedido ?? '').trim();
    if (!codigo) continue;
    if (usesRegraPrazoMesAnterior(String(row.classificacao ?? ''))) {
      codigosEditaveis.add(codigo);
    }
  }

  const map = new Map<string, PedidoListaRow>();
  for (const row of rawRes.rows) {
    const codigo = String(row.codigo_pedido ?? '').trim();
    if (!codigo || !codigosEditaveis.has(codigo)) continue;

    const fornecedor = String(row.fornecedor ?? '').trim();
    const id_loja = Number(row.id_loja);
    const prazo = row.prazo == null ? null : Number(row.prazo);
    const data = normalizePedidoData(row.data);
    const status = row.status == null || String(row.status).trim() === ''
      ? null
      : String(row.status).trim();
    const key = `${id_loja}|${codigo}|${fornecedor}|${prazo ?? ''}`;
    const cur = map.get(key);
    const valor = Number(row.valor) || 0;
    if (cur) {
      cur.valor_total += valor;
    } else {
      map.set(key, {
        codigo_pedido: codigo,
        fornecedor,
        id_loja,
        prazo,
        data,
        status,
        valor_total: valor,
        tem_ajuste: temAjuste.has(codigo),
      });
    }
  }

  const pedidos = [...map.values()].sort((a, b) => {
    const da = a.data ?? '';
    const db = b.data ?? '';
    if (da !== db) return db.localeCompare(da); // default: data desc
    if (a.id_loja !== b.id_loja) return a.id_loja - b.id_loja;
    return a.codigo_pedido.localeCompare(b.codigo_pedido, 'pt-BR');
  });

  return { pedidos, error: null };
}

/** Nível 2: breakdown por classificação/prazo de um codigo_pedido. */
export async function fetchPedidoBreakdown(codigoPedido: string): Promise<{
  rows: PedidoBreakdownRow[];
  error: { message: string } | null;
}> {
  const codigo = codigoPedido.trim();
  const [rawRes, ajusteRes] = await Promise.all([
    supabase
      .from('pedidos_nao_faturados')
      .select('classificacao, prazo, valor, mes_referencia_calculado')
      .eq('codigo_pedido', codigo)
      .order('classificacao', { ascending: true })
      .order('prazo', { ascending: true }),
    supabase
      .from('pedidos_ajuste_mes_referencia')
      .select('mes_referencia_manual')
      .eq('codigo_pedido', codigo)
      .maybeSingle(),
  ]);

  if (rawRes.error) {
    return { rows: [], error: { message: `pedidos_nao_faturados: ${rawRes.error.message}` } };
  }
  if (ajusteRes.error) {
    return {
      rows: [],
      error: { message: `pedidos_ajuste_mes_referencia: ${ajusteRes.error.message}` },
    };
  }

  const manual = normalizeMes(ajusteRes.data?.mes_referencia_manual ?? null);

  const agg = new Map<string, PedidoBreakdownRow>();
  for (const row of (rawRes.data ?? []) as RawBreakdownRow[]) {
    const classificacao = String(row.classificacao ?? '').trim();
    if (!classificacao) continue;
    const prazo = row.prazo == null ? null : Number(row.prazo);
    const calculado = normalizeMes(row.mes_referencia_calculado);
    if (!calculado) continue;

    const editavel = usesRegraPrazoMesAnterior(classificacao);
    const mesFinal = editavel && manual ? manual : calculado;
    const key = `${classificacao.toUpperCase()}|${prazo ?? ''}|${calculado}`;
    const valor = Number(row.valor) || 0;
    const cur = agg.get(key);
    if (cur) {
      cur.valor += valor;
    } else {
      agg.set(key, {
        classificacao,
        prazo,
        valor,
        mes_referencia_final: mesFinal,
        mes_referencia_calculado: calculado,
        editavel,
      });
    }
  }

  const rows = [...agg.values()].sort((a, b) =>
    a.classificacao.localeCompare(b.classificacao, 'pt-BR'),
  );

  return { rows, error: null };
}
