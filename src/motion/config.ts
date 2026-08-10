// Centralized Motion Design Tokens & Physics Config

export const EASINGS = {
  // Apple/Linear style smooth responsive easing
  responsive: [0.16, 1, 0.3, 1] as const,
  // Smooth cinematic ease out
  cinematic: [0.25, 1, 0.5, 1] as const,
  // Sharp structural ease
  sharp: [0.4, 0, 0.2, 1] as const,
  // Spring feel
  springBounce: { type: "spring", stiffness: 400, damping: 25 },
  springSmooth: { type: "spring", stiffness: 300, damping: 30 },
  springGentle: { type: "spring", stiffness: 180, damping: 20 },
};

export const DURATION = {
  FAST: 0.18,
  NORMAL: 0.3,
  MEDIUM: 0.45,
  SLOW: 0.7,
  CINEMATIC: 0.9,
};

export const STAGGER = {
  FAST: 0.04,
  NORMAL: 0.08,
  SLOW: 0.12,
};
