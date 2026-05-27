import type { StoreData, Classification, Group, Curve } from '../data/mockData';
import { MOCK_STORES } from '../data/mockData';

export interface FilterState {
  classification: Classification | null;
  group: Group | null;
  storeId: string | null;
  curve: Curve | null;
}

export function applyFilters(
  filters: FilterState,
  source: StoreData[] = MOCK_STORES,
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
          compraMes: acc.compraMes + c.compraMes,
          vendaProjetada: acc.vendaProjetada + c.vendaProjetada,
          limiteCompra: acc.limiteCompra + c.limiteCompra,
          saldoCompra: acc.saldoCompra + c.saldoCompra,
          diferencaCompraIdeal: acc.diferencaCompraIdeal + c.diferencaCompraIdeal,
          projecaoCompraIdeal: acc.projecaoCompraIdeal + c.projecaoCompraIdeal,
          cmvIdealAcc: acc.cmvIdealAcc + c.cmvIdealVendaAtual,
          cmvProjAcc: acc.cmvProjAcc + c.cmvProjetado,
        }),
        {
          vendaMes: 0,
          compraMes: 0,
          vendaProjetada: 0,
          limiteCompra: 0,
          saldoCompra: 0,
          diferencaCompraIdeal: 0,
          projecaoCompraIdeal: 0,
          cmvIdealAcc: 0,
          cmvProjAcc: 0,
        },
      );

      const cmv = agg.vendaMes > 0 ? (agg.compraMes / agg.vendaMes) * 100 : 0;

      const view: StoreData = {
        ...s,
        vendaMes: agg.vendaMes,
        compraMes: agg.compraMes,
        cmv,
        vendaProjetada: agg.vendaProjetada,
        limiteCompra: agg.limiteCompra,
        saldoCompra: agg.saldoCompra,
        cmvIdealVendaAtual: agg.cmvIdealAcc / curves.length,
        cmvProjetado: agg.cmvProjAcc / curves.length,
        diferencaCompraIdeal: agg.diferencaCompraIdeal,
        projecaoCompraIdeal: agg.projecaoCompraIdeal,
        curves,
      };
      return view;
    })
    .filter((s): s is StoreData => s !== null);
}
