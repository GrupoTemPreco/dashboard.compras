import type { CurveData, StoreData } from '../data/mockData';

export interface ComprasTotals {
  vendaMes: number;
  compraMes: number;
  vendaProjetada: number;
  limiteCompra: number;
  saldoCompra: number;
  cmvIdealVendaAtual: number;
  cmvProjetado: number;
  diferencaCompraIdeal: number;
  projecaoCompraIdeal: number;
}

export interface DerivedCompraFields {
  vendaProjetada: number;
  limiteCompra: number;
  saldoCompra: number;
  cmvIdealVendaAtual: number;
  cmvProjetado: number;
  diferencaCompraIdeal: number;
  projecaoCompraIdeal: number;
}

/** CMV % com 1 casa decimal — mesma precisão exibida na coluna CMV %. */
export function cmvRoundedForCalculo(cmv: number): number {
  return parseFloat(cmv.toFixed(1));
}

/** CMV ideal, limite e CMV projetado a partir de CMV consolidado arredondado. */
export function computeCmvLimiteFromAgregado(
  vendaMes: number,
  vendaProjetada: number,
  cmv: number,
): Pick<DerivedCompraFields, 'cmvIdealVendaAtual' | 'limiteCompra' | 'cmvProjetado'> {
  const cmvBruto = cmvRoundedForCalculo(cmv) / 100;
  const cmvIdealVendaAtual = vendaMes * cmvBruto;
  const limiteCompra = vendaProjetada * cmvBruto;
  return { cmvIdealVendaAtual, limiteCompra, cmvProjetado: limiteCompra };
}

export function computeDerivedCompraFields(
  vendaMes: number,
  compraMes: number,
  cmv: number,
  diasDoMes: number,
  diasDeVenda: number,
): DerivedCompraFields {
  const diasVenda = diasDeVenda > 0 ? diasDeVenda : 1;
  const vendaProjetada = (vendaMes / diasVenda) * diasDoMes;
  const cmvCalculo = cmvRoundedForCalculo(cmv);
  const cmvIdealVendaAtual = vendaMes * (cmvCalculo / 100);
  const limiteCompra = vendaProjetada * (cmvCalculo / 100);
  const saldoCompra = limiteCompra - compraMes;
  const cmvProjetado = limiteCompra;
  const diferencaCompraIdeal = cmvIdealVendaAtual - compraMes;
  const projecaoCompraIdeal = (diferencaCompraIdeal / diasVenda) * diasDoMes;

  return {
    vendaProjetada,
    limiteCompra,
    saldoCompra,
    cmvIdealVendaAtual,
    cmvProjetado,
    diferencaCompraIdeal,
    projecaoCompraIdeal,
  };
}

export function emptyComprasTotals(): ComprasTotals {
  return {
    vendaMes: 0,
    compraMes: 0,
    vendaProjetada: 0,
    limiteCompra: 0,
    saldoCompra: 0,
    cmvIdealVendaAtual: 0,
    cmvProjetado: 0,
    diferencaCompraIdeal: 0,
    projecaoCompraIdeal: 0,
  };
}

/** CMV % ideal derivado de valores em R$ (soma cmvIdeal / soma venda). */
export function cmvPercentIdealFromTotals(vendaMes: number, cmvIdealVendaAtual: number): number {
  if (vendaMes <= 0) return 0;
  return (cmvIdealVendaAtual / vendaMes) * 100;
}

/** CMV % ponderado por venda (ex.: média de `cmv_percentual` da tabela vendas). */
export function weightedCmvPercent(items: { vendaMes: number; cmv: number }[]): number {
  const totalVenda = items.reduce((s, i) => s + i.vendaMes, 0);
  if (totalVenda <= 0) return 0;
  return items.reduce((s, i) => s + i.cmv * i.vendaMes, 0) / totalVenda;
}

export function sumComprasTotals(items: ComprasTotals[]): ComprasTotals {
  return items.reduce(
    (acc, item) => ({
      vendaMes: acc.vendaMes + item.vendaMes,
      compraMes: acc.compraMes + item.compraMes,
      vendaProjetada: acc.vendaProjetada + item.vendaProjetada,
      limiteCompra: acc.limiteCompra + item.limiteCompra,
      saldoCompra: acc.saldoCompra + item.saldoCompra,
      cmvIdealVendaAtual: acc.cmvIdealVendaAtual + item.cmvIdealVendaAtual,
      cmvProjetado: acc.cmvProjetado + item.cmvProjetado,
      diferencaCompraIdeal: acc.diferencaCompraIdeal + item.diferencaCompraIdeal,
      projecaoCompraIdeal: acc.projecaoCompraIdeal + item.projecaoCompraIdeal,
    }),
    emptyComprasTotals(),
  );
}

export function comprasTotalsFromCurves(curves: CurveData[]): ComprasTotals & { cmv: number } {
  const totals = sumComprasTotals(
    curves.map(c => ({
      vendaMes: c.vendaMes,
      compraMes: c.compraMes,
      vendaProjetada: c.vendaProjetada,
      limiteCompra: c.limiteCompra,
      saldoCompra: c.saldoCompra,
      cmvIdealVendaAtual: c.cmvIdealVendaAtual,
      cmvProjetado: c.cmvProjetado,
      diferencaCompraIdeal: c.diferencaCompraIdeal,
      projecaoCompraIdeal: c.projecaoCompraIdeal,
    })),
  );
  return { ...totals, cmv: weightedCmvPercent(curves) };
}

export function comprasTotalsFromStores(stores: StoreData[]): ComprasTotals & { cmv: number } {
  const totals = sumComprasTotals(
    stores.map(s => ({
      vendaMes: s.vendaMes,
      compraMes: s.compraMes,
      vendaProjetada: s.vendaProjetada,
      limiteCompra: s.limiteCompra,
      saldoCompra: s.saldoCompra,
      cmvIdealVendaAtual: s.cmvIdealVendaAtual,
      cmvProjetado: s.cmvProjetado,
      diferencaCompraIdeal: s.diferencaCompraIdeal,
      projecaoCompraIdeal: s.projecaoCompraIdeal,
    })),
  );
  return { ...totals, cmv: weightedCmvPercent(stores) };
}

/** Média ponderada de CMV ideal para o indicador (dot), quando o nível exibe soma nos campos. */
export function weightedCmvIdeal(items: { vendaMes: number; cmvIdealVendaAtual: number }[]): number {
  const totalVenda = items.reduce((s, i) => s + i.vendaMes, 0);
  if (totalVenda <= 0) {
    const n = items.length;
    return n > 0 ? items.reduce((s, i) => s + i.cmvIdealVendaAtual, 0) / n : 0;
  }
  return items.reduce((s, i) => s + i.cmvIdealVendaAtual * i.vendaMes, 0) / totalVenda;
}
