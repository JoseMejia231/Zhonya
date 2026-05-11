import React from 'react';
import { motion } from 'motion/react';
import {
  Home,
  ArrowLeftRight,
  PieChart,
  Repeat,
  Disc3,
  Settings as SettingsIcon,
  LucideIcon,
} from 'lucide-react';
import { cn } from '../utils';

export type TabId =
  | 'overview'
  | 'transactions'
  | 'recurring'
  | 'analysis'
  | 'wheels'
  | 'settings';

interface TabDef {
  id: TabId;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  /** Si false, no aparece en la bottom nav móvil (se accede por otro UI). */
  mobileBottom?: boolean;
}

export const TABS: TabDef[] = [
  { id: 'overview', label: 'TABLERO', shortLabel: 'Tablero', icon: Home, mobileBottom: true },
  {
    id: 'transactions',
    label: 'LIBRO MAYOR',
    shortLabel: 'Libro',
    icon: ArrowLeftRight,
    mobileBottom: true,
  },
  {
    id: 'recurring',
    label: 'OPERACIONES',
    shortLabel: 'Operac.',
    icon: Repeat,
    mobileBottom: true,
  },
  { id: 'analysis', label: 'ANÁLISIS', shortLabel: 'Análisis', icon: PieChart, mobileBottom: true },
  { id: 'wheels', label: 'INSPIRACIÓN', shortLabel: 'Inspira', icon: Disc3, mobileBottom: false },
  {
    id: 'settings',
    label: 'CONFIGURACIÓN',
    shortLabel: 'Config',
    icon: SettingsIcon,
    mobileBottom: true,
  },
];

const MOBILE_TABS = TABS.filter((t) => t.mobileBottom !== false);

interface TabBarProps {
  active: TabId;
  onChange: (id: TabId) => void;
}

/** Sidebar for desktop layout. */
export const Sidebar: React.FC<TabBarProps> = ({ active, onChange }) => (
  <aside className="hidden sm:flex flex-col w-64 h-screen sticky top-0 bg-white border-r border-zinc-200/50 p-6">
    <div className="flex items-center gap-3 mb-10">
      <div className="w-10 h-10 bg-white border border-zinc-200/70 rounded-xl flex items-center justify-center shadow-sm shrink-0">
        <img src="/logo.png" alt="MONA" className="w-7 h-7" onError={(e) => (e.currentTarget.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=mona')} />
      </div>
      <h1 className="text-xl font-bold tracking-tight text-[#836637]">MONA</h1>
    </div>

    <nav className="flex-1 space-y-1">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold tracking-widest transition-all cursor-pointer focus:outline-none uppercase',
              isActive
                ? 'bg-emerald-50/80 text-emerald-700 shadow-sm'
                : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600'
            )}
          >
            <Icon size={18} strokeWidth={2.2} />
            <span>{tab.label}</span>
            {isActive && (
              <motion.div
                layoutId="sidebar-active-indicator"
                className="ml-auto w-1 h-5 bg-emerald-500 rounded-full"
              />
            )}
          </button>
        );
      })}
    </nav>

    <div className="mt-auto pt-6 border-t border-zinc-100 space-y-1">
      <button className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold tracking-widest text-zinc-400 uppercase hover:text-zinc-600">
        <div className="w-5 flex justify-center">
          <div className="w-3 h-0.5 bg-zinc-300" />
        </div>
        <span>COLAPSAR</span>
      </button>
    </div>
  </aside>
);

/** Compact horizontal pill-tabs for desktop (if still used somewhere). */
export const DesktopTabs: React.FC<TabBarProps> = ({ active, onChange }) => (

  <nav
    role="tablist"
    aria-label="Secciones"
    className="hidden sm:flex items-center gap-0.5 p-1 bg-white border border-zinc-200/70 rounded-2xl shadow-sm"
  >
    {TABS.map((tab) => {
      const Icon = tab.icon;
      const isActive = active === tab.id;
      return (
        <button
          key={tab.id}
          role="tab"
          aria-selected={isActive}
          onClick={() => onChange(tab.id)}
          className={cn(
            'relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30 z-10',
            isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-900'
          )}
        >
          <Icon size={16} strokeWidth={2.2} />
          <span>{tab.label}</span>
          {isActive && (
            <motion.span
              layoutId="desktop-tab-pill"
              aria-hidden
              className="absolute inset-0 rounded-xl bg-zinc-900 shadow-sm -z-10"
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            />
          )}
        </button>
      );
    })}
  </nav>
);

/**
 * Botón circular "Ruleta" para el header móvil. Solo visible en <sm.
 * Resalta cuando el tab activo es 'wheels'.
 */
export const WheelBubble: React.FC<TabBarProps> = ({ active, onChange }) => {
  const isActive = active === 'wheels';
  return (
    <button
      type="button"
      aria-label="Ruleta"
      aria-pressed={isActive}
      onClick={() => onChange('wheels')}
      className={cn(
        'sm:hidden inline-flex items-center justify-center min-w-[40px] min-h-[40px] w-10 h-10 rounded-full transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30 shrink-0',
        isActive
          ? 'bg-zinc-900 text-white shadow-lg shadow-black/20'
          : 'bg-white text-zinc-900 border border-zinc-200/70 shadow-sm hover:bg-zinc-50 active:scale-95'
      )}
    >
      <Disc3 size={18} strokeWidth={2.2} />
    </button>
  );
};

/**
 * Bottom nav for mobile. Fixed to viewport bottom, respects iOS home-indicator
 * via env(safe-area-inset-bottom). Hidden on >=sm.
 */
export const MobileBottomNav: React.FC<TabBarProps> = ({ active, onChange }) => (
  <nav
    role="tablist"
    aria-label="Navegación principal"
    className="sm:hidden fixed inset-x-0 bottom-0 z-40 bg-white/85 backdrop-blur-xl border-t border-zinc-200/70 pb-[env(safe-area-inset-bottom)]"
  >
    <div className="grid grid-cols-5 px-1.5 pt-1.5">
      {MOBILE_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-label={tab.label}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex flex-col items-center justify-center gap-1 py-2.5 min-h-[64px] rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30 cursor-pointer transition-colors',
              isActive
                ? 'text-zinc-900'
                : 'text-zinc-400 hover:text-zinc-700 active:bg-zinc-100/60'
            )}
          >
            <span className="relative flex items-center justify-center w-12 h-7">
              {isActive && (
                <motion.span
                  layoutId="mobile-tab-pill"
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-zinc-900"
                  transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                />
              )}
              <Icon
                size={20}
                strokeWidth={isActive ? 2.4 : 2}
                className={cn('relative z-10', isActive && 'text-white')}
              />
            </span>
            <span
              className={cn(
                'text-[10.5px] font-semibold tracking-tight leading-none',
                isActive && 'font-bold'
              )}
            >
              {tab.shortLabel}
            </span>
          </button>
        );
      })}
    </div>
  </nav>
);
