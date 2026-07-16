import { usesRegraPrazoMesAnterior } from '../compraRules';
import { fetchAllRowsSnapshot } from '../fetchRows';
import { fetchLojasPorId } from '../lojas';
import { supabase } from '../supabase';
import { toFirstOfMonthIso } from '../../utils/period';

export type PedidoListaRow = {
  codigo_pedido: string;
  fornecedor: string;
  id_loja: number;
  /** Código de negócio (lojas.company_code) — só para exibição. */
  company_code: string;
  prazo: number | null;
  data: string | null;
  status: string | null;
  /** Classes presentes nesta linha agregada (filtro do List). */
  classificacoes: string[];
  /** Mês vigente (manual do pedido ou calculado de linha editável). */
  mes_referencia_final: string;
  /** Soma de todas as classificações — exibição na lista. */
  valor_total: number;
  /** Soma por classificação — base para o rodapé com clsFixo. */
  valor_por_classificacao: Record<string, number>;
  /**
   * Soma só da classificação do contexto (clsFixo).
   * Preenchido em filterPedidosModal; 0 quando não há clsFixo.
   */
  valor_classificacao_contexto: number;
  tem_ajuste: boolean;
};

export type PedidoBreakdownRow = {
  classificacao: string;
  prazo: number | null;
  valor: number;
  mes_referencia_final: string;
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
  mes_referencia_calculado: string | null;
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

export function pedidoListaRowKey(p: PedidoListaRow): string {
  return `${p.id_loja}|${p.codigo_pedido}|${p.fornecedor}|${p.prazo ?? ''}|${p.data ?? ''}|${p.status ?? ''}`;
}

/**
 * Snapshot Nível 1: pedidos com ≥1 linha Perfumaria/Oficinais.
 * Valor total = todas as classes (incl. Ético/Bonificado).
 * Chave: pedido × loja × fornecedor × data × status × prazo (sem classificação).
 */
export async function fetchPedidosModalSnapshot(): Promise<{
  pedidos: PedidoListaRow[];
  error: { message: string } | null;
}> {
  const [rawRes, ajustesRes, lojasRes] = await Promise.all([
    fetchAllRowsSnapshot<RawPedidoRow>(
      'pedidos_nao_faturados',
      'codigo_pedido, fornecedor, id_loja, prazo, data, status, classificacao, valor, mes_referencia_calculado',
      'id',
    ),
    fetchAllRowsSnapshot<{ codigo_pedido: string; mes_referencia_manual: string | null }>(
      'pedidos_ajuste_mes_referencia',
      'codigo_pedido, mes_referencia_manual',
      'codigo_pedido',
    ),
    fetchLojasPorId(),
  ]);

  if (rawRes.error) return { pedidos: [], error: rawRes.error };
  if (ajustesRes.error) return { pedidos: [], error: ajustesRes.error };
  if (lojasRes.error) return { pedidos: [], error: lojasRes.error };

  const manualByCodigo = new Map<string, string>();
  const temAjuste = new Set<string>();
  for (const a of ajustesRes.rows) {
    const codigo = String(a.codigo_pedido ?? '').trim();
    if (!codigo) continue;
    temAjuste.add(codigo);
    const mes = normalizeMes(a.mes_referencia_manual);
    if (mes) manualByCodigo.set(codigo, mes);
  }

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

    const classificacaoRaw = String(row.classificacao ?? '').trim();
    const classificacao = classificacaoRaw.toUpperCase();
    const editavel = usesRegraPrazoMesAnterior(classificacao);
    const calculado = normalizeMes(row.mes_referencia_calculado);
    const manual = manualByCodigo.get(codigo) ?? '';
    const mesEditavel = editavel ? manual || calculado : '';

    const fornecedor = String(row.fornecedor ?? '').trim();
    const id_loja = Number(row.id_loja);
    const company_code = lojasRes.byId.get(id_loja)?.company_code?.trim() ?? '';
    const prazo = row.prazo == null ? null : Number(row.prazo);
    const data = normalizePedidoData(row.data);
    const status =
      row.status == null || String(row.status).trim() === ''
        ? null
        : String(row.status).trim();
    const key = `${id_loja}|${codigo}|${fornecedor}|${prazo ?? ''}|${data ?? ''}|${status ?? ''}`;
    const valor = Number(row.valor) || 0;

    const cur = map.get(key);
    if (cur) {
      cur.valor_total += valor;
      if (classificacao) {
        cur.valor_por_classificacao[classificacao] =
          (cur.valor_por_classificacao[classificacao] ?? 0) + valor;
        if (!cur.classificacoes.includes(classificacao)) {
          cur.classificacoes.push(classificacao);
        }
      }
      if (mesEditavel) {
        cur.mes_referencia_final = manual || cur.mes_referencia_final || mesEditavel;
      }
    } else {
      map.set(key, {
        codigo_pedido: codigo,
        fornecedor,
        id_loja,
        company_code,
        prazo,
        data,
        status,
        classificacoes: classificacao ? [classificacao] : [],
        mes_referencia_final: mesEditavel,
        valor_total: valor,
        valor_por_classificacao: classificacao ? { [classificacao]: valor } : {},
        valor_classificacao_contexto: 0,
        tem_ajuste: temAjuste.has(codigo),
      });
    }
  }

  const pedidos = [...map.values()].sort((a, b) => {
    const da = a.data ?? '';
    const db = b.data ?? '';
    if (da !== db) return db.localeCompare(da);
    if (a.id_loja !== b.id_loja) return a.id_loja - b.id_loja;
    return a.codigo_pedido.localeCompare(b.codigo_pedido, 'pt-BR');
  });

  return { pedidos, error: null };
}

/** Breakdown por classificação/prazo de um codigo_pedido (todas as classes). */
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
