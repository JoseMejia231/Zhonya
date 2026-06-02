import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  LogOut,
  Tag,
  ChevronRight,
  Bell,
  BellOff,
  Moon,
  Eye,
  FileText,
  HelpCircle,
  Settings as SettingsIcon,
  Palette,
  Database,
  Wallet,
  User as UserIcon,
  Check,
  Smartphone,
  Share,
  Clock,
  AlertTriangle,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { cn, getCurrencySymbol } from '../utils';
import { CategoryManager } from './CategoryManager';
import { BudgetsEditor } from './BudgetsEditor';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { getDefaultNotifyTime, setDefaultNotifyTime } from '../utils/localPrefs';
import { CHANGELOG } from '../changelog';

type SettingsSection =
  | 'profile'
  | 'general'
  | 'budgets'
  | 'appearance'
  | 'notifications'
  | 'data'
  | 'about';

const SECTIONS: readonly SettingsSection[] = [
  'profile',
  'general',
  'budgets',
  'appearance',
  'notifications',
  'data',
  'about',
] as const;

// Monedas soportadas. DOP es el default del proyecto (peso dominicano).
const CURRENCY_OPTIONS: Array<{ code: string; name: string }> = [
  { code: 'DOP', name: 'Peso dominicano' },
  { code: 'USD', name: 'Dólar estadounidense' },
  { code: 'EUR', name: 'Euro' },
  { code: 'MXN', name: 'Peso mexicano' },
];

const SECTION_TITLES: Record<SettingsSection, string> = {
  profile: 'Perfil',
  general: 'Preferencias',
  budgets: 'Presupuestos',
  appearance: 'Apariencia',
  notifications: 'Notificaciones',
  data: 'Tus datos',
  about: 'Acerca de MONA',
};

