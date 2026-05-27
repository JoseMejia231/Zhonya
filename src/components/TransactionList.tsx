import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, cn } from '../utils';
import { groupTotalsByCurrency } from '../utils/money';
import { Trash2, ArrowUpRight, ArrowDownLeft, Inbox, Search, Pencil, Copy, Plus, Target } from 'lucide-react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import type { Transaction } from '../types';
import { TransactionEditModal } from './TransactionEditModal';

const dayKey = (iso: string) => {
  const d = parseISO(iso);
  if (isToday(d)) return 'Hoy';
  if (isYesterday(d)) return 'Ayer';
  return format(d, "d 'de' MMMM", { locale: es });
};

interface TransactionListProps {
  onAddNew?: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ onAddNew }) => {
  const { filteredTransactions, deleteTransaction, settings, filter, setFilter, savingsGoals } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [visibleCount, setVisibleCount] = useState(50);

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [modalMode, setModalMode] = useState<'edit' | 'duplicate'>('edit');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);

  const filterOptions: { label: string; value: typeof filter }[] = [
    { label: 'Todo', value: 'all' },
    { label: 'Hoy', value: 'day' },
    { label: 'Mes', value: 'month' },
    { label: 'Año', value: 'year' },
  ];

  const typeOptions: { label: string; value: typeof typeFilter }[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Ingresos', value: 'income' },
    { label: 'Gastos', value: 'expense' },
  ];

  const effectivelyFiltered = useMemo(() => {
    return filteredTransactions.filter(t => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!t.description?.toLowerCase().includes(q) && !t.category.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [filteredTransactions, typeFilter, searchQuery]);

  // Totales agrupados por moneda. Cuando todas las txs comparten una sola
  // moneda, el array tiene un único elemento y la UI se ve igual que siempre.
  const totalsByCurrency = useMemo(
    () => groupTotalsByCurrency(effectivelyFiltered, settings.currency || 'DOP'),
    [effectivelyFiltered, settings.currency]
  );

  const visibleTransactions = effectivelyFiltered.slice(0, visibleCount);

  const grouped = useMemo(() => {
    const groups = new Map<string, Transaction[]>();
    for (const t of visibleTransactions) {
      const key = dayKey(t.date);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }
    return Array.from(groups.entries());
  }, [visibleTransactions]);

  const handleEdit = (t: Transaction) => {
    setSelectedTransaction(t);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDuplicate = (t: Transaction) => {
    setSelectedTransaction(t);
    setModalMode('duplicate');
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (t: Transaction) => {
    setPendingDelete(t);
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    await deleteTransaction(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <div className="bg-white p-5 sm:p-7 rounded-[32px] border border-zinc-200/60 shadow-sm h-full flex flex-col relative transition-all duration-300">
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto">
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#836637] dark:text-[#D4B15E]">Actividad</h2>
            <p className="text-base font-extrabold text-zinc-900 dark:text-white uppercase tracking-tighter mt-0.5">
              {effectivelyFiltered.length} {effectivelyFiltered.length === 1 ? 'transacción' : 'transacciones'}
            </p>
          </div>
          {onAddNew && (
            <button
              type="button"
              onClick={onAddNew}
              className="px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl bg-[#836637] text-white hover:bg-[#72582f] active:scale-95 transition-all cursor-pointer shadow-sm shadow-[#836637]/20 dark:bg-[#D4B15E] dark:text-zinc-950 dark:hover:bg-[#c2a04e] dark:shadow-[#D4B15E]/10 flex items-center gap-1"
              aria-label="Nuevo movimiento"
            >
              <Plus size={12} strokeWidth={3} />
              <span>Nuevo</span>
            </button>
          )}
        </div>

        {/* Unified Filter Tabs */}
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <div role="tablist" aria-label="Filtro de periodo" className="relative flex p-1 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 rounded-xl overflow-x-auto no-scrollbar max-w-full">
            {filterOptions.map((opt) => {
              const active = filter === opt.value;
              return (
                <button
                  key={opt.value}
                  role="tab"
                  aria-selected={active}
                  onClick={() => { setFilter(opt.value); setVisibleCount(50); }}
                  className={cn(
                    'relative px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors whitespace-nowrap z-10 cursor-pointer focus:outline-none',
                    active ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  )}
                >
                  {opt.label}
                  {active && (
                    <motion.span layoutId="list-filter-pill" aria-hidden className="absolute inset-0 rounded-lg bg-white border border-zinc-200/50 shadow-sm -z-10" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                  )}
                </button>
              );
            })}
          </div>

          <div role="tablist" aria-label="Filtro de tipo" className="relative flex p-1 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 rounded-xl overflow-x-auto no-scrollbar max-w-full">
            {typeOptions.map((opt) => {
              const active = typeFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  role="tab"
                  aria-selected={active}
                  onClick={() => { setTypeFilter(opt.value); setVisibleCount(50); }}
                  className={cn(
                    'relative px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors whitespace-nowrap z-10 cursor-pointer focus:outline-none',
                    active ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  )}
                >
                  {opt.label}
                  {active && (
                    <motion.span layoutId="list-type-pill" aria-hidden className="absolute inset-0 rounded-lg bg-white border border-zinc-200/50 shadow-sm -z-10" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modern Search Bar */}
      <div className="relative mb-5">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
        <input
          type="text"
          placeholder="Buscar descripción, nota o categoría..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(50); }}
          className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl text-xs font-semibold focus:outline-none focus:border-[#836637] dark:focus:border-[#D4B15E] focus:bg-white dark:focus:bg-zinc-900 focus:ring-4 focus:ring-[#836637]/5 dark:focus:ring-[#D4B15E]/5 transition-all"
        />
      </div>

      {/* Balanced Summary Widget Card — una fila por moneda, estilo gradient + dark del dueño */}
      {(effectivelyFiltered.length > 0 || filteredTransactions.length > 0) && totalsByCurrency.length > 0 && (
        <div className="mb-6 p-1.5 sm:p-2 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900 dark:to-emerald-800 rounded-2xl border border-emerald-300 dark:border-emerald-600 shadow-md space-y-1.5">
          {totalsByCurrency.map((t) => (
            <div key={t.currency}>
              {totalsByCurrency.length > 1 && (
                <span className="block px-2 pt-1 pb-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  {t.currency}
                </span>
              )}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {/* Income */}
                <div className="flex flex-col items-center text-center p-2 sm:p-3 bg-white dark:bg-zinc-900 rounded-xl border border-emerald-200 dark:border-emerald-700 shadow-sm min-w-0">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-300 mb-1">Ingresos</span>
                  <span className="text-xs sm:text-lg font-extrabold text-emerald-700 dark:text-emerald-200 num flex items-center gap-0.5 sm:gap-1">
                    <ArrowDownLeft size={12} className="stroke-[2] shrink-0 hidden sm:block" />
                    {formatCurrency(t.income, t.currency)}
                  </span>
                </div>

                {/* Expense */}
                <div className="flex flex-col items-center text-center p-2 sm:p-3 bg-white dark:bg-zinc-900 rounded-xl border border-rose-200 dark:border-rose-700 shadow-sm min-w-0">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-300 mb-1">Gastos</span>
                  <span className="text-xs sm:text-lg font-extrabold text-rose-600 dark:text-rose-200 num flex items-center gap-0.5 sm:gap-1">
                    <ArrowUpRight size={12} className="stroke-[2] shrink-0 hidden sm:block" />
                    {formatCurrency(t.expense, t.currency)}
                  </span>
                </div>

                {/* Net */}
                <div className="flex flex-col items-center text-center p-2 sm:p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-600 shadow-sm min-w-0">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-zinc-500 mb-1">Balance</span>
                  <span className={cn(
                    "text-xs sm:text-lg font-black num",
                    t.net >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"
                  )}>
                    {t.net >= 0 ? '+' : ''}{formatCurrency(t.net, t.currency)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transaction List Timeline Container */}
      {effectivelyFiltered.length === 0 ? (
        <EmptyState onAddNew={onAddNew} />
      ) : (
        <div className="flex-1 lg:overflow-y-auto -mx-2 px-2 custom-scrollbar relative">
          {/* Vertical Timeline Track Line */}
          <div className="absolute left-[23px] top-4 bottom-4 w-[1.5px] border-l-2 border-dashed border-zinc-200/60 -z-0" />

          <div className="space-y-6 pb-4 z-10 relative">
            <AnimatePresence initial={false}>
              {grouped.map(([day, items]) => (
                <motion.div
                  key={day}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-3"
                >
                  {/* Timeline Date Header with sticker style */}
                  <div className="flex items-center gap-3 pl-[10px] py-1">
                    {/* Circle Node overlapping vertical timeline line */}
                    <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-950 border-2 border-white dark:border-zinc-900 shadow-sm flex items-center justify-center shrink-0 z-10">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#836637] dark:bg-[#D4B15E]" />
                    </div>
                    
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-zinc-50 dark:bg-zinc-950/80 text-zinc-500 dark:text-zinc-400 px-3 py-1 border border-zinc-200/50 dark:border-zinc-800/50 rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.01)] num">
                      {day}
                    </span>
                    <div className="flex-1 h-[1px] bg-zinc-100 dark:bg-zinc-800/40" />
                    <span className="text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 num bg-white px-2 leading-none">
                      {items.length} {items.length === 1 ? 'it' : 'its'}
                    </span>
                  </div>

                  <ul className="space-y-2">
                    <AnimatePresence initial={false}>
                      {items.map((t) => (
                        <motion.li
                          key={t.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -24 }}
                          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                          className="group pl-[46px] relative"
                        >
                          {/* Small Timeline Entry Dot */}
                          <div className="absolute left-[18px] top-1/2 -translate-y-1/2 w-[11px] h-[11px] rounded-full border-[2.5px] border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-800 group-hover:bg-[#836637] dark:group-hover:bg-[#D4B15E] group-hover:scale-110 transition-all z-10" />

                          {/* Card body */}
                          <div className="flex items-center gap-3 p-3.5 bg-white rounded-[22px] border border-zinc-200 hover:border-zinc-300 shadow-[0_2px_12px_rgba(0,0,0,0.01)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.03)] dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden">
                            
                            {/* Visual background indicator stripe for type */}
                            <div className={cn(
                              "absolute left-0 top-0 bottom-0 w-1",
                              t.type === 'income' ? 'bg-emerald-500' : 'bg-[#836637]/30 dark:bg-[#D4B15E]/30'
                            )} />

                            {/* Left Cash icon inside a glass bubble */}
                            <div
                              className={cn(
                                'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border transition-colors',
                                t.type === 'income'
                                  ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100/50 dark:border-emerald-900/10 text-emerald-600 dark:text-[#52C447]'
                                  : 'bg-zinc-50/50 dark:bg-zinc-950/20 border-zinc-200/50 dark:border-zinc-850/50 text-zinc-600 dark:text-zinc-400'
                              )}
                            >
                              {t.type === 'income' ? (
                                <ArrowDownLeft size={16} strokeWidth={2.5} />
                              ) : (
                                <ArrowUpRight size={16} strokeWidth={2.5} />
                              )}
                            </div>

                            {/* Center Info Section */}
                            <div className="flex-1 min-w-0 pr-2 sm:pr-24">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-xs sm:text-sm font-bold text-zinc-900 truncate min-w-0 flex-1">
                                  {t.description || t.category}
                                </h4>
                                <span
                                  className={cn(
                                    'text-xs sm:text-sm font-black whitespace-nowrap num shrink-0',
                                    t.type === 'income' ? 'text-emerald-600 dark:text-[#52C447]' : 'text-zinc-800 dark:text-white'
                                  )}
                                >
                                  {t.type === 'income' ? '+' : '−'}
                                  {formatCurrency(t.amount, settings.currency)}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-2 mt-1.5 w-full">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 text-zinc-500 dark:text-zinc-400 max-w-[100px] sm:max-w-none truncate">
                                    {t.category}
                                  </span>
                                  {t.goalId && savingsGoals.find(g => g.id === t.goalId) && (
                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 max-w-[80px] sm:max-w-none truncate flex items-center gap-1">
                                      <Target size={10} strokeWidth={3} />
                                      {savingsGoals.find(g => g.id === t.goalId)?.title}
                                    </span>
                                  )}
                                  <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 num whitespace-nowrap">
                                    {format(parseISO(t.date), 'HH:mm')}
                                  </span>
                                </div>
                                
                                {/* Mobile Action Menu (inline) */}
                                <div className="flex sm:hidden items-center gap-0.5 shrink-0">
                                  <button
                                    onClick={() => handleDuplicate(t)}
                                    className="inline-flex items-center justify-center w-6 h-6 rounded-md text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                                    aria-label={`Duplicar ${t.description || t.category}`}
                                  >
                                    <Copy size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleEdit(t)}
                                    className="inline-flex items-center justify-center w-6 h-6 rounded-md text-zinc-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all cursor-pointer"
                                    aria-label={`Editar ${t.description || t.category}`}
                                  >
                                    <Pencil size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRequest(t)}
                                    className="inline-flex items-center justify-center w-6 h-6 rounded-md text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                                    aria-label={`Eliminar ${t.description || t.category}`}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Desktop Floating Action Menu disclosed on card hover */}
                            <div className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/95 dark:bg-[#151C15]/95 pl-4 rounded-l-xl z-20 shadow-[-8px_0_12px_-4px_rgba(255,255,255,1)] dark:shadow-[-8px_0_12px_-4px_rgba(21,28,21,1)]">
                              <button
                                onClick={() => handleDuplicate(t)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                                aria-label={`Duplicar ${t.description || t.category}`}
                              >
                                <Copy size={13} />
                              </button>
                              <button
                                onClick={() => handleEdit(t)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all cursor-pointer"
                                aria-label={`Editar ${t.description || t.category}`}
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteRequest(t)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                                aria-label={`Eliminar ${t.description || t.category}`}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {visibleCount < effectivelyFiltered.length && (
              <div className="pt-4 pb-2 flex justify-center pl-[46px]">
                <button
                  onClick={() => setVisibleCount(v => v + 50)}
                  className="px-5 py-2.5 bg-zinc-100/70 hover:bg-zinc-100 border border-zinc-200/50 text-zinc-600 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  Cargar más
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <TransactionEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        transaction={selectedTransaction}
        mode={modalMode}
      />

      <AnimatePresence>
        {pendingDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-zinc-900/40 backdrop-blur-sm"
            onClick={() => setPendingDelete(null)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0.6 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl pb-[env(safe-area-inset-bottom)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="p-5 flex items-start gap-3 border-b border-zinc-100">
                <div className="w-11 h-11 rounded-2xl bg-red-600 flex items-center justify-center shrink-0">
                  <Trash2 size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-zinc-900">¿Eliminar este movimiento?</h3>
                  <p className="text-[12px] text-zinc-500 mt-0.5">
                    Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>

              <div className="p-5 grid grid-cols-2 gap-3">
                <div className="bg-zinc-50 rounded-2xl p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Monto
                  </p>
                  <p
                    className={cn(
                      'text-lg font-semibold num mt-0.5',
                      pendingDelete.type === 'income' ? 'text-emerald-600' : 'text-zinc-900'
                    )}
                  >
                    {pendingDelete.type === 'income' ? '+' : '−'}
                    {formatCurrency(pendingDelete.amount, settings.currency)}
                  </p>
                </div>
                <div className="bg-zinc-50 rounded-2xl p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Categoría
                  </p>
                  <p className="text-zinc-900 text-sm font-semibold mt-1 truncate">
                    {pendingDelete.category}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 flex flex-col-reverse sm:flex-row gap-2">
                <button
                  onClick={() => setPendingDelete(null)}
                  className="flex-1 py-3 rounded-2xl bg-zinc-100 text-zinc-700 font-semibold text-sm hover:bg-zinc-200 active:bg-zinc-300 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-red-600 text-white font-semibold text-sm shadow-lg shadow-red-600/20 hover:bg-red-500 active:bg-red-700 transition-colors cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface EmptyStateProps {
  onAddNew?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onAddNew }) => {
  const handleAction = () => {
    if (onAddNew) {
      onAddNew();
      setTimeout(() => {
        const input = document.getElementById('tx-amount') as HTMLInputElement | null;
        if (input) {
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
          input.focus();
        }
      }, 350);
    } else {
      const input = document.getElementById('tx-amount') as HTMLInputElement | null;
      if (input) {
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => input.focus(), 320);
      }
    }
  };
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
      <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mb-4">
        <Inbox className="text-zinc-300" size={28} />
      </div>
      <h3 className="text-base font-semibold text-zinc-900">Sin transacciones</h3>
      <p className="text-xs text-zinc-500 max-w-[260px] mt-1 leading-relaxed">
        No hay transacciones que coincidan con los filtros actuales.
      </p>
      <button
        onClick={handleAction}
        className="mt-5 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 active:bg-zinc-700 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
      >
        Añadir movimiento
      </button>
    </div>
  );
};
