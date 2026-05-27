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
    <section className="rounded-[32px] border border-zinc-200/70 bg-white/70 glass-surface premium-shadow overflow-hidden">
      <div className="px-6 sm:px-7 pt-6 pb-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#f6f1e8] flex items-center justify-center text-[var(--color-brand)]">
          <Wallet size={16} strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#9d9687]/70 mb-0.5">
            Plan mensual
          </p>
          <h3 className="text-base font-bold tracking-tight text-emerald-900">
            Presupuestos
          </h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Monto mensual destinado por categoría.
          </p>
        </div>
      </div>

      <ul className="border-t border-[#f0ede4]">
        {(settings.expenseCategories || settings.categories || []).map((cat) => {
          const isEditing = editing === cat;
          const value = budgets[cat];
          const hasBudget = typeof value === 'number' && value > 0;

          return (
            <li
              key={cat}
              className={cn(
                'flex items-center gap-3 px-6 sm:px-7 py-3 border-b border-[#f0ede4] last:border-b-0 transition-colors',
                isEditing ? 'bg-[#f6f1e8]/40' : ''
              )}
            >
              <span className="text-sm font-medium text-zinc-900 flex-1 min-w-0 truncate">
                {cat}
              </span>

              {isEditing ? (
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center bg-white border border-zinc-200 rounded-xl focus-within:border-[var(--color-action)] focus-within:ring-4 focus-within:ring-[var(--color-action)]/10 transition-all overflow-hidden">
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
                      className="w-24 py-1.5 pr-2 bg-transparent focus:outline-none text-sm font-semibold num text-right text-zinc-900"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => commit(cat)}
                    aria-label="Guardar"
                    className="inline-flex items-center justify-center min-w-[36px] min-h-[36px] rounded-lg bg-[var(--color-action)] text-white hover:bg-[var(--color-action-hover)] transition-colors cursor-pointer active:scale-95"
                  >
                    <Check size={14} strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    onClick={cancel}
                    aria-label="Cancelar"
                    className="inline-flex items-center justify-center min-w-[36px] min-h-[36px] rounded-lg text-zinc-500 hover:bg-zinc-100 transition-colors cursor-pointer active:scale-95"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => startEdit(cat)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action)]/30 active:scale-95',
                    hasBudget
                      ? 'bg-[#f6f1e8]/60 text-[var(--color-action)] hover:bg-[#f6f1e8]'
                      : 'text-zinc-400 hover:text-[var(--color-brand)] hover:bg-[#f6f1e8]/40'
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
