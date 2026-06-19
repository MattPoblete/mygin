/**
 * /equipo — "Nuestro Equipo" (Server Component, SSG con revalidación).
 *
 * Lee la colección `teamMembers` (solo activos) con el client SDK en un one-shot
 * durante el render del servidor. Si no hay documentos —o falla la lectura— cae
 * a un fallback estático con los fundadores reales para que la página nunca
 * quede vacía y conserve su valor SEO.
 */
import type { Metadata } from 'next';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import SectionHeader from '@/components/ui/SectionHeader';
import type { TeamMember } from '@/lib/types.team';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Nuestro Equipo — MyGin',
  description:
    'Conoce a las personas detrás de MyGin: Andrés Jeldres y Fernando Moreno, fundadores del gin contemporáneo chileno destilado en Villarrica, Araucanía.',
  alternates: { canonical: '/equipo' },
  openGraph: {
    title: 'Nuestro Equipo — MyGin',
    description:
      'Las personas detrás de MyGin, el gin contemporáneo chileno nacido en Villarrica, Araucanía.',
    url: '/equipo',
    type: 'website',
  },
};

/** Fundadores reales — fallback si Firestore no tiene miembros activos. */
const FALLBACK_TEAM: TeamMember[] = [
  {
    id: 'andres-jeldres',
    name: 'Andrés Jeldres',
    role: 'Co-fundador',
    bio: 'Junto a Fernando fundó MyGin en 2025 con una obsesión simple: crear el gin que represente de verdad cómo somos los chilenos. Lidera la visión de marca y la búsqueda de botánicos nativos en los cerros de la Araucanía.',
    photo: '/assets/images/amigos.jpeg',
    order: 1,
    active: true,
  },
  {
    id: 'fernando-moreno',
    name: 'Fernando Moreno',
    role: 'Co-fundador',
    bio: 'Co-creó MyGin en Villarrica en 2025. A cargo de la destilación a orillas del Río Pedregoso, equilibra los 11 botánicos —huesillo, tomillo y enebro entre ellos— hasta lograr un perfil genuinamente chileno.',
    photo: '/assets/images/botella_naturaleza.jpeg',
    order: 2,
    active: true,
  },
];

/**
 * Lee miembros activos ordenados por `order`; devuelve [] ante cualquier error o vacío.
 * `where` de igualdad SIN orderBy → índice de campo único automático (no compuesto);
 * se ordena en memoria.
 */
async function getTeamMembers(): Promise<TeamMember[]> {
  try {
    const snap = await getDocs(query(collection(db, 'teamMembers'), where('active', '==', true)));
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<TeamMember, 'id'>) }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch (err) {
    // Cae al equipo de respaldo, pero deja rastro del fallo real en los logs del server.
    console.error('equipo: getTeamMembers falló', err);
    return [];
  }
}

export default async function EquipoPage() {
  const members = await getTeamMembers();
  const team = members.length ? members : FALLBACK_TEAM;

  return (
    <main className="pt-32 pb-32 bg-background" id="equipo">
      <div className="container mx-auto px-8 md:px-12">
        <div className="text-center mb-20">
          <SectionHeader
            id="equipo-headline"
            label="Quiénes somos"
            headline={'Las personas\ndetrás de MyGin.'}
            sublabel="Dos amigos que se propusieron crear el gin que sabe a Chile. Esto es lo que somos."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
          {team.map((m, i) => (
            <article
              key={m.id}
              className={`bg-surface-container-low rounded-2xl overflow-hidden reveal reveal--delay-${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.photo}
                alt={`Foto de ${m.name}, ${m.role} de MyGin`}
                className="w-full aspect-[4/3] object-cover"
                loading="lazy"
              />
              <div className="p-8">
                <h2 className="font-headline text-2xl tracking-tighter text-on-surface">{m.name}</h2>
                <p className="text-xs uppercase tracking-[0.3em] text-secondary font-bold mt-1 mb-5">
                  {m.role}
                </p>
                <p className="text-on-surface-variant text-sm leading-relaxed">{m.bio}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
