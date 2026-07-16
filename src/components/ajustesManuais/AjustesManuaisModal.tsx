import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { theme } from '../../utils/theme';
import { fetchLojasPorId, type LojaRow } from '../../lib/lojas';
import { fetchAllRowsSnapshot } from '../../lib/fetchRows';
import { fetchAjustesManuaisLista } from '../../lib/ajustesManuais/fetchAjustesManuais';
import {
  deleteAjusteManual,
  insertAjusteManual,
  updateAjusteManual,
} from '../../lib/ajustesManuais/saveAjusteManual';
import type { AjusteManualInput, AjusteManualRow } from '../../lib/ajustesManuais/types';
import AjusteManualForm, { type ClassificacaoOption } from './AjusteManualForm';
import AjusteManualListRow from './AjusteManualRow';

const CRIADO_POR_KEY = 'compras.ajustesManuais.criadoPor';

interface AjustesManuaisModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function AjustesManuaisModal({ open, onClose, onSaved }: AjustesManuaisModalProps) {
  const [rows, setRows] = useState<AjusteManualRow[]>([]);
  const [lojas, setLojas] = useState<LojaRow[]>([]);
  const [classificacoes, setClassificacoes] = useState<ClassificacaoOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [editing, setEditing] = useState<AjusteManualRow | null>(null);
  const [defaultCriadoPor, setDefaultCriadoPor] = useState('');

  const nomePorCodigo = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of classificacoes) m.set(c.codigo, c.nome);
    return m;
  }, [classificacoes]);

  const companyById = useMemo(() => {
    const m = new Map<number, string>();
    for (const l of lojas) m.set(l.id_loja, l.company_code?.trim() ?? '');
    return m;
  }, [lojas]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [listaRes, lojasRes, clsRes] = await Promise.all([
      fetchAjustesManuaisLista(),
      fetchLojasPorId(),
      fetchAllRowsSnapshot<{ codigo: string; nome: string }>('classificacoes', 'codigo, nome', 'id'),
    ]);
    setLoading(false);

    if (listaRes.error) {
      setError(listaRes.error.message);
      setRows([]);
    } else {
      setRows(listaRes.rows);
    }

    if (lojasRes.error) {
      setError(prev => prev ?? lojasRes.error!.message);
      setLojas([]);
    } else {
      setLojas([...lojasRes.byId.values()]);
    }

    if (clsRes.error) {
      setError(prev => prev ?? clsRes.error!.message);
      setClassificacoes([]);
    } else {
      setClassificacoes(
        (clsRes.rows ?? [])
          .map(c => ({
            codigo: String(c.codigo ?? '').trim().toUpperCase(),
            nome: String(c.nome ?? '').trim(),
          }))
          .filter(c => c.codigo)
          .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
      );
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setMode('list');
    setEditing(null);
    setError(null);
    try {
      setDefaultCriadoPor(localStorage.getItem(CRIADO_POR_KEY) ?? '');
    } catch {
      setDefaultCriadoPor('');
    }
    void loadAll();
  }, [open, loadAll]);

  const openCreate = () => {
    setEditing(null);
    setMode('form');
  };

  const openEdit = (row: AjusteManualRow) => {
    setEditing(row);
    setMode('form');
  };

  const handleSubmit = async (input: AjusteManualInput) => {
    setSaving(true);
    setError(null);
    const r = editing
      ? await updateAjusteManual(editing.id, input)
      : await insertAjusteManual(input);
    setSaving(false);
    if (r.error) {
      setError(r.error.message);
      return;
    }
    if (input.criado_por) {
      try {
        localStorage.setItem(CRIADO_POR_KEY, input.criado_por);
        setDefaultCriadoPor(input.criado_por);
      } catch {
        /* ignore */
      }
    }
    setMode('list');
    setEditing(null);
    await loadAll();
    onSaved?.();
  };

  const handleDelete = async (row: AjusteManualRow) => {
    const ok = window.confirm(
      `Excluir ajuste de ${formatCurrencyHint(row.valor)} em ${row.classificacao}?`,
    );
    if (!ok) return;
    setDeletingId(row.id);
    setError(null);
    const r = await deleteAjusteManual(row.id);
    setDeletingId(null);
    if (r.error) {
      setError(r.error.message);
      return;
    }
    await loadAll();
    onSaved?.();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-3xl flex flex-col rounded-xl overflow-hidden shadow-2xl"
        style={{
          backgroundColor: theme.card,
          border: `1px solid ${theme.border}`,
          maxHeight: 'min(90vh, 820px)',
          height: 'min(90vh, 820px)',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ajustes-manuais-title"
      >
        <header
          className="flex items-start justify-between gap-3 px-5 py-4 flex-shrink-0"
          style={{ borderBottom: `1px solid ${theme.border}` }}
        >
          <div>
            <h2
              id="ajustes-manuais-title"
              className="text-lg font-bold"
              style={{ color: theme.textPrimary }}
            >
              Ajustes manuais de compras
            </h2>
            <p className="text-xs mt-1" style={{ color: theme.textSecondary }}>
              Lançamentos somados à coluna Compras por loja e classificação no mês de referência.
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

        {mode === 'list' && (
          <>
            <div
              className="px-4 py-3 flex-shrink-0 flex items-center justify-between gap-2"
              style={{ borderBottom: `1px solid ${theme.border}` }}
            >
              <p className="text-xs" style={{ color: theme.textSecondary }}>
                {loading
                  ? 'Carregando…'
                  : `${rows.length} ajuste${rows.length === 1 ? '' : 's'}`}
              </p>
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: theme.accent, color: '#fff' }}
              >
                <Plus size={14} />
                Novo ajuste
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              {loading ? (
                <p className="text-sm px-4 py-8 text-center" style={{ color: theme.textSecondary }}>
                  Carregando ajustes…
                </p>
              ) : rows.length === 0 ? (
                <p className="text-sm px-4 py-8 text-center" style={{ color: theme.textSecondary }}>
                  Nenhum ajuste manual cadastrado.
                </p>
              ) : (
                rows.map(row => (
                  <AjusteManualListRow
                    key={row.id}
                    ajuste={row}
                    companyCode={companyById.get(row.id_loja) ?? ''}
                    classificacaoNome={nomePorCodigo.get(row.classificacao) ?? row.classificacao}
                    onEdit={() => openEdit(row)}
                    onDelete={() => void handleDelete(row)}
                    deleting={deletingId === row.id}
                  />
                ))
              )}
            </div>
          </>
        )}

        {mode === 'form' && (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <AjusteManualForm
              initial={editing}
              lojas={lojas}
              classificacoes={classificacoes}
              defaultCriadoPor={defaultCriadoPor}
              saving={saving}
              onCancel={() => {
                setMode('list');
                setEditing(null);
              }}
              onSubmit={input => void handleSubmit(input)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function formatCurrencyHint(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}
