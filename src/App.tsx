import { useState, useMemo, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { theme } from './utils/theme';
import { applyFilters } from './utils/filters';
import {
  resolvePeriod,
  getDaysInMonth,
  getElapsedSaleDaysInMonth,
  type PeriodRange,
} from './utils/period';
import { fetchDashboardCatalog } from './lib/fetchDashboardCatalog';
import { fetchLastImportAt } from './lib/fetchLastImportAt';
import type {
  ClassificationFilter,
  CurveFilter,
  Group,
  StoreData,
  StoreIdFilter,
} from './data/mockData';
import FloatingWidget from './components/FloatingWidget';
import KpiCards from './components/KpiCards';
import FilterPills from './components/FilterPills';
import AccordionTable from './components/AccordionTable';

export default function App() {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [classificationOrder, setClassificationOrder] = useState<string[]>([]);
  const [curveCodes, setCurveCodes] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [diasDoMes, setDiasDoMes] = useState(() => getDaysInMonth(resolvePeriod(null)));
  const [diasDeVenda, setDiasDeVenda] = useState(() => getElapsedSaleDaysInMonth(resolvePeriod(null)));
  const [lastImportAt, setLastImportAt] = useState<string | null>(null);

  const [period, setPeriod] = useState<PeriodRange | null>(null);

  const [classification, setClassification] = useState<ClassificationFilter>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [storeId, setStoreId] = useState<StoreIdFilter>(null);
  const [curve, setCurve] = useState<CurveFilter>(null);

  const effectivePeriod = useMemo(() => resolvePeriod(period), [period]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const r = await fetchDashboardCatalog(effectivePeriod);
      if (cancelled) return;
      if (r.error) setLoadError(r.error.message);
      else setLoadError(null);
      setStores(r.stores);
      setClassificationOrder(r.classificationOrder);
      setCurveCodes(r.curveCodes);
      setDiasDoMes(r.diasDoMes);
      setDiasDeVenda(r.diasDeVenda);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [effectivePeriod]);

  useEffect(() => {
    let cancelled = false;
    fetchLastImportAt().then(at => {
      if (!cancelled) setLastImportAt(at);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const groupOptions = useMemo(
    () => [...new Set(stores.map(s => s.group))].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [stores],
  );

  const handleGroupChange = (newGroup: Group | null) => {
    setGroup(newGroup);
    setStoreId(null);
  };

  const handleClassificationChange = (newCls: ClassificationFilter) => {
    setClassification(newCls);
    setStoreId(null);
  };

  const filteredStores = useMemo(
    () => applyFilters({ period: effectivePeriod, classification, group, storeId, curve }, stores),
    [effectivePeriod, classification, group, storeId, curve, stores],
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.bg }}>
      <FloatingWidget period={effectivePeriod} lastImportAt={lastImportAt} />

      <div className="max-w-[1680px] mx-auto px-6 py-6">
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
              Grupo Tempreço — Controle de compras por classificação, grupo e curva
            </p>
          </div>
        </div>

        {loadError && (
          <p className="text-sm mb-4 px-3 py-2 rounded-lg" style={{ backgroundColor: '#3f1f25', color: '#fca5a5', border: '1px solid #7f1d1d' }}>
            Não foi possível carregar o catálogo: {loadError}
          </p>
        )}

        <KpiCards stores={filteredStores} />

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {loading && (
            <span className="text-xs" style={{ color: theme.textSecondary }}>
              Carregando lojas e filtros…
            </span>
          )}
          <FilterPills
            period={period}
            onPeriodApply={setPeriod}
            allStores={stores}
            classificationOptions={classificationOrder}
            groupOptions={groupOptions}
            curveCodes={curveCodes}
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

        <div className="mt-5">
          <AccordionTable
            stores={filteredStores}
            classificationOrder={classificationOrder}
            diasDoMes={diasDoMes}
            diasDeVenda={diasDeVenda}
          />
        </div>
      </div>
    </div>
  );
}
