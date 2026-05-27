import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export const ErrorToast: React.FC = () => {
  const { errorMessage, dismissError } = useFinance();

  return (
    <AnimatePresence>
      {errorMessage && (
        <motion.div
          role="alert"
          aria-live="assertive"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ bottom: 'max(1rem, calc(env(safe-area-inset-bottom) + 5.5rem))' }}
          className="fixed left-1/2 -translate-x-1/2 z-50 flex items-start gap-3 pl-3 pr-2 py-3 bg-red-600 text-white rounded-2xl shadow-2xl shadow-red-900/30 border border-red-400/30 w-[calc(100vw-2rem)] max-w-md"
        >
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <AlertTriangle size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <p className="text-sm font-semibold leading-snug">{errorMessage}</p>
          </div>
          <button
            onClick={dismissError}
            aria-label="Cerrar"
            className="p-1.5 text-white/70 hover:text-white rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 cursor-pointer self-start"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
