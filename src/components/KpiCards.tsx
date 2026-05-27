import { useMemo } from 'react';
import { theme, formatCurrency, formatPercent, valueColor, cmvColor } from '../utils/theme';
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
  const totalCompra = stores.reduce((s, st) => s + st.compraMes, 0);
  const totalCmv = totalVenda > 0 ? (totalCompra / totalVenda) * 100 : 0;
  const totalVendaProjetada = stores.reduce((s, st) => s + st.vendaProjetada, 0);
  const totalLimite = stores.reduce((s, st) => s + st.limiteCompra, 0);
  const totalSaldo = stores.reduce((s, st) => s + st.saldoCompra, 0);
  const avgCmvIdeal = stores.length > 0 ? stores.reduce((s, st) => s + st.cmvIdealVendaAtual, 0) / stores.length : 0;
  const avgCmvProjetado = stores.length > 0 ? stores.reduce((s, st) => s + st.cmvProjetado, 0) / stores.length : 0;
  const totalDifCompraIdeal = stores.reduce((s, st) => s + st.diferencaCompraIdeal, 0);
  const totalProjCompraIdeal = stores.reduce((s, st) => s + st.projecaoCompraIdeal, 0);

  return [
    { label: 'Venda mês', value: formatCurrency(totalVenda), color: theme.textPrimary },
    { label: 'Compra mês', value: formatCurrency(totalCompra), color: theme.textPrimary },
    { label: 'CMV %', value: formatPercent(totalCmv), color: cmvColor(totalCmv, avgCmvIdeal) },
    { label: 'Venda projetada', value: formatCurrency(totalVendaProjetada), color: theme.textPrimary },
    { label: 'Limite compra x proj. venda', value: formatCurrency(totalLimite), color: theme.textPrimary },
    { label: 'Saldo de compra', value: formatCurrency(totalSaldo), color: valueColor(totalSaldo) },
    { label: 'CMV ideal sobre venda atual', value: formatPercent(avgCmvIdeal), color: cmvColor(avgCmvIdeal, avgCmvIdeal) },
    { label: 'CMV projetado', value: formatPercent(avgCmvProjetado), color: cmvColor(avgCmvProjetado, avgCmvIdeal) },
    { label: 'Diferença compra x ideal', value: formatCurrency(totalDifCompraIdeal), color: valueColor(totalDifCompraIdeal) },
    { label: 'Proj. compra x ideal', value: formatCurrency(totalProjCompraIdeal), color: valueColor(totalProjCompraIdeal) },
  ];
}

export default function KpiCards({ stores }: KpiCardsProps) {
  const kpis = useMemo(() => computeKpis(stores), [stores]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-3">
        {kpis.slice(0, 5).map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>
      <div className="grid grid-cols-5 gap-3">
        {kpis.slice(5, 10).map((kpi) => (
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
