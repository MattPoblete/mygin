/**
 * JsonLd — inyecta un bloque de datos estructurados schema.org.
 *
 * Next.js no tiene API nativa para JSON-LD; el <script type="application/ld+json">
 * es el patrón oficial documentado. `data` se genera siempre en el server desde
 * fuentes confiables (Firestore / content/site.ts), nunca de input de usuario,
 * por lo que dangerouslySetInnerHTML es seguro aquí.
 */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
