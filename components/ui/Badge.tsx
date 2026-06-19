import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

/**
 * Badge / Tag pill. tones: crimson, navy, cream, outline, success, warning.
 * Portado de components/display/Badge.jsx.
 */
type Tone = 'crimson' | 'navy' | 'cream' | 'outline' | 'success' | 'warning';

export default function Badge({
  tone = 'crimson',
  children,
  style,
  ...rest
}: { tone?: Tone; children: ReactNode } & HTMLAttributes<HTMLSpanElement>) {
  const tones: Record<Tone, CSSProperties> = {
    crimson: { background: 'var(--crimson)', color: 'var(--white)' },
    navy: { background: 'var(--navy-light)', color: 'var(--white)' },
    cream: { background: 'var(--cream)', color: 'var(--navy-dark)', border: '1px solid var(--warm-gray)' },
    outline: { background: 'transparent', color: 'var(--crimson)', border: '1px solid var(--crimson)' },
    success: { background: '#28a745', color: 'var(--white)' },
    warning: { background: '#ffc107', color: 'var(--navy-dark)' },
  };

  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 12px',
    fontFamily: 'var(--font-body)',
    fontWeight: 'var(--fw-semibold)' as CSSProperties['fontWeight'],
    fontSize: 'var(--fs-xs)',
    letterSpacing: 'var(--ls-normal)',
    textTransform: 'uppercase',
    borderRadius: 'var(--radius-pill)',
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
    ...tones[tone],
    ...style,
  };

  return (
    <span style={base} {...rest}>
      {children}
    </span>
  );
}
