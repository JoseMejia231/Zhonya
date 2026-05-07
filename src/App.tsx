import React, { useState, useEffect, useCallback } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import {
  BalanceHero,
  ComparativeChart,
  CategoryBreakdown,
  SavingsRate,
} from './components/Dashboard';
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
import { DesktopTabs, MobileBottomNav, WheelBubble, TABS, TabId } from './components/TabBar';
import { DashboardSkeleton } from './components/Skeleton';
import { Wallet } from 'lucide-react';
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

function AppContent() {
  const { user, loading } = useFinance();
  const [tab, setTabState] = useState<TabId>(readTabFromHash);
  const reduceMotion = useReducedMotion();

  // Sync tab ↔ URL hash for deep linking + back button.
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
  const weekday = format(today, 'EEEE', { locale: es });
  const dateStr = format(today, "d 'de' MMMM", { locale: es });
  const sectionLabel = TABS.find((t) => t.id === tab)?.label ?? '';

  const sectionTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.22, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

  return (
    <div className="min-h-dvh bg-[#F4F4F5] text-zinc-900 font-sans selection:bg-black selection:text-white pb-[calc(96px+env(safe-area-inset-bottom))] sm:pb-0">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-[#F4F4F5]/85 backdrop-blur-xl border-b border-transparent sm:border-zinc-200/50 pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-black/10 shrink-0">
              <Wallet className="text-white" size={17} />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold tracking-tight leading-tight">
                <span className="sm:hidden">{sectionLabel}</span>
                <span className="hidden sm:inline">Zhonyas Wallet</span>
              </h1>
              <p className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 truncate capitalize">
                <span className="sm:hidden">
                  {weekday}, {dateStr}
                </span>
                <span className="hidden sm:inline">Finanzas con calma</span>
              </p>
            </div>
          </div>

          <WheelBubble active={tab} onChange={setTab} />

          <DesktopTabs active={tab} onChange={setTab} />

          <div className="hidden sm:block text-right shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 capitalize">
              {weekday}
            </p>
            <p className="text-sm font-semibold text-zinc-900 capitalize num">{dateStr}</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-8 sm:pb-12">
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
              <div className="max-w-xl mx-auto">
                <Settings />
              </div>
            )}
          </motion.section>
        </AnimatePresence>
      </main>

      <footer className="hidden sm:flex max-w-7xl mx-auto px-6 py-6 border-t border-zinc-200/60 items-center justify-between text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400">
        <span>© {today.getFullYear()} Zhonyas Wallet</span>
        <span className="flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-emerald-500" />
          Cifrado E2E
        </span>
      </footer>

      <UndoToast />
      <PushToast />
      <RecurringConfirmModal />
      <MobileBottomNav active={tab} onChange={setTab} />
    </div>
  );
}

const OverviewSection: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
    <div className="lg:col-span-1">
      <BalanceHero />
    </div>
    <div className="sm:hidden">
      <RecentActivityCard limit={5} />
    </div>
    <div className="hidden sm:block lg:col-span-2">
      <FixedFlowCard />
    </div>
    <div className="lg:col-span-2 order-3">
      <BudgetsCard />
    </div>
    <div className="lg:col-span-1 order-4">
      <SavingsRate />
    </div>
    <div className="lg:col-span-3 order-5">
      <CategoryBreakdown />
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
      <SavingsRate />
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
