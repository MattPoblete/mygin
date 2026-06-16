/**
 * lib/types.team.ts — Modelo del equipo de MyGin (colección `teamMembers`).
 *
 * Tipo de la feature "Nuestro Equipo" (Oleada 1). Vive aquí —no en lib/types.ts—
 * para evitar conflictos de merge entre worktrees. Describe documentos de la
 * colección `teamMembers` de Firestore: lectura pública solo de los `active==true`
 * (lo exige firestore.rules); las escrituras son de admin / Cloud Functions.
 */

/** Miembro del equipo mostrado en /equipo. */
export interface TeamMember {
  /** docId de Firestore. */
  id: string;
  name: string;
  /** Cargo o rol dentro de MyGin (ej. "Co-fundador"). */
  role: string;
  bio: string;
  /** URL de la foto (ruta /assets o URL absoluta). */
  photo: string;
  /** Orden de aparición ascendente. */
  order: number;
  /** Solo los `true` se exponen públicamente. */
  active: boolean;
}
