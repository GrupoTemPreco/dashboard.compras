import { useCallback, useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { theme, formatCurrencyExact } from '../../utils/theme';
import { formatPeriodLabel, toFirstOfMonthIso, type PeriodRange } from '../../utils/period';
import {
  fetchPedidoBreakdown,
  fetchPedidosModalSnapshot,
  type PedidoBreakdownRow,
  type PedidoListaRow,
} from '../../lib/pedidosModal/fetchPedidosModalSnapshot';
import { filterPedidosModal } from '../../lib/pedidosModal/filterPedidosModal';
import { saveAjustesMes } from '../../lib/pedidosModal/saveAjustesMes';
import PedidosModalList from './PedidosModalList';

export type PedidosModalOpenContext = {
  /** null = Perfumaria + Oficinais */
  classificacaoCodigo: 'PERFUMARIA' | 'OFICINAIS' | null;
  classificacaoNome?: string;
  /** default do toggle; botão geral força true e esconde o controle */
  verTodosDefault: boolean;
  /** false no botão geral — toggle oculto e travado em true */
  allowToggleVerTodos: boolean;
  period: PeriodRange;
  /** null = todas as lojas */
  allowedLojaIds: number[] | null;
  /** só para conferência com Compras quando !verTodos */
  comprasEsperado: number | null;
};

interface PedidosUnificadoModalProps {
  open: boolean;
  context: PedidosModalOpenContext | null;
  onClose: () => void;
  onSaved?: () => void;
}

export default function PedidosUnificadoModal({
  open,
  context,
  onClose,
  onSaved,
}: PedidosUnificadoModalProps) {
  const [snapshot, setSnapshot] = useState<PedidoListaRow[]>([]);
  const [search, setSearch] = useState('');
  const [verTodos, setVerTodos] = useState(true);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [breakdownByCodigo, setBreakdownByCodigo] = useState<Map<string, PedidoBreakdownRow[]>>(
    () => new Map(),
  );
  const [loadingBreakdownCodigo, setLoadingBreakdownCodigo] = useState<string | null>(null);
  const [pending, setPending] = useState<Map<string, string>>(() => new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  const pendingCount = pending.size;

  const loadSnapshot = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const r = await fetchPedidosModalSnapshot();
    if (r.error) {
      setLoadError(r.error.message);
      setSnapshot([]);
    } else {
      setSnapshot(r.pedidos);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!open || !context) return;
    setSearch('');
    setExpandedKey(null);
    setBreakdownByCodigo(new Map());
    setPending(new Map());
    setSaveError(null);
    setConfirmCloseOpen(false);
    setVerTodos(context.allowToggleVerTodos ? context.verTodosDefault : true);
    void loadSnapshot();
  }, [open, context, loadSnapshot]);

  const effectiveVerTodos = context?.allowToggleVerTodos === false ? true : verTodos;

  const pedidosVisiveis = useMemo(() => {
    if (!context) return [];
    return filterPedidosModal(snapshot, {
      classificacaoCodigo: context.classificacaoCodigo,
      allowedLojaIds: context.allowedLojaIds,
      verTodos: effectiveVerTodos,
      period: context.period,
    });
  }, [snapshot, context, effectiveVerTodos]);

  const totalVisivel = useMemo(
    () =>
      pedidosVisiveis.reduce(
        (s, p) =>
          s +
          (context?.classificacaoCodigo != null
            ? p.valor_classificacao_contexto
            : p.valor_total),
        0,
      ),
    [pedidosVisiveis, context?.classificacaoCodigo],
  );

  const showTotalConferencia = Boolean(context && !effectiveVerTodos);
  const diverge =
    showTotalConferencia &&
    context?.comprasEsperado != null &&
    Math.abs(totalVisivel - context.comprasEsperado) > 0.015;

  const title = context?.classificacaoNome
    ? `Pedidos · ${context.classificacaoNome}`
    : 'Pedidos · Perfumaria e Oficinais';

  const requestClose = () => {
    if (pending.size > 0) {
      setConfirmCloseOpen(true);
      return;
    }
    onClose();
  };

  const discardAndClose = () => {
    setConfirmCloseOpen(false);
    setPending(new Map());
    onClose();
  };

  const persistPending = async (): Promise<boolean> => {
    if (pending.size === 0) return true;
    setSaving(true);
    setSaveError(null);
    const pendencias = [...pending.entries()].map(([codigo_pedido, mes_referencia_manual]) => ({
      codigo_pedido,
      mes_referencia_manual,
    }));
    const r = await saveAjustesMes(pendencias);
    setSaving(false);
    if (r.error) {
      setSaveError(r.error.message);
      return false;
    }
    setPending(new Map());
    setBreakdownByCodigo(new Map());
    await loadSnapshot();
    onSaved?.();
    return true;
  };

  const confirmAndMaybeClose = async (alsoClose: boolean) => {
    const ok = await persistPending();
    if (!ok) return;
    setConfirmCloseOpen(false);
    if (alsoClose) onClose();
  };

  const handleToggle = async (rowKey: string, codigo: string) => {
    if (expandedKey === rowKey) {
      setExpandedKey(null);
      return;
    }
    setExpandedKey(rowKey);
    if (breakdownByCodigo.has(codigo)) return;

    setLoadingBreakdownCodigo(codigo);
    const r = await fetchPedidoBreakdown(codigo);
    setLoadingBreakdownCodigo(null);
    if (r.error) {
      setSaveError(r.error.message);
      return;
    }
    setBreakdownByCodigo(prev => {
      const next = new Map(prev);
      next.set(codigo, r.rows);
      return next;
    });
  };

  const handleMesChange = (codigo: string, mesIso: string, baselineIso: string) => {
    const nextMes = toFirstOfMonthIso(mesIso);
    const baseline = toFirstOfMonthIso(baselineIso);
    setPending(prev => {
      const next = new Map(prev);
      if (nextMes === baseline) next.delete(codigo);
      else next.set(codigo, nextMes);
      return next;
    });
  };

  if (!open || !context) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      onMouseDown={e => {
        if (e.target === e.currentTarget) requestClose();
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
        aria-labelledby="pedidos-modal-title"
      >
        <header
          className="flex items-start justify-between gap-3 px-5 py-4 flex-shrink-0"
          style={{ borderBottom: `1px solid ${theme.border}` }}
        >
          <div>
            <h2
              id="pedidos-modal-title"
              className="text-lg font-bold"
              style={{ color: theme.textPrimary }}
            >
              {title}
            </h2>
            <p className="text-xs mt-1" style={{ color: theme.textSecondary }}>
              {effectiveVerTodos
                ? 'Todos os pedidos (sem filtro de período). Edições em Perfumaria/Oficinais ficam pendentes até confirmar.'
                : `Pedidos que entram em Compras — ${formatPeriodLabel(context.period)}`}
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            className="p-1.5 rounded-md hover:bg-white/5"
            aria-label="Fechar"
          >
            <X size={18} style={{ color: theme.textSecondary }} />
          </button>
        </header>

        {(loadError || saveError) && (
          <p
            className="text-xs px-5 py-2 flex-shrink-0"
            style={{
              backgroundColor: '#3f1f25',
              color: '#fca5a5',
              borderBottom: '1px solid #7f1d1d',
            }}
          >
            {loadError || saveError}
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
            Total do detalhe ({formatCurrencyExact(totalVisivel)}) difere de Compras na tabela (
            {formatCurrencyExact(context.comprasEsperado ?? 0)}).
          </p>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm" style={{ color: theme.textSecondary }}>
              Carregando pedidos…
            </p>
          </div>
        ) : (
          <PedidosModalList
            pedidos={pedidosVisiveis}
            showVerTodosToggle={context.allowToggleVerTodos}
            verTodos={verTodos}
            onVerTodosChange={setVerTodos}
            search={search}
            onSearchChange={setSearch}
            expandedKey={expandedKey}
            loadingBreakdownCodigo={loadingBreakdownCodigo}
            breakdownByCodigo={breakdownByCodigo}
            pending={pending}
            onToggle={handleToggle}
            onMesChange={handleMesChange}
          />
        )}

        <footer
          className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 flex-shrink-0"
          style={{ borderTop: `1px solid ${theme.border}` }}
        >
          <div className="space-y-0.5">
            <p className="text-xs" style={{ color: theme.textSecondary }}>
              {pendingCount === 0
                ? 'Nenhuma alteração pendente'
                : `${pendingCount} alteração${pendingCount === 1 ? '' : 'ões'} pendente${pendingCount === 1 ? '' : 's'}`}
            </p>
            {showTotalConferencia && (
              <p className="text-sm font-semibold tabular-nums" style={{ color: theme.textPrimary }}>
                Total {formatCurrencyExact(totalVisivel)}
              </p>
            )}
          </div>
          <button
            type="button"
            disabled={pendingCount === 0 || saving}
            onClick={() => void confirmAndMaybeClose(false)}
            className="text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            style={{ backgroundColor: theme.accent, color: '#fff' }}
          >
            {saving ? 'Salvando…' : 'Confirmar alterações'}
          </button>
        </footer>
      </div>

      {confirmCloseOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        >
          <div
            className="w-full max-w-md rounded-xl p-5 shadow-xl"
            style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
            role="alertdialog"
            aria-labelledby="discard-title"
          >
            <h3
              id="discard-title"
              className="text-base font-bold mb-2"
              style={{ color: theme.textPrimary }}
            >
              Descartar alterações?
            </h3>
            <p className="text-sm mb-5" style={{ color: theme.textSecondary }}>
              Você tem {pendingCount} alteração{pendingCount === 1 ? '' : 'ões'} não salva
              {pendingCount === 1 ? '' : 's'}. Se fechar agora, ela
              {pendingCount === 1 ? '' : 's'} será{pendingCount === 1 ? '' : 'ão'} perdida
              {pendingCount === 1 ? '' : 's'}.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={discardAndClose}
                className="text-sm px-3 py-2 rounded-lg"
                style={{
                  color: theme.textPrimary,
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.bg,
                }}
              >
                Descartar alterações
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void confirmAndMaybeClose(true)}
                className="text-sm font-semibold px-3 py-2 rounded-lg disabled:opacity-40"
                style={{ backgroundColor: theme.accent, color: '#fff' }}
              >
                {saving ? 'Salvando…' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
