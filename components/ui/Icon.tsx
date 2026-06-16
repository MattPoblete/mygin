/**
 * Icon — Material Symbols Outlined.
 * Reemplaza el helper icon() de js/render.js.
 */
interface IconProps {
  name: string;
  /** 'FILL' axis: 1 = relleno, 0 = contorno */
  fill?: 0 | 1;
  className?: string;
}

export default function Icon({ name, fill = 1, className = '' }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`.trim()}
      style={{ fontVariationSettings: `'FILL' ${fill}, 'wght' 300, 'GRAD' 0, 'opsz' 24` }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
