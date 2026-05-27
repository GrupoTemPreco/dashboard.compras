import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { theme, formatCurrency, formatPercent, valueColor, cmvColor, curveColor, daysColor, situationDot } from '../utils/theme';
import type { StoreData, Classification, CurveData } from '../data/mockData';
import { CLASSIFICATIONS } from '../data/mockData';

interface AccordionTableProps {
  stores: StoreData[];
}

const STORE_COLS = [
  { key: 'vendaMes', label: 'Venda mês' },
  { key: 'compraMes', label: 'Compra mês' },
  { key: 'cmv', label: 'CMV %' },
  { key: 'vendaProjetada', label: 'Venda proj.' },
  { key: 'limiteCompra', label: 'Limite x proj.' },
  { key: 'saldoCompra', label: 'Saldo compra' },
  { key: 'cmvIdealVendaAtual', label: 'CMV ideal' },
  { key: 'cmvProjetado', label: 'CMV proj.' },
  { key: 'diferencaCompraIdeal', label: 'Dif. compra x ideal' },
  { key: 'projecaoCompraIdeal', label: 'Proj. compra x ideal' },
] as const;

export default function AccordionTable({ stores }: AccordionTableProps) {
  const [expandedCls, setExpandedCls] = useState<Set<Classification>>(new Set());
  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());

  const filteredData = useMemo(() => {
    const result: { classification: Classification; stores: StoreData[] }[] = [];
    for (const cls of CLASSIFICATIONS) {
      const group = stores.filter(s => s.classification === cls);
      if (group.length > 0) result.push({ classification: cls, stores: group });
    }
    return result;
  }, [stores]);

  const toggleCls = (cls: Classification) => {
    setExpandedCls(prev => {
      const next = new Set(prev);
      if (next.has(cls)) next.delete(cls); else next.add(cls);
      return next;
    });
  };

  const toggleStore = (id: string) => {
    setExpandedStores(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="rounded-lg overflow-hidden" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
      {/* Header */}
      <div
        className="grid items-center gap-0 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider sticky top-0 z-10"
        style={{
          gridTemplateColumns: '2rem 1.5rem minmax(140px, 1.5fr) ' + STORE_COLS.map(() => 'minmax(90px, 1fr)').join(' '),
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

      {/* Rows */}
      {filteredData.map(({ classification: cls, stores }) => {
        const totalVenda = stores.reduce((s, st) => s + st.vendaMes, 0);
        const totalCompra = stores.reduce((s, st) => s + st.compraMes, 0);
        const totalCmv = totalVenda > 0 ? (totalCompra / totalVenda) * 100 : 0;
        const avgCmvIdeal = stores.reduce((s, st) => s + st.cmvIdealVendaAtual, 0) / stores.length;
        const dotColor = situationDot(totalCmv, avgCmvIdeal);
        const isExpanded = expandedCls.has(cls);

        return (
          <div key={cls}>
            {/* Level 1 - Classification */}
            <div
              className="grid items-center gap-0 px-4 py-3 cursor-pointer transition-colors duration-100"
              style={{
                gridTemplateColumns: '2rem 1.5rem minmax(140px, 1.5fr) ' + STORE_COLS.map(() => 'minmax(90px, 1fr)').join(' '),
                backgroundColor: isExpanded ? '#111b30' : 'transparent',
                borderBottom: `1px solid ${theme.border}`,
              }}
              onClick={() => toggleCls(cls)}
            >
              <span style={{ color: theme.textSecondary }}>
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm" style={{ color: theme.textPrimary }}>{cls}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${theme.textSecondary}15`, color: theme.textSecondary }}>
                  {stores.length} lojas
                </span>
              </div>
              <span className="text-xs text-right tabular-nums" style={{ color: theme.textPrimary }}>{formatCurrency(totalVenda)}</span>
              <span className="text-xs text-right tabular-nums" style={{ color: theme.textPrimary }}>{formatCurrency(totalCompra)}</span>
              <span className="text-xs text-right tabular-nums font-medium" style={{ color: cmvColor(totalCmv, avgCmvIdeal) }}>{formatPercent(totalCmv)}</span>
              <span /><span /><span /><span /><span /><span /><span />
            </div>

            {/* Level 2 - Stores */}
            {isExpanded && stores.map((store, idx) => {
              const storeExpanded = expandedStores.has(store.id);
              const rowBg = idx % 2 === 0 ? '#0b1222' : '#0d1526';

              return (
                <div key={store.id}>
                  <div
                    className="grid items-center gap-0 px-4 py-2.5 cursor-pointer transition-colors duration-100"
                    style={{
                      gridTemplateColumns: '2rem 1.5rem minmax(140px, 1.5fr) ' + STORE_COLS.map(() => 'minmax(90px, 1fr)').join(' '),
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
                    <CellValue value={store.vendaMes} type="currency" />
                    <CellValue value={store.compraMes} type="currency" />
                    <CellValue value={store.cmv} type="cmv" ideal={store.cmvIdealVendaAtual} />
                    <CellValue value={store.vendaProjetada} type="currency" />
                    <CellValue value={store.limiteCompra} type="currency" />
                    <CellValue value={store.saldoCompra} type="signed" />
                    <CellValue value={store.cmvIdealVendaAtual} type="cmv" ideal={store.cmvIdealVendaAtual} />
                    <CellValue value={store.cmvProjetado} type="cmv" ideal={store.cmvIdealVendaAtual} />
                    <CellValue value={store.diferencaCompraIdeal} type="signed" />
                    <CellValue value={store.projecaoCompraIdeal} type="signed" />
                  </div>

                  {/* Level 3 - Curves */}
                  {storeExpanded && (
                    <CurveSection store={store} />
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

function CurveSection({ store }: { store: StoreData }) {
  const [activeTab, setActiveTab] = useState<'compras' | 'estoque'>('compras');

  return (
    <div className="px-6 pb-3 pt-1" style={{ borderBottom: `1px solid ${theme.border}`, backgroundColor: '#0a1020' }}>
      <div className="flex gap-1 mb-2">
        <TabButton label="Compras" active={activeTab === 'compras'} onClick={() => setActiveTab('compras')} />
        <TabButton label="Estoque" active={activeTab === 'estoque'} onClick={() => setActiveTab('estoque')} />
      </div>
      {activeTab === 'compras' ? <ComprasTable curves={store.curves} cmvIdeal={store.cmvIdealVendaAtual} /> : <EstoqueTable curves={store.curves} />}
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

function ComprasTable({ curves, cmvIdeal }: { curves: CurveData[]; cmvIdeal: number }) {
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
          {curves.map((c, idx) => (
            <tr key={c.curve} style={{ backgroundColor: idx % 2 === 0 ? '#0b1222' : '#0d1526', borderBottom: `1px solid ${theme.border}` }}>
              <td className="py-2 px-3"><CurveBadge curve={c.curve} /></td>
              <td className="text-right py-2 px-3 tabular-nums" style={{ color: theme.textPrimary }}>{formatCurrency(c.vendaMes)}</td>
              <td className="text-right py-2 px-3 tabular-nums" style={{ color: theme.textPrimary }}>{formatCurrency(c.compraMes)}</td>
              <td className="text-right py-2 px-3 tabular-nums font-medium" style={{ color: cmvColor(c.cmv, cmvIdeal) }}>{formatPercent(c.cmv)}</td>
              <td className="text-right py-2 px-3 tabular-nums" style={{ color: theme.textPrimary }}>{formatCurrency(c.vendaProjetada)}</td>
              <td className="text-right py-2 px-3 tabular-nums" style={{ color: theme.textPrimary }}>{formatCurrency(c.limiteCompra)}</td>
              <td className="text-right py-2 px-3 tabular-nums font-medium" style={{ color: valueColor(c.saldoCompra) }}>{formatCurrency(c.saldoCompra)}</td>
              <td className="text-right py-2 px-3 tabular-nums" style={{ color: cmvColor(c.cmvIdealVendaAtual, cmvIdeal) }}>{formatPercent(c.cmvIdealVendaAtual)}</td>
              <td className="text-right py-2 px-3 tabular-nums" style={{ color: cmvColor(c.cmvProjetado, cmvIdeal) }}>{formatPercent(c.cmvProjetado)}</td>
              <td className="text-right py-2 px-3 tabular-nums font-medium" style={{ color: valueColor(c.diferencaCompraIdeal) }}>{formatCurrency(c.diferencaCompraIdeal)}</td>
              <td className="text-right py-2 px-3 tabular-nums font-medium" style={{ color: valueColor(c.projecaoCompraIdeal) }}>{formatCurrency(c.projecaoCompraIdeal)}</td>
            </tr>
          ))}
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
            return (
              <tr key={c.curve} style={{ backgroundColor: idx % 2 === 0 ? '#0b1222' : '#0d1526', borderBottom: `1px solid ${theme.border}` }}>
                <td className="py-2 px-3"><CurveBadge curve={c.curve} /></td>
                <td className="text-right py-2 px-3 tabular-nums" style={{ color: theme.textPrimary }}>{e.estoqueAtualUnid.toLocaleString('pt-BR')}</td>
                <td className="text-right py-2 px-3 tabular-nums" style={{ color: theme.textPrimary }}>{formatCurrency(e.custo)}</td>
                <td className="text-right py-2 px-3 tabular-nums" style={{ color: theme.textPrimary }}>{formatPercent(e.participacao)}</td>
                <td className="text-right py-2 px-3 tabular-nums font-medium">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded" style={{ backgroundColor: `${daysColor(e.diasEstoque)}15`, color: daysColor(e.diasEstoque) }}>
                    {e.diasEstoque}d
                  </span>
                </td>
                <td className="text-right py-2 px-3 tabular-nums" style={{ color: theme.textPrimary }}>{formatCurrency(e.estoqueRealizadoVendaAtual)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
