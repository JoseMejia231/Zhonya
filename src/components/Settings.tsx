import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { 
  LogOut, 
  Tag, 
  Coins, 
  ChevronRight, 
  ShieldCheck, 
  Globe, 
  Zap, 
  Bell, 
  Moon, 
  Smartphone, 
  Download, 
  Trash2, 
  MessageSquare, 
  Star,
  Lock,
  Key,
  HelpCircle,
  Settings as SettingsIcon,
  Palette,
  Database,
  CreditCard,
  Users,
  Share2,
  FileText,
  Code,
  Terminal,
  Activity,
  CloudLightning,
  Mail,
  SmartphoneNfc,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { cn } from '../utils';
import { CategoryManager } from './CategoryManager';

type SettingsSection = 
  | 'general' | 'security' | 'appearance' 
  | 'notifications' | 'billing' | 'team' 
  | 'integrations' | 'data' | 'audit' 
  | 'api' | 'support' | 'delete_account';

export const Settings: React.FC = () => {
  const { logout, user, settings } = useFinance();
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [catOpen, setCatOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [showBalance, setShowBalance] = useState(true);
  const [biometrics, setBiometrics] = useState(true);

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const initials = (user?.displayName || user?.email || '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex flex-col lg:flex-row min-h-[800px] bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
      {/* Settings Sidebar - Professional Enterprise Layout */}
      <aside className="w-full lg:w-72 border-r border-zinc-200 bg-zinc-50/50 flex flex-col">
        <div className="p-6 border-b border-zinc-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg border border-zinc-100 flex items-center justify-center p-2 shadow-sm sidebar-logo-container">
              <img src="/logo.png" alt="Mona" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Admin Center</p>
              <h2 className="text-sm font-black text-zinc-900 uppercase tracking-tighter">Mona Console</h2>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
          {/* Section Group: Sistema */}
          <div className="space-y-1">
            <p className="px-4 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2">Sistema</p>
            <NavButton 
              active={activeSection === 'general'} 
              onClick={() => setActiveSection('general')}
              icon={<SettingsIcon size={16} />}
              label="General"
            />
            <NavButton 
              active={activeSection === 'appearance'} 
              onClick={() => setActiveSection('appearance')}
              icon={<Palette size={16} />}
              label="Apariencia"
            />
            <NavButton 
              active={activeSection === 'notifications'} 
              onClick={() => setActiveSection('notifications')}
              icon={<Bell size={16} />}
              label="Notificaciones"
            />
          </div>

          {/* Section Group: Seguridad y Accesos */}
          <div className="space-y-1">
            <p className="px-4 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2">Seguridad</p>
            <NavButton 
              active={activeSection === 'security'} 
              onClick={() => setActiveSection('security')}
              icon={<ShieldCheck size={16} />}
              label="Protección"
            />
            <NavButton 
              active={activeSection === 'team'} 
              onClick={() => setActiveSection('team')}
              icon={<Users size={16} />}
              label="Equipo"
            />
          </div>

          {/* Section Group: Negocio y Datos */}
          <div className="space-y-1">
            <p className="px-4 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2">Negocio</p>
            <NavButton 
              active={activeSection === 'billing'} 
              onClick={() => setActiveSection('billing')}
              icon={<CreditCard size={16} />}
              label="Suscripción"
            />
            <NavButton 
              active={activeSection === 'integrations'} 
              onClick={() => setActiveSection('integrations')}
              icon={<Share2 size={16} />}
              label="Integraciones"
            />
            <NavButton 
              active={activeSection === 'data'} 
              onClick={() => setActiveSection('data')}
              icon={<Database size={16} />}
              label="Bóveda de Datos"
            />
          </div>

          {/* Section Group: Avanzado */}
          <div className="space-y-1">
            <p className="px-4 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2">Avanzado</p>
            <NavButton 
              active={activeSection === 'audit'} 
              onClick={() => setActiveSection('audit')}
              icon={<FileText size={16} />}
              label="Auditoría"
            />
            <NavButton 
              active={activeSection === 'api'} 
              onClick={() => setActiveSection('api')}
              icon={<Code size={16} />}
              label="API & Webhooks"
            />
            <NavButton 
              active={activeSection === 'delete_account'} 
              onClick={() => setActiveSection('delete_account')}
              icon={<Trash2 size={16} />}
              label="Eliminar Cuenta"
            />
          </div>

          {/* Section Group: Ayuda */}
          <div className="space-y-1 pt-4 border-t border-zinc-200">
            <NavButton 
              active={activeSection === 'support'} 
              onClick={() => setActiveSection('support')}
              icon={<HelpCircle size={16} />}
              label="Ayuda y Soporte"
            />
          </div>
        </nav>

        <div className="p-4 border-t border-zinc-200 bg-white">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-white">
        {/* Unified Header */}
        <header className="px-10 py-8 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-1">Mona Infrastructure</p>
            <h1 className="text-3xl font-black text-zinc-900 uppercase tracking-tighter">
              {activeSection === 'general' && 'Panel General'}
              {activeSection === 'security' && 'Protocolos de Seguridad'}
              {activeSection === 'appearance' && 'Estética del Sistema'}
              {activeSection === 'notifications' && 'Centro de Alertas'}
              {activeSection === 'billing' && 'Plan y Facturación'}
              {activeSection === 'team' && 'Gestión de Equipo'}
              {activeSection === 'integrations' && 'Conexiones Externas'}
              {activeSection === 'data' && 'Bóveda de Información'}
              {activeSection === 'audit' && 'Registro de Auditoría'}
              {activeSection === 'api' && 'Servicios de API'}
              {activeSection === 'delete_account' && 'Eliminar Cuenta'}
              {activeSection === 'support' && 'Centro de Ayuda'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                Sistema Operativo
             </div>
             <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-black text-xs shadow-lg">
                {initials}
             </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-10 overflow-y-auto no-scrollbar">
          {activeSection === 'general' && (
            <div className="max-w-3xl space-y-12">
              <Section title="Base del Sistema" subtitle="Ajustes críticos de moneda y sincronización.">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StatusCard icon={<Coins />} label="Divisa" value={settings.currency} />
                    <StatusCard icon={<Globe />} label="Región" value="LATAM-S1" />
                 </div>
                 <div className="mt-6 space-y-4">
                    <FormToggle 
                      label="Inteligencia Artificial" 
                      description="Activación del motor de análisis predictivo." 
                      active={true} 
                    />
                    <button onClick={() => setCatOpen(true)} className="w-full flex items-center justify-between p-5 bg-zinc-50 border border-zinc-200 rounded-2xl hover:border-[var(--color-brand)] transition-all group">
                       <div className="flex items-center gap-4">
                          <Tag className="text-zinc-400 group-hover:text-[var(--color-brand)]" />
                          <span className="text-sm font-bold text-zinc-900 uppercase tracking-tight">Etiquetas Globales</span>
                       </div>
                       <ChevronRight size={18} className="text-zinc-300" />
                    </button>
                 </div>
              </Section>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="max-w-3xl space-y-10">
              <Section title="Visualización" subtitle="Gestiona el entorno estético de la aplicación.">
                <FormToggle label="Modo Nocturno" description="Optimización para entornos de poca luz." active={darkMode} onToggle={() => setDarkMode(!darkMode)} />
                <div className="mt-4">
                   <FormToggle label="Ocultar Saldo" description="Privacidad absoluta en pantallas compartidas." active={!showBalance} onToggle={() => setShowBalance(!showBalance)} />
                </div>
              </Section>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="max-w-3xl space-y-10">
              <Section title="Alertas" subtitle="Configura cómo y cuándo el sistema te informa.">
                <div className="space-y-4">
                   <NotificationItem icon={<Mail />} label="Reportes Semanales" desc="Recibe un resumen en tu correo." active />
                   <NotificationItem icon={<SmartphoneNfc />} label="Alertas de Gasto Crítico" desc="Notificación push al superar umbrales." active />
                   <NotificationItem icon={<ShieldAlert />} label="Alertas de Seguridad" desc="Aviso inmediato de accesos nuevos." active />
                </div>
              </Section>
            </div>
          )}

          {activeSection === 'billing' && (
            <div className="max-w-3xl space-y-10">
              <Section title="Suscripción" subtitle="Detalles del plan financiero activo.">
                <div className="p-8 bg-zinc-900 rounded-[2rem] text-white relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-10 opacity-10">
                      <CreditCard size={120} />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Plan Actual</p>
                   <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Mona Enterprise</h3>
                   <div className="flex items-center gap-4">
                      <span className="px-3 py-1 bg-[var(--color-action)] rounded-full text-[9px] font-black uppercase tracking-widest">Activo</span>
                      <span className="text-xs font-bold opacity-60">Próximo cobro: 12 Junio, 2026</span>
                   </div>
                   <button className="mt-8 px-6 py-3 bg-white text-zinc-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 transition-colors">
                      Gestionar Facturación
                   </button>
                </div>
              </Section>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="max-w-3xl space-y-10">
              <Section title="Protección Blindada" subtitle="Protocolos de acceso y encriptación.">
                 <div className="space-y-4">
                    <FormToggle label="Biometría" description="FaceID / Fingerprint activo." active={biometrics} onToggle={() => setBiometrics(!biometrics)} />
                    <button className="w-full flex items-center justify-between p-5 bg-white border border-zinc-200 rounded-2xl hover:bg-zinc-50 transition-all">
                       <div className="flex items-center gap-4">
                          <Key className="text-zinc-400" />
                          <span className="text-sm font-bold text-zinc-900 uppercase tracking-tight">Cambiar PIN de 4 Dígitos</span>
                       </div>
                       <ChevronRight size={18} className="text-zinc-300" />
                    </button>
                    <div className="p-6 bg-zinc-900 text-white rounded-3xl">
                       <div className="flex gap-4">
                          <ShieldCheck className="text-[var(--color-brand)]" />
                          <div>
                             <p className="text-xs font-black uppercase tracking-widest">Encriptación AES-256</p>
                             <p className="text-[10px] opacity-60 mt-1">Tus datos están blindados en el nodo local. MONA no almacena llaves de acceso en servidores externos.</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </Section>
            </div>
          )}

          {activeSection === 'team' && (
            <div className="max-w-3xl space-y-10">
              <Section title="Colaboración" subtitle="Gestiona quién tiene acceso a este nodo.">
                 <div className="bg-zinc-50 border border-zinc-200 rounded-[2rem] p-8 text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-100 shadow-sm">
                       <Users size={32} className="text-zinc-300" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">Sin Colaboradores</h3>
                    <p className="text-xs text-zinc-400 mt-2 max-w-xs mx-auto leading-relaxed">Actualmente este nodo es privado. Puedes invitar a analistas o contadores a ver tus reportes.</p>
                    <button className="mt-6 px-8 py-3 bg-[var(--color-brand)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--color-brand)]/20">
                       Invitar Miembro
                    </button>
                 </div>
              </Section>
            </div>
          )}

          {activeSection === 'integrations' && (
            <div className="max-w-3xl space-y-10">
              <Section title="Ecosistema" subtitle="Conecta Mona con otros servicios financieros.">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <IntegrationCard logo="🏦" name="Bancos Dominicanos" desc="Sincronización automática" status="Próximamente" />
                   <IntegrationCard logo="📊" name="Zapier" desc="Automatiza flujos de gasto" status="Disponible" />
                   <IntegrationCard logo="☁️" name="iCloud / Drive" desc="Respaldo automático" status="Configurar" />
                   <IntegrationCard logo="📑" name="Excel / Sheets" desc="Exportación en tiempo real" status="Disponible" />
                </div>
              </Section>
            </div>
          )}

          {activeSection === 'data' && (
            <div className="max-w-3xl space-y-10">
              <Section title="Bóveda de Datos" subtitle="Extrae o purga la información del sistema.">
                 <div className="grid grid-cols-2 gap-4 mb-8">
                    <DataButton icon={<Download />} label="Exportar JSON" />
                    <DataButton icon={<CloudLightning />} label="Forzar Sync" />
                 </div>
                 <div className="p-8 border-2 border-dashed border-rose-100 bg-rose-50/20 rounded-[2rem]">
                    <h3 className="text-sm font-black text-rose-900 uppercase tracking-widest mb-2">Acciones de Purga</h3>
                    <p className="text-xs text-rose-600/70 mb-6">Esta acción borrará permanentemente todos tus datos financieros.</p>
                    <button className="px-6 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-colors">
                       Eliminar Base de Datos
                    </button>
                 </div>
              </Section>
            </div>
          )}

          {activeSection === 'audit' && (
            <div className="max-w-3xl space-y-10">
              <Section title="Historial" subtitle="Registro cronológico de cambios en el sistema.">
                 <div className="bg-zinc-50 border border-zinc-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-[10px]">
                       <thead className="bg-white border-b border-zinc-200 uppercase font-black text-zinc-400">
                          <tr>
                             <th className="px-6 py-4">Evento</th>
                             <th className="px-6 py-4">Fecha</th>
                             <th className="px-6 py-4">IP</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-zinc-200 font-bold text-zinc-600">
                          <tr>
                             <td className="px-6 py-4">Login Exitoso</td>
                             <td className="px-6 py-4">Hoy, 18:05</td>
                             <td className="px-6 py-4 font-mono text-[9px]">192.168.1.45</td>
                          </tr>
                          <tr>
                             <td className="px-6 py-4 text-[var(--color-brand)]">Cambio de Tema</td>
                             <td className="px-6 py-4">Ayer, 21:30</td>
                             <td className="px-6 py-4 font-mono text-[9px]">192.168.1.45</td>
                          </tr>
                       </tbody>
                    </table>
                 </div>
              </Section>
            </div>
          )}

          {activeSection === 'api' && (
            <div className="max-w-3xl space-y-10">
              <Section title="Desarrolladores" subtitle="Construye sobre la infraestructura de Mona.">
                 <div className="space-y-6">
                    <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800">
                       <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Secret API Key</span>
                          <button className="text-[10px] text-[var(--color-brand)] font-black uppercase">Copiar</button>
                       </div>
                       <code className="text-emerald-500 font-mono text-xs truncate block bg-black/40 p-3 rounded-lg">
                          mn_live_4k8392jkd92ks02jd92k1...
                       </code>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <button className="p-4 border border-zinc-200 rounded-xl flex items-center justify-center gap-2 text-xs font-bold hover:bg-zinc-50 transition-colors">
                          <Terminal size={14} /> Documentación
                       </button>
                       <button className="p-4 border border-zinc-200 rounded-xl flex items-center justify-center gap-2 text-xs font-bold hover:bg-zinc-50 transition-colors">
                          <Activity size={14} /> Webhooks
                       </button>
                    </div>
                 </div>
              </Section>
            </div>
          )}

          {activeSection === 'delete_account' && (
            <div className="max-w-2xl space-y-10">
              <Section 
                title="Eliminar Cuenta de Mona" 
                subtitle="Esta acción es definitiva y borrará toda tu información de forma permanente."
              >
                <div className="p-10 border-2 border-rose-100 bg-rose-50/30 rounded-[2.5rem] flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-6">
                    <Trash2 size={40} />
                  </div>
                  <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tighter">¿Estás absolutamente seguro?</h3>
                  <div className="mt-4 space-y-4 text-sm text-zinc-600 max-w-sm">
                    <p>Al eliminar tu cuenta, se perderán de forma irreversible:</p>
                    <ul className="list-disc list-inside text-left space-y-2 opacity-80">
                      <li>Todo tu historial de transacciones.</li>
                      <li>Categorías personalizadas y etiquetas.</li>
                      <li>Configuración de seguridad y biometría.</li>
                      <li>Acceso a la API y webhooks activos.</li>
                    </ul>
                  </div>
                  
                  <div className="mt-10 flex flex-col w-full gap-3">
                    <button onClick={() => setActiveSection('general')} className="w-full py-4 bg-zinc-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-zinc-800 transition-colors">
                      Mantener mi Cuenta
                    </button>
                    <button className="w-full py-4 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/20">
                      Confirmar Eliminación Permanente
                    </button>
                  </div>
                </div>
              </Section>
            </div>
          )}

          {activeSection === 'support' && (
            <div className="max-w-3xl space-y-10">
              <Section title="Centro de Ayuda" subtitle="Asistencia técnica y operativa para tu nodo.">
                 <div className="grid grid-cols-1 gap-3">
                    <SupportCard icon={<MessageSquare />} title="Chat en Vivo" desc="Habla con soporte ahora." />
                    <SupportCard icon={<Star />} title="Feedback" desc="Sugiere una función nueva." />
                    <SupportCard icon={<ExternalLink />} title="Comunidad" desc="Únete al canal oficial." />
                 </div>
              </Section>
            </div>
          )}
        </div>
      </main>

      <CategoryManager open={catOpen} onClose={() => setCatOpen(false)} />
    </div>
  );
};

/* Internal UI Components - Reusable & Modular */

const NavButton: React.FC<{ active: boolean; icon: React.ReactNode; label: string; onClick: () => void }> = ({ active, icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-bold uppercase tracking-tight",
      active 
        ? "bg-[var(--color-brand)] text-white shadow-lg shadow-[var(--color-brand)]/20" 
        : "text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-900"
    )}
  >
    <span className={cn(active ? "text-white" : "text-zinc-400")}>{icon}</span>
    <span>{label}</span>
  </button>
);

const Section: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tighter leading-none">{title}</h2>
      <p className="text-sm text-zinc-500 mt-2 font-medium">{subtitle}</p>
    </div>
    <div className="pt-2">
      {children}
    </div>
  </div>
);

const StatusCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-white border border-zinc-100 rounded-lg flex items-center justify-center text-zinc-400">
        {React.cloneElement(icon as React.ReactElement, { size: 16 })}
      </div>
      <span className="text-xs font-bold text-zinc-900">{label}</span>
    </div>
    <span className="text-[10px] font-mono font-black uppercase bg-white px-2 py-1 border border-zinc-100 rounded-md">{value}</span>
  </div>
);

