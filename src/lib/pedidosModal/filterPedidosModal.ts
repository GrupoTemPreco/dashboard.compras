import { pedidoContaNoKpiNaoFaturado } from '../compraRules';
import type { PeriodRange } from '../../utils/period';
import type { PedidoListaRow } from './fetchPedidosModalSnapshot';

export function filterPedidosModal(
  pedidos: PedidoListaRow[],
  opts: {
    classificacaoCodigo: string | null;
    allowedLojaIds: number[] | null;
    verTodos: boolean;
    period: PeriodRange;
  },
): PedidoListaRow[] {
  const clsFixo = opts.classificacaoCodigo?.trim().toUpperCase() || null;
  const lojas = opts.allowedLojaIds ? new Set(opts.allowedLojaIds) : null;

  const filtered = pedidos.filter(p => {
    if (clsFixo && !p.classificacoes.some(c => c.toUpperCase() === clsFixo)) return false;
    if (lojas && !lojas.has(p.id_loja)) return false;
    if (!opts.verTodos) {
      const clsParaPeriodo = clsFixo ?? p.classificacoes[0] ?? '';
      if (
        !pedidoContaNoKpiNaoFaturado(
          { mes_referencia_final: p.mes_referencia_final, status: p.status },
          clsParaPeriodo,
          opts.period,
        )
      ) {
        return false;
      }
    }
    return true;
  });

  return filtered.map(p => ({
    ...p,
    valor_classificacao_contexto: clsFixo
      ? (p.valor_por_classificacao[clsFixo] ?? 0)
      : 0,
  }));
}
