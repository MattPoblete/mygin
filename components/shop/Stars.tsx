/**
 * Stars — render de solo lectura de una calificación 0..5 (redondeada a entero).
 * Server-safe (sin estado). Para el selector interactivo ver ReviewForm.
 */
export default function Stars({ value, label }: { value: number; label?: string }) {
  const filled = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={label ?? `${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          aria-hidden="true"
          className={`text-base leading-none ${n <= filled ? 'text-primary' : 'text-outline-variant/40'}`}
        >
          ★
        </span>
      ))}
    </span>
  );
}
