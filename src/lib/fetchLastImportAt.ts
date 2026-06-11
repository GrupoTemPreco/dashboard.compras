import { supabase } from './supabase';

export async function fetchLastImportAt(): Promise<string | null> {
  const { data, error } = await supabase
    .from('importacoes')
    .select('importado_em')
    .gt('total_linhas', 0)
    .order('importado_em', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.importado_em) return null;
  return data.importado_em;
}
