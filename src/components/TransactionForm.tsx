import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useFinance } from '../context/FinanceContext';
import { TransactionType } from '../types';
import { Plus, Minus, Check, ChevronDown, Calendar, FileText, X } from 'lucide-react';
import { cn, formatCurrency } from '../utils';
import { success } from '../utils/haptics';
import { motion, AnimatePresence } from 'motion/react';

const CURRENCIES = ['DOP', 'USD', 'EUR', 'MXN'] as const;

const CURRENCY_LABELS: Record<string, string> = {
  DOP: 'RD$',
  USD: 'US$',
  EUR: '€',
  MXN: 'MX$',
};

const todayLocalISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const yesterdayLocalISO = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

interface TransactionFormProps {
  onClose?: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onClose }) => {
  const { addTransaction, settings, updateSettings, transactions, savingsGoals } = useFinance();
  const [type, setType] = useState<TransactionType>('expense');

  const incomeCats = [...(settings.incomeCategories || settings.categories || [])];
  if (!incomeCats.includes('Metas')) incomeCats.push('Metas');

  const expenseCats = settings.expenseCategories || settings.categories || [];
  const activeCategories = type === 'income' ? incomeCats : expenseCats;

  const sortedCategories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === type) {
        counts.set(t.category, (counts.get(t.category) || 0) + 1);
      }
    }
    return [...activeCategories].sort((a, b) => (counts.get(b) || 0) - (counts.get(a) || 0));
  }, [transactions, activeCategories, type]);

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(sortedCategories[0] || '');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayLocalISO());
  const [justSaved, setJustSaved] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string>(savingsGoals.length > 0 ? savingsGoals[0].id : '');

  // Currency dropdown state
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [localCurrency, setLocalCurrency] = useState(settings.currency);
  const currencyRef = useRef<HTMLDivElement>(null);

  // Sync local currency from settings (e.g. on initial load or external change)
  useEffect(() => {
    setLocalCurrency(settings.currency);
  }, [settings.currency]);

  // Close currency dropdown on outside click
  useEffect(() => {
    if (!currencyOpen) return;
    const handler = (e: MouseEvent) => {
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) {
        setCurrencyOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [currencyOpen]);

  const handleCurrencySelect = useCallback((c: string) => {
    setLocalCurrency(c);
    setCurrencyOpen(false);
    void updateSettings({ currency: c });
  }, [updateSettings]);

  // Custom category creation state
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const newCatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showNewCatInput) {
      setTimeout(() => newCatInputRef.current?.focus(), 80);
    }
  }, [showNewCatInput]);

  const handleAddCategory = useCallback(() => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);

    // Determine which list to update
    if (type === 'income') {
      const current = settings.incomeCategories || settings.categories || [];
      if (current.includes(capitalized)) {
        setCategory(capitalized);
        setShowNewCatInput(false);
        setNewCatName('');
        return;
      }
      void updateSettings({ incomeCategories: [...current, capitalized] });
    } else {
      const current = settings.expenseCategories || settings.categories || [];
      if (current.includes(capitalized)) {
        setCategory(capitalized);
        setShowNewCatInput(false);
        setNewCatName('');
        return;
      }
      void updateSettings({ expenseCategories: [...current, capitalized] });
    }

    setCategory(capitalized);
    setShowNewCatInput(false);
    setNewCatName('');
  }, [newCatName, type, settings, updateSettings]);

  // Amount input ref for auto-focus on mount
  const amountInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      amountInputRef.current?.focus();
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  const quickAmounts = useMemo(() => {
    const curr = localCurrency;
    if (curr === 'DOP' || curr === 'MXN') {
      return [100, 500, 1000, 2000];
    }
    return [10, 20, 50, 100];
  }, [localCurrency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    const [y, m, d] = date.split('-').map(Number);
    const now = new Date();
    const localDate = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());

    const parsedAmount = Number(amount);

    const linkedGoalId = category === 'Metas' && selectedGoalId ? selectedGoalId : undefined;

    try {
      await addTransaction(
        {
          amount: parsedAmount,
          type,
          category,
          description,
          date: localDate.toISOString(),
          currency: localCurrency,
          ...(linkedGoalId ? { goalId: linkedGoalId } : {}),
        },
        { syncGoalBalance: Boolean(linkedGoalId) }
      );

      setAmount('');
      setDescription('');
      setJustSaved(true);
      success();
      setTimeout(() => {
        setJustSaved(false);
        onClose?.();
      }, 1200);
    } catch (error) {
      console.error('[MONA] Error saving transaction:', error);
    }
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
    setShowNewCatInput(false);
    setNewCatName('');
  };

  return (
    <div className="bg-white p-5 sm:p-7 rounded-[32px] border border-zinc-200/60 shadow-sm relative overflow-hidden transition-all duration-300">
      {/* Decorative Warm Accent Header background element */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#836637] to-transparent opacity-60" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#836637] dark:text-[#D4B15E]">Registrar</h2>
          <p className="text-base font-extrabold text-zinc-900 dark:text-white uppercase tracking-tighter mt-0.5">Nueva Entrada</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all active:scale-95 cursor-pointer"
            aria-label="Cerrar formulario"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type toggle with animated pill */}
        <div role="tablist" className="relative flex p-1 bg-zinc-50 border border-zinc-200/80 rounded-2xl">
          <button
            role="tab"
            aria-selected={type === 'income'}
            type="button"
            onClick={() => handleTypeChange('income')}
            className={cn(
              'relative flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider z-10 transition-colors cursor-pointer',
              type === 'income' ? 'text-emerald-700 dark:text-[#52C447]' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            )}
          >
            <Plus size={14} strokeWidth={2.5} />
            Ingreso
            {type === 'income' && (
              <motion.span
                layoutId="form-type-pill"
                aria-hidden
                className="absolute inset-0 rounded-xl bg-white border border-zinc-200/50 dark:border-emerald-500/20 shadow-sm -z-10"
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
              'relative flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider z-10 transition-colors cursor-pointer',
              type === 'expense' ? 'text-rose-600 dark:text-red-400' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            )}
          >
            <Minus size={14} strokeWidth={2.5} />
            Gasto
            {type === 'expense' && (
              <motion.span
                layoutId="form-type-pill"
                aria-hidden
                className="absolute inset-0 rounded-xl bg-white border border-zinc-200/50 dark:border-rose-500/20 shadow-sm -z-10"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
          </button>
        </div>

        {/* Prominent amount field */}
        <div className="space-y-2">
          <label htmlFor="tx-amount" className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400 ml-1">
            Monto
          </label>
          <div className="flex items-stretch overflow-visible rounded-2xl border border-zinc-200/80 bg-zinc-50 transition-all duration-300 focus-within:border-[#836637] dark:focus-within:border-[#D4B15E] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#836637]/5 dark:focus-within:ring-[#D4B15E]/5">
            {/* Custom Currency Dropdown */}
            <div ref={currencyRef} className="relative flex shrink-0 items-center border-r border-zinc-200/80">
              <button
                type="button"
                onClick={() => setCurrencyOpen(prev => !prev)}
                className="flex items-center gap-1.5 h-full px-4 py-4 bg-white/70 hover:bg-white transition-colors cursor-pointer rounded-l-2xl"
                aria-label="Seleccionar moneda"
                aria-expanded={currencyOpen}
              >
                <span className="text-[1.1rem] font-bold uppercase tracking-tight text-zinc-800 num">{localCurrency}</span>
                <ChevronDown
                  size={13}
                  className={cn(
                    'text-zinc-400 transition-transform duration-200',
                    currencyOpen && 'rotate-180'
                  )}
                />
              </button>

              <AnimatePresence>
                {currencyOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.95 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-full left-0 mt-1.5 z-50 min-w-[140px] bg-white/95 backdrop-blur-xl border border-zinc-200/80 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] overflow-hidden"
                  >
                    {CURRENCIES.map((c) => {
                      const isActive = localCurrency === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => handleCurrencySelect(c)}
                          className={cn(
                            'w-full flex items-center justify-between px-4 py-3 text-left transition-all cursor-pointer',
                            isActive
                              ? 'bg-[#836637]/5'
                              : 'hover:bg-zinc-50'
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={cn(
                              'text-xs font-bold num',
                              isActive ? 'text-[#836637] dark:text-[#D4B15E]' : 'text-zinc-800'
                            )}>
                              {c}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-medium">{CURRENCY_LABELS[c]}</span>
                          </div>
                          {isActive && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-[#836637] dark:text-[#D4B15E]"
                            >
                              <Check size={12} strokeWidth={3} />
                            </motion.span>
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <input
              ref={amountInputRef}
              id="tx-amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={cn(
                'flex-1 min-w-0 bg-transparent px-5 py-4 focus:outline-none text-[1.65rem] font-black num tracking-tighter border-none',
                amount ? 'text-zinc-900' : 'text-zinc-300'
              )}
              required
            />
          </div>

          {/* Quick Add Buttons */}
          <div className="flex flex-wrap gap-1.5 pl-1">
            {quickAmounts.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  const prev = Number(amount) || 0;
                  setAmount(String(prev + val));
                }}
                className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest rounded-xl bg-zinc-100/75 border border-zinc-200/60 text-[#836637] dark:text-[#D4B15E] hover:bg-zinc-200/50 hover:border-zinc-300 active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                +{val}
              </button>
            ))}
          </div>
        </div>

        {/* Category Picker */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400 ml-1 block">
            Categoría <span className="text-[9px] font-medium lowercase opacity-70 ml-1">(orden inteligente)</span>
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
                    'px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all duration-300 flex items-center gap-1.5 cursor-pointer relative overflow-hidden',
                    active
                      ? 'border-[#836637] text-[#836637] dark:border-[#D4B15E] dark:text-[#D4B15E] bg-[#836637]/5 dark:bg-[#D4B15E]/10 shadow-[0_4px_16px_rgba(131,102,55,0.08)] dark:shadow-[0_4px_16px_rgba(212,177,94,0.12)]'
                      : 'bg-zinc-50/50 text-zinc-500 border-zinc-200 hover:border-zinc-300 hover:text-zinc-700 dark:hover:text-zinc-200'
                  )}
                >
                  <AnimatePresence>
                    {active && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="text-[#836637] dark:text-[#D4B15E]"
                      >
                        <Check size={12} strokeWidth={3} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <span>{cat}</span>
                </button>
              );
            })}

            {/* Add new category button / inline input */}
            <AnimatePresence mode="wait">
              {showNewCatInput ? (
                <motion.div
                  key="new-cat-input"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 'auto', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-1 overflow-hidden"
                >
                  <input
                    ref={newCatInputRef}
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); }
                      if (e.key === 'Escape') { setShowNewCatInput(false); setNewCatName(''); }
                    }}
                    placeholder="Nombre..."
                    maxLength={30}
                    className="w-[120px] px-3 py-2 text-xs font-semibold rounded-xl border border-[#836637]/30 bg-white focus:outline-none focus:border-[#836637] focus:ring-2 focus:ring-[#836637]/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={!newCatName.trim()}
                    className="px-3 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl bg-[#836637] text-white hover:bg-[#6d5530] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95"
                  >
                    Agregar
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowNewCatInput(false); setNewCatName(''); }}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-all cursor-pointer active:scale-95"
                  >
                    <X size={14} strokeWidth={2.5} />
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="new-cat-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  type="button"
                  onClick={() => setShowNewCatInput(true)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold border border-dashed border-zinc-300 text-zinc-400 hover:border-[#836637] hover:text-[#836637] dark:hover:border-[#D4B15E] dark:hover:text-[#D4B15E] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Plus size={12} strokeWidth={2.5} />
                  Nueva
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Goal selector if category is Metas */}
        {category === 'Metas' && savingsGoals.length > 0 && (
          <div className="animate-in fade-in slide-in-from-top-3 duration-300 space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600 dark:text-[#52C447] ml-1 block">
              Destino de la Meta
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
              {savingsGoals.map(g => {
                const percent = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
                const isSelected = selectedGoalId === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGoalId(g.id)}
                    className={cn(
                      "p-3.5 rounded-2xl border text-left transition-all duration-355 cursor-pointer flex flex-col justify-between h-[84px] relative overflow-hidden bg-white",
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/20 dark:border-[#52C447] dark:bg-[#52C447]/10 shadow-[0_4px_16px_rgba(16,185,129,0.06)]"
                        : "border-zinc-200 hover:border-zinc-300"
                    )}
                  >
                    <div className="flex items-start justify-between w-full gap-2">
                      <span className={cn("text-xs font-black truncate uppercase tracking-tight", isSelected ? "text-emerald-950 dark:text-[#A7F3D0]" : "text-zinc-700")}>
                        {g.title}
                      </span>
                      {isSelected && <Check size={12} className="text-emerald-600 dark:text-[#52C447] shrink-0" strokeWidth={3} />}
                    </div>
                    
                    <div className="w-full">
                      <div className="flex items-center justify-between text-[9px] font-bold text-zinc-400 mb-1 leading-none">
                        <span>{percent}%</span>
                        <span className="num">{formatCurrency(g.currentAmount, g.currency || settings.currency)} / {formatCurrency(g.targetAmount, g.currency || settings.currency)}</span>
                      </div>
                      <div className="w-full h-1 bg-zinc-100 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full transition-all duration-500", isSelected ? "bg-emerald-500 dark:bg-[#52C447]" : "bg-zinc-300")}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Date + Description grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-zinc-50 border border-zinc-200/60 rounded-2xl flex flex-col justify-between gap-2.5">
            <div className="flex items-center justify-between">
              <label htmlFor="tx-date" className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400 ml-1">
                Fecha
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setDate(yesterdayLocalISO())}
                  className="px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider rounded-lg bg-white border border-zinc-200/60 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  Ayer
                </button>
                <button
                  type="button"
                  onClick={() => setDate(todayLocalISO())}
                  className="px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider rounded-lg bg-white border border-zinc-200/60 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  Hoy
                </button>
              </div>
            </div>
            <div className="relative flex items-center">
              <Calendar size={14} className="absolute left-3 text-zinc-400" />
              <input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white pl-9 pr-3 py-2.5 border border-zinc-200/60 rounded-xl focus:outline-none focus:border-[#836637] dark:focus:border-[#D4B15E] focus:ring-4 focus:ring-[#836637]/5 dark:focus:ring-[#D4B15E]/5 transition-all text-xs font-semibold num cursor-pointer"
              />
            </div>
          </div>

          <div className="p-4 bg-zinc-50 border border-zinc-200/60 rounded-2xl flex flex-col justify-between gap-2.5">
            <label htmlFor="tx-desc" className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400 ml-1 block">
              Nota
            </label>
            <div className="relative flex items-center">
              <FileText size={14} className="absolute left-3 text-zinc-400" />
              <input
                id="tx-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción (opcional)"
                maxLength={60}
                className="w-full bg-white pl-9 pr-3 py-2.5 border border-zinc-200/60 rounded-xl focus:outline-none focus:border-[#836637] dark:focus:border-[#D4B15E] focus:ring-4 focus:ring-[#836637]/5 dark:focus:ring-[#D4B15E]/5 transition-all text-xs font-semibold"
              />
            </div>
          </div>
        </div>

        <motion.button
          type="submit"
          whileTap={{ scale: 0.98 }}
          className={cn(
            'w-full py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 cursor-pointer flex items-center justify-center gap-2.5',
            justSaved
              ? 'bg-emerald-600 dark:bg-[#52C447] text-white shadow-emerald-500/20 focus:ring-emerald-500'
              : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-zinc-950/10 focus:ring-zinc-900 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100'
          )}
        >
          {justSaved ? (
            <>
              <Check size={14} strokeWidth={3} />
              Guardado Exitosamente
            </>
          ) : (
            'Guardar transacción'
          )}
        </motion.button>
      </form>
    </div>
  );
};
