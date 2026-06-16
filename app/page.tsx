import Hero from '@/components/sections/Hero';
import Historia from '@/components/sections/Historia';
import Producto from '@/components/sections/Producto';
import Experiencia from '@/components/sections/Experiencia';
import Recetas from '@/components/sections/Recetas';
import Testimonios from '@/components/sections/Testimonios';
import Distribuidores from '@/components/sections/Distribuidores';
import Precios from '@/components/sections/Precios';
import UrgencyBanner from '@/components/sections/UrgencyBanner';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Historia />
      <Producto />
      <Experiencia />
      <Recetas />
      <Testimonios />
      <Distribuidores />
      <Precios />
      <UrgencyBanner />
    </main>
  );
}
