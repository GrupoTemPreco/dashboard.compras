import type { FormEvent } from 'react';
import { theme } from '../../utils/theme';
import { formatLojaLabel } from '../../lib/lojas';
import { toFirstOfMonthIso } from '../../utils/period';
import type { AjusteManualInput, AjusteManualRow } from '../../lib/ajustesManuais/types';
import type { LojaRow } from '../../lib/lojas';

export type ClassificacaoOption = { codigo: string; nome: string };

interface AjusteManualFormProps {
  initial: AjusteManualRow | null;
  lojas: LojaRow[];
  classificacoes: ClassificacaoOption[];
  defaultCriadoPor: string;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: AjusteManualInput) => void;
}

function toMonthInputValue(iso: string): string {
  const m = iso.trim().match(/^(\d{4})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}` : '';
}

function currentMonthValue(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export default function AjusteManualForm({
  initial,
  lojas,
  classificacoes,
  defaultCriadoPor,
  saving,
  onCancel,
  onSubmit,
}: AjusteManualFormProps) {
  const lojasSorted = [...lojas].sort((a, b) =>
    formatLojaLabel(a.company_code).localeCompare(formatLojaLabel(b.company_code), 'pt-BR'),
  );

  const inputStyle = {
    backgroundColor: theme.bg,
    color: theme.textPrimary,
    border: `1px solid ${theme.border}`,
  } as const;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const idLoja = Number(fd.get('id_loja'));
    const classificacao = String(fd.get('classificacao') ?? '').trim();
    const fornecedorRaw = String(fd.get('fornecedor') ?? '').trim();
    const prazoRaw = String(fd.get('prazo') ?? '').trim();
    const valorRaw = String(fd.get('valor') ?? '').trim().replace(',', '.');
    const mesRaw = String(fd.get('mes_referencia') ?? '').trim();
    const observacao = String(fd.get('observacao') ?? '').trim();
    const criadoPorRaw = String(fd.get('criado_por') ?? '').trim();

    if (!idLoja || Number.isNaN(idLoja) || !classificacao || !mesRaw || !observacao) return;
    const valor = Number(valorRaw);
    if (Number.isNaN(valor)) return;

    onSubmit({
      id_loja: idLoja,
      classificacao,
      fornecedor: fornecedorRaw || null,
      prazo: prazoRaw === '' ? null : Number(prazoRaw),
      valor,
      mes_referencia: toFirstOfMonthIso(`${mesRaw}-01`),
      observacao,
      criado_por: criadoPorRaw || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3 overflow-y-auto">
      <h3 className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
        {initial ? 'Editar ajuste' : 'Novo ajuste'}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-xs space-y-1" style={{ color: theme.textSecondary }}>
          <span>Loja</span>
          <select
            name="id_loja"
            required
            defaultValue={initial?.id_loja ?? ''}
            className="w-full text-sm rounded-md px-2 py-2 outline-none"
            style={inputStyle}
          >
            <option value="" disabled>
              Selecione…
            </option>
            {lojasSorted.map(l => (
              <option key={l.id_loja} value={l.id_loja}>
                {formatLojaLabel(l.company_code)}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs space-y-1" style={{ color: theme.textSecondary }}>
          <span>Classificação</span>
          <select
            name="classificacao"
            required
            defaultValue={initial?.classificacao ?? ''}
            className="w-full text-sm rounded-md px-2 py-2 outline-none"
            style={inputStyle}
          >
            <option value="" disabled>
              Selecione…
            </option>
            {classificacoes.map(c => (
              <option key={c.codigo} value={c.codigo}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs space-y-1" style={{ color: theme.textSecondary }}>
          <span>Mês de referência</span>
          <input
            type="month"
            name="mes_referencia"
            required
            defaultValue={
              initial ? toMonthInputValue(initial.mes_referencia) : currentMonthValue()
            }
            className="w-full text-sm rounded-md px-2 py-2 outline-none"
            style={inputStyle}
          />
        </label>

        <label className="text-xs space-y-1" style={{ color: theme.textSecondary }}>
          <span>Valor (aceita negativo)</span>
          <input
            type="number"
            name="valor"
            required
            step="0.01"
            defaultValue={initial?.valor ?? ''}
            className="w-full text-sm rounded-md px-2 py-2 outline-none"
            style={inputStyle}
          />
        </label>

        <label className="text-xs space-y-1" style={{ color: theme.textSecondary }}>
          <span>Fornecedor (opcional)</span>
          <input
            type="text"
            name="fornecedor"
            defaultValue={initial?.fornecedor ?? ''}
            className="w-full text-sm rounded-md px-2 py-2 outline-none"
            style={inputStyle}
          />
        </label>

        <label className="text-xs space-y-1" style={{ color: theme.textSecondary }}>
          <span>Prazo em dias (opcional)</span>
          <input
            type="number"
            name="prazo"
            min={0}
            step={1}
            defaultValue={initial?.prazo ?? ''}
            className="w-full text-sm rounded-md px-2 py-2 outline-none"
            style={inputStyle}
          />
        </label>
      </div>

      <label className="block text-xs space-y-1" style={{ color: theme.textSecondary }}>
        <span>Observação</span>
        <textarea
          name="observacao"
          required
          rows={3}
          defaultValue={initial?.observacao ?? ''}
          className="w-full text-sm rounded-md px-2 py-2 outline-none resize-y"
          style={inputStyle}
        />
      </label>

      <label className="block text-xs space-y-1" style={{ color: theme.textSecondary }}>
        <span>Criado por (opcional)</span>
        <input
          type="text"
          name="criado_por"
          defaultValue={initial?.criado_por ?? defaultCriadoPor}
          placeholder="Nome ou iniciais"
          className="w-full text-sm rounded-md px-2 py-2 outline-none"
          style={inputStyle}
        />
      </label>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm px-3 py-2 rounded-lg"
          style={{
            color: theme.textPrimary,
            border: `1px solid ${theme.border}`,
            backgroundColor: theme.bg,
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-40"
          style={{ backgroundColor: theme.accent, color: '#fff' }}
        >
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}
