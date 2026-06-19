import SplitHeadline from '@/components/ui/SplitHeadline';

/**
 * SectionHeader — el bloque repetido en las secciones de la landing:
 * etiqueta (label) + titular partido en dos líneas + subtítulo opcional.
 *
 * El contenedor/centrado lo pone cada sección (varía entre grid y centrado);
 * aquí vive solo el contenido común.
 */
export default function SectionHeader({
  label,
  headline,
  id,
  sublabel,
  headlineClass = 'font-headline text-5xl tracking-tighter reveal',
  secondLineClass,
  align = 'center',
}: {
  label?: string;
  headline: string;
  id?: string;
  sublabel?: string;
  headlineClass?: string;
  secondLineClass?: string;
  /** Centra la regla carmesí; usa 'left' en secciones alineadas a la izquierda. */
  align?: 'left' | 'center';
}) {
  return (
    <>
      {label && <span className="mg-eyebrow mb-4 block">{label}</span>}
      <SplitHeadline id={id} text={headline} className={headlineClass} secondLineClass={secondLineClass} />
      {/* Regla carmesí heráldica */}
      <span className="mg-rule" style={{ marginInline: align === 'center' ? 'auto' : undefined, marginBottom: 0 }} />
      {sublabel && <p className="text-on-surface-variant text-sm mt-4 max-w-lg mx-auto">{sublabel}</p>}
    </>
  );
}
