import React from 'react';

// Icone lineari in stile SF Symbols
type P = {size?: number; color?: string; stroke?: number; style?: React.CSSProperties};
const Svg: React.FC<P & {children: React.ReactNode}> = ({size = 120, color = '#1D1D1F', stroke = 5, style, children}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {children}
  </svg>
);

export const BusIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <rect x="18" y="12" width="64" height="66" rx="12" />
    <path d="M18 50h64M30 28h40" />
    <circle cx="32" cy="64" r="4" />
    <circle cx="68" cy="64" r="4" />
    <path d="M28 78v8M72 78v8" />
  </Svg>
);
export const TrainIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M26 14h48a8 8 0 0 1 8 8v44a10 10 0 0 1-10 10H28a10 10 0 0 1-10-10V22a8 8 0 0 1 8-8z" />
    <rect x="28" y="24" width="44" height="22" rx="5" />
    <circle cx="34" cy="60" r="4" />
    <circle cx="66" cy="60" r="4" />
    <path d="M30 76l-8 12M70 76l8 12" />
  </Svg>
);
export const MetroIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <circle cx="50" cy="50" r="38" />
    <path d="M30 68V34l20 22 20-22v34" />
  </Svg>
);
export const CoffeeIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M24 38h46v20a22 22 0 0 1-22 22h-2a22 22 0 0 1-22-22z" />
    <path d="M70 44h6a9 9 0 0 1 0 18h-7" />
    <path d="M38 14c-4 6 4 10 0 16M52 14c-4 6 4 10 0 16" />
  </Svg>
);
export const ShoeIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M14 66V36l16 2 8 10 18 6 22 6c6 2 8 6 8 10v4H14z" />
    <path d="M14 74h72M40 50l-4 6M48 52l-4 6" />
  </Svg>
);
export const RainIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M28 54a16 16 0 0 1 2-32 22 22 0 0 1 42 6 13 13 0 0 1-2 26z" />
    <path d="M34 66l-4 10M50 66l-4 10M66 66l-4 10" />
  </Svg>
);
export const GumIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <circle cx="50" cy="50" r="30" />
    <path d="M36 44a14 14 0 0 1 14-10" />
  </Svg>
);
export const EyeIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M8 50s16-26 42-26 42 26 42 26-16 26-42 26S8 50 8 50z" />
    <circle cx="50" cy="50" r="12" />
  </Svg>
);
export const ShieldIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M50 10l32 12v24c0 22-14 36-32 44-18-8-32-22-32-44V22z" />
    <path d="M36 50l10 10 18-20" />
  </Svg>
);
export const FlameIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M50 90c-17 0-28-11-28-27 0-16 12-24 16-40 6 8 8 14 8 20 4-4 6-10 6-16 12 10 26 22 26 38 0 15-11 25-28 25z" />
  </Svg>
);
export const PersonIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <circle cx="50" cy="30" r="14" />
    <path d="M22 88c0-18 12-30 28-30s28 12 28 30" />
  </Svg>
);
export const SunIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <circle cx="50" cy="50" r="18" />
    <path d="M50 12v10M50 78v10M12 50h10M78 50h10M23 23l7 7M70 70l7 7M23 77l7-7M70 30l7-7" />
  </Svg>
);
