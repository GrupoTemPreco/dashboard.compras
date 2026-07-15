import {
  computeCompraMesColuna,
  isPedidoConfirmado,
  pedidoContaNoKpiNaoFaturado,
  usesCompraFaturadoMaisConfirmado,
} from './compraRules';
import { fetchAllRowsInPeriod, fetchAllRowsSnapshot } from './fetchRows';
import { weightedCmvPercent, emptyComprasTotals, computeDerivedCompraFields } from './aggregateMetrics';
import {
  getDaysInMonth,
  getElapsedSaleDaysInMonth,
  type PeriodRange,
} from '../utils/period';
import type { CurveData, EstoqueData, StoreData } from '../data/mockData';

function normalizeCode(v: string | null | undefined): string {
  return (v ?? '').trim().toUpperCase();
}

function normalizeCurve(v: string | null | undefined): string {
  return (v ?? '').trim();
}

function curveKey(idLoja: number, classificacao: string, curva: string): string {
  return `${idLoja}|${normalizeCode(classificacao)}|${normalizeCurve(curva)}`;
}

function storeKey(idLoja: number, classificacao: string): string {
  return `${idLoja}|${normalizeCode(classificacao)}`;
}

type ClassificacaoRow = { id?: number; codigo: string; nome: string };

type LojaRow = { id_loja: number; company_code: string | null; grupo: string | null };

type VendaRow = {
  id_loja: number;
  classificacao: string;
  curva: string;
  venda: number | null;
  cmv_percentual: number | null;
};

type CompraFaturadaRow = {
  id_loja: number;
  classificacao: string;
  curva: string;
  valor: number | null;
};

type PedidoRow = {
  id_loja: number;
  classificacao: string;
  curva: string;
  status: string | null;
  valor: number | null;
  mes_referencia_final: string | null;
};

type EstoqueRow = {
  id_loja: number;
  classificacao: string;
  curva: string;
  data: string;
  estoque_unid: number | null;
  custo: number | null;
  participacao: number | null;
};

interface CurveBucket {
  compras: ReturnType<typeof emptyComprasTotals>;
  cmvPonderadoAcc: number;
  compraMesFaturado: number;
  compraMesNaoFaturado: number;
  compraMesNaoFaturadoConfirmado: number;
}

interface PedidosSnapshotMaps {
  total: Map<string, number>;
  confirmado: Map<string, number>;
}

function getOrCreateCurveBucket(
  map: Map<string, CurveBucket>,
  idLoja: number,
  classificacao: string,
  curva: string,
): CurveBucket {
  const key = curveKey(idLoja, classificacao, curva);
  let bucket = map.get(key);
  if (!bucket) {
    bucket = {
      compras: emptyComprasTotals(),
      cmvPonderadoAcc: 0,
      compraMesFaturado: 0,
      compraMesNaoFaturado: 0,
      compraMesNaoFaturadoConfirmado: 0,
    };
    map.set(key, bucket);
  }
  return bucket;
}

function buildEstoqueSnapshotMap(rows: EstoqueRow[]): Map<string, EstoqueRow> {
  const latest = new Map<string, { data: string; row: EstoqueRow }>();
  for (const row of rows) {
    const cls = normalizeCode(row.classificacao);
    const curva = normalizeCurve(row.curva);
    if (!cls || !curva) continue;

    const key = curveKey(row.id_loja, cls, curva);
    const cur = latest.get(key);
    if (!cur || row.data >= cur.data) {
      latest.set(key, { data: row.data, row });
    }
  }
  return new Map([...latest.entries()].map(([k, v]) => [k, v.row]));
}

