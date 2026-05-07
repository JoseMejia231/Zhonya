import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Inbox } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, cn } from '../utils';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const dayLabel = (iso: string) => {
  const d = parseISO(iso);
  if (isToday(d)) return 'Hoy';
  if (isYesterday(d)) return 'Ayer';
  return format(d, "d 'de' MMM", { locale: es });
};

interface RecentActivityCardProps {
  /** Cuántos movimientos mostrar. Por defecto 5. */
  limit?: number;
  /** Handler para "Ver todo" — recibe el ID del tab destino. */
  onSeeAll?: () => void;
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
  limit = 5,
  onSeeAll,
}) => {
  const { transactions, settings } = useFinance();

  const recent = useMemo(() => transactions.slice(0, limit), [transactions, limit]);

  const handleSeeAll = () => {
    if (onSeeAll) onSeeAll();
    else window.location.hash = '#/transactions';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white p-5 rounded-3xl border border-black/5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Actividad
          </h2>
          <p className="text-sm font-semibold text-zinc-900 mt-0.5">
            {transactions.length === 0
              ? 'Sin movimientos'
              : `${transactions.length} ${transactions.length === 1 ? 'transacción' : 'transacciones'}`}
          </p>
        </div>
        {transactions.length > 0 && (
          <button
            type="button"
            onClick={handleSeeAll}
            className="inline-flex items-center gap-0.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 active:bg-zinc-100 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
          >
            Ver todo
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {recent.length === 0 ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-50 mb-3">
            <Inbox className="text-zinc-300" size={22} />
          </div>
          <p className="text-sm font-semibold text-zinc-900">Sin movimientos aún</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-[260px] mx-auto leading-relaxed">
            Registra una transacción desde el tab Movimientos para verla aquí.
          </p>
        </div>
      ) : (
        <ul className="space-y-1.5 -mx-1">
          <AnimatePresence initial={false}>
            {recent.map((t) => (
              <motion.li
                key={t.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 p-2 rounded-2xl"
              >
                <div
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                    t.type === 'income'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-zinc-100 text-zinc-700'
                  )}
                >
                  {t.type === 'income' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
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
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-600 font-medium truncate">
                      {t.category}
                    </span>
                    <span className="text-[10px] text-zinc-400 num whitespace-nowrap">
                      {dayLabel(t.date)} · {format(parseISO(t.date), 'HH:mm')}
                    </span>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </motion.div>
  );
};
