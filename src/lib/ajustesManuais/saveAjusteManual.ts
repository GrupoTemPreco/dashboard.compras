import { supabase } from '../supabase';
import { toFirstOfMonthIso } from '../../utils/period';
import type { AjusteManualInput } from './types';

function payloadFromInput(input: AjusteManualInput) {
  return {
    id_loja: input.id_loja,
    classificacao: input.classificacao.trim().toUpperCase(),
    fornecedor: input.fornecedor?.trim() || null,
    prazo: input.prazo == null || Number.isNaN(input.prazo) ? null : Number(input.prazo),
    valor: Number(input.valor),
    mes_referencia: toFirstOfMonthIso(input.mes_referencia),
    observacao: input.observacao.trim(),
    criado_por: input.criado_por?.trim() || null,
  };
}

export async function insertAjusteManual(
  input: AjusteManualInput,
): Promise<{ error: { message: string } | null }> {
  const { error } = await supabase.from('ajustes_manuais_compras').insert(payloadFromInput(input));
  if (error) return { error: { message: `ajustes_manuais_compras: ${error.message}` } };
  return { error: null };
}

export async function updateAjusteManual(
  id: number,
  input: AjusteManualInput,
): Promise<{ error: { message: string } | null }> {
  const { error } = await supabase
    .from('ajustes_manuais_compras')
    .update(payloadFromInput(input))
    .eq('id', id);
  if (error) return { error: { message: `ajustes_manuais_compras: ${error.message}` } };
  return { error: null };
}

export async function deleteAjusteManual(
  id: number,
): Promise<{ error: { message: string } | null }> {
  const { error } = await supabase.from('ajustes_manuais_compras').delete().eq('id', id);
  if (error) return { error: { message: `ajustes_manuais_compras: ${error.message}` } };
  return { error: null };
}
