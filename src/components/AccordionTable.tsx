import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, List } from 'lucide-react';
import {
  comprasTotalsFromStores,
  cmvRoundedForCalculo,
  computeCmvLimiteFromAgregado,
  type ComprasTotals,
} from '../lib/aggregateMetrics';
import { usesRegraPrazoMesAnterior } from '../lib/compraRules';
import { theme, formatCurrency, formatPercent, valueColor, cmvColor, curveColor, daysColor, situationDot } from '../utils/theme';
import type { StoreData, CurveData } from '../data/mockData';

export type ComprasDetalheOpenPayload = {
  classificacaoCodigo: string;
  classificacaoNome: string;
  comprasEsperado: number;
  allowedLojaIds: number[];
};

interface AccordionTableProps {
  stores: StoreData[];
  classificationOrder?: string[];
  diasDoMes: number;
  diasDeVenda: number;
  onOpenComprasDetalhe?: (payload: ComprasDetalheOpenPayload) => void;
}

function buildDisplayTotals(
  totals: ComprasTotals,
  cmvCampos: ReturnType<typeof computeCmvLimiteFromAgregado>,
  diasDoMes: number,
  diasDeVenda: number,
): ComprasTotals {
  const diasVenda = diasDeVenda > 0 ? diasDeVenda : 1;
  const saldoCompra = cmvCampos.limiteCompra - totals.compraMes;
  const diferencaCompraIdeal = cmvCampos.cmvIdealVendaAtual - totals.compraMes;
  const projecaoCompraIdeal = (diferencaCompraIdeal / diasVenda) * diasDoMes;

  return {
    ...totals,
    ...cmvCampos,
    saldoCompra,
    diferencaCompraIdeal,
    projecaoCompraIdeal,
  };
}

const STORE_COLS = [
  { key: 'vendaMes', label: 'Venda mês' },
  { key: 'compraMes', label: 'Compras' },
  { key: 'cmv', label: 'CMV %' },
  { key: 'vendaProjetada', label: 'Venda proj.' },
  { key: 'limiteCompra', label: 'Limite x proj.' },
  { key: 'saldoCompra', label: 'Saldo compra' },
  { key: 'cmvIdealVendaAtual', label: 'CMV ideal' },
  { key: 'cmvProjetado', label: 'CMV proj.' },
  { key: 'diferencaCompraIdeal', label: 'Dif. compra x ideal' },
  { key: 'projecaoCompraIdeal', label: 'Proj. compra x ideal' },
] as const;

const GRID_COLS =
  '2rem 1.5rem minmax(140px, 1.5fr) ' + STORE_COLS.map(() => 'minmax(90px, 1fr)').join(' ');

