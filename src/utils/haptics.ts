/**
 * Wrappers ligeros sobre navigator.vibrate. iOS Safari ignora la API hoy
 * (Apple no la implementa), pero Android y la mayoría de navegadores sí.
 * Llamar en confirmaciones y cambios de estado importantes — no en cada tap.
 */

const canVibrate = () =>
  typeof navigator !== 'undefined' &&
  typeof navigator.vibrate === 'function' &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const tap = () => {
  if (canVibrate()) navigator.vibrate(8);
};

export const success = () => {
  if (canVibrate()) navigator.vibrate([12, 30, 12]);
};

export const warn = () => {
  if (canVibrate()) navigator.vibrate([20, 40, 20, 40]);
};
