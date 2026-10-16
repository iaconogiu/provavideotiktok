import React from 'react';
import {C, FONT} from './theme';

/** Pillola/card in vetro smerigliato */
export const Glass: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  dark?: boolean;
  radius?: number;
}> = ({children, style, dark, radius = 36}) => (
  <div
    style={{
      fontFamily: FONT,
      color: dark ? C.white : C.ink,
      background: dark ? 'rgba(28,28,30,0.55)' : 'rgba(255,255,255,0.68)',
      backdropFilter: 'blur(30px) saturate(180%)',
      WebkitBackdropFilter: 'blur(30px) saturate(180%)',
      border: `1px solid ${dark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.9)'}`,
      borderRadius: radius,
      boxShadow: '0 24px 70px rgba(0,0,0,0.16), 0 4px 14px rgba(0,0,0,0.06)',
      ...style,
    }}
  >
    {children}
  </div>
);

export const Kicker: React.FC<{children: React.ReactNode; style?: React.CSSProperties; dark?: boolean}> = ({children, style, dark}) => (
  <Glass dark={dark} radius={100} style={{padding: '18px 34px', fontSize: 34, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', ...style}}>
    {children}
  </Glass>
);
