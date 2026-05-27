export const EASINGS = {
  smooth: [0.16, 1, 0.3, 1],
  bouncy: [0.34, 1.56, 0.64, 1],
};

export const SPRINGS = {
  snappy: { type: 'spring', stiffness: 380, damping: 32 },
  bouncy: { type: 'spring', stiffness: 380, damping: 36 },
  stiff: { type: 'spring', stiffness: 500, damping: 30 },
};

export const FADE_IN_UP = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: EASINGS.smooth },
};

export const FADE_IN = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

export const SLIDE_UP_MODAL = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
  transition: SPRINGS.snappy,
};
