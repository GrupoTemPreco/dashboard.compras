import { weightedCmvPercent, computeDerivedCompraFields } from '../lib/aggregateMetrics';
import type {
  StoreData,
  Group,
  ClassificationFilter,
  StoreIdFilter,
  CurveFilter,
} from '../data/mockData';
import type { PeriodRange } from './period';
import { getDaysInMonth, getElapsedSaleDaysInMonth, resolvePeriod } from './period';

export interface FilterState {
  period: PeriodRange | null;
  classification: ClassificationFilter;
  group: Group | null;
  storeId: StoreIdFilter;
  curve: CurveFilter;
}

export function applyFilters(
  filters: FilterState,
  source: StoreData[] = [],
): StoreData[] {
  const { classification, group, storeId, curve, period } = filters;
  let stores = source;
  if (classification?.length) stores = stores.filter(s => classification.includes(s.classification));
  if (group) stores = stores.filter(s => s.group === group);
  if (storeId?.length) stores = stores.filter(s => storeId.includes(s.baseId));
  if (!curve?.length) return stores;

  const effectivePeriod = resolvePeriod(period);
  const diasDoMes = getDaysInMonth(effectivePeriod);
  const diasDeVenda = getElapsedSaleDaysInMonth(effectivePeriod);

  return stores
    .map(s => {
      const curves = s.curves.filter(c => curve.includes(c.curve));
      if (curves.length === 0) return null;

      const agg = curves.reduce(
        (acc, c) => ({
          vendaMes: acc.vendaMes + c.vendaMes,
          compraMesFaturado: acc.compraMesFaturado + c.compraMesFaturado,
          compraMes: acc.compraMes + c.compraMes,
          vendaProjetada: acc.vendaProjetada + c.vendaProjetada,
          limiteCompra: acc.limiteCompra + c.limiteCompra,
          cmvIdealVendaAtual: acc.cmvIdealVendaAtual + c.cmvIdealVendaAtual,
          cmvProjetado: acc.cmvProjetado + c.cmvProjetado,
        }),
        {
          vendaMes: 0,
          compraMesFaturado: 0,
          compraMes: 0,
          vendaProjetada: 0,
          limiteCompra: 0,
          cmvIdealVendaAtual: 0,
          cmvProjetado: 0,
        },
      );

      const compraMesAjuste = s.compraMesAjuste ?? 0;
      const compraMes = agg.compraMes + compraMesAjuste;
      const cmv = weightedCmvPercent(curves);
      const derived = computeDerivedCompraFields(
        agg.vendaMes,
        compraMes,
        cmv,
        diasDoMes,
        diasDeVenda,
      );

      const view: StoreData = {
        ...s,
        vendaMes: agg.vendaMes,
        compraMesFaturado: agg.compraMesFaturado,
        compraMesAjuste,
        compraMes,
        cmv,
        vendaProjetada: derived.vendaProjetada,
        limiteCompra: derived.limiteCompra,
        saldoCompra: derived.saldoCompra,
        cmvIdealVendaAtual: derived.cmvIdealVendaAtual,
        cmvProjetado: derived.cmvProjetado,
        diferencaCompraIdeal: derived.diferencaCompraIdeal,
        projecaoCompraIdeal: derived.projecaoCompraIdeal,
        curves,
      };
      return view;
    })
    .filter((s): s is StoreData => s !== null);
}