export default function AccordionTable({
  stores,
  classificationOrder = [],
  diasDoMes,
  diasDeVenda,
  onOpenComprasDetalhe,
}: AccordionTableProps) {
  const [expandedCls, setExpandedCls] = useState<Set<string>>(new Set());
  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());

  const sections = useMemo(() => {
    const byCls = new Map<string, StoreData[]>();
    for (const s of stores) {
      const list = byCls.get(s.classification) ?? [];
      list.push(s);
      byCls.set(s.classification, list);
    }

    const names =
      classificationOrder.length > 0
        ? [...classificationOrder]
        : [...byCls.keys()].sort((a, b) => a.localeCompare(b, 'pt-BR'));

    return names.map(classification => ({
      classification,
      stores: byCls.get(classification) ?? [],
    }));
  }, [stores, classificationOrder]);

  const toggleCls = (cls: string) => {
    setExpandedCls(prev => {
      const next = new Set(prev);
      if (next.has(cls)) next.delete(cls);
      else next.add(cls);
      return next;
    });
  };

  const toggleStore = (id: string) => {
    setExpandedStores(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="rounded-lg overflow-hidden" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
      <div
        className="grid items-center gap-0 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider sticky top-0 z-10"
        style={{
          gridTemplateColumns: GRID_COLS,
          backgroundColor: '#0b1120',
          color: theme.textSecondary,
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        <span /><span />
        <span>Nome</span>
        {STORE_COLS.map(h => (
          <span key={h.key} className="text-right">{h.label}</span>
        ))}
      </div>

      {sections.map(({ classification: cls, stores: clsStores }) => {
        const clsTotals = comprasTotalsFromStores(clsStores);
        const clsCmvCampos = computeCmvLimiteFromAgregado(
          clsTotals.vendaMes,
          clsTotals.vendaProjetada,
          clsTotals.cmv,
        );
        const clsDisplayTotals = buildDisplayTotals(clsTotals, clsCmvCampos, diasDoMes, diasDeVenda);
        const clsIdeal = cmvRoundedForCalculo(clsTotals.cmv);
        const dotColor = situationDot(clsTotals.cmv, clsIdeal);
        const isExpanded = expandedCls.has(cls);
        const clsCodigo = clsStores[0]?.classificationCodigo ?? '';
        const showComprasDetalhe =
          Boolean(onOpenComprasDetalhe) &&
          clsStores.length > 0 &&
          usesRegraPrazoMesAnterior(clsCodigo);

        return (
          <div key={cls}>
            <div
              className="grid items-center gap-0 px-4 py-3 cursor-pointer transition-colors duration-100"
              style={{
                gridTemplateColumns: GRID_COLS,
                backgroundColor: isExpanded ? '#111b30' : 'transparent',
                borderBottom: `1px solid ${theme.border}`,
              }}
              onClick={() => toggleCls(cls)}
            >
              <span style={{ color: theme.textSecondary }}>
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-sm" style={{ color: theme.textPrimary }}>{cls}</span>
                {showComprasDetalhe && (
                  <button
                    type="button"
                    title="Ver pedidos de Compras"
                    aria-label={`Ver pedidos de Compras de ${cls}`}
                    className="inline-flex items-center justify-center p-1 rounded hover:bg-white/10"
                    style={{ color: theme.accent }}
                    onClick={e => {
                      e.stopPropagation();
                      onOpenComprasDetalhe?.({
                        classificacaoCodigo: clsCodigo,
                        classificacaoNome: cls,
                        comprasEsperado: clsDisplayTotals.compraMes,
                        allowedLojaIds: [
                          ...new Set(clsStores.map(s => Number(s.baseId)).filter(n => !Number.isNaN(n))),
                        ],
                      });
                    }}
                  >
                    <List size={14} />
                  </button>
                )}
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: `${theme.textSecondary}15`, color: theme.textSecondary }}
                >
                  {clsStores.length} lojas
                </span>
              </div>
              <MetricsCells totals={clsDisplayTotals} cmv={clsTotals.cmv} cmvIdeal={clsIdeal} />
            </div>

            {isExpanded &&
              clsStores.map((store, idx) => {
                const storeExpanded = expandedStores.has(store.id);
                const rowBg = idx % 2 === 0 ? '#0b1222' : '#0d1526';
                const storeCmvCampos = computeCmvLimiteFromAgregado(
                  store.vendaMes,
                  store.vendaProjetada,
                  store.cmv,
                );
                const storeDisplayTotals = buildDisplayTotals(store, storeCmvCampos, diasDoMes, diasDeVenda);
                const storeIdeal = cmvRoundedForCalculo(store.cmv);

                return (
                  <div key={store.id}>
                    <div
                      className="grid items-center gap-0 px-4 py-2.5 cursor-pointer transition-colors duration-100"
                      style={{
                        gridTemplateColumns: GRID_COLS,
                        backgroundColor: storeExpanded ? '#0f1a2e' : rowBg,
                        borderBottom: `1px solid ${theme.border}`,
                      }}
                      onClick={() => toggleStore(store.id)}
                    >
                      <span className="pl-5" style={{ color: theme.textSecondary }}>
                        {storeExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </span>
                      <span />
                      <span className="text-sm truncate" style={{ color: theme.textPrimary }}>{store.name}</span>
                      <MetricsCells
                        totals={storeDisplayTotals}
                        cmv={store.cmv}
                        cmvIdeal={storeIdeal}
                      />
                    </div>

                    {storeExpanded && (
                      <CurveSection store={store} diasDoMes={diasDoMes} diasDeVenda={diasDeVenda} />
                    )}
                  </div>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}

function MetricsCells({
  totals,
  cmv,
  cmvIdeal,
}: {
  totals: ComprasTotals;
  cmv: number;
  cmvIdeal: number;
}) {
  return (
    <>
      <CellValue value={totals.vendaMes} type="currency" />
      <CellValue value={totals.compraMes} type="currency" />
      <CellValue value={cmv} type="cmv" ideal={cmvIdeal} />
      <CellValue value={totals.vendaProjetada} type="currency" />
      <CellValue value={totals.limiteCompra} type="currency" />
      <CellValue value={totals.saldoCompra} type="signed" />
      <CellValue value={totals.cmvIdealVendaAtual} type="currency" />
      <CellValue value={totals.cmvProjetado} type="currency" />
      <CellValue value={totals.diferencaCompraIdeal} type="signed" />
      <CellValue value={totals.projecaoCompraIdeal} type="signed" />
    </>
  );
}

function CellValue({ value, type, ideal }: { value: number; type: 'currency' | 'cmv' | 'signed'; ideal?: number }) {
  let display: string;
  let color: string;

  if (type === 'currency') {
    display = formatCurrency(value);
    color = theme.textPrimary;
  } else if (type === 'cmv' && ideal !== undefined) {
    display = formatPercent(value);
    color = cmvColor(value, ideal);
  } else {
    display = formatCurrency(value);
    color = valueColor(value);
  }

  return (
    <span className="text-xs text-right tabular-nums font-medium" style={{ color }}>
      {display}
    </span>
  );
}

function CurveSection({
  store,
  diasDoMes,
  diasDeVenda,
}: {
  store: StoreData;
  diasDoMes: number;
  diasDeVenda: number;
}) {
  const [activeTab, setActiveTab] = useState<'compras' | 'estoque'>('compras');

  return (
    <div className="px-6 pb-3 pt-1" style={{ borderBottom: `1px solid ${theme.border}`, backgroundColor: '#0a1020' }}>
      <div className="flex gap-1 mb-2">
        <TabButton label="Compras" active={activeTab === 'compras'} onClick={() => setActiveTab('compras')} />
        <TabButton label="Estoque" active={activeTab === 'estoque'} onClick={() => setActiveTab('estoque')} />
      </div>
      {activeTab === 'compras' ? (
        <ComprasTable curves={store.curves} diasDoMes={diasDoMes} diasDeVenda={diasDeVenda} />
      ) : (
        <EstoqueTable curves={store.curves} />
      )}
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer"
      style={{
        backgroundColor: active ? `${theme.accent}18` : 'transparent',
        color: active ? theme.accent : theme.textSecondary,
        border: `1px solid ${active ? theme.accent : theme.border}`,
      }}
    >
      {label}
    </button>
  );
}

function CurveBadge({ curve }: { curve: string }) {
  const cc = curveColor(curve);
  return (
    <span
      className="inline-flex items-center justify-center px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wide"
      style={{
        backgroundColor: `${cc}15`,
        color: cc,
        border: `1px solid ${cc}30`,
      }}
    >
      {curve}
    </span>
  );
}

function ComprasTable({
  curves,
  diasDoMes,
  diasDeVenda,
}: {
  curves: CurveData[];
  diasDoMes: number;
  diasDeVenda: number;
}) {
  const diasVenda = diasDeVenda > 0 ? diasDeVenda : 1;
  return (
    <div className="overflow-x-auto rounded-md" style={{ border: `1px solid ${theme.border}` }}>
      <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#0b1120', borderBottom: `1px solid ${theme.border}` }}>
            <th className="text-left py-2 px-3 font-semibold" style={{ color: theme.textSecondary }}>Curva</th>
            <th className="text-right py-2 px-3 font-semibold" style={{ color: theme.textSecondary }}>Venda mês</th>
            <th className="text-right py-2 px-3 font-semibold" style={{ color: theme.textSecondary }}>Compra mês</th>
            <th className="text-right py-2 px-3 font-semibold" style={{ color: theme.textSecondary }}>CMV %</th>
            <th className="text-right py-2 px-3 font-semibold" style={{ color: theme.textSecondary }}>Venda proj.</th>
            <th className="text-right py-2 px-3 font-semibold" style={{ color: theme.textSecondary }}>Limite x proj.</th>
            <th className="text-right py-2 px-3 font-semibold" style={{ color: theme.textSecondary }}>Saldo compra</th>
            <th className="text-right py-2 px-3 font-semibold" style={{ color: theme.textSecondary }}>CMV ideal</th>
            <th className="text-right py-2 px-3 font-semibold" style={{ color: theme.textSecondary }}>CMV proj.</th>
            <th className="text-right py-2 px-3 font-semibold" style={{ color: theme.textSecondary }}>Dif. compra x ideal</th>
            <th className="text-right py-2 px-3 font-semibold" style={{ color: theme.textSecondary }}>Proj. compra x ideal</th>
          </tr>
        </thead>
        <tbody>
          {curves.map((c, idx) => {
            const curvaCmv = computeCmvLimiteFromAgregado(c.vendaMes, c.vendaProjetada, c.cmv);
            const saldoCompra = curvaCmv.limiteCompra - c.compraMes;
            const diferencaCompraIdeal = curvaCmv.cmvIdealVendaAtual - c.compraMes;
            const projecaoCompraIdeal = (diferencaCompraIdeal / diasVenda) * diasDoMes;
            return (
              <tr
                key={c.curve}
                style={{ backgroundColor: idx % 2 === 0 ? '#0b1222' : '#0d1526', borderBottom: `1px solid ${theme.border}` }}
              >
                <td className="py-2 px-3"><CurveBadge curve={c.curve} /></td>
                <td className="text-right py-2 px-3 tabular-nums" style={{ color: theme.textPrimary }}>{formatCurrency(c.vendaMes)}</td>
                <td className="text-right py-2 px-3 tabular-nums" style={{ color: theme.textPrimary }}>{formatCurrency(c.compraMes)}</td>
                <td className="text-right py-2 px-3 tabular-nums font-medium" style={{ color: cmvColor(c.cmv, cmvRoundedForCalculo(c.cmv)) }}>{formatPercent(c.cmv)}</td>
                <td className="text-right py-2 px-3 tabular-nums" style={{ color: theme.textPrimary }}>{formatCurrency(c.vendaProjetada)}</td>
                <td className="text-right py-2 px-3 tabular-nums" style={{ color: theme.textPrimary }}>{formatCurrency(curvaCmv.limiteCompra)}</td>
                <td className="text-right py-2 px-3 tabular-nums font-medium" style={{ color: valueColor(saldoCompra) }}>{formatCurrency(saldoCompra)}</td>
                <td className="text-right py-2 px-3 tabular-nums" style={{ color: theme.textPrimary }}>{formatCurrency(curvaCmv.cmvIdealVendaAtual)}</td>
                <td className="text-right py-2 px-3 tabular-nums" style={{ color: theme.textPrimary }}>{formatCurrency(curvaCmv.cmvProjetado)}</td>
                <td className="text-right py-2 px-3 tabular-nums font-medium" style={{ color: valueColor(diferencaCompraIdeal) }}>{formatCurrency(diferencaCompraIdeal)}</td>
                <td className="text-right py-2 px-3 tabular-nums font-medium" style={{ color: valueColor(projecaoCompraIdeal) }}>{formatCurrency(projecaoCompraIdeal)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EstoqueTable({ curves }: { curves: CurveData[] }) {
  return (
    <div className="overflow-x-auto rounded-md" style={{ border: `1px solid ${theme.border}` }}>
      <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#0b1120', borderBottom: `1px solid ${theme.border}` }}>
            <th className="text-left py-2 px-3 font-semibold" style={{ color: theme.textSecondary }}>Curva</th>
            <th className="text-right py-2 px-3 font-semibold" style={{ color: theme.textSecondary }}>Estoque atual unid.</th>
            <th className="text-right py-2 px-3 font-semibold" style={{ color: theme.textSecondary }}>Custo</th>
            <th className="text-right py-2 px-3 font-semibold" style={{ color: theme.textSecondary }}>Participação %</th>
            <th className="text-right py-2 px-3 font-semibold" style={{ color: theme.textSecondary }}>Dias estoque</th>
            <th className="text-right py-2 px-3 font-semibold" style={{ color: theme.textSecondary }}>Estoque realizado venda atual</th>
          </tr>
        </thead>
        <tbody>
          {curves.map((c, idx) => {
            const e = c.estoque;
            const estoqueRealizadoVendaAtual = computeCmvLimiteFromAgregado(
              c.vendaMes,
              c.vendaProjetada,
              c.cmv,
            ).cmvIdealVendaAtual;
            return (
              <tr
                key={c.curve}
                style={{ backgroundColor: idx % 2 === 0 ? '#0b1222' : '#0d1526', borderBottom: `1px solid ${theme.border}` }}
              >
                <td className="py-2 px-3"><CurveBadge curve={c.curve} /></td>
                <td className="text-right py-2 px-3 tabular-nums" style={{ color: theme.textPrimary }}>{e.estoqueAtualUnid.toLocaleString('pt-BR')}</td>
                <td className="text-right py-2 px-3 tabular-nums" style={{ color: theme.textPrimary }}>{formatCurrency(e.custo)}</td>
                <td className="text-right py-2 px-3 tabular-nums" style={{ color: theme.textPrimary }}>{formatPercent(e.participacao)}</td>
                <td className="text-right py-2 px-3 tabular-nums font-medium">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded"
                    style={{ backgroundColor: `${daysColor(e.diasEstoque)}15`, color: daysColor(e.diasEstoque) }}
                  >
                    {e.diasEstoque}d
                  </span>
                </td>
                <td className="text-right py-2 px-3 tabular-nums" style={{ color: theme.textPrimary }}>{formatCurrency(estoqueRealizadoVendaAtual)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