export const Settings: React.FC = () => {
  const {
    logout,
    user,
    settings,
    updateSettings,
    transactions,
    notificationStatus,
    enableNotifications,
    wipeAllData,
  } = useFinance();
  const [activeSection, setActiveSectionRaw] = useState<SettingsSection>('profile');
  const [catOpen, setCatOpen] = useState(false);
  const [enablingPush, setEnablingPush] = useState(false);
  const { installable, installed, isIOS, promptInstall } = usePWAInstall();
  const contentPanelRef = React.useRef<HTMLDivElement>(null);
  const [defaultNotify, setDefaultNotifyState] = useState<string>(() =>
    getDefaultNotifyTime(user?.uid)
  );
  // Re-leer cuando entra un user nuevo (login), porque la preferencia es per-uid.
  React.useEffect(() => {
    setDefaultNotifyState(getDefaultNotifyTime(user?.uid));
  }, [user?.uid]);

  const handleDefaultNotifyChange = (value: string) => {
    if (!value || !user?.uid) return;
    setDefaultNotifyState(value);
    setDefaultNotifyTime(user.uid, value);
  };

  const selectSection = (section: SettingsSection, scrollToContent = false) => {
    setActiveSectionRaw(section);
    if (!scrollToContent || !window.matchMedia('(max-width: 1023px)').matches) return;
    window.requestAnimationFrame(() => {
      contentPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const darkMode = settings.theme === 'dark';
  const toggleDarkMode = () => updateSettings({ theme: darkMode ? 'light' : 'dark' });
  const hideBalance = !!settings.hideBalance;
  const toggleHideBalance = () => updateSettings({ hideBalance: !hideBalance });

  const handleEnablePush = async () => {
    if (enablingPush || notificationStatus === 'granted') return;
    setEnablingPush(true);
    await enableNotifications();
    setEnablingPush(false);
  };

  // Descarga genérica vía Blob. Evita dependencias externas.
  const downloadBlob = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const today = new Date().toISOString().slice(0, 10);

  const exportCSV = () => {
    const headers = ['fecha', 'tipo', 'categoria', 'descripcion', 'monto', 'moneda'];
    const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = transactions.map((t) =>
      [t.date, t.type, t.category, t.description || '', t.amount, t.currency || settings.currency]
        .map(escape)
        .join(',')
    );
    // BOM para que Excel lea bien los acentos.
    const csv = '﻿' + [headers.join(','), ...rows].join('\n');
    downloadBlob(csv, `mona-transacciones-${today}.csv`, 'text/csv;charset=utf-8');
  };

  const initials = (user?.displayName || user?.email || '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const navItems: Array<{ section: SettingsSection; icon: React.ReactNode; label: string }> = [
    { section: 'profile', icon: <UserIcon size={16} />, label: 'Perfil' },
    { section: 'general', icon: <SettingsIcon size={16} />, label: 'Preferencias' },
    { section: 'budgets', icon: <Wallet size={16} />, label: 'Presupuestos' },
    { section: 'appearance', icon: <Palette size={16} />, label: 'Apariencia' },
    { section: 'notifications', icon: <Bell size={16} />, label: 'Notificaciones' },
    { section: 'data', icon: <Database size={16} />, label: 'Tus datos' },
    { section: 'about', icon: <HelpCircle size={16} />, label: 'Acerca de' },
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-[800px] bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 border-r border-zinc-200 bg-zinc-50/50 flex-col">
        <div className="p-6 border-b border-zinc-200 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg border border-zinc-100 flex items-center justify-center p-2 shadow-sm sidebar-logo-container">
              <img src="/logo.png" alt="MONA" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">
                MONA
              </p>
              <h2 className="text-sm font-black text-zinc-900 uppercase tracking-tighter">
                Configuración
              </h2>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1 no-scrollbar">
          {navItems.map((item) => (
            <NavButton
              key={item.section}
              active={activeSection === item.section}
              onClick={() => selectSection(item.section)}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-200 bg-white dark:bg-zinc-900">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-white dark:bg-zinc-900">
        <header className="px-5 sm:px-10 py-5 sm:py-8 border-b border-zinc-100 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-1">
              MONA · Ajustes
            </p>
            <h1 className="text-xl sm:text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter truncate">
              {SECTION_TITLES[activeSection]}
            </h1>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--color-brand)] text-white flex items-center justify-center font-black text-xs shadow-lg shrink-0 overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
        </header>

        <div
          ref={contentPanelRef}
          className="flex-1 p-5 sm:p-10 overflow-y-auto no-scrollbar scroll-mt-24"
        >
          {activeSection === 'profile' && (
            <div className="max-w-3xl space-y-10">
              <Section title="Tu cuenta" subtitle="Sesión iniciada con tu cuenta de Google.">
                <div className="flex items-center gap-4 p-5 bg-zinc-50 border border-zinc-200 rounded-2xl">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--color-brand)] text-white flex items-center justify-center font-black text-base overflow-hidden shrink-0">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="min-w-0">
                    {user?.displayName && (
                      <p className="text-sm font-bold text-zinc-900 truncate">{user.displayName}</p>
                    )}
                    <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                  </div>
                </div>
              </Section>
            </div>
          )}

          {activeSection === 'general' && (
            <div className="max-w-3xl space-y-10">
              <Section title="Moneda" subtitle="Divisa predeterminada para nuevos movimientos y totales.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CURRENCY_OPTIONS.map((c) => {
                    const active = settings.currency === c.code;
                    return (
                      <button
                        key={c.code}
                        onClick={() => updateSettings({ currency: c.code })}
                        className={cn(
                          'flex items-center justify-between p-4 rounded-2xl border transition-all text-left active:scale-[0.99]',
                          active
                            ? 'bg-[var(--color-action)]/8 border-[var(--color-action)]/40'
                            : 'bg-zinc-50 border-zinc-200 hover:border-[var(--color-action)]/30'
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              'w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs num shrink-0',
                              active
                                ? 'bg-[var(--color-action)] text-white'
                                : 'bg-white border border-zinc-200 text-zinc-500'
                            )}
                          >
                            {getCurrencySymbol(c.code)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-zinc-900">{c.code}</p>
                            <p className="text-[11px] text-zinc-500 truncate">{c.name}</p>
                          </div>
                        </div>
                        {active && (
                          <Check size={16} className="text-[var(--color-action)] shrink-0" strokeWidth={3} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </Section>

              <Section title="Categorías" subtitle="Administra tus categorías de ingresos y gastos.">
                <button
                  onClick={() => setCatOpen(true)}
                  className="w-full flex items-center justify-between p-5 bg-zinc-50 border border-zinc-200 rounded-2xl hover:border-[var(--color-brand)] transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <Tag className="text-zinc-400 group-hover:text-[var(--color-brand)]" size={20} />
                    <span className="text-sm font-bold text-zinc-900">Editar categorías</span>
                  </div>
                  <ChevronRight size={18} className="text-zinc-300" />
                </button>
              </Section>
            </div>
          )}

          {activeSection === 'budgets' && (
            <div className="max-w-3xl space-y-8">
              <Section
                title="Presupuesto mensual"
                subtitle="Asigna un tope por categoría de gasto. Aparece en tu panel."
              >
                <BudgetsEditor />
              </Section>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="max-w-3xl space-y-10">
              <Section title="Visualización" subtitle="Ajusta cómo se ve la aplicación.">
                <FormToggle
                  icon={<Moon size={18} />}
                  label="Modo oscuro"
                  description="Tema oscuro para ambientes de poca luz."
                  active={darkMode}
                  onToggle={toggleDarkMode}
                />
                <div className="mt-4">
                  <FormToggle
                    icon={<Eye size={18} />}
                    label="Ocultar saldo"
                    description="Difumina los montos en el panel. También se alterna con el ojo del balance."
                    active={hideBalance}
                    onToggle={toggleHideBalance}
                  />
                </div>
              </Section>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="max-w-3xl space-y-10">
              <Section
                title="Recordatorios push"
                subtitle="Avisos de tus gastos fijos cuando llega la fecha de pago."
              >
                <PushPanel
                  status={notificationStatus}
                  busy={enablingPush}
                  onEnable={handleEnablePush}
                />
              </Section>

              <Section
                title="Hora por defecto"
                subtitle="Se aplica al crear nuevos gastos o ingresos fijos. Los existentes mantienen su hora."
              >
                <div className="flex items-center gap-3 p-5 bg-white border border-zinc-200 rounded-2xl">
                  <Clock size={18} className="text-zinc-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-900 leading-none">Hora preferida</p>
                    <p className="text-xs text-zinc-400 mt-1.5 font-medium">
                      Pre-rellena la hora del recordatorio al añadir una recurrencia nueva.
                    </p>
                  </div>
                  <input
                    type="time"
                    value={defaultNotify}
                    onChange={(e) => handleDefaultNotifyChange(e.target.value)}
                    className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold num focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 transition-all"
                  />
                </div>
              </Section>
            </div>
          )}

          {activeSection === 'data' && (
            <div className="max-w-3xl space-y-10">
              <Section
                title="Exportar"
                subtitle="Descarga tus movimientos para abrirlos en Excel u hojas de cálculo."
              >
                <DataButton
                  icon={<FileText size={18} />}
                  label="Exportar transacciones (CSV)"
                  sub={`${transactions.length} movimientos`}
                  onClick={exportCSV}
                />
              </Section>

              <Section
                title="Zona de riesgo"
                subtitle="Acciones destructivas e irreversibles. Procede con cuidado."
              >
                <WipePanel onWipe={wipeAllData} />
              </Section>
            </div>
          )}

          {activeSection === 'about' && (
            <div className="max-w-3xl space-y-8">
              {(installable || installed || isIOS) && (
                <Section title="Instalar app" subtitle="Usá MONA como una app, con su propio ícono.">
                  {installed ? (
                    <div className="flex items-center gap-3 p-5 bg-[var(--color-action)]/8 border border-[var(--color-action)]/30 rounded-2xl">
                      <div className="w-9 h-9 rounded-xl bg-[var(--color-action)] text-white flex items-center justify-center shrink-0">
                        <Check size={16} strokeWidth={3} />
                      </div>
                      <p className="text-sm font-bold text-[var(--color-action)]">App instalada</p>
                    </div>
                  ) : installable ? (
                    <div className="p-5 bg-white border border-zinc-200 rounded-2xl">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-zinc-400">
                          <Smartphone size={18} />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-zinc-900">Agregar a tu dispositivo</p>
                          <p className="text-xs text-zinc-400 mt-1">
                            Acceso directo, pantalla completa y notificaciones.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={promptInstall}
                        className="w-full py-3 bg-[var(--color-brand)] text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[var(--color-brand-hover)] transition-colors active:scale-[0.99]"
                      >
                        Instalar app
                      </button>
                    </div>
                  ) : (
                    <div className="p-5 bg-white border border-zinc-200 rounded-2xl">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-zinc-400">
                          <Smartphone size={18} />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-zinc-900">Agregar a tu iPhone o iPad</p>
                          <p className="text-xs text-zinc-400 mt-1">
                            Desde Safari, instálala en dos pasos.
                          </p>
                        </div>
                      </div>
                      <ol className="space-y-2.5">
                        <li className="flex items-center gap-3 text-xs text-zinc-600">
                          <span className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center font-black text-[11px] text-zinc-500 shrink-0">
                            1
                          </span>
                          <span className="flex items-center gap-1.5 flex-wrap">
                            Toca
                            <Share size={14} className="text-[var(--color-brand)]" />
                            Compartir en la barra de Safari.
                          </span>
                        </li>
                        <li className="flex items-center gap-3 text-xs text-zinc-600">
                          <span className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center font-black text-[11px] text-zinc-500 shrink-0">
                            2
                          </span>
                          <span>
                            Elige <span className="font-bold text-zinc-900">«Agregar a inicio»</span>.
                          </span>
                        </li>
                      </ol>
                    </div>
                  )}
                </Section>
              )}
              <Section title="Acerca de MONA" subtitle="Tu app de finanzas personales.">
                <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 bg-white rounded-xl border border-zinc-100 flex items-center justify-center p-2 shadow-sm shrink-0">
                        <img src="/logo.png" alt="MONA" className="w-full h-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-zinc-900 uppercase tracking-tight">MONA</p>
                        <p className="text-[11px] text-zinc-500">Finanzas personales · PWA</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-white border border-zinc-200 rounded-lg px-2.5 py-1 num shrink-0">
                      v{__APP_VERSION__}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Registra ingresos y gastos, define metas de ahorro con rachas, gastos fijos con
                    recordatorios y presupuestos por categoría. Tus datos se sincronizan de forma
                    privada en tu cuenta.
                  </p>
                </div>
              </Section>

              <Section title="Cambios recientes" subtitle="Lo nuevo desde la última versión.">
                <div className="space-y-3">
                  {CHANGELOG.map((entry, idx) => (
                    <div
                      key={`${entry.date}-${idx}`}
                      className="p-4 bg-white border border-zinc-200 rounded-2xl"
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <p className="text-sm font-bold text-zinc-900">{entry.title}</p>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 num shrink-0">
                          {entry.date}
                        </span>
                      </div>
                      {entry.details && entry.details.length > 0 && (
                        <ul className="space-y-1 ml-1">
                          {entry.details.map((d, i) => (
                            <li
                              key={i}
                              className="text-[11px] text-zinc-500 leading-relaxed flex items-start gap-2"
                            >
                              <Sparkles size={10} className="text-[var(--color-brand)] mt-1 shrink-0" />
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}
        </div>

        {/* Mobile navigation */}
        <div className="lg:hidden px-6 pb-4 pt-6">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavButton
                key={item.section}
                active={activeSection === item.section}
                onClick={() => selectSection(item.section, true)}
                icon={item.icon}
                label={item.label}
              />
            ))}
          </nav>
        </div>

        <div className="lg:hidden px-6 pb-8 pt-2">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-2xl transition-colors text-[11px] font-black uppercase tracking-[0.2em]"
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </main>

      <CategoryManager open={catOpen} onClose={() => setCatOpen(false)} />
    </div>
  );
};

/* Internal UI Components */

const NavButton: React.FC<{ active: boolean; icon: React.ReactNode; label: string; onClick: () => void }> = ({
  active,
  icon,
  label,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={cn(
      'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-bold uppercase tracking-tight',
      active
        ? 'bg-[var(--color-brand)] text-white shadow-lg shadow-[var(--color-brand)]/20'
        : 'text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-900'
    )}
  >
    <span className={cn(active ? 'text-white' : 'text-zinc-400')}>{icon}</span>
    <span>{label}</span>
  </button>
);

const Section: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({
  title,
  subtitle,
  children,
}) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-none">
        {title}
      </h2>
      <p className="text-sm text-zinc-500 mt-2 font-medium">{subtitle}</p>
    </div>
    <div className="pt-2">{children}</div>
  </div>
);

const FormToggle: React.FC<{
  icon?: React.ReactNode;
  label: string;
  description: string;
  active: boolean;
  onToggle?: () => void;
}> = ({ icon, label, description, active, onToggle }) => (
  <div className="flex items-center justify-between gap-4 p-5 bg-white dark:bg-zinc-900 border border-zinc-200 rounded-2xl">
    <div className="flex items-center gap-4 min-w-0">
      {icon && <span className="text-zinc-400 shrink-0">{icon}</span>}
      <div className="min-w-0">
        <p className="text-sm font-bold text-zinc-900 dark:text-white leading-none">{label}</p>
        <p className="text-xs text-zinc-400 mt-2 font-medium">{description}</p>
      </div>
    </div>
    <button
      onClick={onToggle}
      aria-pressed={active}
      className={cn(
        'w-12 h-6 rounded-full relative transition-all duration-300 shrink-0',
        active ? 'bg-[var(--color-action)]' : 'bg-zinc-200'
      )}
    >
      <div
        className={cn(
          'absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300',
          active ? 'left-7' : 'left-1'
        )}
      />
    </button>
  </div>
);

const PushPanel: React.FC<{
  status: NotificationPermission | 'unsupported';
  busy: boolean;
  onEnable: () => void;
}> = ({ status, busy, onEnable }) => {
  if (status === 'unsupported') {
    return (
      <div className="flex items-start gap-3 p-5 bg-zinc-50 border border-zinc-200 rounded-2xl">
        <BellOff size={18} className="text-zinc-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-bold text-zinc-900">No disponible aquí</p>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            Este dispositivo o navegador no soporta notificaciones push. Instala la app en tu
            teléfono para recibir recordatorios.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'granted') {
    return (
      <div className="flex items-center gap-3 p-5 bg-[var(--color-action)]/8 border border-[var(--color-action)]/30 rounded-2xl">
        <div className="w-9 h-9 rounded-xl bg-[var(--color-action)] text-white flex items-center justify-center shrink-0">
          <Check size={16} strokeWidth={3} />
        </div>
        <div>
          <p className="text-sm font-bold text-[var(--color-action)]">Notificaciones activadas</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Recibirás recordatorios de tus gastos fijos.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="flex items-start gap-3 p-5 bg-amber-50 border border-amber-200 rounded-2xl">
        <BellOff size={18} className="text-amber-700 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-bold text-amber-800">Bloqueadas en el navegador</p>
          <p className="text-xs text-amber-700/80 mt-1 leading-relaxed">
            Activa las notificaciones para este sitio desde los ajustes de tu navegador y vuelve a
            intentar.
          </p>
        </div>
      </div>
    );
  }

  // 'default': aún no se pidió permiso.
  return (
    <div className="p-5 bg-white border border-zinc-200 rounded-2xl">
      <div className="flex items-center gap-4 mb-4">
        <span className="text-zinc-400">
          <Bell size={18} />
        </span>
        <div>
          <p className="text-sm font-bold text-zinc-900">Activar recordatorios</p>
          <p className="text-xs text-zinc-400 mt-1">
            Te avisamos cuando toca pagar un gasto fijo.
          </p>
        </div>
      </div>
      <button
        onClick={onEnable}
        disabled={busy}
        className="w-full py-3 bg-[var(--color-action)] text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[var(--color-action-hover)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
      >
        {busy ? 'Activando…' : 'Activar notificaciones'}
      </button>
    </div>
  );
};

const DataButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  sub: string;
  onClick: () => void;
}> = ({ icon, label, sub, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-start gap-3 p-5 bg-zinc-50 border border-zinc-200 rounded-2xl hover:border-[var(--color-brand)] transition-all w-full text-left active:scale-[0.99]"
  >
    <div className="w-10 h-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center text-[var(--color-brand)]">
      {icon}
    </div>
    <div>
      <p className="text-sm font-bold text-zinc-900">{label}</p>
      <p className="text-[11px] text-zinc-500 mt-0.5">{sub}</p>
    </div>
  </button>
);

const WIPE_CONFIRM_WORD = 'BORRAR';

const WipePanel: React.FC<{ onWipe: () => Promise<void> }> = ({ onWipe }) => {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const matches = confirm === WIPE_CONFIRM_WORD;

  const reset = () => {
    setOpen(false);
    setConfirm('');
  };

  const handleConfirm = async () => {
    if (!matches || busy) return;
    setBusy(true);
    try {
      await onWipe();
      reset();
    } catch {
      // El context ya muestra el toast de error. Mantenemos el modal abierto
      // por si el usuario quiere reintentar.
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-start gap-4 p-5 w-full bg-red-50 border border-red-200 rounded-2xl text-left hover:border-red-400 transition-all active:scale-[0.99]"
      >
        <div className="w-10 h-10 rounded-xl bg-white border border-red-100 flex items-center justify-center text-red-600 shrink-0">
          <Trash2 size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-red-700">Empezar de cero</p>
          <p className="text-[11px] text-red-600/80 mt-0.5 leading-relaxed">
            Borra transacciones, metas, recurrencias, ruletas y tokens push. Las
            categorías y la moneda vuelven a los valores por defecto.
          </p>
        </div>
      </button>
    );
  }

  return (
    <div className="p-5 bg-red-50 border border-red-200 rounded-2xl space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
          <AlertTriangle size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-red-900">Esto no se puede deshacer.</p>
          <p className="text-[11px] text-red-700/90 mt-1 leading-relaxed">
            Para confirmar, escribe <span className="font-bold">{WIPE_CONFIRM_WORD}</span> abajo
            y pulsa el botón rojo.
          </p>
        </div>
      </div>
      <input
        type="text"
        autoFocus
        value={confirm}
        onChange={(e) => setConfirm(e.target.value.toUpperCase())}
        placeholder={WIPE_CONFIRM_WORD}
        className="w-full px-4 py-3 bg-white border border-red-300 rounded-xl text-sm font-bold tracking-widest text-center focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
        disabled={busy}
      />
      <div className="flex gap-2">
        <button
          onClick={reset}
          disabled={busy}
          className="flex-1 py-3 bg-white text-zinc-700 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-50 border border-zinc-200 transition-colors disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          disabled={!matches || busy}
          className="flex-1 py-3 bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy ? 'Borrando…' : 'Borrar todo'}
        </button>
      </div>
    </div>
  );
};
