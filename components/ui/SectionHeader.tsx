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
}: {
  label?: string;
  headline: string;
  id?: string;
  sublabel?: string;
  headlineClass?: string;
  secondLineClass?: string;
}) {
  return (
    <>
      {label && (
        <span className="text-secondary font-label uppercase tracking-[0.4em] text-xs mb-4 block">
          {label}
        </span>
      )}
      <SplitHeadline id={id} text={headline} className={headlineClass} secondLineClass={secondLineClass} />
      {sublabel && (
        <p className="text-on-surface-variant text-sm mt-4 max-w-lg mx-auto">{sublabel}</p>
      )}
    </>
  );
}
