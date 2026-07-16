import { fetchAllRowsSnapshot } from './fetchRows';

export type LojaRow = {
  id_loja: number;
  company_code: string | null;
  grupo: string | null;
};

/** Label de negócio: company_code, nunca o id_loja interno. */
export function formatLojaLabel(companyCode: string | null | undefined): string {
  const code = companyCode?.trim() ?? '';
  return code ? `Loja ${code}` : 'Loja —';
}

export async function fetchLojasPorId(): Promise<{
  byId: Map<number, LojaRow>;
  error: { message: string } | null;
}> {
  const res = await fetchAllRowsSnapshot<LojaRow>(
    'lojas',
    'id_loja, company_code, grupo',
    'id_loja',
  );
  if (res.error) return { byId: new Map(), error: res.error };

  const byId = new Map<number, LojaRow>();
  for (const loja of res.rows) {
    byId.set(loja.id_loja, loja);
  }
  return { byId, error: null };
}
