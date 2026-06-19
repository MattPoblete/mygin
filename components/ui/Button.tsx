'use client';

import { useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react';

/**
 * Button — CTA heráldica del MyGin Design System.
 * primary = crimson · secondary = navy-light · tertiary = ghost crimson.
 * Hover oscurece, press hunde (inset). Portado de components/buttons/Button.jsx.
 */
type Variant = 'primary' | 'secondary' | 'tertiary';
type Size = 'sm' | 'md' | 'lg';

export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  type = 'button',
  children,
  style,
  ...rest
}: {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);

  const sizes: Record<Size, CSSProperties> = {
    sm: { padding: '8px 16px', fontSize: 'var(--fs-sm)' },
    md: { padding: '12px 20px', fontSize: 'var(--fs-base)' },
    lg: { padding: '16px 32px', fontSize: '1.125rem' },
  };
  const variants: Record<Variant, CSSProperties> = {
    primary: { background: 'var(--crimson)', color: 'var(--white)', border: '2px solid var(--crimson)' },
    secondary: { background: 'var(--navy-light)', color: 'var(--white)', border: '2px solid var(--navy-light)' },
    tertiary: { background: 'transparent', color: 'var(--crimson)', border: '2px solid var(--crimson)' },
  };
  const hoverStyle: Record<Variant, CSSProperties> = {
    primary: { background: 'var(--crimson-dark)', borderColor: 'var(--crimson-dark)' },
    secondary: { background: 'var(--navy)', borderColor: 'var(--navy)' },
    tertiary: { background: 'var(--crimson)', color: 'var(--white)' },
  };

  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: fullWidth ? '100%' : 'auto',
    fontFamily: 'var(--font-body)',
    fontWeight: 'var(--fw-semibold)' as CSSProperties['fontWeight'],
    letterSpacing: 'var(--ls-normal)',
    textTransform: 'uppercase',
    borderRadius: 'var(--radius-md)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition:
      'background var(--transition-base), border-color var(--transition-base), transform var(--transition-fast)',
    boxShadow: active && !disabled ? 'var(--shadow-inset)' : 'none',
    transform: active && !disabled ? 'translateY(1px)' : 'none',
    ...sizes[size],
    ...variants[variant],
    ...(disabled ? { background: 'var(--dark-gray)', borderColor: 'var(--dark-gray)', color: 'var(--white)' } : null),
    ...(!disabled && hover ? hoverStyle[variant] : null),
    ...style,
  };

  return (
    <button
      type={type}
      disabled={disabled}
      style={base}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setActive(false);
      }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      {...rest}
    >
      {children}
    </button>
  );
}
