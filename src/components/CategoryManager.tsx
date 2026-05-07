import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, X, Trash2, AlertTriangle, Check, Tag } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { cn } from '../utils';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const CategoryManager: React.FC<Props> = ({ open, onClose }) => {
  const { settings, updateSettings, transactions } = useFinance();
  const [newCat, setNewCat] = useState('');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of transactions) m.set(t.category, (m.get(t.category) ?? 0) + 1);
    return m;
  }, [transactions]);

  useEffect(() => {
    if (!open) {
      setPendingDelete(null);
      setError(null);
      setNewCat('');
      return;
    }
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  const handleAdd = (e?: React.FormEvent) => {
    e?.preventDefault();
    const name = newCat.trim();
    if (!name) return;
    if (name.length > 24) {
      setError('Máximo 24 caracteres.');
      return;
    }
    const exists = settings.categories.some((c) => c.toLowerCase() === name.toLowerCase());
    if (exists) {
      setError('Esa categoría ya existe.');
      return;
    }
    updateSettings({ categories: [...settings.categories, name] });
    setNewCat('');
    setError(null);
  };

  const handleDelete = (cat: string) => {
    if (settings.categories.length <= 1) {
      setError('Debe existir al menos una categoría.');
      setPendingDelete(null);
      return;
    }
    updateSettings({ categories: settings.categories.filter((c) => c !== cat) });
    setPendingDelete(null);
    setError(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            aria-hidden
          />
          <motion.div
            key="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cat-mgr-title"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-md z-50 bg-white rounded-3xl shadow-2xl shadow-black/20 border border-black/5 overflow-hidden max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center">
                  <Tag size={16} className="text-zinc-700" />
                </div>
                <div>
                  <h2 id="cat-mgr-title" className="text-sm font-semibold text-zinc-900">
                    Categorías
                  </h2>
                  <p className="text-[11px] text-zinc-500 num">
                    {settings.categories.length} total
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Add form */}
            <form onSubmit={handleAdd} className="p-5 border-b border-zinc-100">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1 block mb-1.5">
                Nueva categoría
              </label>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newCat}
                  onChange={(e) => {
                    setNewCat(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Ej. Suscripciones"
                  maxLength={24}
                  className="flex-1 min-w-0 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-zinc-900 focus:bg-white focus:ring-4 focus:ring-zinc-900/5 transition-all"
                />
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.97 }}
                  disabled={!newCat.trim()}
                  className="flex items-center gap-1 px-4 py-2.5 bg-black text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-900"
                >
                  <Plus size={15} />
                  Agregar
                </motion.button>
              </div>
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    role="alert"
                    className="flex items-center gap-1.5 text-[11px] text-red-600 mt-2 ml-1"
                  >
                    <AlertTriangle size={11} />
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </form>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
              <ul className="space-y-1">
                <AnimatePresence initial={false}>
                  {settings.categories.map((cat) => {
                    const count = counts.get(cat) ?? 0;
                    const isPending = pendingDelete === cat;
                    return (
                      <motion.li
                        key={cat}
                        layout
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ duration: 0.18 }}
                        className={cn(
                          'group flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border transition-colors',
                          isPending
                            ? 'bg-red-50 border-red-200'
                            : 'bg-white border-transparent hover:bg-zinc-50 hover:border-zinc-100'
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-sm text-zinc-900 truncate">{cat}</span>
                          {count > 0 && (
                            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 num shrink-0">
                              {count} tx
                            </span>
                          )}
                        </div>

                        {isPending ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setPendingDelete(null)}
                              className="px-2.5 py-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-white transition-colors cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleDelete(cat)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
                            >
                              <Check size={12} />
                              Eliminar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setError(null);
                              setPendingDelete(cat);
                            }}
                            aria-label={`Eliminar ${cat}`}
                            disabled={settings.categories.length <= 1}
                            className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all sm:opacity-0 group-hover:opacity-100 focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-red-500/30 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>

              {pendingDelete && (counts.get(pendingDelete) ?? 0) > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 mx-2 flex items-start gap-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2"
                >
                  <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                  <span>
                    Hay {counts.get(pendingDelete)} transacciones en esta categoría. Seguirán visibles
                    pero la categoría no aparecerá en el formulario.
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
