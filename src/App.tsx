import React, { useState, useEffect, useCallback } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import {
  BalanceHero,
  ComparativeChart,
  CategoryBreakdown,
  StatCard,
  SavingsRateCard,
  LibroOperativo,
  IntuicionAutonoma,
  ProjectProgress,
} from './components/ReferenceDashboard';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { UndoToast } from './components/UndoToast';
import { PushToast } from './components/PushToast';
import { RecurringExpenses } from './components/RecurringExpenses';
import { RecurringConfirmModal } from './components/RecurringConfirmModal';
import { RecurringProjection } from './components/RecurringProjection';
import { FixedFlowCard } from './components/FixedFlowCard';
import { BudgetsCard } from './components/BudgetsCard';
import { RecentActivityCard } from './components/RecentActivityCard';
import { Wheels } from './components/Wheels';
import { DesktopTabs, MobileBottomNav, WheelBubble, Sidebar, TABS, TabId } from './components/TabBar';
import { DashboardSkeleton } from './components/Skeleton';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { tap } from './utils/haptics';

const VALID_TABS: TabId[] = [
  'overview',
  'transactions',
  'recurring',
  'analysis',
  'wheels',
  'settings',
];

function readTabFromHash(): TabId {
  if (typeof window === 'undefined') return 'overview';
  const raw = window.location.hash.replace(/^#\/?/, '');
  return (VALID_TABS as string[]).includes(raw) ? (raw as TabId) : 'overview';
}

function getGreetingName(user: { displayName?: string | null; email?: string | null } | null): string {
  const displayName = user?.displayName?.trim();
  if (displayName) return displayName;

  const email = user?.email?.trim();
  if (!email) return 'José';

  const localPart = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
  if (!localPart) return 'José';

  return localPart
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function AppContent() {
  const { user, loading } = useFinance();
  const [tab, setTabState] = useState<TabId>(readTabFromHash);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onHash = () => setTabState(readTabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const setTab = useCallback((next: TabId) => {
    tap();
    setTabState(next);
    const target = `#/${next}`;
    if (window.location.hash !== target) {
      window.history.pushState(null, '', target);
    }
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (!user) return <Login />;

  const today = new Date();
  const dateLabel = format(today, "EEEE, d 'de' MMMM yyyy", { locale: es }).toUpperCase();
  const sectionLabel = TABS.find((t) => t.id === tab)?.label ?? '';
  const greetingName = getGreetingName(user);

  const sectionTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.22, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

  return (
    <div className="min-h-dvh bg-transparent text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white flex flex-col sm:flex-row pb-[calc(96px+env(safe-area-inset-bottom))] sm:pb-0">
      <Sidebar
        active={tab}
        onChange={setTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-zinc-50/80 backdrop-blur-xl pt-[env(safe-area-inset-top)] border-b border-zinc-200/50">
          <div className="max-w-[1580px] mx-auto px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-zinc-400 mb-1">
                {dateLabel}
              </p>
              <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-emerald-900">
                Hola, {greetingName}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <WheelBubble active={tab} onChange={setTab} />
              
              <button
                type="button"
                aria-label="Nueva entrada"
                onClick={() => setTab('transactions')}
                className="hidden sm:inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#2f5a29] text-white shadow-[0_12px_24px_rgba(45,90,39,0.18)] transition-colors hover:bg-[#244920] active:scale-95"
              >
                <span className="text-xl leading-none font-medium">+</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-[1580px] w-full mx-auto px-4 sm:px-8 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          <motion.section
            key={tab}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
            transition={sectionTransition}
            role="tabpanel"
            aria-label={sectionLabel}
          >
            {tab === 'overview' && <OverviewSection />}
            {tab === 'transactions' && <TransactionsSection onAdd={() => setTab('transactions')} />}
            {tab === 'recurring' && (
              <div className="max-w-2xl mx-auto">
                <RecurringExpenses />
              </div>
            )}
            {tab === 'analysis' && <AnalysisSection />}
            {tab === 'wheels' && (
              <div className="max-w-3xl mx-auto">
                <Wheels />
              </div>
            )}
            {tab === 'settings' && (
              <div className="max-w-5xl mx-auto">
                <Settings />
              </div>
            )}
          </motion.section>
        </AnimatePresence>
        </main>

        <footer className="hidden sm:flex max-w-[1580px] w-full mx-auto px-8 py-6 border-t border-zinc-200/50 items-center justify-between text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400">
          <span>© {today.getFullYear()} MONA</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-emerald-500" />
            CONECTADO · MONA CORE OPTIMIZED
          </span>
        </footer>
      </div>

      <UndoToast />
      <PushToast />
      <RecurringConfirmModal />
      <MobileBottomNav active={tab} onChange={setTab} />
    </div>
  );
}

const OverviewSection: React.FC = () => (
  <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_336px] gap-6 xl:gap-8">
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 xl:gap-5">
        <BalanceHero />
        <StatCard label="Ingresos Brutos" value="$1,700" icon={<ArrowUpRight size={18} strokeWidth={2.4} />} />
        <StatCard label="Tasa de Gasto" value="$1,240" icon={<ArrowDownLeft size={18} strokeWidth={2.4} />} />
        <SavingsRateCard />
      </div>

      <ComparativeChart />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(280px,0.95fr)_minmax(0,1.35fr)] gap-6">
        <CategoryBreakdown />
        <IntuicionAutonoma />
      </div>
    </div>

    <div className="space-y-6">
      <LibroOperativo />
      <ProjectProgress />
    </div>
  </div>
);

interface TransactionsSectionProps {
  onAdd: () => void;
}
const TransactionsSection: React.FC<TransactionsSectionProps> = () => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
    <div className="lg:col-span-5 xl:col-span-4 order-1">
      <TransactionForm />
    </div>
    <div className="lg:col-span-7 xl:col-span-8 order-2 lg:h-[calc(100dvh-220px)]">
      <TransactionList />
    </div>
  </div>
);

const AnalysisSection: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
    <div className="lg:col-span-3">
      <RecurringProjection months={6} />
    </div>
    <div className="lg:col-span-2">
      <CategoryBreakdown />
    </div>
    <div className="lg:col-span-1">
      <SavingsRateCard />
    </div>
    <div className="lg:col-span-3">
      <ComparativeChart />
    </div>
  </div>
);

export default function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}
