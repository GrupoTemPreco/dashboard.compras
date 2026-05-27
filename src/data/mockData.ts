export type Classification = 'Ético' | 'Bonificado' | 'Perfumaria' | 'Oficinais';
export type Group = 'Tempreço' | 'XBrothers';
export type Curve = 'A' | 'B' | 'C' | 'D';

export interface EstoqueData {
  estoqueAtualUnid: number;
  custo: number;
  participacao: number;
  diasEstoque: number;
  estoqueRealizadoVendaAtual: number;
}

export interface CurveData {
  curve: Curve;
  vendaMes: number;
  compraMes: number;
  cmv: number;
  vendaProjetada: number;
  limiteCompra: number;
  saldoCompra: number;
  cmvIdealVendaAtual: number;
  cmvProjetado: number;
  diferencaCompraIdeal: number;
  projecaoCompraIdeal: number;
  estoque: EstoqueData;
}

export interface StoreData {
  id: string;
  baseId: string;
  name: string;
  group: Group;
  classification: Classification;
  vendaMes: number;
  compraMes: number;
  cmv: number;
  vendaProjetada: number;
  limiteCompra: number;
  saldoCompra: number;
  cmvIdealVendaAtual: number;
  cmvProjetado: number;
  diferencaCompraIdeal: number;
  projecaoCompraIdeal: number;
  curves: CurveData[];
}

export const CLASSIFICATIONS: Classification[] = ['Ético', 'Bonificado', 'Perfumaria', 'Oficinais'];
export const GROUPS: Group[] = ['Tempreço', 'XBrothers'];
export const CURVES: Curve[] = ['A', 'B', 'C', 'D'];

interface StoreDef {
  id: string;
  name: string;
  group: Group;
  size: number;
  cmvOffset: number;
}

const STORE_DEFS: StoreDef[] = [
  { id: 'tp-2',  name: 'Loja 2',  group: 'Tempreço',  size: 1.00, cmvOffset:  4.5 },
  { id: 'tp-3',  name: 'Loja 3',  group: 'Tempreço',  size: 0.78, cmvOffset:  9.0 },
  { id: 'tp-4',  name: 'Loja 4',  group: 'Tempreço',  size: 0.72, cmvOffset:  2.0 },
  { id: 'tp-6',  name: 'Loja 6',  group: 'Tempreço',  size: 0.60, cmvOffset: 12.0 },
  { id: 'tp-7',  name: 'Loja 7',  group: 'Tempreço',  size: 0.54, cmvOffset: -5.0 },
  { id: 'tp-13', name: 'Loja 13', group: 'Tempreço',  size: 0.36, cmvOffset:  7.0 },
  { id: 'tp-14', name: 'Loja 14', group: 'Tempreço',  size: 1.18, cmvOffset:  1.0 },
  { id: 'xb-8',  name: 'Loja 8',  group: 'XBrothers', size: 0.91, cmvOffset:  0.0 },
  { id: 'xb-9',  name: 'Loja 9',  group: 'XBrothers', size: 0.70, cmvOffset: 12.0 },
  { id: 'xb-10', name: 'Loja 10', group: 'XBrothers', size: 0.82, cmvOffset: -6.0 },
  { id: 'xb-11', name: 'Loja 11', group: 'XBrothers', size: 0.62, cmvOffset:  8.0 },
  { id: 'xb-12', name: 'Loja 12', group: 'XBrothers', size: 1.02, cmvOffset:  2.5 },
];

interface ClassDef {
  share: number;
  baseCmv: number;
  cmvIdeal: number;
  baseVenda: number;
}

const CLASS_DEFS: Record<Classification, ClassDef> = {
  'Ético':      { share: 0.42, baseCmv: 65, cmvIdeal: 65, baseVenda: 280000 },
  'Bonificado': { share: 0.26, baseCmv: 68, cmvIdeal: 68, baseVenda: 175000 },
  'Perfumaria': { share: 0.20, baseCmv: 58, cmvIdeal: 58, baseVenda: 135000 },
  'Oficinais':  { share: 0.12, baseCmv: 62, cmvIdeal: 62, baseVenda:  80000 },
};

const CURVE_SHARE: Record<Curve, number> = { A: 0.55, B: 0.30, C: 0.12, D: 0.03 };
const CURVE_DAYS: Record<Curve, number> = { A: 16, B: 24, C: 38, D: 62 };

const round = (n: number) => Math.round(n);
const round1 = (n: number) => Math.round(n * 10) / 10;

function buildStore(def: StoreDef, cls: Classification): StoreData {
  const cd = CLASS_DEFS[cls];
  const vendaMes = round(cd.baseVenda * def.size);
  const cmv = round1(cd.baseCmv + def.cmvOffset);
  const compraMes = round(vendaMes * cmv / 100);
  const vendaProjetada = round(vendaMes * 1.72);
  const limiteCompra = round(vendaProjetada * cd.cmvIdeal / 100);
  const saldoCompra = limiteCompra - compraMes;
  const cmvProjetado = round1(cmv * 0.97);
  const diferencaCompraIdeal = round((cd.cmvIdeal - cmv) * vendaMes / 100);
  const projecaoCompraIdeal = round((cd.cmvIdeal - cmvProjetado) * vendaProjetada / 100);

  const curves: CurveData[] = CURVES.map(curve => {
    const share = CURVE_SHARE[curve];
    const cVenda = round(vendaMes * share);
    const cCompra = round(compraMes * share);
    const cVendaProj = round(vendaProjetada * share);
    const cLimite = round(limiteCompra * share);
    const cSaldo = cLimite - cCompra;
    const cDif = round(diferencaCompraIdeal * share);
    const cProj = round(projecaoCompraIdeal * share);

    return {
      curve,
      vendaMes: cVenda,
      compraMes: cCompra,
      cmv,
      vendaProjetada: cVendaProj,
      limiteCompra: cLimite,
      saldoCompra: cSaldo,
      cmvIdealVendaAtual: cd.cmvIdeal,
      cmvProjetado,
      diferencaCompraIdeal: cDif,
      projecaoCompraIdeal: cProj,
      estoque: {
        estoqueAtualUnid: round(cVenda / 40),
        custo: round(cCompra * 0.85),
        participacao: round1(share * 100),
        diasEstoque: CURVE_DAYS[curve],
        estoqueRealizadoVendaAtual: round(cVenda * 0.88),
      },
    };
  });

  return {
    id: `${def.id}__${cls}`,
    baseId: def.id,
    name: def.name,
    group: def.group,
    classification: cls,
    vendaMes,
    compraMes,
    cmv,
    vendaProjetada,
    limiteCompra,
    saldoCompra,
    cmvIdealVendaAtual: cd.cmvIdeal,
    cmvProjetado,
    diferencaCompraIdeal,
    projecaoCompraIdeal,
    curves,
  };
}

export const MOCK_STORES: StoreData[] = STORE_DEFS.flatMap(def =>
  CLASSIFICATIONS.map(cls => buildStore(def, cls)),
);
