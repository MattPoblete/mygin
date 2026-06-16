/**
 * scripts/seed-firestore.mjs — Seed inicial del catálogo en Firestore.
 *
 * Crea los productos vendibles de MyGin (derivados de los tiers de la landing).
 * Requiere credenciales de admin: ejecuta con Application Default Credentials
 * o GOOGLE_APPLICATION_CREDENTIALS apuntando a una service account de theirgin.
 *
 *   node scripts/seed-firestore.mjs
 *
 * Idempotente: usa el slug como docId, así re-ejecutar actualiza en vez de duplicar.
 */
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { ensureAdminApp } from './_admin.mjs';

ensureAdminApp();
const db = getFirestore();

const products = [
  {
    slug: 'mygin-botella-individual',
    name: 'MyGin — Botella Individual',
    type: 'gin',
    shortDesc: '750 ml · Gin Contemporáneo',
    longDesc:
      'Gin contemporáneo chileno de alta expresión botánica. 11 botánicos, con huesillo y tomillo de la Araucanía. Despacho a todo Chile.',
    images: ['/assets/images/assets/botella_naturaleza.webp'],
    price: 17990,
    currency: 'CLP',
    stock: 48,
    stockReserved: 0,
    lowStockThreshold: 6,
    sku: 'MYGIN-750-01',
    active: true,
    featured: false,
    badge: null,
    weightGr: 1200,
    attributes: { volumen: '750 ml' },
  },
  {
    slug: 'mygin-pack-amigos',
    name: 'MyGin — Pack Amigos',
    type: 'gin',
    shortDesc: '2 Botellas · Ahorra $3.000',
    longDesc:
      'Dos botellas de MyGin Gin Contemporáneo. Recetario digital incluido y envío priority 24h.',
    images: ['/assets/images/assets/promo_pack.webp'],
    price: 32990,
    currency: 'CLP',
    stock: 24,
    stockReserved: 0,
    lowStockThreshold: 4,
    sku: 'MYGIN-750-PACK2',
    active: true,
    featured: true,
    badge: 'Lo más pedido',
    weightGr: 2400,
    attributes: { volumen: '2 × 750 ml' },
  },
];

async function seed() {
  const batch = db.batch();
  for (const p of products) {
    const ref = db.collection('products').doc(p.slug);
    batch.set(
      ref,
      { ...p, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    console.log(`· seed product: ${p.slug}`);
  }
  await batch.commit();
  console.log(`✓ ${products.length} productos sembrados en theirgin/products`);
}

seed().then(
  () => process.exit(0),
  (err) => {
    console.error('✗ seed falló:', err);
    process.exit(1);
  },
);
