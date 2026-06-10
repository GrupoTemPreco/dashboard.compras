/** Valores vindos do Supabase — não fixar union literais. */
export type Classification = string;
export type Group = string;
export type Curve = string;

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
  compraMesFaturado: number;
  compraMesNaoFaturado: number;
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
  classificationCodigo: string;
  vendaMes: number;
  compraMesFaturado: number;
  compraMesNaoFaturado: number;
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
