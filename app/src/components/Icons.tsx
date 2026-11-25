// Simple line icons for the tab bar. Decorative: the label carries the meaning.
const common = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'square' as const,
  'aria-hidden': true,
  focusable: false,
};

export const IconHome = () => (
  <svg {...common}>
    <path d="M3 11l9-7 9 7M5 9.5V20h14V9.5" />
  </svg>
);
export const IconHow = () => (
  <svg {...common}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.5V14M12 17.2v.3" />
  </svg>
);
export const IconPlus = () => (
  <svg {...common}>
    <rect x="3" y="3" width="18" height="18" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);
export const IconMap = () => (
  <svg {...common}>
    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);
export const IconMine = () => (
  <svg {...common}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.2-4 4.3-6 8-6s6.8 2 8 6" />
  </svg>
);
