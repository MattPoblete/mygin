import Hero from '@/components/sections/Hero';
import Historia from '@/components/sections/Historia';
import Producto from '@/components/sections/Producto';
import Botanicals from '@/components/sections/Botanicals';
import Distribuidores from '@/components/sections/Distribuidores';
import Shop from '@/components/sections/Shop';
import Contacto from '@/components/sections/Contacto';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Distribuidores />
      <Producto />
      <Historia />
      <Botanicals />
      <Shop />
      <Contacto />
    </main>
  );
}
