import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Disc3,
  Sparkles,
  PiggyBank,
  Coins,
  Gift,
  Target,
  RotateCw,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Wheel, WheelMode, WheelSlice, TransactionType } from '../types';
import { cn, formatCurrency, getCurrencySymbol } from '../utils';
import { success, tap } from '../utils/haptics';

// === Plantillas predefinidas ===

interface WheelPreset {
  key: string;
  title: string;
  description: string;
  mode: WheelMode;
  txType?: TransactionType;
  icon: React.FC<{ size?: number; className?: string }>;
  build: (defaultCategories: string[]) => WheelSlice[];
}

const newSlice = (label: string, value?: number, category?: string): WheelSlice => ({
  id: crypto.randomUUID(),
  label,
  ...(typeof value === 'number' ? { value } : {}),
  ...(category ? { category } : {}),
});

const PRESETS: WheelPreset[] = [
  {
    key: 'decision',
    title: 'Decisión',
    description: 'Ruleta neutral para decisiones generales (sí / no, opciones cualquiera).',
    mode: 'decision',
    icon: Sparkles,
    build: () => [newSlice('Sí'), newSlice('No')],
  },
  {
    key: 'savings',
    title: 'Ahorro',
    description: 'Sortea cuánto guardar y registra el movimiento en Ahorro.',
    mode: 'transaction',
    txType: 'expense',
    icon: PiggyBank,
    build: () => [
      newSlice('$50', 50, 'Inversión'),
      newSlice('$100', 100, 'Inversión'),
      newSlice('$200', 200, 'Inversión'),
      newSlice('$500', 500, 'Inversión'),
    ],
  },
  {
    key: 'treat',
    title: 'Capricho',
    description: 'Te toca un mini-presupuesto para una categoría discrecional.',
    mode: 'transaction',
    txType: 'expense',
    icon: Gift,
    build: (cats) => [
      newSlice('Comida $200', 200, cats.find((c) => c.toLowerCase() === 'comida') ?? cats[0]),
      newSlice('Entretenimiento $300', 300, cats.find((c) => c.toLowerCase().startsWith('entret')) ?? cats[0]),
      newSlice('Compras $400', 400, cats.find((c) => c.toLowerCase() === 'compras') ?? cats[0]),
      newSlice('Otros $150', 150, cats.find((c) => c.toLowerCase() === 'otros') ?? cats[0]),
    ],
  },
  {
    key: 'surplus',
    title: 'Sobrante',
    description: 'Decide qué hacer con el sobrante del mes.',
    mode: 'decision',
    icon: Coins,
    build: () => [
      newSlice('Ahorrar todo'),
      newSlice('Invertir 50%, ahorrar 50%'),
      newSlice('Cancelar deuda'),
      newSlice('Capricho responsable'),
    ],
  },
  {
    key: 'habit',
    title: 'Hábito',
    description: 'Sortea una micro-meta del día.',
    mode: 'decision',
    icon: Target,
    build: () => [
      newSlice('No Uber hoy'),
      newSlice('Registrar 3 gastos'),
      newSlice('Cocinar en casa'),
      newSlice('Cero compras impulsivas'),
      newSlice('Revisar suscripciones'),
    ],
  },
];

// === Componente principal ===

interface SheetDraft {
  id?: string;
  title: string;
  mode: WheelMode;
  txType?: TransactionType;
  slices: WheelSlice[];
}

