import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Check, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils';
import { success } from '../utils/haptics';

export const RecurringConfirmModal: React.FC = () => {
  const { recurringPrompt, setRecurringPrompt, recurring, settings, confirmRecurringPayment } =
    useFinance();

  const rec = recurringPrompt
    ? recurring.find((r) => r.id === recurringPrompt.recurringId)
    : null;

  const close = () => setRecurringPrompt(null);

  const onConfirm = async () => {
    if (!rec) return;
    await confirmRecurringPayment(rec.id, recurringPrompt?.periodKey);
    success();
    close();
  };

  return (
    <AnimatePresence>
      {recurringPrompt && rec && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={close}
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
              <div className="w-11 h-11 rounded-2xl bg-zinc-900 flex items-center justify-center shrink-0">
                <Bell size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-zinc-900">¿Pagaste {rec.name}?</h3>
                <p className="text-[12px] text-zinc-500 mt-0.5">
                  Confirma para registrar el {rec.type === 'income' ? 'ingreso' : 'gasto'} en tu cuenta.
                </p>
              </div>
              <button
                onClick={close}
                aria-label="Cerrar"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 grid grid-cols-2 gap-3">
              <div className="bg-zinc-50 rounded-2xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Monto
                </p>
                <p
                  className={
                    rec.type === 'income'
                      ? 'text-emerald-600 text-lg font-semibold num mt-0.5'
                      : 'text-zinc-900 text-lg font-semibold num mt-0.5'
                  }
                >
                  {rec.type === 'income' ? '+' : '−'}
                  {formatCurrency(rec.amount, settings.currency)}
                </p>
              </div>
              <div className="bg-zinc-50 rounded-2xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Categoría
                </p>
                <p className="text-zinc-900 text-sm font-semibold mt-1 truncate">{rec.category}</p>
              </div>
            </div>

            <div className="px-5 pb-5 flex flex-col-reverse sm:flex-row gap-2">
              <button
                onClick={close}
                className="flex-1 py-3 rounded-2xl bg-zinc-100 text-zinc-700 font-semibold text-sm hover:bg-zinc-200 active:bg-zinc-300 transition-colors cursor-pointer"
              >
                Aún no
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-black text-white font-semibold text-sm shadow-lg shadow-black/10 hover:bg-zinc-800 active:bg-zinc-700 transition-colors cursor-pointer"
              >
                <Check size={15} strokeWidth={2.5} />
                Sí, pagué
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
