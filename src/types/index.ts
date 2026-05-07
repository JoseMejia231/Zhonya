export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  date: string; // ISO string
  description: string;
  type: TransactionType;
  uid: string;
}

export interface UserSettings {
  currency: string;
  theme: 'light' | 'dark';
  categories: string[];
  /** Presupuesto mensual por categoría (en la moneda activa). Falta = sin límite. */
  budgets?: Record<string, number>;
}

export type FilterType = 'all' | 'day' | 'month' | 'year';

export interface FinanceState {
  transactions: Transaction[];
  settings: UserSettings;
  filter: FilterType;
}

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly';

export type WheelMode = 'decision' | 'transaction';

export interface WheelSlice {
  id: string;
  label: string;
  /** Solo en modo transaction: monto sugerido al caer aquí. */
  value?: number;
  /** Solo en modo transaction: categoría asociada. */
  category?: string;
  /** Peso para sorteo ponderado (default 1). 0 = inactivo. */
  weight?: number;
}

export interface Wheel {
  id: string;
  uid: string;
  title: string;
  mode: WheelMode;
  /** Solo en modo transaction. Define si las casillas crean ingreso o gasto. */
  txType?: TransactionType;
  slices: WheelSlice[];
  createdAt: string; // ISO
  lastSpunAt?: string; // ISO
  lastResultId?: string; // último slice id que cayó
}

export interface RecurringExpense {
  id: string;
  uid: string;
  name: string;
  amount: number;
  category: string;
  type: TransactionType;
  frequency: RecurringFrequency;
  /** Día del mes (1–31). Sólo si frequency === 'monthly'. */
  dayOfMonth?: number;
  /** Días de la semana (0=Domingo, 6=Sábado). Sólo si frequency === 'weekly'. */
  daysOfWeek?: number[];
  /** Hora local "HH:mm" en la que disparar la notificación. */
  notifyTime: string;
  enabled: boolean;
  /**
   * Idempotencia: "YYYY-MM-DD" para diario y semanal, "YYYY-MM" para mensual.
   */
  lastNotifiedKey?: string;
  createdAt: string; // ISO
}
