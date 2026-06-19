# Endurecimiento de Seguridad — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cerrar el endurecimiento de seguridad de la Oleada 2 (código + emulador): índices compuestos faltantes, allowlist de campos en los `create` públicos de Firestore, y un e2e que verifica que el checkout no sobre-vende bajo concurrencia.

**Architecture:** Tres cambios independientes. Índices y reglas son edición de config verificada por build + el happy-path e2e existente (que no debe romperse). El test de overselling es el entregable de testing: dispara N create-order en paralelo contra un producto dedicado del seed y verifica el reparto exacto 200/409 sin 500.

**Tech Stack:** Next.js App Router (API routes), Firebase Admin SDK (transacciones), Firestore emulator, Playwright (`request` fixture), pnpm.

**Spec:** `docs/superpowers/specs/2026-06-19-endurecimiento-seguridad-design.md`

---

### Task 1: Índices compuestos faltantes

Dos queries `where(igualdad) + orderBy(otro campo)` requieren índice compuesto; hoy no están declaradas (el emulador las ignora, producción falla). No tienen test propio: se validan al desplegar y porque el build sigue verde.

**Files:**
- Modify: `firestore.indexes.json`

- [ ] **Step 1: Agregar los dos índices**

Reemplazar el array `indexes` para que contenga los tres (el de `orders` ya existe):

```json
{
  "indexes": [
    {
      "collectionGroup": "orders",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "reservationExpiresAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "teamMembers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "active", "order": "ASCENDING" },
        { "fieldPath": "order", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "blogPosts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "publishedAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

- [ ] **Step 2: Validar JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('firestore.indexes.json','utf8')); console.log('ok')"`
Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add firestore.indexes.json
git commit -m "fix(security): índices compuestos para teamMembers y blogPosts"
```

---

### Task 2: Endurecer los `create` públicos de Firestore

Los `create` públicos de `comments` y `contactSubmissions` validan campos requeridos pero permiten campos extra arbitrarios. Agregar allowlist `keys().hasOnly([...])` + topes de tamaño. No alteran el happy-path: los forms (`ReviewForm.tsx`, `ContactForm.tsx`) escriben exactamente esas claves. Se verifica con el e2e existente en la Task 5.

**Files:**
- Modify: `firestore.rules` (bloques `comments` y `contactSubmissions`)

- [ ] **Step 1: Endurecer `comments.create`**

Reemplazar el `allow create` del bloque `// --- comments ---` por:

```
      // Creación pública de reseñas: estado 'pending', sin contar aún, y forma válida.
      allow create: if request.resource.data.keys().hasOnly(
                         ['productId','productSlug','rating','authorName','authorEmail','body','status','counted','createdAt'])
                    && request.resource.data.status == 'pending'
                    && request.resource.data.counted == false
                    && request.resource.data.productId is string
                    && request.resource.data.rating is int
                    && request.resource.data.rating >= 1
                    && request.resource.data.rating <= 5
                    && request.resource.data.authorName is string
                    && request.resource.data.authorName.size() > 0
                    && request.resource.data.authorName.size() <= 120
                    && request.resource.data.authorEmail is string
                    && request.resource.data.authorEmail.size() <= 200
                    && request.resource.data.body is string
                    && request.resource.data.body.size() > 0
                    && request.resource.data.body.size() <= 2000;
```

- [ ] **Step 2: Endurecer `contactSubmissions.create`**

Reemplazar el `allow create` del bloque `// --- contactSubmissions ---` por:

```
      // Creación validada (preferible vía callable submitContact); lectura admin.
      allow create: if request.resource.data.keys().hasOnly(
                         ['name','email','phone','company','message','type','status','createdAt','userAgent'])
                    && request.resource.data.name is string
                    && request.resource.data.name.size() > 0
                    && request.resource.data.name.size() <= 120
                    && request.resource.data.email is string
                    && request.resource.data.message is string
                    && request.resource.data.message.size() > 0
                    && request.resource.data.message.size() <= 5000
                    && request.resource.data.status == 'new';
```

- [ ] **Step 3: Commit**

```bash
git add firestore.rules
git commit -m "fix(security): allowlist de campos + topes de tamaño en creates públicos"
```

---

### Task 3: Sembrar producto dedicado para el test de concurrencia

`mygin-concurrencia` (stock 5) aísla el test: reservar su stock no interfiere con specs que leen stock de otros productos. Vive solo en el seed del emulador (test-only). `smoke`/`catalog` asertan presencia por nombre, no conteo exacto → no se rompen.

**Files:**
- Modify: `scripts/seed-emulator.mjs` (array `products`, ~línea 28-45)

- [ ] **Step 1: Agregar el producto al array `products`**

Añadir como último elemento del array `const products = [ ... ]` (antes del `];`):