const FormToggle: React.FC<{ label: string; description: string; active: boolean; onToggle?: () => void }> = ({ label, description, active, onToggle }) => (
  <div className="flex items-center justify-between p-5 bg-white border border-zinc-200 rounded-2xl">
    <div>
      <p className="text-sm font-bold text-zinc-900 leading-none">{label}</p>
      <p className="text-xs text-zinc-400 mt-2 font-medium">{description}</p>
    </div>
    <button 
      onClick={onToggle}
      className={cn(
        "w-12 h-6 rounded-full relative transition-all duration-300",
        active ? "bg-[var(--color-action)]" : "bg-zinc-200"
      )}
    >
      <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300", active ? "left-7" : "left-1")} />
    </button>
  </div>
);


const NotificationItem: React.FC<{ icon: React.ReactNode; label: string; desc: string; active: boolean }> = ({ icon, label, desc, active }) => (
  <div className="flex items-center justify-between p-5 bg-white border border-zinc-200 rounded-2xl">
     <div className="flex items-center gap-4">
        <div className="text-zinc-400">{icon}</div>
        <div>
           <p className="text-sm font-bold text-zinc-900">{label}</p>
           <p className="text-xs text-zinc-400">{desc}</p>
        </div>
     </div>
     <div className={cn("w-2 h-2 rounded-full", active ? "bg-emerald-500" : "bg-zinc-200")} />
  </div>
);

