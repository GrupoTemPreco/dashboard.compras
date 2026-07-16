export type AjusteManualRow = {
  id: number;
  id_loja: number;
  classificacao: string;
  fornecedor: string | null;
  prazo: number | null;
  valor: number;
  mes_referencia: string;
  observacao: string;
  criado_por: string | null;
  criado_em: string;
};

export type AjusteManualInput = {
  id_loja: number;
  classificacao: string;
  fornecedor: string | null;
  prazo: number | null;
  valor: number;
  mes_referencia: string;
  observacao: string;
  criado_por: string | null;
};
