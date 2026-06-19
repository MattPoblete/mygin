/**
 * scripts/seed-emulator.mjs — Siembra datos deterministas en el EMULADOR para tests E2E.
 *
 * Se ejecuta dentro de `firebase emulators:exec`, que exporta FIRESTORE_EMULATOR_HOST y
 * FIREBASE_AUTH_EMULATOR_HOST; con esas vars el Admin SDK habla con los emuladores y NO
 * requiere credenciales reales (init con solo projectId).
 *
 * Crea: productos (en stock / featured / low-stock / agotado), cupones (válido + vencido),
 * un pedido pagado, un post de blog, y los usuarios de prueba (admin + no-admin).
 */
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.error('✗ Falta FIRESTORE_EMULATOR_HOST/FIREBASE_AUTH_EMULATOR_HOST. Corre vía `firebase emulators:exec`.');
  process.exit(1);
}

const PROJECT_ID = process.env.GCLOUD_PROJECT || 'theirgin';
if (!getApps().length) initializeApp({ projectId: PROJECT_ID });
const db = getFirestore();
const auth = getAuth();

const ts = () => FieldValue.serverTimestamp();
const DAY = 24 * 60 * 60 * 1000;

const products = [
  { slug: 'mygin-botella-individual', name: 'MyGin — Botella Individual', type: 'gin',
    shortDesc: '750 ml · Gin Contemporáneo', longDesc: 'Gin contemporáneo chileno. 11 botánicos.',
    images: ['/assets/images/assets/botella_naturaleza.webp'], price: 17990, currency: 'CLP',
    stock: 48, stockReserved: 0, lowStockThreshold: 6, sku: 'MYGIN-750-01', active: true, featured: false, badge: null,
    ratingSum: 5, ratingCount: 1 },
  { slug: 'mygin-pack-amigos', name: 'MyGin — Pack Amigos', type: 'gin',
    shortDesc: '2 Botellas · Ahorra $3.000', longDesc: 'Dos botellas de MyGin.',
    images: ['/assets/images/assets/promo_pack.webp'], price: 32990, currency: 'CLP',
    stock: 24, stockReserved: 0, lowStockThreshold: 4, sku: 'MYGIN-750-PACK2', active: true, featured: true, badge: 'Lo más pedido' },
  { slug: 'mygin-edicion-limitada', name: 'MyGin — Edición Limitada', type: 'gin',
    shortDesc: '750 ml · Serie corta', longDesc: 'Serie limitada. Quedan pocas.',
    images: ['/assets/images/assets/botella_naturaleza.webp'], price: 24990, currency: 'CLP',
    stock: 3, stockReserved: 0, lowStockThreshold: 6, sku: 'MYGIN-750-LE', active: true, featured: false, badge: null },
  { slug: 'mygin-agotado', name: 'MyGin — Agotado', type: 'gin',
    shortDesc: '750 ml · Sin stock', longDesc: 'Producto sin stock para probar el estado agotado.',
    images: ['/assets/images/assets/botella_naturaleza.webp'], price: 19990, currency: 'CLP',
    stock: 0, stockReserved: 0, lowStockThreshold: 6, sku: 'MYGIN-750-OUT', active: true, featured: false, badge: null },
];

const coupons = [
  { code: 'BIENVENIDA10', type: 'percent', value: 10, active: true, redemptions: 0,
    minSubtotal: 0, maxRedemptions: 1000, startsAt: Timestamp.fromMillis(Date.now() - DAY),
    expiresAt: Timestamp.fromMillis(Date.now() + 30 * DAY) },
  { code: 'VENCIDO', type: 'percent', value: 50, active: true, redemptions: 0,
    startsAt: Timestamp.fromMillis(Date.now() - 60 * DAY), expiresAt: Timestamp.fromMillis(Date.now() - DAY) },
];

const users = [
  { email: 'admin@test.local', password: 'Test1234!', admin: true },
  { email: 'user@test.local', password: 'Test1234!', admin: false },
];

async function seedUser({ email, password, admin }) {
  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch {
    user = await auth.createUser({ email, password, emailVerified: true });
  }
  await auth.setCustomUserClaims(user.uid, admin ? { admin: true } : {});
  console.log(`· user ${email} (admin=${admin})`);
}

async function seed() {
  const batch = db.batch();
  for (const p of products) batch.set(db.collection('products').doc(p.slug), { ratingSum: 0, ratingCount: 0, ...p, createdAt: ts(), updatedAt: ts() }, { merge: true });
  for (const c of coupons) batch.set(db.collection('coupons').doc(c.code), { ...c, createdAt: ts() }, { merge: true });

  // Post de blog (publicado) para los tests de admin blog.
  batch.set(db.collection('blogPosts').doc('gin-tonic-perfecto'), {
    slug: 'gin-tonic-perfecto', title: 'El gin tonic perfecto', excerpt: 'Cómo preparar un gin tonic.',
    content: '# Gin tonic\n\nPasos...', category: 'receta', status: 'published', coverImage: '',
    tags: ['receta'], author: 'MyGin', createdAt: ts(), updatedAt: ts(), publishedAt: ts(),
  }, { merge: true });

  // Reseñas: una aprobada (visible en el PDP, ya contada) y una pendiente (cola de moderación).
  batch.set(db.collection('comments').doc('seed-review-approved'), {
    productId: 'mygin-botella-individual', productSlug: 'mygin-botella-individual', rating: 5,
    authorName: 'Camila R.', authorEmail: 'camila@test.local', body: 'Excelente gin, muy aromático.',
    status: 'approved', counted: true, createdAt: ts(), approvedAt: ts(),
  }, { merge: true });
  batch.set(db.collection('comments').doc('seed-review-pending'), {
    productId: 'mygin-botella-individual', productSlug: 'mygin-botella-individual', rating: 4,
    authorName: 'Diego P.', authorEmail: 'diego@test.local', body: 'Muy bueno, pero caro.',
    status: 'pending', counted: false, createdAt: ts(),
  }, { merge: true });

  // Pedido pagado para que /admin/pedidos no esté vacío.
  batch.set(db.collection('orders').doc('seed-order-paid'), {
    status: 'paid', items: [{ productId: 'mygin-botella-individual', name: 'MyGin — Botella Individual', qty: 1, unitPrice: 17990 }],
    subtotal: 17990, discount: 0, shipping: 3990, total: 21980,
    customer: { name: 'Cliente Prueba', email: 'cliente@test.local', phone: '+56912345678',
      address: { region: 'Araucanía', comuna: 'Villarrica', calle: 'Calle 1' } },
    createdAt: ts(), updatedAt: ts(), paidAt: ts(),
  }, { merge: true });

  await batch.commit();
  for (const u of users) await seedUser(u);
  console.log(`✓ seed emulador: ${products.length} productos, ${coupons.length} cupones, 1 post, 1 pedido, ${users.length} usuarios`);
}

seed().then(
  () => process.exit(0),
  (err) => { console.error('✗ seed-emulator falló:', err); process.exit(1); },
);
