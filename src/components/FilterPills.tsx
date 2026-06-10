import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { theme } from '../utils/theme';
import type { PeriodRange } from '../utils/period';
import type { Classification, Group, Curve } from '../data/mockData';
import type { StoreData } from '../data/mockData';
import PeriodFilter from './PeriodFilter';

interface FilterPillsProps {
  period: PeriodRange | null;
  onPeriodApply: (value: PeriodRange | null) => void;
  allStores?: StoreData[];
  classificationOptions?: string[];
  groupOptions?: string[];
  curveCodes?: string[];
  classification: Classification | null;
  group: Group | null;
  storeId: string | null;
  curve: Curve | null;
  onClassificationChange: (v: Classification | null) => void;
  onGroupChange: (v: Group | null) => void;
  onStoreChange: (v: string | null) => void;
  onCurveChange: (v: Curve | null) => void;
}

interface Option<T extends string> {
  value: T | null;
  label: string;
  groupLabel?: string;
}

export default function FilterPills({
  period,
  onPeriodApply,
  allStores = [],
  classificationOptions = [],
  groupOptions = [],
  curveCodes = [],
  classification, group, storeId, curve,
  onClassificationChange, onGroupChange, onStoreChange, onCurveChange,
}: FilterPillsProps) {
  const seen = new Set<string>();
  const availableStores = allStores.filter(s => {
    if (group && s.group !== group) return false;
    if (classification && s.classification !== classification) return false;
    if (seen.has(s.baseId)) return false;
    seen.add(s.baseId);
    return true;
  });

  const storeOptions: Option<string>[] = [{ value: null, label: 'Todas' }];
  if (group) {
    availableStores.forEach(s => storeOptions.push({ value: s.baseId, label: s.name }));
  } else {
    groupOptions.forEach(g => {
      const inGroup = availableStores.filter(s => s.group === g);
      inGroup.forEach(s => storeOptions.push({ value: s.baseId, label: s.name, groupLabel: g }));
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <PeriodFilter value={period} onApply={onPeriodApply} />

      <Dropdown
        label="Classificação"
        value={classification}
        options={[
          { value: null, label: 'Todas' },
          ...classificationOptions.map(c => ({ value: c, label: c })),
        ]}
        onChange={onClassificationChange}
      />

      <Dropdown
        label="Grupo"
        value={group}
        options={[
          { value: null, label: 'Todos' },
          ...groupOptions.map(g => ({ value: g, label: g })),
        ]}
        onChange={onGroupChange}
      />

      <Dropdown
        label="Loja"
        value={storeId}
        options={storeOptions}
        onChange={onStoreChange}
      />

      <Dropdown
        label="Curva"
        value={curve}
        options={[
          { value: null, label: 'Todas' },
          ...curveCodes.map(c => ({ value: c, label: c })),
        ]}
        onChange={onCurveChange}
      />
    </div>
  );
}

interface DropdownProps<T extends string> {
  label: string;
  value: T | null;
  options: Option<T>[];
  onChange: (v: T | null) => void;
}

function Dropdown<T extends string>({ label, value, options, onChange }: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  const current = options.find(o => o.value === value);
  const displayLabel = current?.label ?? 'Todas';

  let lastGroup: string | undefined;

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
          {label}:
        </span>
        <span className="truncate max-w-[140px]">{displayLabel}</span>
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
          className="absolute left-0 mt-1.5 min-w-full w-max max-w-[280px] rounded-md overflow-hidden z-50 max-h-72 overflow-y-auto"
          style={{
            backgroundColor: '#0d1526',
            border: '1px solid #1e2d4a',
            boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
          }}
        >
          {options.map((opt, i) => {
            const isActive = opt.value === value;
            const showHeader = opt.groupLabel && opt.groupLabel !== lastGroup;
            if (opt.groupLabel) lastGroup = opt.groupLabel;
            return (
              <div key={`${opt.value ?? '__all__'}-${i}`}>
                {showHeader && (
                  <div
                    className="px-3 py-1 text-[9px] font-semibold uppercase tracking-wider"
                    style={{ color: theme.accent, backgroundColor: '#0a1020' }}
                  >
                    {opt.groupLabel}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition-colors duration-100 cursor-pointer"
                  style={{
                    backgroundColor: isActive ? '#1e2d4a' : 'transparent',
                    color: isActive ? theme.accent : '#e2e8f0',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.backgroundColor = '#1e2d4a';
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span className="truncate">{opt.label}</span>
                  {isActive && <Check size={14} />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
