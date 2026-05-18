import React, { useState, useMemo, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction, TransactionType } from '../types';
import { Plus, Minus, Check, ChevronDown, X } from 'lucide-react';
import { cn } from '../utils';
import { success } from '../utils/haptics';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';

const CURRENCIES = ['USD', 'EUR', 'DOP', 'MXN'] as const;

interface TransactionEditModalProps {
  transaction: Transaction | null;
  mode: 'edit' | 'duplicate';
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionEditModal: React.FC<TransactionEditModalProps> = ({
  transaction,
  mode,
  isOpen,
  onClose,
}) => {
  const { updateTransaction, addTransaction, settings, updateSettings, transactions } = useFinance();
  
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (transaction && isOpen) {
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setCategory(transaction.category);
      setDescription(transaction.description || '');
      
      if (mode === 'edit') {
        // Formato local YYYY-MM-DD para el input type="date"
        try {
          const d = parseISO(transaction.date);
          setDate(format(d, 'yyyy-MM-dd'));
        } catch {
          setDate(new Date().toISOString().split('T')[0]);
        }
      } else {
        // Si es duplicar, usamos la fecha de hoy
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        setDate(`${yyyy}-${mm}-${dd}`);
      }
      setJustSaved(false);
    }
  }, [transaction, isOpen, mode]);

  const incomeCats = settings.incomeCategories || settings.categories || [];
  const expenseCats = settings.expenseCategories || settings.categories || [];
  const activeCategories = type === 'income' ? incomeCats : expenseCats;

  const sortedCategories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === type) {
        counts.set(t.category, (counts.get(t.category) || 0) + 1);
      }
    }
    const sorted = [...activeCategories].sort((a, b) => (counts.get(b) || 0) - (counts.get(a) || 0));
    // Ensure the current category is always in the list
    if (category && !sorted.includes(category)) {
      sorted.unshift(category);
    }
    return sorted;
  }, [transactions, activeCategories, type, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || !transaction) return;

    // Construir fecha local manteniendo la hora actual (para no cambiar la zona horaria)
    const [y, m, d] = date.split('-').map(Number);
    let targetDate = new Date();
    if (mode === 'edit') {
        const originalDate = parseISO(transaction.date);
        targetDate = new Date(y, m - 1, d, originalDate.getHours(), originalDate.getMinutes(), originalDate.getSeconds());
    } else {
        const now = new Date();
        targetDate = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());
    }

    if (mode === 'edit') {
      await updateTransaction(transaction.id, {
        amount: Number(amount),
        type,
        category,
        description,
        date: targetDate.toISOString(),
      });
    } else {
      await addTransaction({
        amount: Number(amount),
        type,
        category,
        description,
        date: targetDate.toISOString(),
      });
    }

    setJustSaved(true);
    success();
    setTimeout(() => {
      setJustSaved(false);
      onClose();
    }, 600);
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const targetCats = newType === 'income' ? incomeCats : expenseCats;
    const counts = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === newType) counts.set(t.category, (counts.get(t.category) || 0) + 1);
    }
    const sorted = [...targetCats].sort((a, b) => (counts.get(b) || 0) - (counts.get(a) || 0));
    setCategory(sorted[0] || '');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 sm:p-6 max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    {mode === 'edit' ? 'Editar' : 'Duplicar'}
                  </h2>
                  <p className="text-sm font-semibold text-zinc-900 mt-0.5">
                    {mode === 'edit' ? 'Modificar transacción' : 'Nueva transacción basada en anterior'}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500 transition-colors"
                  aria-label="Cerrar modal"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div role="tablist" className="relative flex p-1 bg-zinc-100 rounded-xl">
                  <button
                    role="tab"
                    aria-selected={type === 'income'}
                    type="button"
                    onClick={() => handleTypeChange('income')}
                    className={cn(
                      'relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium z-10 transition-colors cursor-pointer',
                      type === 'income' ? 'text-emerald-600' : 'text-zinc-500 hover:text-zinc-800'
                    )}
                  >
                    <Plus size={15} />
                    Ingreso
                    {type === 'income' && (
                      <motion.span
                        layoutId="modal-type-pill"
                        aria-hidden
                        className="absolute inset-0 rounded-lg bg-white shadow-sm -z-10"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                  </button>
                  <button
                    role="tab"
                    aria-selected={type === 'expense'}
                    type="button"
                    onClick={() => handleTypeChange('expense')}
                    className={cn(
                      'relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium z-10 transition-colors cursor-pointer',
                      type === 'expense' ? 'text-red-600' : 'text-zinc-500 hover:text-zinc-800'
                    )}
                  >
                    <Minus size={15} />
                    Gasto
                    {type === 'expense' && (
                      <motion.span
                        layoutId="modal-type-pill"
                        aria-hidden
                        className="absolute inset-0 rounded-lg bg-white shadow-sm -z-10"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                  </button>
                </div>

                <div>
                  <label htmlFor="modal-amount" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">
                    Monto
                  </label>
                  <div className="mt-1 flex items-stretch overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 transition-all focus-within:border-zinc-900 focus-within:bg-white focus-within:ring-4 focus-within:ring-zinc-900/5">
                    <div className="relative flex w-[6.8rem] shrink-0 items-center border-r border-zinc-200 bg-white/70">
                      <select
                        aria-label="Moneda"
                        value={settings.currency}
                        onChange={(e) => void updateSettings({ currency: e.target.value })}
                        className="h-full w-full appearance-none bg-transparent px-4 py-3.5 pr-8 text-[1.35rem] font-light uppercase tracking-tight text-zinc-900 focus:outline-none num"
                      >
                        {CURRENCIES.map((currency) => (
                          <option key={currency} value={currency}>
                            {currency}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="pointer-events-none absolute right-3 text-zinc-400" />
                    </div>
                    <input
                      id="modal-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className={cn(
                        'flex-1 min-w-0 bg-transparent px-4 py-3.5 focus:outline-none text-[1.35rem] font-light num tracking-tight',
                        amount ? 'text-zinc-900' : 'text-zinc-300'
                      )}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1 block mb-2">
                    Categoría
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {sortedCategories.map((cat) => {
                      const active = category === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(cat)}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer',
                            active
                              ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                              : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400 hover:text-zinc-900'
                          )}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="modal-date" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1 mb-1 block">
                      Fecha
                    </label>
                    <input
                      id="modal-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 focus:bg-white focus:ring-4 focus:ring-zinc-900/5 transition-all text-sm num"
                    />
                  </div>
                  <div>
                    <label htmlFor="modal-desc" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1 mb-1 block">
                      Nota
                    </label>
                    <input
                      id="modal-desc"
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Opcional"
                      maxLength={60}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 focus:bg-white focus:ring-4 focus:ring-zinc-900/5 transition-all text-sm"
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.985 }}
                  className={cn(
                    'w-full py-3.5 rounded-2xl font-semibold shadow-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white cursor-pointer flex items-center justify-center gap-2 mt-2',
                    justSaved
                      ? 'bg-emerald-500 text-white shadow-emerald-500/25 focus-visible:ring-emerald-500'
                      : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-black/10 focus-visible:ring-zinc-900'
                  )}
                >
                  {justSaved ? (
                    <>
                      <Check size={16} />
                      Guardado
                    </>
                  ) : (
                    mode === 'edit' ? 'Guardar cambios' : 'Confirmar duplicado'
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
