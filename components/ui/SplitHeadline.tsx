import type { ReactNode } from 'react';

/**
 * SplitHeadline — porta el patrón repetido en render.js:
 * divide el texto en '\n' y resalta la segunda línea en cursiva.
 */
export default function SplitHeadline({
  text,
  className = '',
  id,
  secondLineClass = 'italic text-primary',
}: {
  text: string;
  className?: string;
  id?: string;
  secondLineClass?: string;
}): ReactNode {
  const [line1, line2 = ''] = text.split('\n');
  return (
    <h2 id={id} className={className}>
      {line1}
      <br />
      <span className={secondLineClass}>{line2}</span>
    </h2>
  );
}
