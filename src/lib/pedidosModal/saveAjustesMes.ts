import { supabase } from '../supabase';
import { toFirstOfMonthIso } from '../../utils/period';

export type PendenciaAjuste = {
  codigo_pedido: string;
  mes_referencia_manual: string;
};

/** Upsert em lote — onConflict codigo_pedido. Não escreve em pedidos_nao_faturados. */
export async function saveAjustesMes(
  pendencias: PendenciaAjuste[],
): Promise<{ error: { message: string } | null }> {
  if (pendencias.length === 0) return { error: null };

  const payload = pendencias.map(p => ({
    codigo_pedido: p.codigo_pedido.trim(),
    mes_referencia_manual: toFirstOfMonthIso(p.mes_referencia_manual),
    ajustado_por: null as string | null,
  }));

  const { error } = await supabase
    .from('pedidos_ajuste_mes_referencia')
    .upsert(payload, { onConflict: 'codigo_pedido' });

  if (error) {
    return { error: { message: `pedidos_ajuste_mes_referencia: ${error.message}` } };
  }

  return { error: null };
}
