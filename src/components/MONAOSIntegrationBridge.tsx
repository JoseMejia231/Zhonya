// MONA - OS Integration
import { useEffect, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import type { FilterType } from '../types';

// MONA - OS Integration
type MONAOSAction = 'open' | 'viewSummary' | 'recordExpense' | 'recordTransaction' | 'viewDailySpend';

// MONA - OS Integration
const COMMAND_ACTION_KEYS = ['monaAction', 'action'];
const COMMAND_AMOUNT_KEYS = ['monaAmount', 'amount'];
const COMMAND_CATEGORY_KEYS = ['monaCategory', 'category'];
const COMMAND_DESCRIPTION_KEYS = ['monaDescription', 'description', 'name'];
const COMMAND_FILTER_KEYS = ['monaFilter', 'filter'];

// MONA - OS Integration
function readParam(params: URLSearchParams, keys: string[]): string {
  for (const key of keys) {
    const value = params.get(key)?.trim();
    if (value) return value;
  }
  return '';
}

// MONA - OS Integration
function normalizeAction(value: string): MONAOSAction | null {
  const normalized = value.trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (['open', 'openmona', 'abrirmona'].includes(normalized)) return 'open';
  if (['summary', 'viewsummary', 'resumen', 'verresumen'].includes(normalized)) return 'viewSummary';
  if (['recordexpense', 'addexpense', 'registrargasto', 'gasto'].includes(normalized)) return 'recordExpense';
  if (['recordtransaction', 'addtransaction', 'registrarmovimiento', 'movimiento'].includes(normalized)) {
    return 'recordTransaction';
  }
  if (
    [
      'viewdailyspend',
      'dailyspend',
      'cuantogastehoy',
      'cuantohegastadohoy',
      'gastosdehoy',
      'gastodehoy',
      'gastohoy',
    ].includes(normalized)
  ) {
    return 'viewDailySpend';
  }
  return null;
}

// MONA - OS Integration
function normalizeFilter(value: string): FilterType | null {
  const normalized = value.trim().toLowerCase();
  if (['day', 'today', 'hoy'].includes(normalized)) return 'day';
  if (['month', 'mes'].includes(normalized)) return 'month';
  if (['year', 'ano'].includes(normalized)) return 'year';
  if (normalized === 'all' || normalized === 'todo') return 'all';
  return null;
}

// MONA - OS Integration
function parseAmount(value: string): number | null {
  const normalized = value.replace(',', '.').replace(/[^\d.]/g, '');
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

// MONA - OS Integration
function cleanUrlToHash(hash: '#/overview' | '#/transactions') {
  window.history.replaceState(null, '', `${window.location.pathname}${hash}`);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

// MONA - OS Integration
export function MONAOSIntegrationBridge() {
  const { user, addTransaction, settings, setFilter } = useFinance();
  const handledCommandRef = useRef<string | null>(null);

  // MONA - OS Integration
  useEffect(() => {
    if (!user || typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const action = normalizeAction(readParam(params, COMMAND_ACTION_KEYS));
    if (!action) return;

    const commandId = params.get('monaCommandId') || window.location.search;
    if (handledCommandRef.current === commandId) return;
    handledCommandRef.current = commandId;

    const filter = normalizeFilter(readParam(params, COMMAND_FILTER_KEYS));
    if (filter) setFilter(filter);

    if (action === 'viewDailySpend') {
      setFilter('day');
      cleanUrlToHash('#/transactions');
      return;
    }

    if (action === 'open' || action === 'viewSummary') {
      cleanUrlToHash('#/overview');
      return;
    }

    const amount = parseAmount(readParam(params, COMMAND_AMOUNT_KEYS));
    const fallbackCategory =
      (settings.expenseCategories || settings.categories || [])[0] || 'Otros Gastos';
    const category = readParam(params, COMMAND_CATEGORY_KEYS) || fallbackCategory;
    const description = readParam(params, COMMAND_DESCRIPTION_KEYS) || 'Android';

    if (!amount) {
      cleanUrlToHash('#/transactions');
      return;
    }

    void addTransaction({
      amount,
      type: 'expense',
      category,
      description,
      date: new Date().toISOString(),
    }).finally(() => cleanUrlToHash('#/transactions'));
  }, [addTransaction, setFilter, settings.categories, settings.expenseCategories, user]);

  return null;
}
