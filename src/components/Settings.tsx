import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { 
  LogOut, 
  Tag, 
  Coins, 
  ChevronRight, 
  Check, 
  TrendingUp, 
  ShieldCheck, 
  Globe, 
  Zap, 
  Bell, 
  Moon, 
  Sun, 
  Smartphone, 
  Download, 
  Trash2, 
  MessageSquare, 
  Star,
  Lock,
  Eye,
  EyeOff,
  Palette,
  CloudLightning
} from 'lucide-react';
import { cn } from '../utils';
import { CategoryManager } from './CategoryManager';
import { motion } from 'framer-motion';

const CURRENCIES = [
  { code: 'USD', label: 'Dólar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'DOP', label: 'Peso DOM' },
  { code: 'MXN', label: 'Peso MEX' },
];

const THEMES = [
  { id: 'warm', label: 'Warm', color: 'bg-[#836637]' },
  { id: 'dark', label: 'Dark', color: 'bg-zinc-900' },
  { id: 'ocean', label: 'Ocean', color: 'bg-[#2D5A27]' },
];

export const Settings: React.FC = () => {
  const { logout, user, settings } = useFinance();
  const [catOpen, setCatOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [biometrics, setBiometrics] = useState(true);

  const initials = (user?.displayName || user?.email || '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const containerVars = {
    animate: { transition: { staggerChildren: 0.05 } }
  };

  const itemVars = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVars}
      initial="initial"
      animate="animate"
      className="space-y-8 pb-20"
    >
      {/* Brand Header & Quick Profile */}
      <motion.div variants={itemVars} className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-zinc-200/50 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-brand)] via-[var(--color-action)] to-[var(--color-tech)]"></div>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-action)] rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-white p-4 rounded-3xl border border-zinc-100 shadow-sm">
              <img src="/logo.png" alt="Mona Logo" className="w-20 h-20 object-contain rounded-2xl" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-[var(--color-action)] text-white p-1.5 rounded-full border-4 border-white shadow-lg">
              <ShieldCheck size={14} />
            </div>
          </div>
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <h1 className="text-3xl font-black text-zinc-900 tracking-tight">MONA</h1>
              <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 text-[9px] font-black rounded-md uppercase tracking-[0.2em]">v2.0.4</span>
            </div>
            <p className="text-sm font-medium text-zinc-500 mt-1">
              Sesión activa de <span className="text-[var(--color-brand)] font-bold">{user?.displayName || user?.email?.split('@')[0]}</span>
            </p>
            <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
              <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                    {initials}
                  </div>
                ))}
              </div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">+ EQUIPO ALPHA</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center md:items-end gap-3">
          <div className="px-4 py-2 bg-[var(--color-bg-app)] rounded-2xl border border-zinc-200/50">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-center md:text-right">Balance Total Protegido</p>
            <p className="text-xl font-black text-[var(--color-brand)] tracking-tight">$24,500.00</p>
          </div>
          <button className="flex items-center gap-2 text-[10px] font-bold text-[var(--color-action)] uppercase tracking-widest hover:opacity-70 transition-opacity">
            <TrendingUp size={12} />
            Ver Reporte de Auditoría
          </button>
        </div>
      </motion.div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: General & Appearance */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Nodo de Infraestructura */}
          <motion.section variants={itemVars} className="space-y-4">
            <SectionHeader title="Configuración de Red" subtitle="Núcleo del sistema y sincronización" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <GridItem 
                  icon={<Coins className="text-[var(--color-brand)]" />}
                  title="Divisa de Operación"
                  desc="Afecta todos los nodos de gasto"
                  value={settings.currency}
                  action={<ChevronRight size={16} />}
               />
               <GridItem 
                  icon={<Globe className="text-sky-500" />}
                  title="Región Global"
                  desc="Sincronización de latencia"
                  value="LATAM-S1"
                  action={<ChevronRight size={16} />}
               />
               <GridItem 
                  icon={<Zap className="text-amber-500" />}
                  title="Motor Predictivo"
                  desc="Inteligencia Autónoma"
                  value="ACTIVO"
                  action={<Toggle active={true} />}
               />
               <GridItem 
                  icon={<Bell className="text-rose-500" />}
                  title="Alertas de Empuje"
                  desc="Notificaciones críticas"
                  value="SMART"
                  action={<Toggle active={true} />}
               />
            </div>
          </motion.section>

          {/* Personalización y UX */}
          <motion.section variants={itemVars} className="space-y-4">
            <SectionHeader title="Experiencia Visual" subtitle="Temas y capas de visualización" />
            <div className="bg-white p-6 rounded-[2rem] border border-zinc-200/50 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                    <Palette size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">Paleta del Sistema</p>
                    <p className="text-[10px] text-zinc-400 font-medium">Cambia la atmósfera visual</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {THEMES.map(t => (
                    <button key={t.id} className={cn("w-8 h-8 rounded-full border-2 border-white shadow-sm transition-transform active:scale-90", t.color)} />
                  ))}
                </div>
              </div>

              <div className="h-px bg-zinc-50"></div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SettingToggle 
                  icon={<Moon size={18} />} 
                  title="Modo Nocturno" 
                  desc="Optimizado para OLED"
                  active={darkMode}
                  onToggle={() => setDarkMode(!darkMode)}
                />
                <SettingToggle 
                  icon={showBalance ? <Eye size={18} /> : <EyeOff size={18} />} 
                  title="Privacidad de Saldo" 
                  desc="Ocultar montos sensibles"
                  active={!showBalance}
                  onToggle={() => setShowBalance(!showBalance)}
                />
              </div>
            </div>
          </motion.section>

          {/* Gestión de Datos */}
          <motion.section variants={itemVars} className="space-y-4">
             <SectionHeader title="Bóveda de Datos" subtitle="Exportación y mantenimiento" />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="flex items-center gap-4 p-5 bg-white border border-zinc-200/50 rounded-3xl hover:bg-zinc-50 transition-all text-left shadow-sm group">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Download size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-900">Exportar Historial</p>
                    <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">CSV / PDF / JSON</p>
                  </div>
                </button>
                <button className="flex items-center gap-4 p-5 bg-white border border-zinc-200/50 rounded-3xl hover:bg-zinc-50 transition-all text-left shadow-sm group">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CloudLightning size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-900">Sincronizar Nube</p>
                    <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Respaldo Inmediato</p>
                  </div>
                </button>
             </div>
          </motion.section>

        </div>

        {/* Right Column: Security & Actions */}
        <div className="space-y-8">
          
          {/* Seguridad Blindada */}
          <motion.section variants={itemVars} className="space-y-4">
            <SectionHeader title="Protección de Capa" subtitle="Seguridad biométrica y acceso" />
            <div className="bg-white p-6 rounded-[2rem] border border-zinc-200/50 shadow-sm space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Lock size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900">Bóveda Blindada</p>
                  <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Nivel: Militar</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <SettingToggle 
                  icon={<Smartphone size={18} />} 
                  title="FaceID / Huella" 
                  desc="Acceso instantáneo"
                  active={biometrics}
                  onToggle={() => setBiometrics(!biometrics)}
                />
                <div className="h-px bg-zinc-50"></div>
                <div className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="text-zinc-400 group-hover:text-[var(--color-brand)] transition-colors"><Lock size={18} /></div>
                    <span className="text-xs font-bold text-zinc-700">Cambiar PIN de Acceso</span>
                  </div>
                  <ChevronRight size={16} className="text-zinc-300" />
                </div>
              </div>
            </div>
          </motion.section>

          {/* Control Center Actions */}
          <motion.section variants={itemVars} className="space-y-4">
            <SectionHeader title="Acciones" subtitle="Comandos del sistema" />
            <div className="space-y-3">
              <button
                onClick={() => setCatOpen(true)}
                className="w-full flex items-center justify-between p-6 bg-white border border-zinc-200/50 rounded-[2rem] text-sm font-bold text-zinc-900 hover:bg-zinc-50 transition-all active:scale-[0.98] shadow-sm group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-[var(--color-bg-app)] group-hover:text-[var(--color-brand)] transition-colors">
                    <Tag size={20} />
                  </div>
                  <div className="text-left">
                    <span className="block">Etiquetas Globales</span>
                    <span className="text-[10px] text-zinc-400 font-normal uppercase tracking-wider">Gestión de Categorías</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-zinc-300" />
              </button>

              <button className="w-full flex items-center justify-between p-6 bg-white border border-zinc-200/50 rounded-[2rem] text-sm font-bold text-zinc-900 hover:bg-zinc-50 transition-all active:scale-[0.98] shadow-sm group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-100 group-hover:text-zinc-600 transition-colors">
                    <MessageSquare size={20} />
                  </div>
                  <div className="text-left">
                    <span className="block">Soporte y Feedback</span>
                    <span className="text-[10px] text-zinc-400 font-normal uppercase tracking-wider">Ayuda en línea 24/7</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-zinc-300" />
              </button>

              <button className="w-full flex items-center justify-between p-6 bg-white border border-zinc-200/50 rounded-[2rem] text-sm font-bold text-zinc-900 hover:bg-zinc-50 transition-all active:scale-[0.98] shadow-sm group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:text-amber-500 transition-colors">
                    <Star size={20} />
                  </div>
                  <div className="text-left">
                    <span className="block">Calificar App</span>
                    <span className="text-[10px] text-zinc-400 font-normal uppercase tracking-wider">Danos 5 estrellas</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-zinc-300" />
              </button>
            </div>
          </motion.section>

          {/* Peligro / Sesión */}
          <motion.section variants={itemVars} className="space-y-3 pt-4">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center p-6 bg-rose-50 text-rose-600 rounded-[2rem] text-[10px] font-black tracking-[0.3em] uppercase border border-rose-100 hover:bg-rose-100 transition-all active:scale-[0.98] shadow-sm"
            >
              <LogOut size={16} className="mr-3" />
              Cerrar Sesión Segura
            </button>
            <button className="w-full flex items-center justify-center p-4 text-rose-300 hover:text-rose-500 transition-colors text-[9px] font-black tracking-[0.3em] uppercase">
              <Trash2 size={12} className="mr-2" />
              Borrar Datos de Usuario
            </button>
          </motion.section>

        </div>

      </div>

      <motion.div variants={itemVars} className="flex flex-col items-center gap-3 pt-10">
        <div className="flex gap-4">
           <span className="w-2 h-2 rounded-full bg-[var(--color-brand)] opacity-20"></span>
           <span className="w-2 h-2 rounded-full bg-[var(--color-action)] opacity-20"></span>
           <span className="w-2 h-2 rounded-full bg-[var(--color-brand)] opacity-20"></span>
        </div>
        <p className="text-center text-[10px] font-mono uppercase tracking-[0.5em] text-zinc-300">
          MONA CORE ARCHITECTURE · ENCRYPTED · {new Date().getFullYear()}
        </p>
      </motion.div>

      <CategoryManager open={catOpen} onClose={() => setCatOpen(false)} />
    </motion.div>
  );
};

const SectionHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="px-6">
    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-900">{title}</h3>
    <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest mt-0.5">{subtitle}</p>
  </div>
);

const GridItem: React.FC<{ icon: React.ReactNode; title: string; desc: string; value?: string; action?: React.ReactNode }> = ({ icon, title, desc, value, action }) => (
  <div className="bg-white p-5 rounded-3xl border border-zinc-200/50 shadow-sm flex items-center justify-between group hover:border-zinc-300 transition-all">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center group-hover:scale-110 transition-transform">{icon}</div>
      <div>
        <p className="text-xs font-bold text-zinc-900">{title}</p>
        <p className="text-[10px] text-zinc-400 font-medium">{desc}</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      {value && <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-50 px-2 py-1 rounded-md">{value}</span>}
      {action}
    </div>
  </div>
);

const SettingToggle: React.FC<{ icon: React.ReactNode; title: string; desc: string; active: boolean; onToggle: () => void }> = ({ icon, title, desc, active, onToggle }) => (
  <div className="flex items-center justify-between group cursor-pointer" onClick={onToggle}>
    <div className="flex items-center gap-3">
      <div className={cn("text-zinc-400 transition-colors", active && "text-[var(--color-brand)]")}>{icon}</div>
      <div>
        <p className="text-xs font-bold text-zinc-900">{title}</p>
        <p className="text-[9px] text-zinc-400 font-medium">{desc}</p>
      </div>
    </div>
    <Toggle active={active} />
  </div>
);

const Toggle: React.FC<{ active: boolean }> = ({ active }) => (
  <div className={cn("w-10 h-5 rounded-full relative transition-colors duration-300", active ? "bg-[var(--color-action)]" : "bg-zinc-200")}>
    <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 shadow-sm", active ? "left-6" : "left-1")} />
  </div>
);



