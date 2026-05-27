import { useState, useMemo } from 'react';
import { ShoppingBag } from 'lucide-react';
import { theme } from './utils/theme';
import { applyFilters } from './utils/filters';
import type { Classification, Group, Curve } from './data/mockData';
import FloatingWidget from './components/FloatingWidget';
import KpiCards from './components/KpiCards';
import FilterPills from './components/FilterPills';
import AccordionTable from './components/AccordionTable';

export default function App() {
  const [classification, setClassification] = useState<Classification | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [curve, setCurve] = useState<Curve | null>(null);

  const handleGroupChange = (newGroup: Group | null) => {
    setGroup(newGroup);
    setStoreId(null);
  };

  const handleClassificationChange = (newCls: Classification | null) => {
    setClassification(newCls);
    setStoreId(null);
  };

  const filteredStores = useMemo(
    () => applyFilters({ classification, group, storeId, curve }),
    [classification, group, storeId, curve],
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.bg }}>
      <FloatingWidget />

      <div className="max-w-[1680px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-lg"
            style={{ backgroundColor: `${theme.accent}15`, border: `1px solid ${theme.accent}25` }}
          >
            <ShoppingBag size={20} style={{ color: theme.accent }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: theme.textPrimary }}>
              Dashboard de Compras
            </h1>
            <p className="text-xs" style={{ color: theme.textSecondary }}>
              Rede de Farmácias — Controle de compras por classificação, grupo e curva
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <KpiCards stores={filteredStores} />

        {/* Filters */}
        <div className="mt-5">
          <FilterPills
            classification={classification}
            group={group}
            storeId={storeId}
            curve={curve}
            onClassificationChange={handleClassificationChange}
            onGroupChange={handleGroupChange}
            onStoreChange={setStoreId}
            onCurveChange={setCurve}
          />
        </div>

        {/* Accordion Table */}
        <div className="mt-5">
          <AccordionTable stores={filteredStores} />
        </div>
      </div>
    </div>
  );
}
