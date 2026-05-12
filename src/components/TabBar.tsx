import React from 'react';
import { motion } from 'motion/react';
import {
  Home,
  ArrowLeftRight,
  PieChart,
  Repeat,
  Disc3,
  Settings as SettingsIcon,
  PanelLeftClose,
  PanelLeftOpen,
  LucideIcon,
} from 'lucide-react';
import { cn } from '../utils';
import { MonaMark } from './MonaMark';

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

interface SidebarProps extends TabBarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

/** Sidebar for desktop layout. */
export const Sidebar: React.FC<SidebarProps> = ({ active, onChange, collapsed, onToggleCollapse }) => (
  <aside
    className={cn(
      'hidden sm:flex flex-col sticky top-0 h-screen overflow-hidden bg-white/90 backdrop-blur-xl border-r border-zinc-200/60 py-4 transition-all duration-300 ease-out',
      collapsed ? 'w-[92px] px-3' : 'w-[252px] px-5'
    )}
  >
    <div
      className={cn(
        'mb-10 flex items-center px-1 pt-1 transition-all duration-300',
        collapsed ? 'justify-center gap-0' : 'gap-3'
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200/70 bg-white shadow-sm">
        <MonaMark size={40} />
      </div>
      {!collapsed && <h1 className="text-xl font-bold tracking-[0.08em] text-[#7c6744]">MONA</h1>}
    </div>

    <nav className="flex-1 space-y-2">
      {TABS.filter((tab) => tab.id !== 'settings').map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            title={tab.label}
            aria-label={tab.label}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative w-full cursor-pointer rounded-2xl text-xs font-bold uppercase tracking-[0.16em] transition-all focus:outline-none',
              collapsed ? 'flex h-12 items-center justify-center px-0' : 'flex items-center gap-3 px-4 py-3',
              isActive
                ? 'bg-[#eef6f4] text-zinc-700 shadow-[0_10px_24px_rgba(27,31,35,0.05)]'
                : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600'
            )}
          >
            <Icon size={18} strokeWidth={2.2} />
            {!collapsed && <span>{tab.label}</span>}
            {!collapsed && isActive && tab.id === 'overview' && (
              <span className="ml-auto inline-flex min-w-6 items-center justify-center rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#2f5a29] shadow-sm">
                1
              </span>
            )}
          </button>
        );
      })}
    </nav>

    <div className="mt-auto space-y-2 border-t border-zinc-100 pt-5">
      <button
        type="button"
        title={collapsed ? 'Expandir' : 'Colapsar'}
        aria-label={collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
        onClick={onToggleCollapse}
        className={cn(
          'w-full rounded-2xl text-xs font-bold uppercase tracking-[0.16em] text-zinc-400 transition-all hover:bg-zinc-50 hover:text-zinc-600',
          collapsed ? 'flex items-center justify-center px-0 py-3' : 'flex items-center gap-3 px-4 py-3'
        )}
      >
        <div className="flex w-5 justify-center">
          {collapsed ? <PanelLeftOpen size={18} strokeWidth={2.2} /> : <PanelLeftClose size={18} strokeWidth={2.2} />}
        </div>
        {!collapsed && <span>Colapsar</span>}
      </button>
      <button
        type="button"
        title="Configuración"
        aria-label="Configuración"
        onClick={() => onChange('settings')}
        className={cn(
          'w-full rounded-2xl text-xs font-bold uppercase tracking-[0.16em] transition-all',
          collapsed ? 'flex items-center justify-center px-0 py-3' : 'flex items-center gap-3 px-4 py-3',
          active === 'settings'
            ? 'bg-[#eef6f4] text-zinc-700 shadow-[0_10px_24px_rgba(27,31,35,0.05)]'
            : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600'
        )}
      >
        <SettingsIcon size={18} strokeWidth={2.2} />
        {!collapsed && <span>Configuración</span>}
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
