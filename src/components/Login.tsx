import React, { useState } from 'react';
import { resetPassword, signInWithGoogle, signInWithEmail, signUpWithEmail } from '../firebase';
import {
  Shield,
  Mail,
  Lock,
  User,
  Loader2,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MonaMark } from './MonaMark';

type Mode = 'signin' | 'signup';

const palette = {
  page: '#F0EDE4',
  side: '#E8E4D9',
  card: '#F6F4ED',
  ink: '#202D1E',
  green: '#324B2C',
  moss: '#5E7356',
  sage: '#8A9B7B',
  sand: '#CCC7A8',
  line: 'rgba(32,45,30,0.14)',
  muted: 'rgba(32,45,30,0.58)',
};

const mapAuthError = (code: string): string => {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o contrase\u00f1a incorrectos.';
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con ese correo.';
    case 'auth/weak-password':
      return 'La contrase\u00f1a debe tener al menos 6 caracteres.';
    case 'auth/invalid-email':
      return 'Correo inv\u00e1lido.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Intenta m\u00e1s tarde.';
    case 'auth/popup-closed-by-user':
      return 'Cerraste la ventana de Google antes de terminar.';
    case 'auth/network-request-failed':
      return 'Sin conexi\u00f3n. Verifica tu internet.';
    default:
      return 'Algo sali\u00f3 mal. Intenta de nuevo.';
  }
};

const Star4 = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41Z" />
  </svg>
);

const BarChart = ({ size = 28, className = '' }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    className={className}
  >
    <rect x="4" y="18" width="5" height="10" rx="1" />
    <rect x="13" y="10" width="5" height="18" rx="1" />
    <rect x="22" y="4" width="5" height="24" rx="1" />
    <path d="M5 14l6-5 5 4 9-10" />
  </svg>
);

