import { theme } from '../../utils/theme';
import { buildMesReferenciaOptions } from '../../lib/pedidosModal/mesReferenciaOptions';
import { toFirstOfMonthIso } from '../../utils/period';

interface MesReferenciaSelectProps {
  vigenteIso: string;
  value: string;
  disabled?: boolean;
  onChange: (mesIso: string) => void;
}

export default function MesReferenciaSelect({
  vigenteIso,
  value,
  disabled,
  onChange,
}: MesReferenciaSelectProps) {
  const vigente = toFirstOfMonthIso(vigenteIso);
  const selected = toFirstOfMonthIso(value);
  const options = buildMesReferenciaOptions(vigente);
  if (!options.some(o => o.value === selected)) {
    options.push({
      value: selected,
      label: buildMesReferenciaOptions(selected)[1]?.label ?? selected,
    });
  }

  return (
    <select
      value={selected}
      disabled={disabled}
      onChange={e => onChange(e.target.value)}
      className="text-xs rounded-md px-2 py-1.5 outline-none cursor-pointer"
      style={{
        backgroundColor: theme.bg,
        color: theme.textPrimary,
        border: `1px solid ${theme.border}`,
        minWidth: '7.5rem',
      }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