export const Wheels: React.FC = () => {
  const { wheels, deleteWheel, settings } = useFinance();
  const [draft, setDraft] = useState<SheetDraft | null>(null);
  const [picking, setPicking] = useState(false);
  const [spinningId, setSpinningId] = useState<string | null>(null);
  const spinningWheel = useMemo(
    () => wheels.find((w) => w.id === spinningId) ?? null,
    [wheels, spinningId]
  );

  return (
    <div className="space-y-4">
      <header className="bg-white rounded-3xl border border-zinc-200/70 shadow-sm p-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Ruletas
          </h2>
          <p className="text-sm font-semibold text-zinc-900 mt-0.5">
            {wheels.length === 0
              ? 'Crea tu primera ruleta'
              : `${wheels.length} ${wheels.length === 1 ? 'ruleta' : 'ruletas'}`}
          </p>
          <p className="text-[11px] text-zinc-500 leading-relaxed mt-1 max-w-[280px]">
            Decisiones, ahorro, caprichos o hábitos — gira y deja que el azar elija.
          </p>
        </div>
        <button
          onClick={() => setPicking(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 active:bg-zinc-700 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
        >
          <Plus size={14} />
          Crear
        </button>
      </header>

      {wheels.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-200/70 shadow-sm p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-50 mb-3">
            <Disc3 className="text-zinc-300" size={26} />
          </div>
          <p className="text-sm font-semibold text-zinc-900">Sin ruletas creadas</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-[280px] mx-auto leading-relaxed">
            Toca "Crear" y elige una plantilla, o arma una desde cero.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AnimatePresence initial={false}>
            {wheels.map((w) => (
              <motion.li
                key={w.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-3xl border border-zinc-200/70 shadow-sm overflow-hidden flex flex-col"
              >
                <button
                  onClick={() => {
                    tap();
                    setSpinningId(w.id);
                  }}
                  className="text-left p-5 hover:bg-zinc-50 active:bg-zinc-100 transition-colors cursor-pointer focus:outline-none focus-visible:bg-zinc-50 flex-1"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={cn(
                        'inline-flex items-center justify-center w-8 h-8 rounded-xl',
                        w.mode === 'transaction'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-zinc-100 text-zinc-700'
                      )}
                    >
                      <Disc3 size={16} />
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-900 truncate flex-1">
                      {w.title}
                    </h3>
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-md font-medium',
                        w.mode === 'transaction'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-zinc-100 text-zinc-600'
                      )}
                    >
                      {w.mode === 'transaction'
                        ? w.txType === 'income'
                          ? 'Ingreso'
                          : 'Gasto'
                        : 'Decisión'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    {w.slices.length} casillas · toca para girar
                  </p>
                </button>
                <div className="flex items-center gap-1 px-3 pb-3">
                  <button
                    onClick={() =>
                      setDraft({
                        id: w.id,
                        title: w.title,
                        mode: w.mode,
                        txType: w.txType,
                        slices: w.slices,
                      })
                    }
                    aria-label="Editar"
                    className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`¿Eliminar la ruleta "${w.title}"?`)) {
                        deleteWheel(w.id);
                      }
                    }}
                    aria-label="Eliminar"
                    className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <AnimatePresence>
        {picking && (
          <PresetPicker
            onPick={(preset) => {
              setPicking(false);
              setDraft({
                title: preset.title,
                mode: preset.mode,
                txType: preset.txType,
                slices: preset.build(settings.categories),
              });
            }}
            onClose={() => setPicking(false)}
          />
        )}
        {draft && <WheelSheet initial={draft} onClose={() => setDraft(null)} />}
        {spinningWheel && (
          <SpinView wheel={spinningWheel} onClose={() => setSpinningId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

// === Sheet: picker de plantilla ===

const PresetPicker: React.FC<{
  onPick: (preset: WheelPreset) => void;
  onClose: () => void;
}> = ({ onPick, onClose }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <SheetShell onClose={onClose} title="Nueva ruleta" subtitle="Elige una plantilla para empezar">
      <div className="grid grid-cols-1 gap-2">
        {PRESETS.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.key}
              onClick={() => onPick(p)}
              className="text-left p-4 rounded-2xl bg-zinc-50 hover:bg-zinc-100 active:bg-zinc-200 transition-colors flex items-start gap-3 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
            >
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 border border-zinc-200">
                <Icon size={18} className="text-zinc-700" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-zinc-900">{p.title}</h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed mt-0.5">{p.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </SheetShell>
  );
};

// === Sheet: editor unificado (crear + editar) ===

const WheelSheet: React.FC<{ initial: SheetDraft; onClose: () => void }> = ({ initial, onClose }) => {
  const { upsertWheel, settings } = useFinance();
  const [title, setTitle] = useState(initial.title);
  const [mode, setMode] = useState<WheelMode>(initial.mode);
  const [txType, setTxType] = useState<TransactionType>(initial.txType ?? 'expense');
  const [slices, setSlices] = useState<WheelSlice[]>(initial.slices);
  const [saving, setSaving] = useState(false);
  const isCreating = !initial.id;

  const symbol = getCurrencySymbol(settings.currency);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const updateSlice = (id: string, patch: Partial<WheelSlice>) => {
    setSlices((arr) => arr.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };
  const removeSlice = (id: string) => {
    setSlices((arr) => (arr.length > 2 ? arr.filter((s) => s.id !== id) : arr));
  };
  const addSlice = () => {
    if (slices.length >= 24) return;
    setSlices((arr) => [...arr, newSlice('Nueva opción')]);
  };

  const valid =
    title.trim().length > 0 &&
    slices.length >= 2 &&
    slices.length <= 24 &&
    slices.every((s) => s.label.trim().length > 0);

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      const cleaned: WheelSlice[] = slices.map((s) => ({
        id: s.id,
        label: s.label.trim(),
        ...(mode === 'transaction' && typeof s.value === 'number' && s.value > 0
          ? { value: s.value }
          : {}),
        ...(mode === 'transaction' && s.category ? { category: s.category } : {}),
        ...(typeof s.weight === 'number' && s.weight > 0 && s.weight !== 1
          ? { weight: s.weight }
          : {}),
      }));
      await upsertWheel({
        id: initial.id,
        title: title.trim(),
        mode,
        txType: mode === 'transaction' ? txType : undefined,
        slices: cleaned,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SheetShell
      onClose={onClose}
      title={isCreating ? 'Nueva ruleta' : 'Editar ruleta'}
      subtitle={`${slices.length} casillas · personaliza antes de guardar`}
    >
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1 block">
            Nombre
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={60}
            className="mt-1 w-full px-3.5 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 focus:bg-white focus:ring-4 focus:ring-zinc-900/5 transition-all text-sm"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1 block mb-2">
            Modo
          </label>
          <div role="tablist" className="relative grid grid-cols-2 gap-1 p-1 bg-zinc-100 rounded-xl">
            {(
              [
                { id: 'decision' as const, label: 'Decisión' },
                { id: 'transaction' as const, label: 'Transacción' },
              ]
            ).map(({ id, label }) => {
              const active = mode === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMode(id)}
                  className={cn(
                    'relative py-2 rounded-lg text-sm font-medium z-10 transition-colors cursor-pointer',
                    active ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-800'
                  )}
                >
                  {label}
                  {active && (
                    <motion.span
                      layoutId="wheel-mode-pill"
                      aria-hidden
                      className="absolute inset-0 rounded-lg bg-white shadow-sm -z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {mode === 'transaction' && (
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1 block mb-2">
              Tipo de transacción
            </label>
            <div role="tablist" className="relative grid grid-cols-2 gap-1 p-1 bg-zinc-100 rounded-xl">
              {(['expense', 'income'] as const).map((t) => {
                const active = txType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTxType(t)}
                    className={cn(
                      'relative py-2 rounded-lg text-sm font-medium z-10 transition-colors cursor-pointer',
                      active ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-800'
                    )}
                  >
                    {t === 'expense' ? 'Gasto' : 'Ingreso'}
                    {active && (
                      <motion.span
                        layoutId="wheel-txtype-pill"
                        aria-hidden
                        className="absolute inset-0 rounded-lg bg-white shadow-sm -z-10"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">
              Casillas ({slices.length})
            </label>
            <button
              type="button"
              onClick={addSlice}
              disabled={slices.length >= 24}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-xs font-semibold text-zinc-700 disabled:opacity-50 cursor-pointer"
            >
              <Plus size={12} />
              Añadir
            </button>
          </div>
          <ul className="space-y-2">
            {slices.map((s, i) => (
              <li
                key={s.id}
                className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-semibold text-zinc-400 num w-5">
                    {i + 1}.
                  </span>
                  <input
                    type="text"
                    value={s.label}
                    onChange={(e) => updateSlice(s.id, { label: e.target.value })}
                    placeholder="Etiqueta"
                    maxLength={60}
                    className="flex-1 min-w-0 px-3 py-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5 transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeSlice(s.id)}
                    disabled={slices.length <= 2}
                    aria-label="Eliminar"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {mode === 'transaction' && (
                  <div className="grid grid-cols-2 gap-2 pl-7">
                    <div className="flex items-center bg-white border border-zinc-200 rounded-lg overflow-hidden">
                      <span className="pl-2.5 pr-1 text-xs text-zinc-400 num">{symbol}</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        value={s.value ?? ''}
                        onChange={(e) =>
                          updateSlice(s.id, {
                            value: e.target.value === '' ? undefined : Number(e.target.value),
                          })
                        }
                        placeholder="Monto"
                        className="w-full py-2 pr-2 bg-transparent focus:outline-none text-xs num"
                      />
                    </div>
                    <select
                      value={s.category ?? ''}
                      onChange={(e) =>
                        updateSlice(s.id, { category: e.target.value || undefined })
                      }
                      className="px-2 py-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900 text-xs cursor-pointer"
                    >
                      <option value="">— sin categoría —</option>
                      {settings.categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={save}
          disabled={!valid || saving}
          className="w-full py-3.5 rounded-2xl bg-zinc-900 text-white font-semibold shadow-lg shadow-black/10 hover:bg-zinc-800 active:bg-zinc-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Check size={16} />
          {saving ? 'Guardando…' : isCreating ? 'Crear ruleta' : 'Guardar cambios'}
        </button>
      </div>
    </SheetShell>
  );
};

// === Sheet shell (compartido) ===

const SheetShell: React.FC<{
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ onClose, title, subtitle, children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-zinc-900/40 backdrop-blur-sm"
    onClick={onClose}
  >
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 380, damping: 36 }}
      className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl pb-[env(safe-area-inset-bottom)] max-h-[92dvh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-zinc-100 px-5 py-4 flex items-center justify-between z-10">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-zinc-900 truncate">{title}</h3>
          {subtitle && <p className="text-[11px] text-zinc-500 truncate">{subtitle}</p>}
        </div>
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  </motion.div>
);

// === Spin view ===

const CHART_COLORS = [
  '#4b5741', // zinc-900
  '#688e59', // emerald-500
  '#b7846d', // red-500
  '#c79a58', // amber-500
  '#b9ad98', // blue-500
  '#a5938d', // violet-500
  '#c49ba0', // pink-500
  '#8b7f70', // zinc-500
];

interface PolarPoint {
  x: number;
  y: number;
}
const polar = (deg: number, r: number, cx = 0, cy = 0): PolarPoint => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const SpinView: React.FC<{ wheel: Wheel; onClose: () => void }> = ({ wheel, onClose }) => {
  const { addTransaction, recordWheelSpin, settings } = useFinance();
  const reduceMotion = useReducedMotion();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<WheelSlice | null>(null);
  const [creating, setCreating] = useState(false);

  // Compute angles for each slice based on weights.
  const totalWeight = wheel.slices.reduce(
    (acc, s) => acc + (typeof s.weight === 'number' && s.weight > 0 ? s.weight : 1),
    0
  );
  const sliceAngles = useMemo(() => {
    let cursor = 0;
    return wheel.slices.map((s) => {
      const weight = typeof s.weight === 'number' && s.weight > 0 ? s.weight : 1;
      const span = (weight / totalWeight) * 360;
      const start = cursor;
      const end = cursor + span;
      cursor = end;
      return { slice: s, start, end, center: start + span / 2 };
    });
  }, [wheel.slices, totalWeight]);

  const symbol = getCurrencySymbol(settings.currency);

  const spin = () => {
    if (spinning) return;
    setResult(null);
    setSpinning(true);
    tap();

    // Sorteo ponderado.
    const r = Math.random() * totalWeight;
    let acc = 0;
    let winnerIdx = 0;
    for (let i = 0; i < wheel.slices.length; i++) {
      const w =
        typeof wheel.slices[i].weight === 'number' && (wheel.slices[i].weight as number) > 0
          ? (wheel.slices[i].weight as number)
          : 1;
      acc += w;
      if (r <= acc) {
        winnerIdx = i;
        break;
      }
    }
    const winner = sliceAngles[winnerIdx];

    // Random jitter dentro del slice (evita siempre caer en el centro).
    const span = winner.end - winner.start;
    const jitter = (Math.random() - 0.5) * span * 0.6;
    const targetWithinSlice = winner.center + jitter;

    // Rotación final: extras enteros + lo que falte para que el centro quede arriba.
    const extras = reduceMotion ? 0 : 360 * 5;
    const currentMod = ((rotation % 360) + 360) % 360;
    const desired = (360 - targetWithinSlice) % 360;
    const delta = (desired - currentMod + 360) % 360;
    const final = rotation + extras + delta;

    setRotation(final);

    const duration = reduceMotion ? 0 : 4000;
    setTimeout(() => {
      setSpinning(false);
      setResult(winner.slice);
      success();
      recordWheelSpin(wheel.id, winner.slice.id);
    }, duration + 50);
  };

  const handleCreateTx = async () => {
    if (!result || wheel.mode !== 'transaction' || !wheel.txType || !result.value) return;
    setCreating(true);
    try {
      await addTransaction({
        amount: result.value,
        type: wheel.txType,
        category: result.category || settings.categories[0],
        description: `${wheel.title} — ${result.label}`,
        date: new Date().toISOString(),
      });
      success();
      onClose();
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !spinning) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, spinning]);

  // SVG layout
  const SIZE = 320;
  const R = 150;
  const CX = SIZE / 2;
  const CY = SIZE / 2;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur-sm flex flex-col items-center justify-between p-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]"
    >
      <div className="w-full max-w-md flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
            {wheel.mode === 'transaction'
              ? wheel.txType === 'income'
                ? 'Sortea ingreso'
                : 'Sortea gasto'
              : 'Decisión'}
          </p>
          <h2 className="text-lg font-bold text-white truncate">{wheel.title}</h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Cerrar"
          disabled={spinning}
          className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-40 cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>

      <div className="relative flex items-center justify-center">
        {/* Pointer */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-white drop-shadow-lg" />

        <motion.div
          animate={{ rotate: rotation }}
          transition={{ duration: spinning ? 4 : 0, ease: [0.18, 0.85, 0.18, 1] }}
          style={{ width: SIZE, height: SIZE }}
          className="relative"
        >
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            <defs>
              <radialGradient id="wheel-shine" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.04)" />
                <stop offset="80%" stopColor="rgba(255,255,255,0)" />
              </radialGradient>
            </defs>
            <circle cx={CX} cy={CY} r={R + 6} fill="white" />
            {sliceAngles.map((sa, i) => {
              const start = polar(sa.start, R, CX, CY);
              const end = polar(sa.end, R, CX, CY);
              const span = sa.end - sa.start;
              const largeArc = span > 180 ? 1 : 0;
              const path = `M ${CX} ${CY} L ${start.x} ${start.y} A ${R} ${R} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
              const labelPos = polar(sa.center, R * 0.65, CX, CY);
              const color = CHART_COLORS[i % CHART_COLORS.length];
              const textColor = ['#FFFFFF'][0]; // todos blanco para legibilidad
              const labelText =
                sa.slice.label.length > 12
                  ? sa.slice.label.slice(0, 12) + '…'
                  : sa.slice.label;
              return (
                <g key={sa.slice.id}>
                  <path d={path} fill={color} stroke="white" strokeWidth={2} />
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    fill={textColor}
                    fontSize="12"
                    fontWeight="700"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${sa.center} ${labelPos.x} ${labelPos.y})`}
                    style={{ pointerEvents: 'none' }}
                  >
                    {labelText}
                  </text>
                </g>
              );
            })}
            <circle cx={CX} cy={CY} r={R} fill="url(#wheel-shine)" pointerEvents="none" />
            <circle cx={CX} cy={CY} r={20} fill="white" stroke="#4b5741" strokeWidth={3} />
            <circle cx={CX} cy={CY} r={6} fill="#4b5741" />
          </svg>
        </motion.div>
      </div>

      <div className="w-full max-w-md space-y-3">
        <AnimatePresence mode="wait">
          {result && !spinning ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-3xl p-5 shadow-2xl"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Resultado
              </p>
              <p className="text-2xl font-bold text-zinc-900 mt-1 break-words">
                {result.label}
              </p>
              {wheel.mode === 'transaction' && typeof result.value === 'number' && (
                <p className="text-sm text-zinc-500 num mt-1">
                  {symbol}
                  {formatCurrency(result.value, settings.currency).replace(symbol, '')}
                  {result.category && <span className="text-zinc-400"> · {result.category}</span>}
                </p>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={spin}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-zinc-100 text-zinc-700 text-sm font-semibold hover:bg-zinc-200 active:bg-zinc-300 transition-colors cursor-pointer"
                >
                  <RotateCw size={14} />
                  Otra vez
                </button>
                {wheel.mode === 'transaction' &&
                  wheel.txType &&
                  typeof result.value === 'number' &&
                  result.value > 0 && (
                    <button
                      onClick={handleCreateTx}
                      disabled={creating}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-zinc-900 text-white text-sm font-semibold shadow-lg shadow-black/20 hover:bg-zinc-800 active:bg-zinc-700 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      <Check size={14} strokeWidth={2.5} />
                      {creating ? 'Registrando…' : 'Registrar'}
                    </button>
                  )}
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="spin"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={spin}
              disabled={spinning}
              className="w-full py-4 rounded-2xl bg-white text-zinc-900 font-bold shadow-2xl hover:bg-zinc-50 active:scale-[0.98] disabled:opacity-70 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Disc3 size={18} className={spinning ? 'animate-spin' : ''} />
              {spinning ? 'Girando…' : 'Girar'}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
