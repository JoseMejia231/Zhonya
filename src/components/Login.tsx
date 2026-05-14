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
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from 'motion/react';
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

const DepthWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const reduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = React.useState(true);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (reduceMotion || !isMobile) return <div className={`w-full ${className || ''}`}>{children}</div>;

  return (
    <motion.div 
      initial={{ scale: 0.85, opacity: 0.4, rotateX: -20, filter: "blur(3px)", y: 15 }}
      whileInView={{ scale: 1, opacity: 1, rotateX: 0, filter: "blur(0px)", y: 0 }}
      viewport={{ margin: "-15% 0px -15% 0px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{ transformPerspective: 1000 }}
      className={`w-full ${className || ''}`}
    >
      {children}
    </motion.div>
  );
};

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

  // Subtler Infinity Path - 3% indentation to avoid clipping while keeping the aesthetic
  const infinityPath = "M 0,0 C 0.5,-0.02 0.5,-0.02 1,0 C 0.98,0.2 0.97,0.4 0.97,0.5 C 0.97,0.6 0.98,0.8 1,1 C 0.5,1.02 0.5,1.02 0,1 C 0.02,0.8 0.03,0.6 0.03,0.5 C 0.03,0.4 0.02,0.2 0,0 Z";

  return (
    <div className="min-h-dvh bg-[#F5F5F0] text-[#4b5741] relative grid lg:grid-cols-[1.1fr_1fr] xl:grid-cols-[1.2fr_1fr] selection:bg-[#2D5A27] selection:text-white h-dvh overflow-hidden max-md:h-auto max-md:overflow-visible">
      {/* Left Panel - Brand (Desktop Only) */}
      <aside className="hidden lg:flex flex-col justify-between p-16 xl:p-24 border-r border-[#ede8dc]/60 relative overflow-hidden bg-white/40 backdrop-blur-sm">
        {/* Subtle background decoration for left panel */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#836637]/5 blur-[100px] rounded-full" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-20">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#ede8dc] flex items-center justify-center shadow-sm">
              <MonaMark size={32} />
            </div>
            <div>
              <div className="text-xl font-black tracking-tight text-[#836637]">MONA</div>
              <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-400 opacity-60">
                {brandId}
              </div>
            </div>
          </div>

          <div className="max-w-md">
            <h2 className="text-6xl xl:text-7xl font-black tracking-tighter leading-[0.95] text-[#4b5741] mb-8">
              Tu futuro <br />
              <span className="text-[#836637]">empieza hoy.</span>
            </h2>
            <p className="text-lg text-zinc-500 font-medium leading-relaxed mb-12 opacity-80">
              Gestiona tus finanzas con la elegancia y simplicidad que te mereces. 
              Privacidad absoluta, control total.
            </p>

            <div className="space-y-6">
              {features.map((f, i) => (
                <div key={f.title} className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-[#ede8dc] flex items-center justify-center shrink-0 shadow-sm">
                    <f.icon size={22} className="text-[#2D5A27]" />
                  </div>
                  <div>
                    <div className="text-sm font-black uppercase tracking-wider text-[#4b5741]">{f.title}</div>
                    <div className="text-xs text-zinc-400 font-bold uppercase tracking-widest">{f.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">
          <span>CIFRADO E2E</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2D5A27] animate-pulse" />
            <span>SISTEMA OPERATIVO</span>
          </div>
        </div>
      </aside>

      {/* Right Panel - Login Card */}
      <main className="relative flex items-center justify-center p-8 overflow-hidden bg-[#F5F5F0]">
        {/* Background decoration (visible on mobile/tablet or as subtle layers on desktop) */}
        <div className="absolute top-0 left-0 w-full h-full opacity-40 pointer-events-none lg:opacity-20">
          <div className="absolute top-[-15%] left-[-15%] w-[60%] h-[60%] bg-[#836637]/10 blur-[140px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-15%] right-[-15%] w-[60%] h-[60%] bg-[#2D5A27]/10 blur-[140px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        
        {/* Main Infinity Container */}
        <div className="relative w-full max-w-[480px] z-10 filter drop-shadow-[0_30px_70px_rgba(75,87,65,0.18)]">
          {/* The Card with ClipPath */}
          <div 
            className="relative bg-white pt-28 pb-24 px-12 sm:px-14 flex flex-col items-center"
            style={{ clipPath: `url(#infinity-clip-v4)` }}
          >
            {/* Internal Brand Header (Mobile Only) */}
            <DepthWrapper>
              <div className="text-center mb-14 lg:hidden flex flex-col items-center">
                <div className="inline-flex p-4 rounded-3xl bg-[#F5F5F0] border border-[#ede8dc] mb-5 shadow-inner">
                  <MonaMark size={44} />
                </div>
                <h1 className="text-5xl font-black tracking-tight text-[#836637] mb-2">MONA</h1>
                <p className="text-[12px] font-black uppercase tracking-[0.4em] text-[#4b5741]/40">
                  Personal Wealth
                </p>
              </div>
            </DepthWrapper>

            {/* Pill Switcher */}
            <DepthWrapper>
              <div className="w-full bg-[#F5F5F0] p-1.5 rounded-full flex mb-12 border border-[#ede8dc]/80">
                {(['signin', 'signup'] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => switchMode(m)}
                    className={`relative flex-1 py-3 text-[11px] font-black uppercase tracking-[0.2em] rounded-full transition-all duration-700 ${
                      mode === m ? 'text-[#836637] bg-white shadow-xl shadow-[#836637]/5' : 'text-zinc-400 hover:text-[#4b5741]'
                    }`}
                  >
                    {m === 'signin' ? 'Entrar' : 'Unirse'}
                  </button>
                ))}
              </div>
            </DepthWrapper>

            {/* Form */}
            <form onSubmit={handleSubmit} className="w-full space-y-7">
              <AnimatePresence mode="wait">
                {mode === 'signup' && (
                  <motion.div
                    key="signup"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <DepthWrapper>
                      <label className="block text-[11px] font-black uppercase tracking-[0.25em] text-[#836637] mb-3 ml-6">
                        ¿Tu nombre?
                      </label>
                      <div className="relative group">
                        <User className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#2D5A27] transition-all duration-300" size={20} />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Escribe tu nombre..."
                          className="w-full pl-16 pr-8 py-5 bg-[#F5F5F0]/40 border-2 border-transparent rounded-[2.5rem] text-sm font-semibold focus:bg-white focus:border-[#2D5A27]/20 outline-none transition-all shadow-sm focus:shadow-md"
                        />
                      </div>
                    </DepthWrapper>
                  </motion.div>
                )}
              </AnimatePresence>

              <DepthWrapper>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-[0.25em] text-[#836637] mb-3 ml-6">
                    Correo electrónico
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#2D5A27] transition-all duration-300" size={20} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="w-full pl-16 pr-8 py-5 bg-[#F5F5F0]/40 border-2 border-transparent rounded-[2.5rem] text-sm font-semibold focus:bg-white focus:border-[#2D5A27]/20 outline-none transition-all shadow-sm focus:shadow-md"
                    />
                  </div>
                </div>
              </DepthWrapper>

              <DepthWrapper>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-[0.25em] text-[#836637] mb-3 ml-6">
                    Contraseña
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#2D5A27] transition-all duration-300" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-16 pr-16 py-5 bg-[#F5F5F0]/40 border-2 border-transparent rounded-[2.5rem] text-sm font-semibold focus:bg-white focus:border-[#2D5A27]/20 outline-none transition-all shadow-sm focus:shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </DepthWrapper>

              {error && (
                <DepthWrapper>
                  <div className="bg-red-50/80 text-red-700 p-5 rounded-[2rem] border border-red-100 flex items-center gap-4 animate-shake">
                    <AlertCircle size={20} className="shrink-0" />
                    <span className="text-[11px] font-black uppercase tracking-wider">{error}</span>
                  </div>
                </DepthWrapper>
              )}

              <DepthWrapper>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-[#2D5A27] hover:bg-[#254a20] text-white py-5 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[13px] flex items-center justify-center gap-4 transition-all shadow-2xl shadow-[#2D5A27]/25 active:scale-[0.97] disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin" /> : <><span>{primaryCta}</span> <ArrowRight size={22} /></>}
                </button>
              </DepthWrapper>
            </form>

            {/* Divider */}
            <DepthWrapper>
              <div className="w-full flex items-center gap-5 my-12">
                <div className="flex-1 h-px bg-zinc-100/80" />
                <span className="text-[9px] font-black uppercase tracking-[0.5em] text-zinc-300">OPCIONES</span>
                <div className="flex-1 h-px bg-zinc-100/80" />
              </div>
            </DepthWrapper>

            {/* Google Button */}
            <DepthWrapper>
              <button
                onClick={handleGoogle}
                disabled={busy}
                className="w-full bg-white border-2 border-[#ede8dc] hover:border-[#836637]/30 py-5 rounded-[2.5rem] flex items-center justify-center gap-4 transition-all active:scale-[0.97] disabled:opacity-50 group shadow-sm hover:shadow-md"
              >
                {googleLoading ? <Loader2 className="animate-spin text-zinc-400" /> : (
                  <>
                    <svg width="22" height="22" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span className="text-[12px] font-black uppercase tracking-[0.15em] text-zinc-600 group-hover:text-[#4b5741]">Google</span>
                  </>
                )}
              </button>
            </DepthWrapper>

            <DepthWrapper className="mt-auto pt-16">
              <p className="text-[10px] text-center text-zinc-300 font-black uppercase tracking-[0.3em] leading-relaxed max-w-[320px] mx-auto">
                {brandId} · PRIVATE · {new Date().getFullYear()}
              </p>
            </DepthWrapper>
          </div>

          {/* SVG Definition */}
          <svg width="0" height="0" className="absolute pointer-events-none">
            <defs>
              <clipPath id="infinity-clip-v4" clipPathUnits="objectBoundingBox">
                <path d={infinityPath} />
              </clipPath>
            </defs>
          </svg>
        </div>
      </main>
    </div>
  );
};
