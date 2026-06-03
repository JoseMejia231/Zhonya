import { format, parseISO, isToday, isYesterday, isSameMonth, isSameYear, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatShortDate = (dateISO: string): string => {
  return format(parseISO(dateISO), 'dd MMM', { locale: es }).toUpperCase();
};

export const formatMonthYear = (date: Date): string => {
  return format(date, 'MMMM yyyy', { locale: es }).toUpperCase();
};

export const formatShortMonthYear = (date: Date): string => {
  return format(date, 'MMM yyyy', { locale: es }).replace(/\./g, '');
};

export const formatRelativeDate = (dateISO: string): string => {
  const date = parseISO(dateISO);
  if (isToday(date)) return 'Hoy';
  if (isYesterday(date)) return 'Ayer';
  return formatShortDate(dateISO);
};

export const formatFullDateLabel = (date: Date): string => {
  return format(date, "EEEE, d 'de' MMMM yyyy", { locale: es }).toUpperCase();
};

export const formatDayMonth = (date: Date): string => {
  return format(date, 'd MMM', { locale: es }).replace(/\./g, '');
};
