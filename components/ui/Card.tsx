'use client';

import { useState, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';

/**
 * Card — superficie elevada. tone "dark" (navy-light) o "light" (cream).
 * Lift −4px + shadow-lg en hover cuando interactive. Portado de components/display/Card.jsx.
 */
export default function Card({
  tone = 'light',
  interactive = false,
  children,
  style,
  ...rest
}: {
  tone?: 'dark' | 'light';
  interactive?: boolean;
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>) {
  const [hover, setHover] = useState(false);

  const tones: Record<'dark' | 'light', CSSProperties> = {
    dark: { background: 'var(--navy-light)', color: 'var(--cream)', border: '1px solid rgba(255,255,255,.10)' },
    light: { background: 'var(--cream)', color: 'var(--navy-dark)', border: '1px solid rgba(0,0,0,.06)' },
  };

  const base: CSSProperties = {
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--sp-lg)',
    boxShadow: interactive && hover ? 'var(--shadow-lg)' : 'var(--shadow-md)',
    transform: interactive && hover ? 'translateY(-4px)' : 'none',
    transition: 'box-shadow var(--transition-base), transform var(--transition-base)',
    ...tones[tone],
    ...style,
  };

  return (
    <div
      style={base}
      onMouseEnter={() => interactive && setHover(true)}
      onMouseLeave={() => interactive && setHover(false)}
      {...rest}
    >
      {children}
    </div>
  );
}
