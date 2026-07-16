import { supabase } from './supabase';

const PAGE_SIZE = 1000;

/** Coluna(s) para ORDER BY estável na paginação por .range(). Default: id. */
export type OrderBy = string | string[];

function applyOrder<T extends { order: (column: string, options?: { ascending?: boolean }) => T }>(
  query: T,
  orderBy: OrderBy,
): T {
  const columns = Array.isArray(orderBy) ? orderBy : [orderBy];
  let q = query;
  for (const column of columns) {
    q = q.order(column, { ascending: true });
  }
  return q;
}

export async function fetchAllRowsInPeriod<T>(
  table: string,
  period: { start: string; end: string },
  select: string,
  orderBy: OrderBy = 'id',
  dateColumn: string = 'data',
): Promise<{ rows: T[]; error: { message: string } | null }> {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await applyOrder(
      supabase
        .from(table)
        .select(select)
        .gte(dateColumn, period.start)
        .lte(dateColumn, period.end),
      orderBy,
    ).range(from, from + PAGE_SIZE - 1);

    if (error) return { rows: [], error: { message: `${table}: ${error.message}` } };

    const page = (data ?? []) as T[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return { rows, error: null };
}

/** Snapshot — sem filtro de período. */
export async function fetchAllRowsSnapshot<T>(
  table: string,
  select: string,
  orderBy: OrderBy = 'id',
): Promise<{ rows: T[]; error: { message: string } | null }> {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await applyOrder(
      supabase.from(table).select(select),
      orderBy,
    ).range(from, from + PAGE_SIZE - 1);

    if (error) return { rows: [], error: { message: `${table}: ${error.message}` } };

    const page = (data ?? []) as T[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return { rows, error: null };
}
