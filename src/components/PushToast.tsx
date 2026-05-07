import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export const PushToast: React.FC = () => {
  const { inAppNotification, dismissInAppNotification } = useFinance();

  useEffect(() => {
    if (!inAppNotification) return;
    const id = setTimeout(dismissInAppNotification, 6000);
    return () => clearTimeout(id);
  }, [inAppNotification, dismissInAppNotification]);

  return (
    <AnimatePresence>
      {inAppNotification && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -24, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
          className="fixed left-1/2 -translate-x-1/2 z-50 flex items-start gap-3 pl-3 pr-2 py-3 bg-zinc-900 text-white rounded-2xl shadow-2xl shadow-black/30 border border-white/10 w-[calc(100vw-2rem)] max-w-md"
        >
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Bell size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{inAppNotification.title}</p>
            {inAppNotification.body && (
              <p className="text-[11px] text-white/60 leading-snug mt-0.5 line-clamp-2">
                {inAppNotification.body}
              </p>
            )}
          </div>
          <button
            onClick={dismissInAppNotification}
            aria-label="Cerrar"
            className="p-1.5 text-white/50 hover:text-white rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 cursor-pointer"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