```js
  { slug: 'mygin-concurrencia', name: 'MyGin — Concurrencia (test)', type: 'gin',
    shortDesc: '750 ml · producto de prueba de concurrencia', longDesc: 'Solo para el e2e de overselling.',
    images: ['/assets/images/assets/botella_naturaleza.webp'], price: 17990, currency: 'CLP',
    stock: 5, stockReserved: 0, lowStockThreshold: 6, sku: 'MYGIN-750-CONC', active: true, featured: false, badge: null },
```

- [ ] **Step 2: Verificar que el seed corre sin error**

Run: `node -c scripts/seed-emulator.mjs && echo "sintaxis ok"`
Expected: `sintaxis ok`

- [ ] **Step 3: Commit**

```bash
git add scripts/seed-emulator.mjs
git commit -m "test(e2e): producto dedicado mygin-concurrencia para overselling"
```

---

### Task 4: Test de overselling (el entregable de testing)

Dispara N create-order en paralelo contra `mygin-concurrencia` (stock 5) y verifica que exactamente 5 reservan (200), el resto recibe 409, y no hay 500. El path real (`createOrderServer`) ya es transaccional y correcto, así que el test debe pasar a la primera: es una verificación, no un arreglo.

**Files:**
- Create: `e2e/overselling.spec.ts`

- [ ] **Step 1: Escribir el test**

```ts
import { test, expect } from '@playwright/test';

/**
 * Overselling — verifica que createOrderServer (lib/server/checkout.ts) no sobre-vende
 * bajo concurrencia. La reserva de stock ocurre dentro de adminDb.runTransaction()
 * validando stock - stockReserved; este test lo prueba disparando N create-order en
 * paralelo contra un producto de stock conocido (mygin-concurrencia, stock 5).
 *
 * No usa página: el fixture `request` pega al endpoint contra el next dev + emulador
 * que levanta scripts/run-e2e.mjs.
 */

const STOCK = 5;
const N = 8;

const customer = {
  name: 'Cliente Concurrencia',
  email: 'concurrencia@test.local',
  phone: '+56912345678',
  address: { region: 'Araucanía', comuna: 'Villarrica', calle: 'Calle 1' },
};

test('N create-order en paralelo no sobre-venden el stock', async ({ request }) => {
  const fire = () =>
    request.post('/api/checkout/create-order', {
      data: { items: [{ productId: 'mygin-concurrencia', qty: 1 }], customer },
    });

  const responses = await Promise.all(Array.from({ length: N }, fire));
  const statuses = responses.map((r) => r.status());

  const ok = statuses.filter((s) => s === 200).length;
  const conflict = statuses.filter((s) => s === 409).length;
  const server = statuses.filter((s) => s >= 500).length;

  // Exactamente `STOCK` reservan; el resto choca con 409; cero 500 (la transacción
  // resuelve la contención sin romperse).
  expect(server).toBe(0);
  expect(ok).toBe(STOCK);
  expect(conflict).toBe(N - STOCK);
});
```

- [ ] **Step 2: Correr el test (debe pasar)**

Run: `pnpm test:e2e overselling.spec.ts`
Expected: `1 passed`. Si aparecen 500s o `ok !== 5`, es un hallazgo real de robustez de la transacción — investigar antes de seguir (no relajar la aserción sin entender por qué).

- [ ] **Step 3: Commit**

```bash
git add e2e/overselling.spec.ts
git commit -m "test(e2e): concurrencia de checkout no sobre-vende (200/409, cero 500)"
```

---

### Task 5: Verificación integral + cierre

**Files:**
- Modify: `tasks.md` (sección "Seguridad — endurecimiento final")

- [ ] **Step 1: Build limpio**

Run: `pnpm build`
Expected: build sin errores (las rutas y el seed no cambian el output; los índices/rules no afectan el build).

- [ ] **Step 2: Suite e2e completa verde**

Run: `pnpm test:e2e`
Expected: `105 passed` (104 previos + overselling). En particular `contact.spec.ts` y `resenas.spec.ts` deben seguir verdes — eso confirma que el `hasOnly` no rompió las escrituras legítimas.

- [ ] **Step 3: Actualizar `tasks.md`**

En la sección "Seguridad (endurecimiento final)", marcar como ✅ las partes de código (rules consolidadas, índices reales, pruebas de overselling) y dejar **App Check explícitamente diferido** (operativo: claves reCAPTCHA + enforcement; no cubre el checkout por Admin SDK). Agregar el pendiente operativo: `firebase deploy --only firestore:indexes,firestore:rules`.

- [ ] **Step 4: Commit**

```bash
git add tasks.md
git commit -m "docs(oleada2): endurecimiento de seguridad hecho (App Check diferido)"
```

---

## Pendiente operativo (usuario)

`firebase deploy --only firestore:indexes,firestore:rules` para publicar los índices nuevos (teamMembers, blogPosts) y las reglas endurecidas en el proyecto `theirgin`. Sin esto, las páginas `/equipo` y `/blog` fallarán sus queries en producción.
