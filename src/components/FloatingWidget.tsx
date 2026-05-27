import { Calendar, TrendingUp } from 'lucide-react';
import { theme } from '../utils/theme';

export default function FloatingWidget() {
  return (
    <div
      className="fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-2.5 rounded-full backdrop-blur-sm"
      style={{
        backgroundColor: `${theme.card}cc`,
        border: `1px solid ${theme.border}`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px ${theme.border}`,
      }}
    >
      <div className="flex items-center gap-2">
        <Calendar size={14} style={{ color: theme.accent }} />
        <span className="text-xs font-medium" style={{ color: theme.textSecondary }}>
          Dias do mês:
        </span>
        <span className="text-sm font-bold tabular-nums" style={{ color: theme.textPrimary }}>
          31
        </span>
      </div>
      <div style={{ width: 1, height: 18, backgroundColor: theme.border }} />
      <div className="flex items-center gap-2">
        <TrendingUp size={14} style={{ color: theme.green }} />
        <span className="text-xs font-medium" style={{ color: theme.textSecondary }}>
          Dias de venda:
        </span>
        <span className="text-sm font-bold tabular-nums" style={{ color: theme.green }}>
          18
        </span>
      </div>
    </div>
  );
}
