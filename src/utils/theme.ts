export const theme = {
  bg: '#0a0f1e',
  card: '#0d1526',
  border: '#1e2d4a',
  textPrimary: '#e2e8f0',
  textSecondary: '#64748b',
  accent: '#3b82f6',
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#ef4444',
  curveA: '#10b981',
  curveB: '#3b82f6',
  curveC: '#f59e0b',
  curveD: '#64748b',
} as const;

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function cmvColor(cmv: number, ideal: number): string {
  const diff = cmv - ideal;
  if (diff <= 0) return theme.green;
  if (diff <= 3) return theme.yellow;
  return theme.red;
}

export function valueColor(value: number): string {
  if (value > 0) return theme.green;
  if (value < 0) return theme.red;
  return theme.textPrimary;
}

export function daysColor(days: number): string {
  if (days <= 20) return theme.green;
  if (days <= 35) return theme.yellow;
  return theme.red;
}

export function curveColor(curve: string): string {
  const c = curve.trim();
  switch (c) {
    case 'A': return theme.curveA;
    case 'B': return theme.curveB;
    case 'C': return theme.curveC;
    case 'D': return theme.curveD;
    case 'SC': return '#94a3b8';
    default: return theme.textSecondary;
  }
}

export function situationDot(cmv: number, ideal: number): string {
  const diff = cmv - ideal;
  if (diff <= 0) return theme.green;
  if (diff <= 3) return theme.yellow;
  return theme.red;
}
