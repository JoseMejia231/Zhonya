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
  { id: 'overview', label: 'Resumen', shortLabel: 'Resumen', icon: Home, mobileBottom: true },
  {
    id: 'transactions',
    label: 'Movimientos',
    shortLabel: 'Movs.',
    icon: ArrowLeftRight,
    mobileBottom: true,
  },
  {
    id: 'recurring',
    label: 'Gastos fijos',
    shortLabel: 'Fijos',
    icon: Repeat,
    mobileBottom: true,
  },
  { id: 'analysis', label: 'Análisis', shortLabel: 'Stats', icon: PieChart, mobileBottom: true },
  { id: 'wheels', label: 'Ruleta', shortLabel: 'Ruleta', icon: Disc3, mobileBottom: false },
  {
    id: 'settings',
    label: 'Ajustes',
    shortLabel: 'Ajustes',
    icon: SettingsIcon,
    mobileBottom: true,
  },
];

const MOBILE_TABS = TABS.filter((t) => t.mobileBottom !== false);

interface TabBarProps {
  active: TabId;
  onChange: (id: TabId) => void;
}

/** Compact horizontal pill-tabs for desktop placed in the header. */
export const DesktopTabs: React.FC<TabBarProps> = ({ active, onChange }) => (
  <nav
    role="tablist"
    aria-label="Secciones"
    className="hidden sm:flex items-center gap-0.5 p-1 bg-white border border-black/5 rounded-2xl shadow-sm"
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
          : 'bg-white text-zinc-900 border border-black/5 shadow-sm hover:bg-zinc-50 active:scale-95'
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
    className="sm:hidden fixed inset-x-0 bottom-0 z-40 bg-white/85 backdrop-blur-xl border-t border-black/5 pb-[env(safe-area-inset-bottom)]"
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
