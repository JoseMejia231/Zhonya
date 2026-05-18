import React, { useState } from 'react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../firebase';
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

/* 4-pointed star SVG icon */
const Star4 = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41Z" />
  </svg>
);

/* Bar-chart icon used in the "Panorama Financiero" bubble */
const BarChart = ({ size = 28, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
    <rect x="4" y="18" width="5" height="10" rx="1" />
    <rect x="13" y="10" width="5" height="18" rx="1" />
    <rect x="22" y="4" width="5" height="24" rx="1" />
  </svg>
);

export const Login: React.FC = () => {
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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
  const primaryCta = mode === 'signin' ? 'INICIAR SESIÓN' : 'CREAR CUENTA';

  return (
    <div className="min-h-dvh w-full flex flex-col lg:flex-row font-sans overflow-hidden" style={{ background: '#F0EDE4' }}>
      
      {/* ═══════════════════ LEFT PANEL ═══════════════════ */}
      <div className="flex-1 relative p-8 lg:p-12 flex flex-col justify-between items-center lg:items-stretch lg:min-h-dvh overflow-hidden">
        
        {/* Header — MONA brand */}
        <div className="flex items-center gap-3 w-full z-10">
          <div className="w-10 h-10 rounded-xl bg-white/70 border border-[#3C4A34]/12 flex items-center justify-center shadow-sm backdrop-blur-sm">
            <MonaMark size={24} />
          </div>
          <span className="text-[17px] font-black tracking-[0.18em] text-[#3C4A34]">MONA</span>
        </div>

        {/* ── Central artwork ── */}
        <div className="relative flex-1 flex items-center justify-center min-h-[480px]">
          <div className="relative w-[480px] h-[480px] max-w-full" style={{ aspectRatio: '1' }}>

            {/* 1. Large thin outline circle (outermost ring) */}
            <div className="absolute inset-[-30px] rounded-full border border-[#B8B19E]/50" />

            {/* 2. Dark green diamond (back, slightly offset bottom-left) */}
            <div
              className="absolute"
              style={{
                width: '370px', height: '370px',
                top: '50%', left: '50%',
                transform: 'translate(-54%, -46%) rotate(45deg)',
                background: '#5E7356',
                borderRadius: '10px',
              }}
            />

            {/* 3. Light tan/beige diamond (front, slightly offset top-right) */}
            <div
              className="absolute"
              style={{
                width: '330px', height: '330px',
                top: '50%', left: '50%',
                transform: 'translate(-46%, -54%) rotate(45deg)',
                background: '#CCC7A8',
                borderRadius: '10px',
              }}
            />

            {/* 4. White circle WITH character inside (clipped) */}
            <div
              className="absolute rounded-full overflow-hidden"
              style={{
                width: '280px', height: '280px',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                background: '#F5F3EC',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                zIndex: 10,
              }}
            >
              {/* Character illustration — clipped inside the circle */}
              <img
                src="/WhatsApp Image 2026-05-12 at 11.56.02 AM.jpeg"
                alt="Mona"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 15%',
                  mixBlendMode: 'multiply',
                }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>

            {/* ── Floating label bubbles ── */}

            {/* SEGURIDAD DE ÉLITE — top-left */}
            <div
              className="absolute z-20 rounded-full border border-[#3C4A34]/12 flex flex-col items-center justify-center backdrop-blur-md"
              style={{
                width: '150px', height: '150px',
                top: '-10px', left: '-30px',
                background: 'rgba(240,237,228,0.65)',
              }}
            >
              <span className="text-[8px] font-black tracking-[0.15em] text-[#3C4A34] text-center leading-[1.4] mb-1">SEGURIDAD<br />DE ÉLITE</span>
              <Shield size={18} className="text-[#5A6E50]" strokeWidth={1.5} />
            </div>

            {/* PANORAMA FINANCIERO TOTAL — top-right */}
            <div
              className="absolute z-20 rounded-full border border-[#3C4A34]/12 flex flex-col items-center justify-center backdrop-blur-md"
              style={{
                width: '170px', height: '170px',
                top: '30px', right: '-50px',
                background: 'rgba(240,237,228,0.65)',
              }}
            >
              <span className="text-[8px] font-black tracking-[0.15em] text-[#3C4A34] text-center leading-[1.4] mb-1">PANORAMA<br />FINANCIERO TOTAL</span>
              <BarChart size={28} className="text-[#5A6E50]" />
            </div>

            {/* IA FINANCIERA PREDICTIVA — bottom-right */}
            <div
              className="absolute z-20 rounded-full border border-[#3C4A34]/12 flex flex-col items-center justify-center backdrop-blur-md"
              style={{
                width: '145px', height: '145px',
                bottom: '10px', right: '-20px',
                background: 'rgba(240,237,228,0.65)',
              }}
            >
              <Star4 size={16} className="text-[#5A6E50] mb-1" />
              <span className="text-[8px] font-black tracking-[0.15em] text-[#3C4A34] text-center leading-[1.4]">IA FINANCIERA<br />PREDICTIVA</span>
            </div>

            {/* Decorative stars */}
            <Star4 size={18} className="absolute text-[#3C4A34]/25 top-[15%] left-[12%] z-30" />
            <Star4 size={22} className="absolute text-[#8A9B7B] bottom-[22%] right-[5%] z-30" />

            {/* Small red accent dots */}
            <div className="absolute w-[6px] h-[6px] bg-[#C94B3D] rounded-full left-[18%] bottom-[38%] z-30" />
            <div className="absolute w-[4px] h-[4px] bg-[#C94B3D] rounded-full left-[15%] bottom-[35%] z-30" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between w-full text-[9px] font-black tracking-[0.25em] text-[#3C4A34]/60 z-10">
          <span>CIFRADO E2E</span>
          <div className="flex items-center gap-2">
            <span className="w-[5px] h-[5px] rounded-full bg-[#3C4A34]" />
            <span>SISTEMA OPERATIVO</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════ RIGHT PANEL ═══════════════════ */}
      <div className="w-full lg:w-[480px] xl:w-[520px] flex items-center justify-center p-6 lg:p-10 shrink-0" style={{ background: '#E8E4D9' }}>

        <div
          className="w-full max-w-[400px] rounded-[28px] p-10 sm:p-11"
          style={{
            background: '#F6F4ED',
            boxShadow: '0 24px 48px -12px rgba(0,0,0,0.06)',
            border: '1px solid rgba(255,255,255,0.5)',
          }}
        >
          {/* Title */}
          <h2 className="text-[26px] font-medium tracking-tight mb-1" style={{ color: '#202D1E' }}>
            {mode === 'signin' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
          </h2>
          <p className="text-[13px] mb-9" style={{ color: 'rgba(32,45,30,0.55)' }}>
            {mode === 'signin' ? 'Ingresa tus datos para continuar.' : 'Únete a la nueva era financiera.'}
          </p>

          {/* Tab switcher */}
          <div className="flex gap-5 mb-9 border-b pb-2" style={{ borderColor: 'rgba(32,45,30,0.1)' }}>
            {(['signin', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className="relative pb-2 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors"
                style={{ color: mode === m ? '#202D1E' : 'rgba(32,45,30,0.35)' }}
              >
                {m === 'signin' ? 'ENTRAR' : 'UNIRSE'}
                {mode === m && (
                  <motion.div
                    layoutId="tab"
                    className="absolute bottom-[-3px] left-0 right-0 h-[2px]"
                    style={{ background: '#202D1E' }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-7">
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <label className="block text-[9px] font-black uppercase tracking-[0.18em] mb-1" style={{ color: 'rgba(32,45,30,0.5)' }}>
                    TU NOMBRE
                  </label>
                  <div className="relative pb-1" style={{ borderBottom: '1px solid rgba(32,45,30,0.15)' }}>
                    <User className="absolute left-0 top-1/2 -translate-y-1/2" size={15} strokeWidth={2} style={{ color: 'rgba(32,45,30,0.35)' }} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full pl-7 pr-3 bg-transparent text-[13px] font-medium focus:outline-none"
                      style={{ color: '#202D1E', caretColor: '#3C6B2F' }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div>
              <label className="block text-[9px] font-black uppercase tracking-[0.18em] mb-1" style={{ color: 'rgba(32,45,30,0.5)' }}>
                CORREO ELECTRÓNICO
              </label>
              <div className="relative pb-1" style={{ borderBottom: '1px solid rgba(32,45,30,0.15)' }}>
                <Mail className="absolute left-0 top-1/2 -translate-y-1/2" size={15} strokeWidth={2} style={{ color: 'rgba(32,45,30,0.35)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full pl-7 pr-3 bg-transparent text-[13px] font-medium focus:outline-none"
                  style={{ color: '#202D1E', caretColor: '#3C6B2F' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[9px] font-black uppercase tracking-[0.18em] mb-1" style={{ color: 'rgba(32,45,30,0.5)' }}>
                CONTRASEÑA
              </label>
              <div className="relative pb-1" style={{ borderBottom: '1px solid rgba(32,45,30,0.15)' }}>
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2" size={15} strokeWidth={2} style={{ color: 'rgba(32,45,30,0.35)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-7 pr-9 bg-transparent text-[13px] font-medium focus:outline-none"
                  style={{ color: '#202D1E', caretColor: '#3C6B2F' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'rgba(32,45,30,0.35)' }}
                >
                  {showPassword ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-100 flex items-center gap-2">
                <AlertCircle size={15} strokeWidth={2} className="shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={busy}
              className="w-full text-white py-3.5 rounded-xl font-bold tracking-[0.15em] text-[11px] flex items-center justify-center gap-2.5 transition-colors disabled:opacity-50 mt-5"
              style={{ background: '#324B2C', boxShadow: '0 4px 12px rgba(50,75,44,0.25)' }}
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <><span>{primaryCta}</span><ArrowRight size={15} strokeWidth={2.5} /></>}
            </button>
          </form>

          {/* Divider */}
          <div className="w-full flex items-center gap-4 my-7">
            <div className="flex-1 h-px" style={{ background: 'rgba(32,45,30,0.08)' }} />
            <span className="text-[9px] font-medium" style={{ color: 'rgba(32,45,30,0.25)' }}>o</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(32,45,30,0.08)' }} />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={busy}
            className="w-full py-3.5 rounded-xl flex items-center justify-center gap-3 transition-colors disabled:opacity-50 group"
            style={{ border: '1px solid rgba(32,45,30,0.12)', background: 'transparent' }}
          >
            {googleLoading ? <Loader2 size={15} className="animate-spin" style={{ color: 'rgba(32,45,30,0.4)' }} /> : (
              <>
                <svg width="17" height="17" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span className="text-[11px] font-bold tracking-[0.12em]" style={{ color: 'rgba(32,45,30,0.7)' }}>CONTINUAR CON GOOGLE</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
