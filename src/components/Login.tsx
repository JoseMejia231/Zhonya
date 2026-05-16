import React, { useState, useId, useMemo } from 'react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../firebase';
import {
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
import { MonaMark } from './MonaMark';

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
  { icon: Shield, title: 'Privacidad absoluta', sub: 'Cifrado de grado militar' },
  { icon: TrendingUp, title: 'Claridad total', sub: 'Tus metas, en perspectiva' },
  { icon: Sparkles, title: 'Inteligencia IA', sub: 'Insights que ahorran' },
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
  const brandId = useMemo(
    () => 'MN-' + Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + new Date().getFullYear(),
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
    <div className="min-h-dvh bg-[#EFEAE2] text-[#4b5741] relative grid lg:grid-cols-[1fr_1fr] xl:grid-cols-[1.1fr_1fr] selection:bg-[#2D5A27] selection:text-white h-dvh overflow-hidden max-md:h-auto max-md:overflow-visible font-sans">
      
      {/* Background decoration - subtle moving organic shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[#836637]/5 blur-[120px] rounded-full animate-[spin_40s_linear_infinite]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-[#2D5A27]/5 blur-[120px] rounded-full animate-[spin_50s_linear_infinite_reverse]" />
      </div>

      {/* Left Panel - Brand (Desktop Only) */}
      <aside className="hidden lg:flex flex-col justify-between p-16 xl:p-24 relative z-10">
        <div>
          <div className="flex items-center gap-4 mb-20">
            <div className="w-12 h-12 rounded-xl bg-white/40 backdrop-blur-md border border-white/50 flex items-center justify-center shadow-sm">
              <MonaMark size={32} />
            </div>
            <div>
              <div className="text-xl font-black tracking-tight text-[#4b5741]">MONA</div>
              <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 opacity-80">
                {brandId}
              </div>
            </div>
          </div>

          <div className="relative w-full max-w-2xl py-20 px-8">
            {/* Outer Larger Cloud */}
            <div className="relative w-full aspect-[16/11] group">
              {/* Lumps for Outer Cloud */}
              <div className="absolute -top-[15%] left-[10%] w-[35%] h-[50%] bg-white/40 rounded-full blur-2xl" />
              <div className="absolute -top-[25%] left-[30%] w-[45%] h-[65%] bg-white/60 rounded-full shadow-xl shadow-[#836637]/5" />
              <div className="absolute -top-[10%] left-[65%] w-[30%] h-[45%] bg-white/40 rounded-full blur-xl" />

              <div className="relative w-full h-full bg-white/30 backdrop-blur-md rounded-[5rem] border border-white/60 shadow-2xl shadow-[#836637]/10 flex items-center justify-center p-12">

                {/* Inner Cloud Container */}
                <div className="relative w-[85%] aspect-[16/10] group-hover:scale-[1.02] transition-transform duration-700">
                  {/* Lumps for Inner Cloud */}
                  <div className="absolute -top-[15%] left-[12%] w-[30%] h-[50%] bg-white rounded-full" />
                  <div className="absolute -top-[25%] left-[35%] w-[40%] h-[60%] bg-white rounded-full shadow-lg" />
                  <div className="absolute -top-[12%] left-[62%] w-[25%] h-[45%] bg-white rounded-full" />

                  <div className="relative w-full h-full bg-white rounded-[4rem] shadow-xl shadow-[#836637]/5 flex flex-col items-center justify-center text-center p-10 border border-[#ede8dc]/50">
                    <h2 className="text-4xl xl:text-5xl font-black tracking-tighter leading-tight text-[#4b5741] mb-6">
                      Domina tus <br />
                      <span className="text-[#836637]">finanzas personales.</span>
                    </h2>
                    <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#2D5A27] opacity-80">
                      Libertad en cada decisión
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">
          <span>CIFRADO E2E</span>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#2D5A27] animate-pulse" />
            <span>SISTEMA OPERATIVO</span>
          </div>
        </div>
      </aside>

      {/* Right Panel - Login Card */}
      <main className="relative flex items-center justify-center p-6 sm:p-8 z-10 max-md:py-16">
        
        {/* Main Glassmorphism Card */}
        <div className="relative w-full max-w-[440px] bg-white/20 backdrop-blur-[40px] border border-white/40 p-10 sm:p-12 rounded-[24px] shadow-[0_40px_100px_rgba(75,87,65,0.15)]">
          
          {/* Internal Brand Header (Mobile Only) */}
          <div className="text-center mb-12 lg:hidden flex flex-col items-center">
            <div className="w-16 h-16 rounded-xl bg-white/40 backdrop-blur-md border border-white/50 flex items-center justify-center shadow-sm mb-6">
              <MonaMark size={40} />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-[#4b5741] mb-2">MONA</h1>
          </div>

          <h2 className="text-3xl font-black tracking-tight text-[#4b5741] mb-2 text-center lg:text-left">
            {mode === 'signin' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
          </h2>
          <p className="text-[#4b5741]/60 text-sm font-medium mb-10 text-center lg:text-left">
            {mode === 'signin' ? 'Ingresa tus datos para continuar.' : 'Únete a la nueva era financiera.'}
          </p>

          {/* Pill Switcher (Minimalist) */}
          <div className="flex gap-4 mb-10 border-b border-[#4b5741]/10 pb-2">
            {(['signin', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`pb-2 text-[11px] font-black uppercase tracking-[0.2em] transition-colors relative ${
                  mode === m ? 'text-[#2D5A27]' : 'text-zinc-500 hover:text-[#4b5741]'
                }`}
              >
                {m === 'signin' ? 'Entrar' : 'Unirse'}
                {mode === m && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-[-3px] left-0 right-0 h-[2px] bg-[#2D5A27]"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-8">
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#4b5741]/70 mb-2">
                    Tu nombre
                  </label>
                  <div className="relative">
                    <User className="absolute left-0 top-1/2 -translate-y-1/2 text-[#4b5741]/40" size={18} strokeWidth={1.5} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Jane Doe"
                      className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-[#2D5A27]/20 rounded-none text-sm font-semibold text-[#4b5741] placeholder:text-[#4b5741]/30 focus:border-[#2D5A27] outline-none transition-colors"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#4b5741]/70 mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-[#4b5741]/40" size={18} strokeWidth={1.5} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-[#2D5A27]/20 rounded-none text-sm font-semibold text-[#4b5741] placeholder:text-[#4b5741]/30 focus:border-[#2D5A27] outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#4b5741]/70 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-[#4b5741]/40" size={18} strokeWidth={1.5} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-8 pr-10 py-3 bg-transparent border-b border-[#2D5A27]/20 rounded-none text-sm font-semibold text-[#4b5741] placeholder:text-[#4b5741]/30 focus:border-[#2D5A27] outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-[#4b5741]/40 hover:text-[#4b5741] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50/50 text-red-700 p-4 rounded-xl border border-red-100 flex items-center gap-3">
                <AlertCircle size={18} strokeWidth={1.5} className="shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wider">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-[#2D5A27] hover:bg-[#254a20] text-white py-4 rounded-xl font-black uppercase tracking-[0.15em] text-[12px] flex items-center justify-center gap-3 transition-colors disabled:opacity-50 mt-4"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <><span>{primaryCta}</span> <ArrowRight size={18} strokeWidth={1.5} /></>}
            </button>
          </form>

          {/* Divider */}
          <div className="w-full flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-[#4b5741]/10" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#4b5741]/40">O</span>
            <div className="flex-1 h-px bg-[#4b5741]/10" />
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogle}
            disabled={busy}
            className="w-full bg-transparent border border-[#4b5741]/20 hover:border-[#4b5741]/40 py-4 rounded-xl flex items-center justify-center gap-3 transition-colors disabled:opacity-50 group"
          >
            {googleLoading ? <Loader2 size={18} className="animate-spin text-[#4b5741]/40" /> : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[#4b5741] group-hover:text-[#2D5A27]">Continuar con Google</span>
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
};
