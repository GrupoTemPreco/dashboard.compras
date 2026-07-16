import { useMemo } from 'react';
import { weightedCmvPercent, computeCmvLimiteFromAgregado } from '../lib/aggregateMetrics';
import { theme, formatCurrency, formatPercent, cmvColor } from '../utils/theme';
import type { StoreData } from '../data/mockData';

interface KpiCardsProps {
  stores: StoreData[];
}

interface Kpi {
  label: string;
  value: string;
  color: string;
}

function computeKpis(stores: StoreData[]): Kpi[] {
  const totalVenda = stores.reduce((s, st) => s + st.vendaMes, 0);
  const totalCmv = weightedCmvPercent(stores);
  const totalVendaProjetada = stores.reduce((s, st) => s + st.vendaProjetada, 0);
  const { cmvIdealVendaAtual: totalCmvIdeal, limiteCompra: totalLimite, cmvProjetado: totalCmvProjetado } =
    computeCmvLimiteFromAgregado(totalVenda, totalVendaProjetada, totalCmv);

  return [
    { label: 'Venda mês', value: formatCurrency(totalVenda), color: theme.textPrimary },
    { label: 'CMV %', value: formatPercent(totalCmv), color: cmvColor(totalCmv, totalCmv) },
    { label: 'Venda projetada', value: formatCurrency(totalVendaProjetada), color: theme.textPrimary },
    { label: 'Limite compra x proj. venda', value: formatCurrency(totalLimite), color: theme.textPrimary },
    { label: 'CMV ideal sobre venda atual', value: formatCurrency(totalCmvIdeal), color: theme.textPrimary },
    { label: 'CMV projetado', value: formatCurrency(totalCmvProjetado), color: theme.textPrimary },
  ];
}

function CompraMesCard({ stores }: { stores: StoreData[] }) {
  const faturado = stores.reduce((s, st) => s + st.compraMesFaturado, 0);
  const naoFaturado = stores.reduce((s, st) => s + st.compraMesNaoFaturado, 0);
  const ajustes = stores.reduce((s, st) => s + (st.compraMesAjuste ?? 0), 0);
  const total = stores.reduce((s, st) => s + st.compraMes, 0);

  return (
    <div
      className="rounded-lg px-4 py-3 transition-all duration-200 hover:scale-[1.02] hover:border-opacity-60"
      style={{
        backgroundColor: theme.card,
        border: `1px solid ${theme.border}`,
      }}
    >
      <p className="text-[11px] font-medium mb-2 leading-tight" style={{ color: theme.textSecondary }}>
        Compra mês
      </p>
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[10px]" style={{ color: theme.textSecondary }}>
            Faturado
          </span>
          <span className="text-sm font-semibold tabular-nums" style={{ color: theme.textPrimary }}>
            {formatCurrency(faturado)}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[10px]" style={{ color: theme.textSecondary }}>
            Não faturado
          </span>
          <span className="text-sm font-semibold tabular-nums" style={{ color: theme.textPrimary }}>
            {formatCurrency(naoFaturado)}
          </span>
        </div>
        {ajustes !== 0 && (
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px]" style={{ color: theme.textSecondary }}>
              Ajustes
            </span>
            <span
              className="text-sm font-semibold tabular-nums"
              style={{ color: ajustes > 0 ? theme.green : theme.red }}
            >
              {ajustes > 0 ? '+' : ''}
              {formatCurrency(ajustes)}
            </span>
          </div>
        )}
      </div>
      <p
        className="mt-2 pt-2 text-xs font-medium tabular-nums border-t"
        style={{ color: theme.textSecondary, borderColor: theme.border }}
      >
        Total {formatCurrency(total)}
      </p>
    </div>
  );
}

export default function KpiCards({ stores }: KpiCardsProps) {
  const kpis = useMemo(() => computeKpis(stores), [stores]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-3">
        <KpiCard kpi={kpis[0]} />
        <CompraMesCard stores={stores} />
        {kpis.slice(1, 4).map(kpi => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>
      <div className="grid grid-cols-5 gap-3">
        {kpis.slice(4).map(kpi => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>
    </div>
  );
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <div
      className="rounded-lg px-4 py-3 transition-all duration-200 hover:scale-[1.02] hover:border-opacity-60"
      style={{
        backgroundColor: theme.card,
        border: `1px solid ${theme.border}`,
      }}
    >
      <p className="text-[11px] font-medium mb-1.5 leading-tight" style={{ color: theme.textSecondary }}>
        {kpi.label}
      </p>
      <p className="text-lg font-bold tracking-tight tabular-nums" style={{ color: kpi.color }}>
        {kpi.value}
      </p>
    </div>
  );
}
