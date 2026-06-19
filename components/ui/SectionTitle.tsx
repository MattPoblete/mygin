import type { CSSProperties, ReactNode } from 'react';

/**
 * SectionTitle — eyebrow + headline Playfair + regla carmesí.
 * align "center" centra todo (incluida la regla). tone fija color para fondos dark/light.
 */
export default function SectionTitle({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  tone = 'light',
  className,
  style,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: 'left' | 'center';
  tone?: 'dark' | 'light';
  className?: string;
  style?: CSSProperties;
}) {
  const onDark = tone === 'dark';
  const center = align === 'center';

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: center ? 'center' : 'flex-start',
        textAlign: center ? 'center' : 'left',
        ...style,
      }}
    >
      {eyebrow && (
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 'var(--fw-semibold)' as CSSProperties['fontWeight'],
            fontSize: 'var(--fs-xs)',
            letterSpacing: 'var(--ls-mark)',
            textTransform: 'uppercase',
            /* WCAG AA: small uppercase eyebrow (12px, fails as "large"). On dark → accessible
               crimson (5.25:1 vs navy); on light → --crimson-dark #b82835 on cream ≈ 5.69:1
               (vs --crimson #dc3545 ≈ 4.16:1, fails 4.5:1). */
            color: onDark ? 'var(--crimson-on-dark)' : 'var(--crimson-dark)',
            marginBottom: 'var(--sp-md)',
          }}
        >
          {eyebrow}
        </span>
      )}
      <h2
        style={{
          fontFamily: 'var(--font-headline)',
          fontWeight: 'var(--fw-bold)' as CSSProperties['fontWeight'],
          fontSize: 'clamp(28px, 5vw, 40px)',
          letterSpacing: 'var(--ls-wider)',
          lineHeight: 'var(--lh-snug)',
          color: onDark ? 'var(--white)' : 'var(--navy-dark)',
          margin: 0,
        }}
      >
        {title}
      </h2>
      <span style={{ width: 60, height: 3, background: 'var(--crimson)', margin: 'var(--sp-md) 0 0' }} />
      {subtitle && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--fs-base)',
            lineHeight: 'var(--lh-relaxed)',
            /* WCAG AA: subtitle is small body text. --dark-gray (#8b8884) on cream ≈ 3.24:1 (fails);
               --text-muted (#5a6b78) on cream ≈ 5.07:1 (passes 4.5:1). warm-gray on navy ≈ 6:1 (ok). */
            color: onDark ? 'var(--warm-gray)' : 'var(--text-muted)',
            maxWidth: 520,
            margin: 'var(--sp-lg) 0 0',
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
