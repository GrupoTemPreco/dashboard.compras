import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ChevronDown } from 'lucide-react';
import { theme } from '../utils/theme';
import {
  formatPeriodLabel,
  getCurrentMonthPeriod,
  isValidPeriod,
  type PeriodRange,
} from '../utils/period';

interface PeriodFilterProps {
  value: PeriodRange | null;
  onApply: (value: PeriodRange | null) => void;
}

const inputStyle: CSSProperties = {
  backgroundColor: '#0a1020',
  border: '1px solid #1e2d4a',
  color: '#e2e8f0',
};

export default function PeriodFilter({ value, onApply }: PeriodFilterProps) {
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState('');
  const [draftEnd, setDraftEnd] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const defaultRange = value ?? getCurrentMonthPeriod();
    setDraftStart(defaultRange.start);
    setDraftEnd(defaultRange.end);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const draft: PeriodRange = { start: draftStart, end: draftEnd };
  const canApply = isValidPeriod(draft);

  const handleClear = () => {
    const month = getCurrentMonthPeriod();
    onApply(null);
    setDraftStart(month.start);
    setDraftEnd(month.end);
    setOpen(false);
  };

  const handleApply = () => {
    if (!canApply) return;
    onApply(draft);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 cursor-pointer"
        style={{
          backgroundColor: '#0d1526',
          border: `1px solid ${open ? theme.accent : '#1e2d4a'}`,
          color: '#e2e8f0',
          boxShadow: open ? `0 0 0 1px ${theme.accent}40` : 'none',
        }}
      >
        <span
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: theme.textSecondary }}
        >
          Período:
        </span>
        <span className="truncate max-w-[180px]">{formatPeriodLabel(value)}</span>
        <ChevronDown
          size={14}
          style={{
            color: theme.textSecondary,
            transition: 'transform 150ms',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 mt-1.5 w-[280px] rounded-md overflow-hidden z-50"
          style={{
            backgroundColor: '#0d1526',
            border: '1px solid #1e2d4a',
            boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
          }}
        >
          <div className="px-3 py-3 space-y-3">
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                De
              </span>
              <input
                type="date"
                value={draftStart}
                onChange={e => setDraftStart(e.target.value)}
                className="mt-1 w-full px-2.5 py-1.5 rounded-md text-sm"
                style={inputStyle}
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                Até
              </span>
              <input
                type="date"
                value={draftEnd}
                onChange={e => setDraftEnd(e.target.value)}
                className="mt-1 w-full px-2.5 py-1.5 rounded-md text-sm"
                style={inputStyle}
              />
            </label>
            {!canApply && draftStart && draftEnd && (
              <p className="text-[11px]" style={{ color: theme.red }}>
                A data inicial não pode ser depois da final.
              </p>
            )}
          </div>

          <div
            className="flex items-center justify-end gap-2 px-3 py-2"
            style={{ borderTop: '1px solid #1e2d4a', backgroundColor: '#0a1020' }}
          >
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 cursor-pointer"
              style={{
                color: theme.textSecondary,
                border: '1px solid #1e2d4a',
                backgroundColor: 'transparent',
              }}
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!canApply}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                color: '#fff',
                backgroundColor: theme.accent,
                border: `1px solid ${theme.accent}`,
              }}
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