const IntegrationCard: React.FC<{ logo: string; name: string; desc: string; status: string }> = ({ logo, name, desc, status }) => (
  <div className="p-5 bg-white border border-zinc-200 rounded-2xl hover:border-zinc-300 transition-all flex flex-col justify-between">
    <div>
      <span className="text-2xl mb-4 block">{logo}</span>
      <p className="text-sm font-black text-zinc-900 uppercase tracking-tighter">{name}</p>
      <p className="text-[10px] text-zinc-400 mt-1 font-medium leading-relaxed">{desc}</p>
    </div>
    <div className="mt-4 flex items-center justify-between">
       <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md", status === 'Disponible' ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-500')}>
          {status}
       </span>
       <ExternalLink size={12} className="text-zinc-300" />
    </div>
  </div>
);

const DataButton: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <button className="flex items-center gap-3 p-5 bg-zinc-900 text-white rounded-2xl hover:bg-[var(--color-brand)] transition-colors w-full">
     {icon}
     <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const SupportCard: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <button className="flex items-center justify-between p-5 bg-white border border-zinc-200 rounded-2xl hover:bg-zinc-50 transition-all group">
     <div className="flex items-center gap-4">
        <div className="text-zinc-400 group-hover:text-[var(--color-brand)] transition-colors">{icon}</div>
        <div className="text-left">
           <p className="text-sm font-bold text-zinc-900">{title}</p>
           <p className="text-xs text-zinc-400">{desc}</p>
        </div>
     </div>
     <ChevronRight size={18} className="text-zinc-300" />
  </button>
);
