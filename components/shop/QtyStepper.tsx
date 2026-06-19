'use client';

import Icon from '@/components/ui/Icon';

/**
 * QtyStepper — control de cantidad (− valor +). Controlado por el padre.
 * `max` limita el incremento al stock disponible cuando se conoce.
 */
export default function QtyStepper({
  value,
  onChange,
  min = 1,
  max,
  className = '',
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  className?: string;
}) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(max ? Math.min(max, value + 1) : value + 1);
  const atMin = value <= min;
  const atMax = max !== undefined && value >= max;

  return (
    <div
      className={`inline-flex items-center rounded-lg border border-outline-variant/40 ${className}`.trim()}
    >
      <button
        type="button"
        onClick={dec}
        disabled={atMin}
        aria-label="Disminuir cantidad"
        className="flex h-11 w-11 items-center justify-center text-secondary disabled:opacity-30 transition-opacity"
      >
        <Icon name="remove" fill={0} className="text-base" />
      </button>
      <span className="w-11 text-center font-body text-on-surface tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={atMax}
        aria-label="Aumentar cantidad"
        className="flex h-11 w-11 items-center justify-center text-secondary disabled:opacity-30 transition-opacity"
      >
        <Icon name="add" fill={0} className="text-base" />
      </button>
    </div>
  );
}
