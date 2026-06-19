import type { Metadata } from 'next';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { Product } from '@/lib/types';
import { serializeProduct } from '@/lib/products';
import SectionHeader from '@/components/ui/SectionHeader';
import ProductCard from '@/components/shop/ProductCard';

/**
 * app/(shop)/tienda/page.tsx — Catálogo público.
 *
 * Server Component que lee los productos activos de Firestore con el client SDK
 * en un one-shot durante el render (RSC). Se revalida cada 5 minutos.
 */
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Tienda — MyGin',
  description: 'Compra MyGin online. Gin contemporáneo chileno, 11 botánicos de la Araucanía.',
};

async function getActiveProducts(): Promise<Product[]> {
  const snap = await getDocs(query(collection(db, 'products'), where('active', '==', true)));
  return snap.docs
    .map(serializeProduct)
    .sort((a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name));
}

export default async function TiendaPage() {
  const products = await getActiveProducts();

  return (
    <main className="bg-background min-h-screen pt-32 pb-32">
      <div className="container mx-auto px-8 md:px-12">
        <header className="mb-16 text-center">
          <SectionHeader
            label="Tienda"
            headline="Nuestra colección"
            headlineClass="font-headline text-5xl tracking-tighter"
          />
        </header>

        {products.length === 0 ? (
          <div className="mx-auto max-w-md rounded-xl border border-outline-variant/30 bg-surface-container-low p-12 text-center">
            <p className="font-headline text-2xl text-on-surface">Aún no hay productos</p>
            <p className="mt-3 text-sm text-on-surface-variant">
              Estamos preparando el catálogo. Vuelve pronto.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
