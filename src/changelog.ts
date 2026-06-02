// Cambios recientes mostrados en Settings > Acerca de.
// Cuando despliegues una nueva versión, agrega arriba (orden cronológico inverso).
// La versión se inyecta automáticamente desde package.json vía vite.define.

export interface ChangelogEntry {
  date: string; // YYYY-MM-DD
  title: string;
  details?: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-06-01',
    title: 'Mejoras de configuración',
    details: [
      'Restaurar categorías por defecto desde el editor',
      'Hora default para nuevos recordatorios',
      'Empezar de cero (borrar todos tus datos)',
      'Versión y cambios visibles en "Acerca de"',
    ],
  },
  {
    date: '2026-06-01',
    title: 'Metas y movimientos',
    details: [
      'Asignar/cambiar meta al editar un movimiento',
      '"Metas" disponible también como categoría de gasto',
    ],
  },
  {
    date: '2026-06-01',
    title: 'Ingresos fijos automáticos',
    details: [
      'Los cobros recurrentes se registran solos al llegar su fecha',
    ],
  },
];
