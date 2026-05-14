import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Target, Plus, Trash2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, cn } from '../utils';

const CURRENCIES = ['USD', 'EUR', 'DOP', 'MXN'] as const;

export const SavingsGoalsSection: React.FC = () => {
  const { savingsGoals, upsertSavingsGoal, deleteSavingsGoal, settings } = useFinance();
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [currency, setCurrency] = useState(settings.currency || 'DOP');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetAmount) return;
    
    await upsertSavingsGoal({
      title,
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount) || 0,
      currency,
    });
    
    setTitle('');
    setTargetAmount('');
    setCurrentAmount('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-emerald-900">Metas de Ahorro</h2>
          <p className="text-sm text-zinc-500 mt-1">Planifica tus próximos grandes objetivos.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-2 bg-[#2D5A27] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#244920] transition-colors"
        >
          {isAdding ? 'Cancelar' : <><Plus size={18} /> Nueva Meta</>}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="bg-white p-6 rounded-2xl border border-zinc-200/60 shadow-sm overflow-hidden"
            onSubmit={handleAdd}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Nombre de la Meta</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ej. Viaje a Japón"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#2D5A27]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Monto Objetivo</label>
                <div className="flex items-stretch overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 focus-within:border-[#2D5A27] focus-within:ring-2 focus-within:ring-[#2D5A27]/20 transition-all">
                  <div className="relative flex w-[5.5rem] shrink-0 items-center border-r border-zinc-200 bg-white/70">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="h-full w-full appearance-none bg-transparent pl-3 pr-6 py-2.5 text-sm font-medium uppercase tracking-tight text-zinc-900 focus:outline-none cursor-pointer"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2 text-zinc-400 pointer-events-none" />
                  </div>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={targetAmount}
                    onChange={e => setTargetAmount(e.target.value)}
                    placeholder="5000"
                    className="flex-1 w-full min-w-0 bg-transparent px-3 py-2.5 text-sm outline-none num"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Monto Actual (Opcional)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={currentAmount}
                  onChange={e => setCurrentAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#2D5A27]"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="bg-[#2D5A27] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#244920] transition-colors"
              >
                Guardar Meta
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {savingsGoals.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center text-zinc-500">
            <Target size={48} className="mx-auto text-zinc-300 mb-4" />
            <p className="text-lg font-medium text-zinc-600">No tienes metas de ahorro aún.</p>
            <p className="text-sm">Tus objetivos aparecerán en el panel principal.</p>
          </div>
        )}
        
        {savingsGoals.map(goal => {
          const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          return (
            <div key={goal.id} className="bg-white p-6 rounded-3xl border border-zinc-200/60 shadow-sm relative group">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-zinc-900 tracking-tight pr-8">{goal.title}</h3>
                <button
                  onClick={() => deleteSavingsGoal(goal.id)}
                  className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity absolute top-6 right-6"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-zinc-500">Progreso</span>
                  <span className="text-[#2D5A27]">{progress}%</span>
                </div>
                <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-[#2D5A27]"
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Acumulado</p>
                  <p className="font-semibold text-zinc-900 num">{formatCurrency(goal.currentAmount, goal.currency || settings.currency)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Objetivo</p>
                  <p className="font-semibold text-zinc-500 num">{formatCurrency(goal.targetAmount, goal.currency || settings.currency)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