function buildPedidosSnapshotMaps(rows: PedidoRow[], period: PeriodRange): PedidosSnapshotMaps {
  const total = new Map<string, number>();
  const confirmado = new Map<string, number>();

  for (const row of rows) {
    const cls = normalizeCode(row.classificacao);
    const curva = normalizeCurve(row.curva);
    if (!cls || !curva) continue;

    if (!pedidoContaNoKpiNaoFaturado(row, cls, period)) continue;

    const key = curveKey(row.id_loja, cls, curva);
    const valor = Number(row.valor) || 0;

    if (usesCompraFaturadoMaisConfirmado(cls)) {
      confirmado.set(key, (confirmado.get(key) ?? 0) + valor);
    } else {
      total.set(key, (total.get(key) ?? 0) + valor);
      if (isPedidoConfirmado(row.status)) {
        confirmado.set(key, (confirmado.get(key) ?? 0) + valor);
      }
    }
  }

  return { total, confirmado };
}

/** Soma filtrada para o card KPI — não altera buckets/curvas da tabela. */
function buildKpiCompraMesNaoFaturadoByStore(
  rows: PedidoRow[],
  period: PeriodRange,
): Map<string, number> {
  const totals = new Map<string, number>();

  for (const row of rows) {
    const cls = normalizeCode(row.classificacao);
    if (!cls) continue;

    if (!pedidoContaNoKpiNaoFaturado(row, cls, period)) continue;

    const key = storeKey(row.id_loja, cls);
    const valor = Number(row.valor) || 0;
    totals.set(key, (totals.get(key) ?? 0) + valor);
  }

  return totals;
}

function estoqueDataFromSnapshot(
  snapshot: Map<string, EstoqueRow>,
  idLoja: number,
  classificacaoCodigo: string,
  curva: string,
  cmvPonderadoAcc: number,
): EstoqueData {
  const row = snapshot.get(curveKey(idLoja, classificacaoCodigo, curva));
  return {
    estoqueAtualUnid: row?.estoque_unid ?? 0,
    custo: row?.custo ?? 0,
    participacao: row?.participacao ?? 0,
    diasEstoque: 0,
    estoqueRealizadoVendaAtual: cmvPonderadoAcc / 100,
  };
}

function resolveCompraFields(
  bucket: CurveBucket | undefined,
  pedidosMaps: PedidosSnapshotMaps,
  idLoja: number,
  classificacaoCodigo: string,
  curva: string,
) {
  const key = curveKey(idLoja, classificacaoCodigo, curva);
  const compraMesFaturado = bucket?.compraMesFaturado ?? 0;
  const compraMesNaoFaturado = bucket?.compraMesNaoFaturado ?? pedidosMaps.total.get(key) ?? 0;
  const compraMesNaoFaturadoConfirmado =
    bucket?.compraMesNaoFaturadoConfirmado ?? pedidosMaps.confirmado.get(key) ?? 0;
  const compraMes = computeCompraMesColuna(
    classificacaoCodigo,
    compraMesFaturado,
    compraMesNaoFaturado,
    compraMesNaoFaturadoConfirmado,
  );

  return { compraMesFaturado, compraMesNaoFaturado, compraMes };
}

function bucketToCurveData(
  curveCode: string,
  bucket: CurveBucket | undefined,
  pedidosMaps: PedidosSnapshotMaps,
  estoqueSnapshot: Map<string, EstoqueRow>,
  idLoja: number,
  classificacaoCodigo: string,
  diasDoMes: number,
  diasDeVenda: number,
): CurveData {
  const compra = resolveCompraFields(bucket, pedidosMaps, idLoja, classificacaoCodigo, curveCode);
  const vendaMes = bucket?.compras.vendaMes ?? 0;
  const cmv = vendaMes > 0 ? (bucket?.cmvPonderadoAcc ?? 0) / vendaMes : 0;
  const derived = computeDerivedCompraFields(vendaMes, compra.compraMes, cmv, diasDoMes, diasDeVenda);

  return {
    curve: curveCode,
    vendaMes,
    compraMesFaturado: compra.compraMesFaturado,
    compraMesNaoFaturado: compra.compraMesNaoFaturado,
    compraMes: compra.compraMes,
    cmv,
    ...derived,
    estoque: estoqueDataFromSnapshot(
      estoqueSnapshot,
      idLoja,
      classificacaoCodigo,
      curveCode,
      bucket?.cmvPonderadoAcc ?? 0,
    ),
  };
}

