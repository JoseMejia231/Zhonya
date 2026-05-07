import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Undo2, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils';

export const UndoToast: React.FC = () => {
  const { lastDeleted, undoDelete, dismissUndo, settings } = useFinance();

  return (
    <AnimatePresence>
      {lastDeleted && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ bottom: 'calc(96px + env(safe-area-inset-bottom))' }}
          className="fixed left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 sm:gap-3 pl-3 sm:pl-4 pr-2 py-2 bg-zinc-900 text-white rounded-2xl shadow-2xl shadow-black/30 border border-white/10 w-[calc(100vw-2rem)] max-w-md sm:!bottom-6"
        >
          {/* Progress ring behind the close icon */}
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold">Transacción eliminada</span>
            <span className="text-[11px] text-white/50 truncate num">
              {lastDeleted.description || lastDeleted.category} ·{' '}
              {formatCurrency(lastDeleted.amount, settings.currency)}
            </span>
          </div>

          <button
            onClick={undoDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 cursor-pointer"
          >
            <Undo2 size={13} />
            Deshacer
          </button>

          <button
            onClick={dismissUndo}
            aria-label="Cerrar"
            className="p-1.5 text-white/50 hover:text-white rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 cursor-pointer"
          >
            <X size={14} />
          </button>

          {/* Progress bar */}
          <motion.div
            aria-hidden
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: 5, ease: 'linear' }}
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400/70 origin-left rounded-b-2xl"
            key={lastDeleted.id}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
