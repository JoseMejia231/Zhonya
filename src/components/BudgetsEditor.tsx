import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Wallet, Pencil, Check, X } from 'lucide-react';
import { cn, formatCurrency, getCurrencySymbol } from '../utils';

/**
 * Lista editable de presupuestos por categoría. Se muestra en la sección
 * Ajustes. Toca una fila para editar el monto, blur o Enter guarda.
 */
export const BudgetsEditor: React.FC = () => {
  const { settings, setCategoryBudget } = useFinance();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const symbol = getCurrencySymbol(settings.currency);
  const budgets = settings.budgets ?? {};

  const startEdit = (cat: string) => {
    const cur = budgets[cat];
    setDraft(cur ? String(cur) : '');
    setEditing(cat);
  };

  const commit = async (cat: string) => {
    const num = draft.trim() === '' ? null : Number(draft);
    await setCategoryBudget(cat, num);
    setEditing(null);
    setDraft('');
  };

  const cancel = () => {
    setEditing(null);
    setDraft('');
  };

  return (
    <section className="bg-white rounded-3xl border border-zinc-200/70 shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center">
          <Wallet size={15} className="text-zinc-700" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-zinc-900">Presupuestos</h3>
          <p className="text-[11px] text-zinc-500">Monto mensual destinado por categoría.</p>
        </div>
      </div>

      <ul className="border-t border-zinc-100">
        {settings.categories.map((cat) => {
          const isEditing = editing === cat;
          const value = budgets[cat];
          const hasBudget = typeof value === 'number' && value > 0;

          return (
            <li
              key={cat}
              className={cn(
                'flex items-center gap-3 px-5 py-3 border-b border-zinc-100 last:border-b-0 transition-colors',
                isEditing ? 'bg-zinc-50' : ''
              )}
            >
              <span className="text-sm font-medium text-zinc-900 flex-1 min-w-0 truncate">
                {cat}
              </span>

              {isEditing ? (
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center bg-white border border-zinc-200 rounded-xl focus-within:border-zinc-900 focus-within:ring-4 focus-within:ring-zinc-900/5 transition-all overflow-hidden">
                    <span className="pl-2.5 pr-1 text-xs text-zinc-400 select-none num">
                      {symbol}
                    </span>
                    <input
                      autoFocus
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commit(cat);
                        if (e.key === 'Escape') cancel();
                      }}
                      placeholder="0.00"
                      className="w-24 py-1.5 pr-2 bg-transparent focus:outline-none text-sm font-semibold num text-right"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => commit(cat)}
                    aria-label="Guardar"
                    className="inline-flex items-center justify-center min-w-[36px] min-h-[36px] rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-700 transition-colors cursor-pointer"
                  >
                    <Check size={14} strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    onClick={cancel}
                    aria-label="Cancelar"
                    className="inline-flex items-center justify-center min-w-[36px] min-h-[36px] rounded-lg text-zinc-500 hover:bg-zinc-100 transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => startEdit(cat)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30',
                    hasBudget
                      ? 'bg-zinc-50 text-zinc-900 hover:bg-zinc-100'
                      : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50'
                  )}
                >
                  {hasBudget ? (
                    <span className="num">{formatCurrency(value, settings.currency)}</span>
                  ) : (
                    <>
                      <Pencil size={12} />
                      Asignar
                    </>
                  )}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};
