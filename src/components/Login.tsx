import React, { useState, useId, useMemo } from 'react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../firebase';
import {
  Wallet,
  Shield,
  Sparkles,
  TrendingUp,
  Mail,
  Lock,
  User,
  Loader2,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

type Mode = 'signin' | 'signup';

const mapAuthError = (code: string): string => {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o contraseña incorrectos.';
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con ese correo.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/invalid-email':
      return 'Correo inválido.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Intenta más tarde.';
    case 'auth/popup-closed-by-user':
      return 'Cerraste la ventana de Google antes de terminar.';
    case 'auth/network-request-failed':
      return 'Sin conexión. Verifica tu internet.';
    default:
      return 'Algo salió mal. Intenta de nuevo.';
  }
};

const features = [
  { icon: Shield, title: 'Privacidad primero', sub: 'Cifrado extremo a extremo' },
  { icon: TrendingUp, title: 'Claridad financiera', sub: 'Cada movimiento, a la vista' },
  { icon: Sparkles, title: 'Asistencia con IA', sub: 'Insights automáticos' },
];

export const Login: React.FC = () => {
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const reduceMotion = useReducedMotion();
  const emailId = useId();
  const pwId = useId();
  const nameId = useId();

  const brandId = useMemo(
    () => 'ZC-' + Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + new Date().getFullYear(),
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email.trim(), password);
      } else {
        await signUpWithEmail(email.trim(), password, name.trim() || undefined);
      }
    } catch (err) {
      setError(mapAuthError((err as { code?: string })?.code ?? ''));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(mapAuthError((err as { code?: string })?.code ?? ''));
    } finally {
      setGoogleLoading(false);
    }
  };

  const switchMode = (next: Mode) => {
    if (mode === next) return;
    setMode(next);
    setError(null);
  };

  const busy = submitting || googleLoading;
  const primaryCta = mode === 'signin' ? 'Iniciar sesión' : 'Crear cuenta';

  return (
    <div className="min-h-dvh bg-[#F4F4F5] text-zinc-900 relative overflow-hidden selection:bg-black selection:text-white">
      {/* Subtle ambient accents — very low opacity to stay minimal */}
      {!reduceMotion && (
        <>
          <motion.div
            aria-hidden
            className="absolute -top-40 -left-40 w-[36rem] h-[36rem] rounded-full bg-emerald-500/[0.05] blur-[120px]"
            animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden
            className="absolute -bottom-40 -right-40 w-[36rem] h-[36rem] rounded-full bg-zinc-900/[0.04] blur-[140px]"
            animate={{ x: [0, -20, 0], y: [0, -30, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}

      <div className="relative z-10 min-h-dvh grid lg:grid-cols-[1.1fr_1fr] xl:grid-cols-[1.2fr_1fr]">
        {/* Brand panel — desktop only */}
        <motion.aside
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex flex-col justify-between p-12 xl:p-16 border-r border-black/5"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-black flex items-center justify-center shadow-lg shadow-black/10">
              <Wallet className="text-white" size={22} />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight">Zhonyas Wallet</div>
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400">{brandId}</div>
            </div>
          </div>

          <div className="space-y-10 max-w-lg">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-black/5 text-zinc-600 text-[11px] font-medium mb-6">
                <span className="relative flex h-1.5 w-1.5">
                  {!reduceMotion && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
                  )}
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                Tus finanzas, con calma
              </div>
              <h1 className="text-5xl xl:text-6xl font-bold tracking-tight leading-[1.05] text-zinc-900">
                Control financiero
                <br />
                <span className="text-zinc-400">sin el ruido.</span>
              </h1>
              <p className="mt-5 text-zinc-500 text-base leading-relaxed">
                Zhonyas Wallet organiza tus ingresos y gastos en una interfaz clara, rápida y privada. Sin suscripciones
                confusas, sin dark patterns.
              </p>
            </div>

            <ul className="space-y-5">
              {features.map((f, i) => (
                <motion.li
                  key={f.title}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-black/5 flex items-center justify-center shrink-0">
                    <f.icon size={18} className="text-zinc-900" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">{f.title}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{f.sub}</div>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-zinc-400">
            <span>Cifrado E2E</span>
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-emerald-500" />
              Servicio operativo
            </span>
          </div>
        </motion.aside>

        {/* Auth panel */}
        <main className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm"
          >
            {/* Mobile brand */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center shadow-lg shadow-black/10">
                  <Wallet className="text-white" size={22} />
                </div>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Zhonyas Wallet</h1>
              <p className="text-sm text-zinc-500 mt-1">Tu gestor financiero personal</p>
            </div>

            {/* Card */}
            <div className="relative bg-white border border-black/5 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/5">
              {/* Tab switcher with animated pill */}
              <div
                role="tablist"
                aria-label="Modo de autenticación"
                className="relative flex bg-zinc-100 rounded-2xl p-1 mb-6"
              >
                {(['signin', 'signup'] as Mode[]).map((m) => (
                  <button
                    key={m}
                    role="tab"
                    aria-selected={mode === m}
                    type="button"
                    onClick={() => switchMode(m)}
                    className={`relative flex-1 py-2 text-sm font-semibold rounded-xl transition-colors z-10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/40 ${
                      mode === m ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    {m === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'}
                    {mode === m && (
                      <motion.span
                        layoutId="tab-pill"
                        aria-hidden
                        className="absolute inset-0 rounded-xl bg-white shadow-sm -z-10"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-3" noValidate>
                <AnimatePresence initial={false}>
                  {mode === 'signup' && (
                    <motion.div
                      key="name-field"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <FieldLabel htmlFor={nameId}>Nombre</FieldLabel>
                      <InputShell icon={User}>
                        <input
                          id={nameId}
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="¿Cómo te llamas?"
                          autoComplete="name"
                          className={inputClass}
                        />
                      </InputShell>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <FieldLabel htmlFor={emailId}>Correo</FieldLabel>
                  <InputShell icon={Mail}>
                    <input
                      id={emailId}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      required
                      autoComplete="email"
                      inputMode="email"
                      className={inputClass}
                    />
                  </InputShell>
                </div>

                <div>
                  <FieldLabel htmlFor={pwId}>
                    <span>Contraseña</span>
                    {mode === 'signup' && (
                      <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                        mín. 6
                      </span>
                    )}
                  </FieldLabel>
                  <InputShell icon={Lock}>
                    <input
                      id={pwId}
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/40 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </InputShell>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      role="alert"
                      aria-live="polite"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-2 text-red-600 text-xs bg-red-50 border border-red-100 rounded-xl px-3 py-2.5"
                    >
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  disabled={busy}
                  whileTap={busy ? undefined : { scale: 0.985 }}
                  className="group relative w-full mt-2 py-3.5 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 bg-black hover:bg-zinc-800 shadow-lg shadow-black/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:ring-zinc-900"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <span>{primaryCta}</span>
                      <ArrowRight
                        size={16}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </>
                  )}
                </motion.button>
              </form>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-zinc-200" />
                <span className="text-[10px] uppercase font-semibold tracking-[0.2em] text-zinc-400">
                  o continúa
                </span>
                <div className="flex-1 h-px bg-zinc-200" />
              </div>

              <motion.button
                type="button"
                onClick={handleGoogle}
                disabled={busy}
                whileTap={busy ? undefined : { scale: 0.985 }}
                className="w-full py-3.5 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:ring-zinc-900/40"
              >
                {googleLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Continuar con Google
                  </>
                )}
              </motion.button>

              <p className="mt-6 text-center text-[11px] text-zinc-400 leading-relaxed">
                Al continuar aceptas el uso de cookies esenciales para autenticación.
              </p>
            </div>

            {/* Footer microcopy */}
            <div className="mt-6 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400">
              <span>v1.0</span>
              <span className="flex items-center gap-1.5">
                <Shield size={10} />
                TLS · Firebase Auth
              </span>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

/* ───── Subcomponents ───── */

const inputClass =
  'w-full pl-10 pr-11 py-3 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none';

const FieldLabel: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
  <label
    htmlFor={htmlFor}
    className="flex items-center justify-between mb-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500"
  >
    {children}
  </label>
);

const InputShell: React.FC<{
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}> = ({ icon: Icon, children }) => (
  <div className="relative group">
    <Icon
      size={15}
      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors z-10"
    />
    <div className="rounded-2xl bg-zinc-50 border border-zinc-200 transition-all group-focus-within:border-zinc-900 group-focus-within:bg-white group-focus-within:ring-4 group-focus-within:ring-zinc-900/5">
      {children}
    </div>
  </div>
);
