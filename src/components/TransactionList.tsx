import React, { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, cn } from '../utils';
import { Trash2, ArrowUpRight, ArrowDownLeft, Inbox } from 'lucide-react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import type { Transaction } from '../types';

const dayKey = (iso: string) => {
  const d = parseISO(iso);
  if (isToday(d)) return 'Hoy';
  if (isYesterday(d)) return 'Ayer';
  return format(d, "d 'de' MMMM", { locale: es });
};

export const TransactionList: React.FC = () => {
  const { filteredTransactions, deleteTransaction, settings, filter, setFilter } = useFinance();

  const filterOptions: { label: string; value: typeof filter }[] = [
    { label: 'Todo', value: 'all' },
    { label: 'Hoy', value: 'day' },
    { label: 'Mes', value: 'month' },
    { label: 'Año', value: 'year' },
  ];

  const grouped = useMemo(() => {
    const groups = new Map<string, Transaction[]>();
    for (const t of filteredTransactions) {
      const key = dayKey(t.date);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }
    return Array.from(groups.entries());
  }, [filteredTransactions]);

  const totalCount = filteredTransactions.length;

  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/70 shadow-sm h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Actividad</h2>
          <p className="text-sm font-semibold text-zinc-900 mt-0.5">
            {totalCount} {totalCount === 1 ? 'transacción' : 'transacciones'}
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Filtro de periodo"
          className="relative flex p-1 bg-zinc-100 rounded-xl overflow-x-auto no-scrollbar"
        >
          {filterOptions.map((opt) => {
            const active = filter === opt.value;
            return (
              <button
                key={opt.value}
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(opt.value)}
                className={cn(
                  'relative px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap z-10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30',
                  active ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-800'
                )}
              >
                {opt.label}
                {active && (
                  <motion.span
                    layoutId="list-filter-pill"
                    aria-hidden
                    className="absolute inset-0 rounded-lg bg-white shadow-sm -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex-1 lg:overflow-y-auto -mx-2 px-2 custom-scrollbar">
          <div className="space-y-5">
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
                          className="group flex items-center gap-3 p-3 rounded-2xl hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-100"
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

                          <div className="flex-1 min-w-0">
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

                              <button
                                onClick={() => deleteTransaction(t.id)}
                                className="sm:opacity-0 group-hover:opacity-100 inline-flex items-center justify-center min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:p-2 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-red-500/30 cursor-pointer -mr-2 sm:mr-0"
                                aria-label={`Eliminar ${t.description || t.category}`}
                              >
                                <Trash2 size={14} />
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
          </div>
        </div>
      )}
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
        Aún no hay actividad para este periodo. Registra la primera para ver tus datos.
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
