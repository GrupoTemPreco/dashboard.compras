import { supabase } from './supabase';

const PAGE_SIZE = 1000;

export async function fetchAllRowsInPeriod<T>(
  table: string,
  period: { start: string; end: string },
  select: string,
): Promise<{ rows: T[]; error: { message: string } | null }> {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .gte('data', period.start)
      .lte('data', period.end)
      .range(from, from + PAGE_SIZE - 1);

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
): Promise<{ rows: T[]; error: { message: string } | null }> {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase.from(table).select(select).range(from, from + PAGE_SIZE - 1);

    if (error) return { rows: [], error: { message: `${table}: ${error.message}` } };

    const page = (data ?? []) as T[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return { rows, error: null };
}
