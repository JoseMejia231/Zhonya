import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { TransactionType } from '../types';
import { Plus, Minus, Check, ChevronDown } from 'lucide-react';
import { cn } from '../utils';
import { success } from '../utils/haptics';
import { motion } from 'motion/react';

const CURRENCIES = ['USD', 'EUR', 'DOP', 'MXN'] as const;

const todayLocalISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const TransactionForm: React.FC = () => {
  const { addTransaction, settings, updateSettings } = useFinance();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(settings.categories[0]);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayLocalISO());
  const [justSaved, setJustSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    // Construct a local date from the YYYY-MM-DD picker value combined with the
    // current local time — avoids the UTC-midnight shift that pushed transactions
    // to the previous day in negative-offset timezones.
    const [y, m, d] = date.split('-').map(Number);
    const now = new Date();
    const localDate = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());

    addTransaction({
      amount: Number(amount),
      type,
      category,
      description,
      date: localDate.toISOString(),
    });

    setAmount('');
    setDescription('');
    setJustSaved(true);
    success();
    setTimeout(() => setJustSaved(false), 1200);
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/70 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Nuevo</h2>
          <p className="text-sm font-semibold text-zinc-900 mt-0.5">Registrar transacción</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type toggle with animated pill */}
        <div role="tablist" className="relative flex p-1 bg-zinc-100 rounded-xl">
          <button
            role="tab"
            aria-selected={type === 'income'}
            type="button"
            onClick={() => setType('income')}
            className={cn(
              'relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium z-10 transition-colors cursor-pointer',
              type === 'income' ? 'text-emerald-600' : 'text-zinc-500 hover:text-zinc-800'
            )}
          >
            <Plus size={15} />
            Ingreso
            {type === 'income' && (
              <motion.span
                layoutId="form-type-pill"
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
            onClick={() => setType('expense')}
            className={cn(
              'relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium z-10 transition-colors cursor-pointer',
              type === 'expense' ? 'text-red-600' : 'text-zinc-500 hover:text-zinc-800'
            )}
          >
            <Minus size={15} />
            Gasto
            {type === 'expense' && (
              <motion.span
                layoutId="form-type-pill"
                aria-hidden
                className="absolute inset-0 rounded-lg bg-white shadow-sm -z-10"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
          </button>
        </div>

        {/* Prominent amount field */}
        <div>
          <label htmlFor="tx-amount" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">
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
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 text-zinc-400"
              />
            </div>
            <input
              id="tx-amount"
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

        {/* Category chip picker */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1 block mb-2">
            Categoría
          </label>
          <div className="flex flex-wrap gap-1.5">
            {settings.categories.map((cat) => {
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

        {/* Date + Description grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="tx-date" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">
              Fecha
            </label>
            <input
              id="tx-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 focus:bg-white focus:ring-4 focus:ring-zinc-900/5 transition-all text-sm num"
            />
          </div>
          <div>
            <label htmlFor="tx-desc" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">
              Nota
            </label>
            <input
              id="tx-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional"
              maxLength={60}
              className="mt-1 w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 focus:bg-white focus:ring-4 focus:ring-zinc-900/5 transition-all text-sm"
            />
          </div>
        </div>

        <motion.button
          type="submit"
          whileTap={{ scale: 0.985 }}
          className={cn(
            'w-full py-3.5 rounded-2xl font-semibold shadow-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white cursor-pointer flex items-center justify-center gap-2',
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
            'Guardar transacción'
          )}
        </motion.button>
      </form>
    </div>
  );
};
