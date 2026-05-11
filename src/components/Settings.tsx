import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { LogOut, Cloud, Tag, Coins, ChevronRight, Check, TrendingUp, Repeat } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Profile card */}
      <section className="bg-white p-6 rounded-3xl border border-zinc-200/50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-lg font-bold shrink-0 border border-emerald-100">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-zinc-900 uppercase tracking-tight">
              {user?.displayName || user?.email?.split('@')[0] || 'Usuario'}
            </h2>
            <p className="text-[10px] font-mono font-bold text-zinc-400 mt-0.5 tracking-widest uppercase">
              Identidad de operador: #MN-01-{initials}
            </p>
          </div>
        </div>
      </section>

      {/* Nodo de Preferencias */}
      <section className="bg-white rounded-3xl border border-zinc-200/50 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
            Nodo de preferencias
          </h3>
        </div>
        <div className="divide-y divide-zinc-50">
          <PreferenceItem icon={<Coins size={14} />} label="Moneda Principal" value={settings.currency + " ($)"} />
          <PreferenceItem icon={<TrendingUp size={14} />} label="Capa de Inteligencia" value="ACTIVA" color="text-emerald-600" />
          <PreferenceItem icon={<Cloud size={14} />} label="Túnel de Privacidad" value="ENCRIPTADO" color="text-emerald-600" />
          <PreferenceItem icon={<Repeat size={14} />} label="Distribución Cloud" value="SINCRONIZADO" color="text-emerald-600" />
        </div>
        <div className="p-4 bg-zinc-50/50">
          <button className="w-full flex items-center justify-between px-4 py-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-[10px] font-bold tracking-widest text-emerald-800 uppercase hover:bg-emerald-100 transition-colors">
            <div className="flex items-center gap-3">
              <Repeat size={14} />
              <span>Cambiar a Inglés</span>
            </div>
            <span className="text-[9px] font-mono">EN</span>
          </button>
        </div>
      </section>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={() => setCatOpen(true)}
          className="w-full flex items-center justify-between p-5 bg-white border border-zinc-200/50 rounded-3xl text-sm font-semibold text-zinc-900 hover:bg-zinc-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Tag size={16} className="text-zinc-400" />
            <span>Gestionar Categorías</span>
          </div>
          <ChevronRight size={16} className="text-zinc-300" />
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center p-5 bg-red-50 text-red-600 rounded-3xl text-[10px] font-bold tracking-[0.2em] uppercase border border-red-100 hover:bg-red-100 transition-all active:scale-[0.98]"
        >
          Terminate Session
        </button>
      </div>

      <p className="text-center text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-400 pt-4">
        MONA CORE · SECURED · {new Date().getFullYear()}
      </p>

      <CategoryManager open={catOpen} onClose={() => setCatOpen(false)} />
    </div>
  );
};

const PreferenceItem: React.FC<{ icon: React.ReactNode; label: string; value: string; color?: string }> = ({ icon, label, value, color = 'text-zinc-500' }) => (
  <div className="flex items-center justify-between px-6 py-4">
    <div className="flex items-center gap-3">
      <div className="text-zinc-400">{icon}</div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</span>
    </div>
    <span className={cn("text-[10px] font-mono font-bold tracking-wider", color)}>{value}</span>
  </div>
);

