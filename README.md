# MyGin — E-commerce

Gin contemporáneo chileno. Migrado de landing estática (Vanilla JS + Vite) a
e-commerce sobre **Next.js (App Router) + TypeScript + Tailwind v4 + Firebase**.

Plan completo: `~/.claude/plans/necesito-que-analices-requirements-md-sleepy-sparrow.md`.

## Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4 (PostCSS).
- **Backend:** Cloud Firestore + Cloud Functions (pagos Flow, inventario, cupones, moderación).
- **Hosting:** Firebase Hosting + frameworks (`southamerica-west1`); migrable a Cloud Run.
- **Pagos:** Flow/Webpay (reemplaza a Shopify).

## Desarrollo

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # build de producción (SSG/ISR)
pnpm typecheck    # tsc --noEmit
```

## Estructura

```
app/                    # App Router (layout, page, rutas)
components/
  sections/             # secciones de la landing (Hero, Historia, Producto, ...)
  nav/                  # Navbar, Footer
  ui/                   # Icon, CtaButton, SplitHeadline
  RevealObserver.tsx    # animaciones reveal-on-scroll (porta animations.js)
content/site.ts         # contenido estático de marketing (porta config.js)
lib/
  types.ts              # modelo de dominio CONGELADO (Product, Order, Coupon, ...)
  firebase/client.ts    # Firebase SDK navegador (Firestore + Auth + Analytics)
  firebase/admin.ts     # Admin SDK (solo servidor — privilegiado)
functions/              # Cloud Functions (Flow, inventario, cupones, ...)
firestore.rules         # reglas de seguridad (bloques por colección)
firestore.indexes.json  # índices compuestos
scripts/seed-firestore.mjs  # seed inicial del catálogo
```

## Estado de implementación (por oleadas)

- **Oleada 0 (fundación):** ✅ Landing migrada a Next.js + contratos compartidos
  (tipos, firebase wiring, rules base, config). ⏳ Auth + admin shell + CRUD productos.
- **Oleada 1 (paralela):** Catálogo+Carrito · Inventario+Flow+Cupones · Equipo+Contacto · Blog/CMS.
- **Oleada 2:** Comentarios moderados · Endurecimiento de seguridad.

## Imágenes

Colocar los assets en `public/assets/images/` (hero_bg.jpeg, botella_naturaleza.jpeg,
amigos.jpeg, supermercado.jpeg, marciano.jpeg). Se sirven en `/assets/images/*`.
