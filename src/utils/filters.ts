import { weightedCmvPercent } from '../lib/aggregateMetrics';
import type { StoreData, Classification, Group, Curve } from '../data/mockData';
import type { PeriodRange } from './period';

export interface FilterState {
  period: PeriodRange | null;
  classification: Classification | null;
  group: Group | null;
  storeId: string | null;
  curve: Curve | null;
}

export function applyFilters(
  filters: FilterState,
  source: StoreData[] = [],
): StoreData[] {
  const { classification, group, storeId, curve } = filters;
  let stores = source;
  if (classification) stores = stores.filter(s => s.classification === classification);
  if (group) stores = stores.filter(s => s.group === group);
  if (storeId) stores = stores.filter(s => s.baseId === storeId);
  if (!curve) return stores;

  return stores
    .map(s => {
      const curves = s.curves.filter(c => c.curve === curve);
      if (curves.length === 0) return null;

      const agg = curves.reduce(
        (acc, c) => ({
          vendaMes: acc.vendaMes + c.vendaMes,
          compraMesFaturado: acc.compraMesFaturado + c.compraMesFaturado,
          compraMes: acc.compraMes + c.compraMes,
          vendaProjetada: acc.vendaProjetada + c.vendaProjetada,
          limiteCompra: acc.limiteCompra + c.limiteCompra,
          saldoCompra: acc.saldoCompra + c.saldoCompra,
          cmvIdealVendaAtual: acc.cmvIdealVendaAtual + c.cmvIdealVendaAtual,
          cmvProjetado: acc.cmvProjetado + c.cmvProjetado,
          diferencaCompraIdeal: acc.diferencaCompraIdeal + c.diferencaCompraIdeal,
          projecaoCompraIdeal: acc.projecaoCompraIdeal + c.projecaoCompraIdeal,
        }),
        {
          vendaMes: 0,
          compraMesFaturado: 0,
          compraMes: 0,
          vendaProjetada: 0,
          limiteCompra: 0,
          saldoCompra: 0,
          cmvIdealVendaAtual: 0,
          cmvProjetado: 0,
          diferencaCompraIdeal: 0,
          projecaoCompraIdeal: 0,
        },
      );

      const view: StoreData = {
        ...s,
        vendaMes: agg.vendaMes,
        compraMesFaturado: agg.compraMesFaturado,
        compraMes: agg.compraMes,
        cmv: weightedCmvPercent(curves),
        vendaProjetada: agg.vendaProjetada,
        limiteCompra: agg.limiteCompra,
        saldoCompra: agg.saldoCompra,
        cmvIdealVendaAtual: agg.cmvIdealVendaAtual,
        cmvProjetado: agg.cmvProjetado,
        diferencaCompraIdeal: agg.diferencaCompraIdeal,
        projecaoCompraIdeal: agg.projecaoCompraIdeal,
        curves,
      };
      return view;
    })
    .filter((s): s is StoreData => s !== null);
}
