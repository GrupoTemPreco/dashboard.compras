import { ChevronDown, ChevronRight } from 'lucide-react';
import { theme, formatCurrencyExact } from '../../utils/theme';
import type { PedidoBreakdownRow, PedidoListaRow } from '../../lib/ajusteMes/fetchPedidosAjuste';
import { formatDateBr, formatMesCurto, toFirstOfMonthIso } from '../../utils/period';
import MesReferenciaSelect from './MesReferenciaSelect';

function statusBadgeStyle(status: string | null): { color: string; backgroundColor: string; border: string } {
  const key = (status ?? '').trim().toLowerCase();
  const color =
    key === 'confirmado'
      ? '#f97316' // laranja
      : key === 'recebido'
        ? '#22d3ee' // ciano
        : key === 'desistido'
          ? '#ef4444' // vermelho
          : key === 'recebido parcialmente'
            ? '#f472b6' // rosa
            : theme.textSecondary;

  return {
    color,
    backgroundColor: `${color}18`,
    border: `1px solid ${color}40`,
  };
}

interface PedidoAjusteRowProps {
  pedido: PedidoListaRow;
  expanded: boolean;
  loadingBreakdown: boolean;
  breakdown: PedidoBreakdownRow[] | undefined;
  pendingMes: string | undefined;
  onToggle: () => void;
  onMesChange: (mesIso: string, baselineIso: string) => void;
}

export default function PedidoAjusteRow({
  pedido,
  expanded,
  loadingBreakdown,
  breakdown,
  pendingMes,
  onToggle,
  onMesChange,
}: PedidoAjusteRowProps) {
  const baseline =
    breakdown?.find(r => r.editavel)?.mes_referencia_final ??
    breakdown?.[0]?.mes_referencia_final ??
    '';
  const showAjustado = Boolean(pendingMes) || pedido.tem_ajuste;

  return (
    <div style={{ borderBottom: `1px solid ${theme.border}` }}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
      >
        {expanded ? (
          <ChevronDown size={16} style={{ color: theme.textSecondary, flexShrink: 0 }} />
        ) : (
          <ChevronRight size={16} style={{ color: theme.textSecondary, flexShrink: 0 }} />
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0 flex-1">
          <span
            className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded flex-shrink-0"
            style={statusBadgeStyle(pedido.status)}
          >
            {pedido.status ?? '—'}
          </span>
          <span className="text-xs tabular-nums flex-shrink-0" style={{ color: theme.textSecondary }}>
            {pedido.data ? formatDateBr(pedido.data) : '—'}
          </span>
          <span className="text-sm font-semibold tabular-nums" style={{ color: theme.textPrimary }}>
            {pedido.codigo_pedido}
          </span>
          {showAjustado && (
            <span
              className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
              style={{
                color: theme.yellow,
                backgroundColor: `${theme.yellow}18`,
                border: `1px solid ${theme.yellow}40`,
              }}
            >
              ajustado
            </span>
          )}
          <span className="text-xs truncate" style={{ color: theme.textSecondary }}>
            {pedido.fornecedor || '—'}
          </span>
          <span className="text-xs tabular-nums" style={{ color: theme.textSecondary }}>
            Loja {pedido.id_loja}
            {pedido.prazo != null ? ` · Prazo ${pedido.prazo} dias` : ''}
          </span>
        </div>
        <span className="text-sm font-medium tabular-nums flex-shrink-0" style={{ color: theme.textPrimary }}>
          {formatCurrencyExact(pedido.valor_total)}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-3 pl-12">
          {loadingBreakdown && (
            <p className="text-xs py-2" style={{ color: theme.textSecondary }}>
              Carregando classificações…
            </p>
          )}
          {!loadingBreakdown && breakdown && breakdown.length === 0 && (
            <p className="text-xs py-2" style={{ color: theme.textSecondary }}>
              Nenhuma classificação encontrada.
            </p>
          )}
          {!loadingBreakdown && breakdown && breakdown.length > 0 && (
            <div
              className="rounded-md overflow-hidden"
              style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.bg }}
            >
              <div
                className="grid gap-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  gridTemplateColumns: 'minmax(120px,1.2fr) 4.5rem minmax(5.5rem,1fr) minmax(8rem,1fr)',
                  color: theme.textSecondary,
                  borderBottom: `1px solid ${theme.border}`,
                }}
              >
                <span>Classificação</span>
                <span className="text-right">Prazo</span>
                <span className="text-right">Valor</span>
                <span className="text-right">Mês referência</span>
              </div>
              {breakdown.map(row => {
                const displayMes = toFirstOfMonthIso(
                  pendingMes ?? row.mes_referencia_final,
                );
                return (
                  <div
                    key={`${row.classificacao}|${row.prazo}|${row.mes_referencia_calculado}`}
                    className="grid gap-2 px-3 py-2 items-center text-xs"
                    style={{
                      gridTemplateColumns:
                        'minmax(120px,1.2fr) 4.5rem minmax(5.5rem,1fr) minmax(8rem,1fr)',
                      borderBottom: `1px solid ${theme.border}88`,
                      color: theme.textPrimary,
                    }}
                  >
                    <span className="font-medium truncate">{row.classificacao}</span>
                    <span className="text-right tabular-nums" style={{ color: theme.textSecondary }}>
                      {row.prazo ?? '—'}
                    </span>
                    <span className="text-right tabular-nums">{formatCurrencyExact(row.valor)}</span>
                    <div className="flex justify-end">
                      {row.editavel ? (
                        <MesReferenciaSelect
                          vigenteIso={row.mes_referencia_final}
                          value={displayMes}
                          onChange={mes => onMesChange(mes, baseline || row.mes_referencia_final)}
                        />
                      ) : (
                        <span className="text-[11px]" style={{ color: theme.textSecondary }}>
                          Não editável
                          {row.mes_referencia_final
                            ? ` · ${formatMesCurto(row.mes_referencia_final)}`
                            : ''}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
