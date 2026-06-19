import Hero from '@/components/sections/Hero';
import Historia from '@/components/sections/Historia';
import Producto from '@/components/sections/Producto';
import Botanicals from '@/components/sections/Botanicals';
import Distribuidores from '@/components/sections/Distribuidores';
import Shop from '@/components/sections/Shop';
import Contacto from '@/components/sections/Contacto';
import { getActiveProducts } from '@/lib/products';

// Precio/imagen/descripción de Producto y Shop salen de Firestore. Dinámico (SSR en vivo)
// para que los cambios del admin se vean al instante; sin lag de caché ISR. Tráfico bajo.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const bySlug = new Map((await getActiveProducts()).map((p) => [p.slug, p]));

  return (
    <main>
      <Hero />
      <Distribuidores />
      <Producto products={bySlug} />
      <Historia />
      <Botanicals />
      <Shop products={bySlug} />
      <Contacto />
    </main>
  );
}
