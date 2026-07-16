import { useMemo, useState } from 'react';
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';
import { theme } from '../../utils/theme';
import type {
  PedidoBreakdownRow,
  PedidoListaRow,
} from '../../lib/pedidosModal/fetchPedidosModalSnapshot';
import { pedidoListaRowKey } from '../../lib/pedidosModal/fetchPedidosModalSnapshot';
import PedidosModalRow from './PedidosModalRow';

interface PedidosModalListProps {
  pedidos: PedidoListaRow[];
  showVerTodosToggle: boolean;
  verTodos: boolean;
  onVerTodosChange: (v: boolean) => void;
  search: string;
  onSearchChange: (v: string) => void;
  expandedKey: string | null;
  loadingBreakdownCodigo: string | null;
  breakdownByCodigo: Map<string, PedidoBreakdownRow[]>;
  pending: Map<string, string>;
  onToggle: (rowKey: string, codigo: string) => void;
  onMesChange: (codigo: string, mesIso: string, baselineIso: string) => void;
}

type SortDataDir = 'desc' | 'asc';

export default function PedidosModalList({
  pedidos,
  showVerTodosToggle,
  verTodos,
  onVerTodosChange,
  search,
  onSearchChange,
  expandedKey,
  loadingBreakdownCodigo,
  breakdownByCodigo,
  pending,
  onToggle,
  onMesChange,
}: PedidosModalListProps) {
  const [filterDataDe, setFilterDataDe] = useState('');
  const [filterDataAte, setFilterDataAte] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortDataDir, setSortDataDir] = useState<SortDataDir>('desc');

  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of pedidos) {
      if (p.status) set.add(p.status);
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [pedidos]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const dataDe = filterDataDe.trim();
    const dataAte = filterDataAte.trim();
    const statusFiltro = filterStatus.trim();

    let rows = pedidos.filter(p => {
      if (q) {
        const hit =
          p.codigo_pedido.toLowerCase().includes(q) ||
          p.fornecedor.toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (dataDe || dataAte) {
        const d = p.data ?? '';
        if (!d) return false;
        if (dataDe && d < dataDe) return false;
        if (dataAte && d > dataAte) return false;
      }
      if (statusFiltro && (p.status ?? '') !== statusFiltro) return false;
      return true;
    });

    rows = [...rows].sort((a, b) => {
      const da = a.data ?? '';
      const db = b.data ?? '';
      const cmp = da.localeCompare(db);
      if (cmp !== 0) return sortDataDir === 'asc' ? cmp : -cmp;
      if (a.id_loja !== b.id_loja) return a.id_loja - b.id_loja;
      return a.codigo_pedido.localeCompare(b.codigo_pedido, 'pt-BR');
    });

    return rows;
  }, [pedidos, search, filterDataDe, filterDataAte, filterStatus, sortDataDir]);

  const inputStyle = {
    backgroundColor: theme.bg,
    color: theme.textPrimary,
    border: `1px solid ${theme.border}`,
  } as const;

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div
        className="px-4 py-3 flex-shrink-0 space-y-2"
        style={{ borderBottom: `1px solid ${theme.border}` }}
      >
        <input
          type="search"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Buscar por código do pedido ou fornecedor…"
          className="w-full text-sm rounded-lg px-3 py-2 outline-none"
          style={inputStyle}
        />

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex items-center gap-1.5 text-xs"
            style={{ color: theme.textSecondary }}
          >
            <label className="flex items-center gap-1">
              De
              <input
                type="date"
                value={filterDataDe}
                onChange={e => setFilterDataDe(e.target.value)}
                className="text-xs rounded-md px-2 py-1.5 outline-none"
                style={inputStyle}
              />
            </label>
            <label className="flex items-center gap-1">
              Até
              <input
                type="date"
                value={filterDataAte}
                onChange={e => setFilterDataAte(e.target.value)}
                className="text-xs rounded-md px-2 py-1.5 outline-none"
                style={inputStyle}
              />
            </label>
          </div>

          <label className="flex items-center gap-1.5 text-xs" style={{ color: theme.textSecondary }}>
            Status
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="text-xs rounded-md px-2 py-1.5 outline-none"
              style={inputStyle}
            >
              <option value="">Todos</option>
              {statusOptions.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => setSortDataDir(d => (d === 'desc' ? 'asc' : 'desc'))}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md hover:bg-white/[0.04]"
            style={inputStyle}
            title={sortDataDir === 'desc' ? 'Ordenar data crescente' : 'Ordenar data decrescente'}
          >
            {sortDataDir === 'desc' ? (
              <ArrowDownWideNarrow size={14} style={{ color: theme.accent }} />
            ) : (
              <ArrowUpNarrowWide size={14} style={{ color: theme.accent }} />
            )}
            {sortDataDir === 'desc' ? 'Data ↓' : 'Data ↑'}
          </button>

          {showVerTodosToggle && (
            <label
              className="ml-auto inline-flex items-center gap-2 text-xs cursor-pointer select-none"
              style={{ color: theme.textSecondary }}
              title="Inclui pedidos fora do período selecionado no dashboard"
            >
              <span>Ver todos os pedidos</span>
              <button
                type="button"
                role="switch"
                aria-checked={verTodos}
                onClick={() => onVerTodosChange(!verTodos)}
                className="relative w-9 h-5 rounded-full transition-colors"
                style={{
                  backgroundColor: verTodos ? theme.accent : theme.border,
                }}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                  style={{
                    transform: verTodos ? 'translateX(1rem)' : 'translateX(0)',
                  }}
                />
              </button>
            </label>
          )}
        </div>

        <p className="text-[11px]" style={{ color: theme.textSecondary }}>
          {filtered.length} pedido{filtered.length === 1 ? '' : 's'}
          {search.trim() || filterDataDe || filterDataAte || filterStatus
            ? ' encontrado(s)'
            : ''}
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-sm px-4 py-8 text-center" style={{ color: theme.textSecondary }}>
            Nenhum pedido encontrado.
          </p>
        ) : (
          filtered.map(p => {
            const rowKey = pedidoListaRowKey(p);
            return (
              <PedidosModalRow
                key={rowKey}
                pedido={p}
                expanded={expandedKey === rowKey}
                loadingBreakdown={loadingBreakdownCodigo === p.codigo_pedido}
                breakdown={breakdownByCodigo.get(p.codigo_pedido)}
                pendingMes={pending.get(p.codigo_pedido)}
                onToggle={() => onToggle(rowKey, p.codigo_pedido)}
                onMesChange={(mes, baseline) => onMesChange(p.codigo_pedido, mes, baseline)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