export type DashboardCatalogError = {
  message: string;
  details?: unknown;
};

export async function fetchDashboardCatalog(period: PeriodRange): Promise<{
  stores: StoreData[];
  classificationOrder: string[];
  curveCodes: string[];
  diasDoMes: number;
  diasDeVenda: number;
  error: DashboardCatalogError | null;
}> {
  const warnings: string[] = [];
  const diasDoMes = getDaysInMonth(period);
  const diasDeVenda = getElapsedSaleDaysInMonth(period);

  const [clsRes, curvasRes, lojasRes] = await Promise.all([
    fetchAllRowsSnapshot<ClassificacaoRow>('classificacoes', 'id, codigo, nome').then(r => ({
      data: r.rows.sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR')),
      error: r.error,
    })),
    fetchAllRowsSnapshot<{ codigo: string }>('curvas', 'codigo', 'codigo'),
    fetchAllRowsSnapshot<LojaRow>('lojas', 'id_loja, company_code, grupo', 'id_loja'),
  ]);

  if (clsRes.error) warnings.push(`Classificações: ${clsRes.error.message}`);
  if (curvasRes.error) warnings.push(`Curvas: ${curvasRes.error.message}`);
  if (lojasRes.error) warnings.push(`Lojas: ${lojasRes.error.message}`);

  const classificacoes = clsRes.data ?? [];
  const nomePorCodigo = new Map(
    classificacoes.map(c => [normalizeCode(c.codigo), String(c.nome)]),
  );
  const classificationOrder = classificacoes.map(c => String(c.nome));

  const curveCodes = (curvasRes.rows ?? [])
    .map(r => normalizeCurve(r.codigo))
    .filter(c => c !== '')
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const lojasPorId = new Map<number, LojaRow>();
  for (const loja of lojasRes.rows ?? []) {
    lojasPorId.set(loja.id_loja, loja);
  }

  const curveBuckets = new Map<string, CurveBucket>();
  const storePairs = new Set<string>();

  const [vendasRes, comprasRes, pedidosRes, estoqueRes] = await Promise.all([
    fetchAllRowsInPeriod<VendaRow>(
      'vendas',
      period,
      'id_loja, classificacao, curva, venda, cmv_percentual',
    ),
    fetchAllRowsInPeriod<CompraFaturadaRow>(
      'compras_faturadas',
      period,
      'id_loja, classificacao, curva, valor',
    ),
    fetchAllRowsSnapshot<PedidoRow>(
      'pedidos_nao_faturados_view',
      'id_loja, classificacao, curva, status, valor, mes_referencia_final',
      [
        'id_loja',
        'classificacao',
        'curva',
        'status',
        'prazo',
        'mes_referencia_final',
      ],
    ),
    fetchAllRowsSnapshot<EstoqueRow>(
      'estoque',
      'id_loja, classificacao, curva, data, estoque_unid, custo, participacao',
    ),
  ]);

  if (vendasRes.error) warnings.push(vendasRes.error.message);
  if (comprasRes.error) warnings.push(comprasRes.error.message);
  if (pedidosRes.error) warnings.push(pedidosRes.error.message);
  if (estoqueRes.error) warnings.push(estoqueRes.error.message);

  const estoqueSnapshot = buildEstoqueSnapshotMap(estoqueRes.rows);
  const pedidosMaps = buildPedidosSnapshotMaps(pedidosRes.rows, period);
  const kpiCompraMesNaoFaturadoByStore = buildKpiCompraMesNaoFaturadoByStore(pedidosRes.rows, period);

  for (const row of pedidosRes.rows) {
    const cls = normalizeCode(row.classificacao);
    const curva = normalizeCurve(row.curva);
    if (!cls || !curva) continue;

    if (!pedidoContaNoKpiNaoFaturado(row, cls, period)) continue;

    const bucket = getOrCreateCurveBucket(curveBuckets, row.id_loja, cls, curva);
    const valor = Number(row.valor) || 0;

    if (usesCompraFaturadoMaisConfirmado(cls)) {
      bucket.compraMesNaoFaturadoConfirmado += valor;
    } else {
      bucket.compraMesNaoFaturado += valor;
      if (isPedidoConfirmado(row.status)) {
        bucket.compraMesNaoFaturadoConfirmado += valor;
      }
    }
  }

  for (const row of comprasRes.rows) {
    const cls = normalizeCode(row.classificacao);
    const curva = normalizeCurve(row.curva);
    if (!cls || !curva) continue;

    storePairs.add(storeKey(row.id_loja, cls));
    const bucket = getOrCreateCurveBucket(curveBuckets, row.id_loja, cls, curva);
    bucket.compraMesFaturado += Number(row.valor) || 0;
  }

  for (const row of vendasRes.rows) {
    const cls = normalizeCode(row.classificacao);
    const curva = normalizeCurve(row.curva);
    if (!cls || !curva) continue;

    storePairs.add(storeKey(row.id_loja, cls));
    const bucket = getOrCreateCurveBucket(curveBuckets, row.id_loja, cls, curva);
    const venda = Number(row.venda) || 0;
    const cmvPct = Number(row.cmv_percentual) || 0;
    bucket.compras.vendaMes += venda;
    bucket.cmvPonderadoAcc += cmvPct * venda;
  }

  const stores: StoreData[] = [];

  for (const pairKey of storePairs) {
    const [idLojaStr, clsCodigo] = pairKey.split('|');
    const idLoja = Number(idLojaStr);
    const classificationNome = nomePorCodigo.get(clsCodigo) ?? clsCodigo;
    const loja = lojasPorId.get(idLoja);

    const companyCode = loja?.company_code?.trim() ?? '';
    const displayName = companyCode ? `Loja ${companyCode}` : 'Loja —';
    const grupo = loja?.grupo?.trim() ?? 'Sem grupo';

    const curves: CurveData[] = curveCodes.map(code =>
      bucketToCurveData(
        code,
        curveBuckets.get(curveKey(idLoja, clsCodigo, code)),
        pedidosMaps,
        estoqueSnapshot,
        idLoja,
        clsCodigo,
        diasDoMes,
        diasDeVenda,
      ),
    );

    const compraMesFaturado = curves.reduce((s, c) => s + c.compraMesFaturado, 0);
    const compraMesNaoFaturado = kpiCompraMesNaoFaturadoByStore.get(storeKey(idLoja, clsCodigo)) ?? 0;
    const compraMes = curves.reduce((s, c) => s + c.compraMes, 0);
    const vendaMes = curves.reduce((s, c) => s + c.vendaMes, 0);

    stores.push({
      id: `${idLoja}_${clsCodigo}`,
      baseId: String(idLoja),
      name: displayName,
      group: grupo,
      classification: classificationNome,
      classificationCodigo: clsCodigo,
      vendaMes,
      compraMesFaturado,
      compraMesNaoFaturado,
      compraMes,
      cmv: weightedCmvPercent(curves),
      vendaProjetada: curves.reduce((s, c) => s + c.vendaProjetada, 0),
      limiteCompra: curves.reduce((s, c) => s + c.limiteCompra, 0),
      saldoCompra: curves.reduce((s, c) => s + c.saldoCompra, 0),
      cmvIdealVendaAtual: curves.reduce((s, c) => s + c.cmvIdealVendaAtual, 0),
      cmvProjetado: curves.reduce((s, c) => s + c.cmvProjetado, 0),
      diferencaCompraIdeal: curves.reduce((s, c) => s + c.diferencaCompraIdeal, 0),
      projecaoCompraIdeal: curves.reduce((s, c) => s + c.projecaoCompraIdeal, 0),
      curves,
    });
  }

  const error =
    warnings.length > 0 && stores.length === 0
      ? { message: warnings.join(' · '), details: warnings }
      : warnings.length > 0
        ? { message: warnings.join(' · ') }
        : null;

  return { stores, classificationOrder, curveCodes, diasDoMes, diasDeVenda, error };
}
