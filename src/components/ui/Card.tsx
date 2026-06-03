import React, { ReactNode } from 'react';
import { cn } from '../../utils';

import { useFinance } from '../../context/FinanceContext';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function getSurfaceAccentStyles(accent?: string, isSoft = false) {
  switch (accent) {
    case 'ocean':
      return isSoft 
        ? 'bg-zinc-50/80 border-blue-200/50 dark:bg-[#121c25]/88 dark:border-blue-800/30'
        : 'bg-white/70 border-blue-200/50 dark:bg-[#0f1720]/86 dark:border-blue-800/30';
    case 'terracotta':
      return isSoft 
        ? 'bg-zinc-50/80 border-orange-200/50 dark:bg-[#251812]/88 dark:border-orange-800/30'
        : 'bg-white/70 border-orange-200/50 dark:bg-[#1d120d]/86 dark:border-orange-800/30';
    case 'charcoal':
      return isSoft 
        ? 'bg-zinc-100/80 border-zinc-300/50 dark:bg-[#1a1a1a]/88 dark:border-zinc-700/30'
        : 'bg-white/70 border-zinc-200/80 dark:bg-[#141414]/86 dark:border-zinc-700/30';
    case 'rose':
      return isSoft 
        ? 'bg-zinc-50/80 border-rose-200/50 dark:bg-[#25151a]/88 dark:border-rose-800/30'
        : 'bg-white/70 border-rose-200/50 dark:bg-[#1d0f14]/86 dark:border-rose-800/30';
    case 'sage':
    default:
      return isSoft
        ? 'bg-zinc-100/80 border-zinc-200 dark:bg-[#1d2b26]/88 dark:border-white/10'
        : 'bg-white/70 border-zinc-200/70 dark:bg-[#17231f]/86 dark:border-white/10';
  }
}

export const Card: React.FC<CardProps> = ({ children, className }) => {
  const { settings } = useFinance();
  const accentStyles = getSurfaceAccentStyles(settings.themeAccent);

  return (
    <div className={cn("p-5 sm:p-7 rounded-[32px] shadow-sm relative overflow-hidden transition-all duration-300", accentStyles, className)}>
      {children}
    </div>
  );
};
