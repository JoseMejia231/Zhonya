import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { LogOut, Cloud, Tag, Coins, ChevronRight, Check } from 'lucide-react';
import { cn } from '../utils';
import { CategoryManager } from './CategoryManager';
import { BudgetsEditor } from './BudgetsEditor';

const CURRENCIES = [
  { code: 'USD', label: 'Dólar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'DOP', label: 'Peso DOM' },
  { code: 'MXN', label: 'Peso MEX' },
];

export const Settings: React.FC = () => {
  const { logout, user, transactions, settings, updateSettings } = useFinance();
  const [catOpen, setCatOpen] = useState(false);

  const initials = (user?.displayName || user?.email || '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-4">
      {/* Profile card */}
      <section className="bg-white p-5 rounded-3xl border border-black/5 shadow-sm">
        <div className="flex items-center gap-3">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Usuario'}
              className="w-12 h-12 rounded-2xl border border-zinc-100 shrink-0 object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center text-sm font-bold shrink-0">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-900 truncate">
              {user?.displayName || user?.email?.split('@')[0] || 'Usuario'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Cloud size={11} className="text-emerald-500 shrink-0" />
              <span className="text-[10px] font-medium text-emerald-600">Sincronizado</span>
              <span className="text-[10px] text-zinc-300">·</span>
              <span className="text-[10px] text-zinc-500 num">
                {transactions.length} {transactions.length === 1 ? 'registro' : 'registros'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Currency */}
      <section className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center">
            <Coins size={15} className="text-zinc-700" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Moneda</h3>
            <p className="text-[11px] text-zinc-500">Se aplica a todos los movimientos.</p>
          </div>
        </div>
        <ul className="border-t border-zinc-100">
          {CURRENCIES.map((c) => {
            const active = settings.currency === c.code;
            return (
              <li key={c.code}>
                <button
                  onClick={() => !active && updateSettings({ currency: c.code })}
                  className={cn(
                    'w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors cursor-pointer focus:outline-none focus-visible:bg-zinc-50',
                    'hover:bg-zinc-50 active:bg-zinc-100',
                    active && 'bg-zinc-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-semibold text-zinc-900 num w-10">
                      {c.code}
                    </span>
                    <span className="text-sm text-zinc-700">{c.label}</span>
                  </div>
                  {active ? (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-900 text-white">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full border border-zinc-200" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Categories */}
      <section className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
        <button
          onClick={() => setCatOpen(true)}
          className="w-full flex items-center gap-3 p-5 text-left hover:bg-zinc-50 active:bg-zinc-100 transition-colors cursor-pointer focus:outline-none focus-visible:bg-zinc-50"
        >
          <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
            <Tag size={15} className="text-zinc-700" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-zinc-900">Categorías</h3>
            <p className="text-[11px] text-zinc-500 truncate">
              {settings.categories.length} categorías · toca para gestionar
            </p>
          </div>
          <ChevronRight size={16} className="text-zinc-400 shrink-0" />
        </button>
      </section>

      <BudgetsEditor />

      {/* Logout */}
      <section className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 p-5 text-left hover:bg-red-50 active:bg-red-100 transition-colors cursor-pointer focus:outline-none focus-visible:bg-red-50 group"
        >
          <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center shrink-0 group-hover:bg-red-100 transition-colors">
            <LogOut size={15} className="text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-red-600">Cerrar sesión</h3>
            <p className="text-[11px] text-zinc-500">Salir de tu cuenta en este dispositivo.</p>
          </div>
        </button>
      </section>

      <p className="text-center text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 pt-2">
        Zhonyas Wallet · Cifrado E2E
      </p>

      <CategoryManager open={catOpen} onClose={() => setCatOpen(false)} />
    </div>
  );
};
