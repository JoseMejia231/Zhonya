import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, cn } from '../utils';
import { Trash2, ArrowUpRight, ArrowDownLeft, Inbox, Search, Pencil, Copy } from 'lucide-react';
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

export const TransactionList: React.FC = () => {
  const { filteredTransactions, deleteTransaction, settings, filter, setFilter } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [visibleCount, setVisibleCount] = useState(50);

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [modalMode, setModalMode] = useState<'edit' | 'duplicate'>('edit');
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      // Type Filter
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      // Search Filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!t.description?.toLowerCase().includes(q) && !t.category.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [filteredTransactions, typeFilter, searchQuery]);

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of effectivelyFiltered) {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    }
    return { income, expense, net: income - expense };
  }, [effectivelyFiltered]);

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

  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/70 shadow-sm h-full flex flex-col relative">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-3">
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Actividad</h2>
          <p className="text-sm font-semibold text-zinc-900 mt-0.5">
            {effectivelyFiltered.length} {effectivelyFiltered.length === 1 ? 'transacción' : 'transacciones'}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div role="tablist" aria-label="Filtro de periodo" className="relative flex p-1 bg-zinc-100 rounded-xl overflow-x-auto no-scrollbar max-w-full">
            {filterOptions.map((opt) => {
              const active = filter === opt.value;
              return (
                <button
                  key={opt.value}
                  role="tab"
                  aria-selected={active}
                  onClick={() => { setFilter(opt.value); setVisibleCount(50); }}
                  className={cn(
                    'relative px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap z-10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30',
                    active ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-800'
                  )}
                >
                  {opt.label}
                  {active && (
                    <motion.span layoutId="list-filter-pill" aria-hidden className="absolute inset-0 rounded-lg bg-white shadow-sm -z-10" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                  )}
                </button>
              );
            })}
          </div>

          <div role="tablist" aria-label="Filtro de tipo" className="relative flex p-1 bg-zinc-100 rounded-xl overflow-x-auto no-scrollbar max-w-full">
            {typeOptions.map((opt) => {
              const active = typeFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  role="tab"
                  aria-selected={active}
                  onClick={() => { setTypeFilter(opt.value); setVisibleCount(50); }}
                  className={cn(
                    'relative px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap z-10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30',
                    active ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-800'
                  )}
                >
                  {opt.label}
                  {active && (
                    <motion.span layoutId="list-type-pill" aria-hidden className="absolute inset-0 rounded-lg bg-white shadow-sm -z-10" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4 items-center">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar nota o categoría..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(50); }}
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-zinc-900 focus:bg-white focus:ring-4 focus:ring-zinc-900/5 transition-all"
          />
        </div>
      </div>

      {(effectivelyFiltered.length > 0 || filteredTransactions.length > 0) && (
        <div className="flex items-center justify-between mb-4 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Ingresos</span>
            <span className="text-xs font-semibold text-emerald-600 num">+{formatCurrency(summary.income, settings.currency)}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Gastos</span>
            <span className="text-xs font-semibold text-red-600 num">-{formatCurrency(summary.expense, settings.currency)}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Neto</span>
            <span className={cn("text-xs font-bold num", summary.net >= 0 ? "text-emerald-600" : "text-red-600")}>
              {summary.net >= 0 ? '+' : ''}{formatCurrency(summary.net, settings.currency)}
            </span>
          </div>
        </div>
      )}

      {effectivelyFiltered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex-1 lg:overflow-y-auto -mx-2 px-2 custom-scrollbar">
          <div className="space-y-5 pb-4">
            <AnimatePresence initial={false}>
              {grouped.map(([day, items]) => (
                <motion.div
                  key={day}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="flex items-center gap-3 mb-2 px-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                      {day}
                    </span>
                    <div className="flex-1 h-px bg-zinc-100" />
                    <span className="text-[10px] font-mono text-zinc-400 num">
                      {items.length}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    <AnimatePresence initial={false}>
                      {items.map((t) => (
                        <motion.li
                          key={t.id}
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                          className="group flex items-center gap-3 p-3 rounded-2xl hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-100 relative overflow-hidden"
                        >
                          <div
                            className={cn(
                              'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
                              t.type === 'income'
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-zinc-100 text-zinc-700'
                            )}
                          >
                            {t.type === 'income' ? (
                              <ArrowDownLeft size={18} />
                            ) : (
                              <ArrowUpRight size={18} />
                            )}
                          </div>

                          <div className="flex-1 min-w-0 pr-24 sm:pr-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-sm font-semibold text-zinc-900 truncate">
                                {t.description || t.category}
                              </h4>
                              <span
                                className={cn(
                                  'text-sm font-semibold whitespace-nowrap num',
                                  t.type === 'income' ? 'text-emerald-600' : 'text-zinc-900'
                                )}
                              >
                                {t.type === 'income' ? '+' : '−'}
                                {formatCurrency(t.amount, settings.currency)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 mt-0.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-600 font-medium truncate">
                                  {t.category}
                                </span>
                                <span className="text-[10px] text-zinc-400 num whitespace-nowrap">
                                  {format(parseISO(t.date), 'HH:mm')}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Acción Buttons */}
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-50 sm:bg-transparent pl-4 sm:pl-0 rounded-l-xl">
                            <button
                              onClick={() => handleDuplicate(t)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 transition-all focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-zinc-500/30 cursor-pointer"
                              aria-label={`Duplicar ${t.description || t.category}`}
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              onClick={() => handleEdit(t)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-all focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-blue-500/30 cursor-pointer"
                              aria-label={`Editar ${t.description || t.category}`}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => deleteTransaction(t.id)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-red-500/30 cursor-pointer"
                              aria-label={`Eliminar ${t.description || t.category}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {visibleCount < effectivelyFiltered.length && (
              <div className="pt-4 pb-2 flex justify-center">
                <button
                  onClick={() => setVisibleCount(v => v + 50)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
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
    </div>
  );
};

const EmptyState: React.FC = () => {
  const focusForm = () => {
    const input = document.getElementById('tx-amount') as HTMLInputElement | null;
    if (input) {
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => input.focus(), 320);
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
        onClick={focusForm}
        className="mt-5 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 active:bg-zinc-700 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
      >
        Añadir movimiento
      </button>
    </div>
  );
};
