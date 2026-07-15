import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { theme, formatCurrencyExact } from '../../utils/theme';
import { formatDateBr, formatPeriodLabel, type PeriodRange } from '../../utils/period';
import {
  fetchComprasPedidosDetalhe,
  type CompraPedidoDetalheRow,
} from '../../lib/comprasDetalhe/fetchComprasPedidosDetalhe';

function statusBadgeStyle(status: string | null): {
  color: string;
  backgroundColor: string;
  border: string;
} {
  const key = (status ?? '').trim().toLowerCase();
  const color =
    key === 'confirmado'
      ? '#f97316'
      : key === 'recebido'
        ? '#22d3ee'
        : key === 'desistido'
          ? '#ef4444'
          : key === 'recebido parcialmente'
            ? '#f472b6'
            : theme.textSecondary;
  return {
    color,
    backgroundColor: `${color}18`,
    border: `1px solid ${color}40`,
  };
}

export type ComprasDetalheTarget = {
  classificacaoCodigo: string;
  classificacaoNome: string;
  comprasEsperado: number;
  allowedLojaIds: number[];
};

interface ComprasPedidosModalProps {
  open: boolean;
  target: ComprasDetalheTarget | null;
  period: PeriodRange;
  onClose: () => void;
}

export default function ComprasPedidosModal({
  open,
  target,
  period,
  onClose,
}: ComprasPedidosModalProps) {
  const [rows, setRows] = useState<CompraPedidoDetalheRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !target) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const r = await fetchComprasPedidosDetalhe({
        classificacaoCodigo: target.classificacaoCodigo,
        period,
        allowedLojaIds: target.allowedLojaIds,
      });
      if (cancelled) return;
      if (r.error) {
        setError(r.error.message);
        setRows([]);
        setTotal(0);
      } else {
        setRows(r.rows);
        setTotal(r.total);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, target, period]);

  if (!open || !target) return null;

  const diverge =
    !loading &&
    !error &&
    Math.abs(total - target.comprasEsperado) > 0.015;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-5xl flex flex-col rounded-xl overflow-hidden shadow-2xl"
        style={{
          backgroundColor: theme.card,
          border: `1px solid ${theme.border}`,
          maxHeight: 'min(92vh, 900px)',
          height: 'min(92vh, 900px)',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="compras-detalhe-title"
      >
        <header
          className="flex items-start justify-between gap-3 px-5 py-4 flex-shrink-0"
          style={{ borderBottom: `1px solid ${theme.border}` }}
        >
          <div>
            <h2
              id="compras-detalhe-title"
              className="text-lg font-bold"
              style={{ color: theme.textPrimary }}
            >
              Compras · {target.classificacaoNome}
            </h2>
            <p className="text-xs mt-1" style={{ color: theme.textSecondary }}>
              Pedidos que entram no valor de Compras — {formatPeriodLabel(period)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-white/5"
            aria-label="Fechar"
          >
            <X size={18} style={{ color: theme.textSecondary }} />
          </button>
        </header>

        {error && (
          <p
            className="text-xs px-5 py-2 flex-shrink-0"
            style={{
              backgroundColor: '#3f1f25',
              color: '#fca5a5',
              borderBottom: '1px solid #7f1d1d',
            }}
          >
            {error}
          </p>
        )}

        {diverge && (
          <p
            className="text-xs px-5 py-2 flex-shrink-0"
            style={{
              backgroundColor: `${theme.yellow}12`,
              color: theme.yellow,
              borderBottom: `1px solid ${theme.yellow}40`,
            }}
          >
            Total do detalhe ({formatCurrencyExact(total)}) difere de Compras na tabela (
            {formatCurrencyExact(target.comprasEsperado)}).
          </p>
        )}

        <div className="flex-1 min-h-0 overflow-auto">
          {loading ? (
            <p className="text-sm px-5 py-10 text-center" style={{ color: theme.textSecondary }}>
              Carregando pedidos…
            </p>
          ) : rows.length === 0 ? (
            <p className="text-sm px-5 py-10 text-center" style={{ color: theme.textSecondary }}>
              Nenhum pedido no período/filtros atuais.
            </p>
          ) : (
            <table className="w-full text-xs">
              <thead
                className="sticky top-0 z-10"
                style={{ backgroundColor: '#0b1120', color: theme.textSecondary }}
              >
                <tr className="text-left text-[10px] uppercase tracking-wider">
                  <th className="px-4 py-2.5 font-semibold">Código</th>
                  <th className="px-3 py-2.5 font-semibold">Fornecedor</th>
                  <th className="px-3 py-2.5 font-semibold">Loja</th>
                  <th className="px-3 py-2.5 font-semibold">Data</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Prazo</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr
                    key={`${r.codigo_pedido}|${r.id_loja}|${r.data}|${r.status}|${r.prazo}`}
                    style={{ borderTop: `1px solid ${theme.border}`, color: theme.textPrimary }}
                  >
                    <td className="px-4 py-2 font-semibold tabular-nums">{r.codigo_pedido}</td>
                    <td className="px-3 py-2 truncate max-w-[14rem]" style={{ color: theme.textSecondary }}>
                      {r.fornecedor || '—'}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{r.id_loja}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {r.data ? formatDateBr(r.data) : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
                        style={statusBadgeStyle(r.status)}
                      >
                        {r.status ?? '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: theme.textSecondary }}>
                      {r.prazo ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium">
                      {formatCurrencyExact(r.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <footer
          className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 flex-shrink-0"
          style={{ borderTop: `1px solid ${theme.border}` }}
        >
          <p className="text-xs" style={{ color: theme.textSecondary }}>
            {loading ? '…' : `${rows.length} pedido${rows.length === 1 ? '' : 's'}`}
          </p>
          <p className="text-sm font-semibold tabular-nums" style={{ color: theme.textPrimary }}>
            Total {formatCurrencyExact(total)}
          </p>
        </footer>
      </div>
    </div>
  );
}