export const Login: React.FC = () => {
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!email.trim()) {
      setError('Escribe tu correo electr\u00f3nico.');
      return;
    }
    if (!password) {
      setError('Escribe tu contrase\u00f1a.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setError('La contrase\u00f1a debe tener al menos 6 caracteres.');
      return;
    }

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
    setNotice(null);
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
    setNotice(null);
  };

  const handlePasswordReset = async () => {
    setError(null);
    setNotice(null);
    const targetEmail = email.trim();
    if (!targetEmail) {
      setError('Escribe tu correo para enviarte el enlace.');
      return;
    }

    setResetLoading(true);
    try {
      await resetPassword(targetEmail);
      setNotice('Te enviamos un enlace para restablecer tu contrase\u00f1a.');
    } catch (err) {
      setError(mapAuthError((err as { code?: string })?.code ?? ''));
    } finally {
      setResetLoading(false);
    }
  };

  const busy = submitting || googleLoading || resetLoading;
  const primaryCta = mode === 'signin' ? 'INICIAR SESI\u00d3N' : 'CREAR CUENTA';

  return (
    <main className="relative min-h-dvh w-full overflow-hidden lg:h-dvh lg:min-h-0 font-sans text-[#202D1E] bg-[#F0EDE4]">
      {/* Desktop split background */}
      <div 
        className="absolute inset-0 hidden lg:block z-0"
        style={{
          background:
            'radial-gradient(circle at 18% 18%, rgba(94,115,86,0.12), transparent 28%), radial-gradient(circle at 52% 64%, rgba(204,199,168,0.20), transparent 30%), linear-gradient(90deg, #F0EDE4 0%, #F3F0E8 60%, #E8E4D9 60%, #E8E4D9 100%)',
        }}
      />
      {/* Mobile uniform background */}
      <div 
        className="absolute inset-0 lg:hidden z-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(94,115,86,0.12), transparent 70%)',
        }}
      />

      <div className="relative z-10 flex min-h-dvh w-full flex-col lg:h-full lg:min-h-0 lg:flex-row">
        {/* Decorative Graphic Section (Hidden on mobile) */}
        <section className="relative hidden lg:flex min-h-[360px] flex-1 flex-col justify-between overflow-hidden px-6 py-7 sm:px-10 lg:min-h-0 lg:px-[clamp(36px,4.5vw,64px)] lg:py-9">
          <div className="pointer-events-none absolute left-[8%] top-[19%] h-[32dvh] w-[32dvh] rounded-full bg-[#CCC7A8]/18 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[12%] right-[6%] h-[40dvh] w-[40dvh] rounded-full bg-[#5E7356]/10 blur-3xl" />

          <div className="relative z-30 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#3C4A34]/10 bg-white/55 shadow-sm backdrop-blur-sm">
              <MonaMark size={23} />
            </div>
            <span className="text-[14px] font-extrabold uppercase tracking-[0.16em] text-[#202D1E]">MONA</span>
          </div>

          <div className="relative z-10 flex flex-1 items-center justify-center py-8 lg:py-0">
            <div className="relative aspect-square w-[min(84vw,500px)] sm:w-[min(74vw,540px)] lg:w-[min(48vw,76dvh,540px)] lg:translate-x-[1%]">
              <div className="absolute inset-[-7%] rounded-full border border-[#B8B19E]/55" />
              <div className="absolute -left-[8%] bottom-[10%] h-[31%] w-[31%] rounded-[34%] bg-[#5E7356] opacity-90" />
              <div className="absolute right-[-3%] top-[18%] h-[32%] w-[32%] rounded-full bg-[#CBD4C0]/55 blur-[1px]" />

              <div
                className="absolute left-1/2 top-1/2 h-[80%] w-[80%] -translate-x-[54%] -translate-y-[46%] rotate-45 rounded-[10px] opacity-80"
                style={{ background: palette.moss }}
              />
              <div
                className="absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-[46%] -translate-y-[54%] rotate-45 rounded-[10px] opacity-90"
                style={{ background: palette.sand }}
              />
              <div className="absolute left-1/2 top-1/2 z-10 h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full bg-[#F5F3EC] shadow-[0_16px_36px_rgba(32,45,30,0.08)]">
                <img
                  src="/WhatsApp Image 2026-05-12 at 11.56.02 AM.jpeg"
                  alt="Mona"
                  className="h-full w-full object-cover mix-blend-multiply"
                  style={{ objectPosition: 'center center' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>

              <div className="absolute left-[-2%] top-[10%] z-20 flex h-[30%] w-[30%] flex-col items-center justify-center rounded-full border border-[#3C4A34]/10 bg-[#F0EDE4]/70 text-center backdrop-blur-md">
                <span className="mb-2 text-[clamp(7px,1.2vw,10px)] font-black uppercase leading-tight tracking-[0.12em] text-[#202D1E]">
                  Seguridad<br />de elite
                </span>
                <Shield size={22} className="text-[#5A6E50]" strokeWidth={1.6} />
              </div>

              <div className="absolute right-[-8%] top-[16%] z-20 flex h-[34%] w-[34%] flex-col items-center justify-center rounded-full border border-[#3C4A34]/10 bg-[#F0EDE4]/68 text-center backdrop-blur-md">
                <span className="mb-2 text-[clamp(7px,1.15vw,10px)] font-black uppercase leading-tight tracking-[0.12em] text-[#202D1E]">
                  Panorama<br />financiero total
                </span>
                <BarChart size={34} className="text-[#5A6E50]" />
              </div>

              <div className="absolute bottom-[13%] right-[-2%] z-20 flex h-[29%] w-[29%] flex-col items-center justify-center rounded-full border border-[#3C4A34]/10 bg-[#F0EDE4]/68 text-center backdrop-blur-md">
                <Star4 size={20} className="mb-2 text-[#5A6E50]" />
                <span className="text-[clamp(7px,1.12vw,10px)] font-black uppercase leading-tight tracking-[0.12em] text-[#202D1E]">
                  IA financiera<br />predictiva
                </span>
              </div>

              <Star4 size={24} className="absolute bottom-[18%] left-[10%] z-30 text-[#D5CCAA]" />
              <Star4 size={27} className="absolute bottom-[28%] right-[5%] z-30 text-[#5A6E50]" />
              <div className="absolute bottom-[34%] left-[10%] z-30 h-1.5 w-1.5 rounded-full bg-[#C94B3D]" />
              <div className="absolute bottom-[32%] left-[12%] z-30 h-1 w-1 rounded-full bg-[#C94B3D]" />
            </div>
          </div>

          <div className="relative z-30 flex items-center justify-between text-[8px] font-black uppercase tracking-[0.25em] text-[#202D1E]/65 sm:text-[9px]">
            <span>Cifrado E2E</span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#202D1E]" />
              Sistema operativo
            </span>
          </div>
        </section>

        {/* Login Form Section */}
        <aside className="relative flex min-h-dvh w-full shrink-0 items-center justify-center px-5 py-6 lg:h-full lg:min-h-0 lg:w-[clamp(440px,36vw,540px)] lg:px-10">
          <div className="pointer-events-none absolute right-[4%] top-[18%] hidden h-[38dvh] w-[38dvh] rounded-full bg-[#836637]/8 blur-3xl lg:block" />
          <div
            className="relative w-full max-w-[335px] mx-auto rounded-[22px] px-7 py-7 sm:max-w-[360px] sm:px-9 sm:py-8 lg:px-9 lg:py-9"
            style={{
              background: palette.card,
              boxShadow: '0 24px 52px -22px rgba(32,45,30,0.22)',
              border: '1px solid rgba(255,255,255,0.58)',
            }}
          >
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#3C4A34]/10 bg-white/60 shadow-sm">
                <MonaMark size={23} />
              </div>
              <span className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#202D1E]">MONA</span>
            </div>

            <h1 className="mb-1 text-[22px] font-extrabold leading-tight tracking-[-0.035em] text-[#202D1E] sm:text-[24px]">
              {mode === 'signin' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
            </h1>
            <p className="mb-6 text-[11px] font-medium text-[#202D1E]/60 sm:mb-7">
              {mode === 'signin' ? 'Accede a tu panel financiero MONA.' : '\u00danete a tu nuevo centro financiero.'}
            </p>

            <div className="mb-6 flex gap-2 rounded-xl border border-[#202D1E]/10 bg-white/25 p-1 sm:mb-7">
              {(['signin', 'signup'] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className="relative flex-1 overflow-hidden rounded-lg px-3 py-2 text-[9px] font-black uppercase tracking-[0.16em] transition-colors"
                  style={{ color: mode === m ? palette.ink : 'rgba(32,45,30,0.38)' }}
                >
                  {mode === m && (
                    <motion.span
                      layoutId="login-tab"
                      className="absolute inset-0 rounded-lg bg-white shadow-sm"
                    />
                  )}
                  <span className="relative z-10">{m === 'signin' ? 'Entrar' : 'Unirse'}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence mode="wait">
                {mode === 'signup' && (
                  <motion.div
                    key="name"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <FieldLabel htmlFor="login-name">Tu nombre</FieldLabel>
                    <div className="relative border-b border-[#202D1E]/15 pb-2 transition-colors focus-within:border-[#324B2C]">
                      <User className="absolute left-0 top-1/2 -translate-y-1/2 text-[#202D1E]/42" size={15} strokeWidth={2} />
                      <input
                        id="login-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jane Doe"
                        autoComplete="name"
                        className="w-full bg-transparent pl-7 pr-3 text-[12px] font-semibold text-[#202D1E] outline-none placeholder:text-[#202D1E]/45"
                        style={{ caretColor: palette.green }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <FieldLabel htmlFor="login-email">{'Correo electr\u00f3nico'}</FieldLabel>
                <div className="relative border-b border-[#202D1E]/15 pb-2 transition-colors focus-within:border-[#324B2C]">
                  <Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-[#202D1E]/42" size={15} strokeWidth={2} />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    autoComplete="email"
                    required
                    className="w-full bg-transparent pl-7 pr-3 text-[12px] font-semibold text-[#202D1E] outline-none placeholder:text-[#202D1E]/45"
                    style={{ caretColor: palette.green }}
                  />
                </div>
              </div>

              <div>
                <FieldLabel htmlFor="login-password">{'Contrase\u00f1a'}</FieldLabel>
                <div className="relative border-b border-[#202D1E]/15 pb-2 transition-colors focus-within:border-[#324B2C]">
                  <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-[#202D1E]/42" size={15} strokeWidth={2} />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    minLength={mode === 'signup' ? 6 : undefined}
                    required
                    className="w-full bg-transparent pl-7 pr-8 text-[12px] font-semibold text-[#202D1E] outline-none placeholder:text-[#202D1E]/45"
                    style={{ caretColor: palette.green }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-[#202D1E]/42 transition-colors hover:text-[#202D1E]"
                    aria-label={showPassword ? 'Ocultar contrase\u00f1a' : 'Mostrar contrase\u00f1a'}
                  >
                    {showPassword ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
                  </button>
                </div>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    disabled={busy}
                    className="mt-2 text-[9px] font-black uppercase tracking-[0.16em] text-[#324B2C]/70 transition-colors hover:text-[#324B2C] disabled:opacity-50"
                  >
                    {resetLoading ? 'Enviando...' : 'Olvid\u00e9 mi contrase\u00f1a'}
                  </button>
                )}
              </div>

              {notice && (
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-emerald-700">
                  <span className="text-[9px] font-bold uppercase tracking-wider">{notice}</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-red-600">
                  <AlertCircle size={15} strokeWidth={2} className="shrink-0" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-[11px] py-3.5 text-[10px] font-black uppercase tracking-[0.15em] text-white shadow-[0_14px_24px_rgba(50,75,44,0.22)] transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
                style={{ background: palette.green }}
              >
                {submitting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <>
                    <span>{primaryCta}</span>
                    <ArrowRight size={14} strokeWidth={2.5} />
                  </>
                )}
              </button>
            </form>

            <div className="my-7 flex w-full items-center gap-4">
              <div className="h-px flex-1 bg-[#202D1E]/10" />
              <span className="text-[9px] font-semibold text-[#202D1E]/30">o</span>
              <div className="h-px flex-1 bg-[#202D1E]/10" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy}
              className="flex w-full items-center justify-center gap-3 rounded-[11px] border border-[#202D1E]/14 bg-transparent py-3.5 text-[10px] font-black uppercase tracking-[0.13em] text-[#202D1E]/72 transition-colors hover:bg-white/35 disabled:pointer-events-none disabled:opacity-50"
            >
              {googleLoading ? (
                <Loader2 size={15} className="animate-spin text-[#202D1E]/45" />
              ) : (
                <>
                  <GoogleIcon />
                  <span>Continuar con Google</span>
                </>
              )}
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
};

const FieldLabel: React.FC<{ children: React.ReactNode; htmlFor: string }> = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="mb-2 block text-[8px] font-black uppercase tracking-[0.21em] text-[#202D1E]/55">
    {children}
  </label>
);

const GoogleIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);
