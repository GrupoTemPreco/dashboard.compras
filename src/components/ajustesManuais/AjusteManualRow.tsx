import { theme, formatCurrencyExact } from '../../utils/theme';
import { formatLojaLabel } from '../../lib/lojas';
import { formatMesCurto } from '../../utils/period';
import type { AjusteManualRow } from '../../lib/ajustesManuais/types';

interface AjusteManualRowProps {
  ajuste: AjusteManualRow;
  companyCode: string;
  classificacaoNome: string;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}

export default function AjusteManualListRow({
  ajuste,
  companyCode,
  classificacaoNome,
  onEdit,
  onDelete,
  deleting,
}: AjusteManualRowProps) {
  const positivo = ajuste.valor >= 0;
  const valorColor = positivo ? theme.green : theme.red;

  return (
    <div
      className="flex flex-wrap items-start gap-3 px-4 py-3"
      style={{ borderBottom: `1px solid ${theme.border}` }}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span
            className="text-sm font-semibold tabular-nums"
            style={{ color: valorColor }}
          >
            {positivo ? '+' : ''}
            {formatCurrencyExact(ajuste.valor)}
          </span>
          <span className="text-xs" style={{ color: theme.textSecondary }}>
            {formatMesCurto(ajuste.mes_referencia)}
          </span>
          <span className="text-xs font-medium" style={{ color: theme.textPrimary }}>
            {formatLojaLabel(companyCode)}
          </span>
          <span
            className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
            style={{
              color: theme.accent,
              backgroundColor: `${theme.accent}18`,
              border: `1px solid ${theme.accent}40`,
            }}
          >
            {classificacaoNome || ajuste.classificacao}
          </span>
        </div>
        <p className="text-xs" style={{ color: theme.textSecondary }}>
          {ajuste.observacao}
        </p>
        {(ajuste.fornecedor || ajuste.prazo != null || ajuste.criado_por) && (
          <p className="text-[11px]" style={{ color: theme.textSecondary }}>
            {[
              ajuste.fornecedor || null,
              ajuste.prazo != null ? `Prazo ${ajuste.prazo} dias` : null,
              ajuste.criado_por ? `por ${ajuste.criado_por}` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="text-xs px-2.5 py-1.5 rounded-md hover:bg-white/5"
          style={{ color: theme.textPrimary, border: `1px solid ${theme.border}` }}
        >
          Editar
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={onDelete}
          className="text-xs px-2.5 py-1.5 rounded-md hover:bg-white/5 disabled:opacity-40"
          style={{ color: theme.red, border: `1px solid ${theme.red}55` }}
        >
          {deleting ? '…' : 'Excluir'}
        </button>
      </div>
    </div>
  );
}
