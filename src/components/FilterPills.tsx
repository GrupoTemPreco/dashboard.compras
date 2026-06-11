import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { theme } from '../utils/theme';
import type { PeriodRange } from '../utils/period';
import type {
  ClassificationFilter,
  Group,
  CurveFilter,
  StoreIdFilter,
} from '../data/mockData';
import type { StoreData } from '../data/mockData';
import PeriodFilter from './PeriodFilter';

interface FilterPillsProps {
  period: PeriodRange | null;
  onPeriodApply: (value: PeriodRange | null) => void;
  allStores?: StoreData[];
  classificationOptions?: string[];
  groupOptions?: string[];
  curveCodes?: string[];
  classification: ClassificationFilter;
  group: Group | null;
  storeId: StoreIdFilter;
  curve: CurveFilter;
  onClassificationChange: (v: ClassificationFilter) => void;
  onGroupChange: (v: Group | null) => void;
  onStoreChange: (v: StoreIdFilter) => void;
  onCurveChange: (v: CurveFilter) => void;
}

interface Option<T extends string> {
  value: T | null;
  label: string;
  groupLabel?: string;
}

interface MultiOption<T extends string> {
  value: T;
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
    if (classification?.length && !classification.includes(s.classification)) return false;
    if (seen.has(s.baseId)) return false;
    seen.add(s.baseId);
    return true;
  });

  const storeOptions: MultiOption<string>[] = [];
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

      <MultiDropdown
        label="Classificação"
        value={classification}
        allLabel="Todas"
        options={classificationOptions.map(c => ({ value: c, label: c }))}
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

      <MultiDropdown
        label="Loja"
        value={storeId}
        allLabel="Todas"
        options={storeOptions}
        onChange={onStoreChange}
      />

      <MultiDropdown
        label="Curva"
        value={curve}
        allLabel="Todas"
        options={curveCodes.map(c => ({ value: c, label: c }))}
        onChange={onCurveChange}
      />
    </div>
  );
}

function multiDisplayLabel<T extends string>(
  value: T[] | null,
  options: MultiOption<T>[],
  allLabel: string,
): string {
  if (!value?.length) return allLabel;
  if (value.length === 1) {
    return options.find(o => o.value === value[0])?.label ?? allLabel;
  }
  return `${value.length} selecionadas`;
}

interface MultiDropdownProps<T extends string> {
  label: string;
  value: T[] | null;
  options: MultiOption<T>[];
  allLabel?: string;
  onChange: (v: T[] | null) => void;
}

function MultiDropdown<T extends string>({
  label,
  value,
  options,
  allLabel = 'Todas',
  onChange,
}: MultiDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = value ?? [];
  const noneSelected = selected.length === 0;
  const displayLabel = multiDisplayLabel(value, options, allLabel);

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

  const toggle = (item: T) => {
    const next = selected.includes(item)
      ? selected.filter(v => v !== item)
      : [...selected, item];
    onChange(next.length > 0 ? next : null);
  };

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
          <button
            type="button"
            onClick={() => onChange(null)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors duration-100 cursor-pointer"
            style={{
              backgroundColor: noneSelected ? '#1e2d4a' : 'transparent',
              color: noneSelected ? theme.accent : '#e2e8f0',
              borderBottom: '1px solid #1e2d4a',
            }}
            onMouseEnter={e => {
              if (!noneSelected) e.currentTarget.style.backgroundColor = '#1e2d4a';
            }}
            onMouseLeave={e => {
              if (!noneSelected) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Checkbox checked={noneSelected} />
            <span>{allLabel}</span>
          </button>

          {options.map((opt, i) => {
            const isChecked = selected.includes(opt.value);
            const showHeader = opt.groupLabel && opt.groupLabel !== lastGroup;
            if (opt.groupLabel) lastGroup = opt.groupLabel;
            return (
              <div key={`${opt.value}-${i}`}>
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
                  onClick={() => toggle(opt.value)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors duration-100 cursor-pointer"
                  style={{
                    backgroundColor: isChecked ? '#1e2d4a40' : 'transparent',
                    color: isChecked ? theme.accent : '#e2e8f0',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#1e2d4a';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = isChecked ? '#1e2d4a40' : 'transparent';
                  }}
                >
                  <Checkbox checked={isChecked} />
                  <span className="truncate">{opt.label}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className="flex-shrink-0 flex items-center justify-center w-3.5 h-3.5 rounded-sm"
      style={{
        backgroundColor: checked ? theme.accent : 'transparent',
        border: `1.5px solid ${checked ? theme.accent : '#475569'}`,
      }}
    >
      {checked && <Check size={10} color="#fff" strokeWidth={3} />}
    </span>
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
