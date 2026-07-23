import { theme } from '../../utils/theme';
import { toFirstOfMonthIso } from '../../utils/period';

interface MesReferenciaSelectProps {
  vigenteIso: string;
  value: string;
  disabled?: boolean;
  onChange: (mesIso: string) => void;
}

/** Converte ISO (yyyy-mm-dd) → valor de <input type="month"> (yyyy-mm). */
function toMonthInputValue(iso: string): string {
  const m = iso.trim().match(/^(\d{4})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}` : '';
}

export default function MesReferenciaSelect({
  value,
  disabled,
  onChange,
}: MesReferenciaSelectProps) {
  const selected = toFirstOfMonthIso(value);
  const monthValue = toMonthInputValue(selected);

  return (
    <input
      type="month"
      value={monthValue}
      disabled={disabled}
      onChange={e => {
        const ym = e.target.value.trim();
        if (!ym) return;
        onChange(toFirstOfMonthIso(`${ym}-01`));
      }}
      className="text-xs rounded-md px-2 py-1.5 outline-none cursor-pointer"
      style={{
        backgroundColor: theme.bg,
        color: theme.textPrimary,
        border: `1px solid ${theme.border}`,
        minWidth: '7.5rem',
      }}
    />
  );
}
