import React from 'react';
import { cn } from '../utils';

interface SkeletonProps {
  className?: string;
}

/**
 * Bloque shimmer base. Usar la utilidad `animate-pulse` de Tailwind.
 * Para estados de carga >300ms en lugar de spinners.
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div className={cn('bg-zinc-200/70 rounded-xl animate-pulse', className)} aria-hidden="true" />
);

/** Esqueleto de la pantalla principal — tarjetas con la silueta del Resumen. */
export const DashboardSkeleton: React.FC = () => (
  <div className="min-h-dvh bg-transparent px-4 sm:px-6 pt-6 pb-24" aria-busy="true" aria-live="polite">
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="w-24 h-3.5" />
            <Skeleton className="w-32 h-2.5" />
          </div>
        </div>
        <Skeleton className="w-16 h-8 rounded-2xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Skeleton className="h-44 lg:h-48 rounded-3xl bg-zinc-300/60" />
        <Skeleton className="h-44 lg:h-48 rounded-3xl lg:col-span-2" />
        <Skeleton className="h-56 rounded-3xl lg:col-span-2" />
        <Skeleton className="h-56 rounded-3xl" />
      </div>
    </div>
  </div>
);
