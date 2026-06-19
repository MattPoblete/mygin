# Auditoría UX — MyGin

Auditoría completa del sitio público (es-CL), realizada con el skill `ux-designer`
(heurísticas WCAG 2.2 AA, NN/g, Baymard, Laws of UX). Dividida en 6 superficies por
agentes paralelos y consolidada aquí. **Excluye `/admin`** (back-office interno) salvo
algunos hallazgos de focus que aplican transversalmente.

Severidad: 🔴 Critical · 🟠 High · 🟡 Medium · ⚪ Low.

---

## Resumen ejecutivo — los 6 que más duelen

1. 🔴 **Cerrar el popup de pago se interpreta como éxito** → el usuario aterriza en la
   confirmación de un pedido **no pagado**, sin camino para reintentar. (`checkout/page.tsx:127-130`)
2. 🔴 **No existe `:focus-visible` en todo el sitio**; varios formularios incluso usan
   `outline-none`. Navegación por teclado sin indicador visible = fallo WCAG 2.4.7 global.
3. 🔴 **Costos ocultos**: despacho e IVA no se muestran antes de "Pagar"; el total real
   recién aparece dentro del popup. (`checkout/page.tsx:271-277`, `carrito/page.tsx:109`)
4. 🔴 **AgeGate sin semántica de diálogo**: no atrapa foco, no bloquea scroll, el teclado
   tabula "detrás" de la barrera; "No" expulsa a google.com. (`AgeGate.tsx:26-98`)
5. 🟠 **Contraste insuficiente** en carmesí-sobre-navy (eyebrows, links de footer, precios)
   ≈ 2.6–3.9:1 y gris-sobre-cream (subtítulos) ≈ 3.2:1 — bajo el 4.5:1 AA.
6. 🟠 **Agregar al carrito es un callejón sin salida**: solo el botón cambia a "Agregado"
   2s; sin toast ni acceso al carrito. (`AddToCartButton.tsx` + `CartProvider.tsx:132`)

---

## A. Transversales (arreglar una vez, impacta todo el sitio)

### 🔴 Focus por teclado inexistente
- **`app/globals.css`** — no hay regla `:focus-visible` para `.btn-*`, links de nav,
  cards (`<Link>`), `QtyStepper`, botones del AgeGate. → Añadir global:
  `:focus-visible { outline: 2px solid var(--crimson); outline-offset: 2px; }`
- **Formularios usan `outline-none`** y solo cambian color de borde (fallo 2.4.7 + 1.4.1):
  `ContactForm.tsx`, `admin/CouponForm.tsx`, `BlogPostForm.tsx`, `ProductForm.tsx`,
  `LoginScreen.tsx`. → Quitar `outline-none` o reemplazar por anillo de foco visible.

### 🟠 Contraste de color (WCAG AA 4.5:1 texto / 3:1 grande)
- Carmesí `#dc3545` sobre navy `#1a3a52` ≈ **2.6–3.9:1** — afecta eyebrows (`.mg-eyebrow`),
  links de footer, precios en carmesí, labels de formulario.
- Gris `--dark-gray #8b8884` sobre cream `#f8f5f0` ≈ **3.2:1** — subtítulos en
  `SectionTitle.tsx:74` (usado por `Distribuidores.tsx:24`, `Shop.tsx:29`).
  → Oscurecer a ~`#5a6b78`/`--navy-light` para subtítulos; subir luminosidad del carmesí
  o usar cream/blanco para textos pequeños sobre navy.

### 🟡 `prefers-reduced-motion` solo cubre `.reveal`
- Transforms sin gatear: `Experiencia.tsx:35` (scale-110 1000ms), `UrgencyBanner.tsx:24`,
  `Recetas.tsx:37` (rotate-180), `ProductCard.tsx:28` (scale-105), `Precios.tsx:47`,
  `Navbar.tsx:152,160` (slide/opacity del menú móvil).
  → Regla global: `@media (prefers-reduced-motion: reduce) { *{ transition-duration:.01ms!important; animation-duration:.01ms!important } }`.

### 🟡 Moneda no localizada
- `'$' + n.toLocaleString('es-CL')` concatenado a mano en `Shop.tsx:12`, `Producto.tsx:13`,
  `ProductCard.tsx`, `producto/[slug]/page.tsx:128-130` (anexa `product.currency` "CLP"),
  `admin/cupones/page.tsx`.
  → Helper único: `Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0})`.

### 🟡 Señalización solo por color
- Estados de stock (Agotado/En stock/Últimas N), subrayado de nav activo, feedback de
  cupón (`checkout/page.tsx:251-257`). → Añadir texto/ícono además del color.

### ⚪ Salvaguarda de encabezados
- `SectionTitle`/`SplitHeadline` fijan `<h2>`; una página que los use como título tope
  quedaría sin `<h1>`. Hoy OK (1 `<h1>` por página). → Prop `as`/`level`.

---

## B. Navegación y chrome global

- 🔴 **`content/site.ts:119` — anchor muerto `#recetas`**: la sección no se renderiza en
  `app/page.tsx`; no hace scroll en `/` y resuelve a `/#recetas` inexistente desde otras
  rutas. → Montar `<Recetas/>` o quitar el ítem de nav.
- 🔴 **`AgeGate.tsx:26-39`** — sin `role="dialog"`/`aria-modal`/`aria-labelledby`, sin mover
  foco, sin focus-trap, sin Escape, sin bloqueo de scroll. → Usar `<dialog>` nativo con
  `showModal()` o implementar el patrón completo.
- 🔴 **`Navbar.tsx:146-174`** — menú móvil sigue en el DOM y tabulable cuando "cerrado"
  (solo `translate-x-full`); abierto no atrapa foco, no bloquea scroll, sin Escape.
  `role="menu"`/`menuitem` es el patrón ARIA equivocado. → `inert`/render condicional +
  focus-trap + `<nav>`+`<ul>` en vez de menu/menuitem.
- 🟠 **`AgeGate.tsx:90-98`** — "No" → `window.location.href='google.com'`: dead-end hostil
  e irreversible. → Mostrar estado "debes ser mayor de 18" in situ, con opción de volver.
- 🟠 **`Navbar.tsx:84`** — `<header role="navigation">` borra el landmark `banner`. → Quitar
  el role del header; etiquetar los `<nav>` internos.
- 🟠 **`Navbar.tsx:122-141`** — toggle móvil ~34px (`p-1` sobre icono 26px) < 44px. → `p-3`.
- 🟡 **`Navbar.tsx:25-38`** — scroll-spy nunca limpia `activeId` (threshold 0.4) → subrayado
  puede quedar "pegado"; "Tienda" nunca refleja estar en `/tienda`. → Activar por sección
  más cercana al top + marcar "Tienda" por `pathname`.
- 🟡 **`Footer.tsx:22` / `site.ts:401`** — "Bebe responsablemente" apunta a `href="#"`
  (link legal a la nada). → Página real o texto estático.
- 🟡 **`Footer.tsx:11-23`** — links hardcodeados divergen de `site.ts:399-405` (dos fuentes
  de verdad). → Leer footer desde `content/site.ts`.
- ⚪ **`layout.tsx`** — falta "Saltar al contenido" (skip link) antes del navbar sticky.

---

## C. Tienda y detalle de producto

- 🔴 **`AddToCartButton.tsx:22-28` + `CartProvider.tsx:132-143`** — sin camino a checkout/
  carrito tras agregar; el botón revierte a 2s. → Toast "Agregado" con "Ir al carrito" /
  "Seguir comprando", o abrir drawer.
- 🟠 **`QtyStepper.tsx:36,48`** — botones 40×40px < 44px. → `h-11 w-11`.
- 🟠 **`ProductCard.tsx:40-44`** — "Agotado" solo overlay visual; resto de la card sigue
  "comprable", sin indicación programática. → Texto SR "Agotado", atenuar precio, `aria-disabled`.
- 🟠 **`producto/[slug]/page.tsx:134-148`** — urgencia/positivo de stock por color+ícono
  `aria-hidden`. → Mantener texto y asegurar contraste de `text-secondary`/`text-primary-fixed`.
- 🟠 **`AddToCartButton.tsx:49`** — `aria-live` sobre el propio botón que cambia su label
  (no se anuncia fiable); `QtyStepper.tsx:40` parlotea en cada incremento. → `role="status"`
  visualmente oculto dedicado; quitar `aria-live` del valor de cantidad.
- 🟡 **`tienda/page.tsx:29-56`** — sin skeleton/estado de carga y sin orden/filtro UI
  (orden hardcodeado). → Suspense fallback + control de orden cuando crezca el catálogo.
- 🟡 **`producto/[slug]/page.tsx:98-105`** — thumbnails repiten `alt` idéntico y no son
  interactivos. → alts indexados o `alt=""`; thumbs clicables o quitarlos.
- 🟡 **PDP sin señales de confianza** (despacho, métodos de pago, devoluciones, reseñas).
  → Bloque de confianza cerca del CTA.
- 🟡 **`tienda/page.tsx:22` y `producto/[slug]/page.tsx:65`** — fetch Firestore sin try/catch
  ni estado de error/reintento. → Error boundary amigable.
- ⚪ **`Badge.tsx` existe pero la tienda hace pills inline** (drift); `longDesc` `whitespace-pre-line`
  como muro de texto; feedback fijo de 2s resetea la cantidad elegida.

---

## D. Carrito y checkout (flujo de conversión — máxima prioridad)

- 🔴 **`checkout/page.tsx:127-130`** — `win.closed` → `finish()` sin status → siempre navega
  a confirmación, aun si el usuario abandonó/rechazó. → Solo navegar con status explícito;
  ante cierre sin mensaje, volver al form con "No recibimos confirmación. ¿Reintentar?".
- 🔴 **`checkout/page.tsx:131-135`** — si el popup se bloquea/cierra y el mensaje no llega,
  `busy`/`waiting` quedan `true` para siempre ("Esperando el pago…" sin salida). → Botón
  "Cancelar/Reintentar" durante `waiting` + timeout que restaura el form.
- 🔴 **`checkout/page.tsx:155-199`** — **cero `autoComplete`** en name/email/tel/RUT/region/
  comuna/calle → sin autofill. → `name`, `email`, `tel`, `address-level1/2`, `street-address`.
- 🟠 **`checkout/page.tsx:89-96,202`** — validación solo en submit, banner único lejos del
  campo, sin `aria-invalid`/`aria-describedby`. → Validar on-blur, error bajo cada campo.
- 🟠 **`checkout/page.tsx:156-199`** — campos requeridos sin marcar (solo se marcan los
  "opcional"). → Asterisco visible + `aria-required`.
- 🟠 **`checkout/page.tsx:159-166`** — phone sin `inputMode`/placeholder; RUT texto plano sin
  máscara/validación (formato es-CL con dígito verificador). → `inputMode`, placeholders
  (`+56 9 …`, `12.345.678-9`), validar RUT; aclarar para qué se pide.
- 🟠 **`checkout/page.tsx:271-277` / `carrito/page.tsx:109-111`** — despacho/IVA invisibles
  antes del popup (costo oculto). → Mostrar despacho ("Gratis"/"según comuna") y total real
  antes de "Pagar"; declarar IVA incluido.
- 🟠 **`confirmacion/[orderId]/page.tsx:38-79`** — sin "qué sigue" (correo, plazo de despacho,
  soporte). → Afirmación de éxito + "Te enviamos un correo a {email}" + plazo + contacto.
- 🟠 **`confirmacion/[orderId]/page.tsx:43-45`** — renderiza igual todos los estados; un pago
  fallido/cancelado se ve como pedido normal sin reintento. → Ramear UI por status con
  "Reintentar pago / Volver al carrito".
- 🟡 Popup sin expectativa previa ni manejo de bloqueo (`page.tsx:107-112,214`); retorno sin
  auto-poll (`retorno/page.tsx:74-84`); eliminar ítem y "Vaciar carrito" sin undo/confirm
  (`carrito/page.tsx:72-79,118-124`); comuna texto libre independiente de región
  (`page.tsx:182-184`); `<img>` de líneas sin dimensiones → CLS (`carrito/page.tsx:52`);
  cupón "aplicado" persiste al editar el código (`page.tsx:251-257`).
- ⚪ Sin skeletons pre-hidratación; sin indicador de pasos Carrito→Checkout→Pago→Confirmación;
  microcopy de estados ("quedó sin pagar", "Volviendo a la tienda" engañoso).

---

## E. Formularios y marketing

- 🟠 **`ContactForm.tsx:47-58,138-142`** — sin validación on-blur; un error a la vez (return
  al primer fallo); `<p role="alert">` al fondo, lejos del campo; sin `aria-invalid`/
  `aria-describedby`/`id`. → Validación por campo on-blur + error junto al input.
- 🟠 **`ContactForm.tsx:108-135`** — requeridos sin marcar mientras los opcionales sí
  ("opcional"). → Asterisco en requeridos.
- 🟠 **`Contacto.tsx` vs `contacto/page.tsx`** — dos superficies de contacto con info, tono
  (casual vs B2B) y canales distintos (la sección omite el `mailto:`); posible `id="contacto"`
  duplicado. → Consolidar en un set/componente; la sección que enlace a `/contacto`.
- 🟡 **`blog/[slug]/page.tsx:66-74`** — sin fecha de publicación (existe `publishedAt`) ni
  tiempo de lectura. → Render `Intl.DateTimeFormat('es-CL')` + lectura estimada.
- 🟡 **`blog/page.tsx:48-56`** — card sin `coverImage` deja caja gris vacía. → Placeholder de
  marca o colapsar el área.
- 🟡 **`equipo/page.tsx` / `blog/page.tsx:21`** — fallo de fetch Firestore indistinguible de
  "vacío" ("Aún no hay artículos" cuando el backend está caído). → Diferenciar error de vacío.
- 🟡 **`blog/page.tsx:51-55` / `[slug]:79`** — `alt={post.title}` duplica el `<h2>/<h1>`
  adyacente. → `alt=""` para portadas decorativas.
- ⚪ `select` "Tipo de consulta" default "comercial" sin neutral; submit sin `aria-busy`;
  éxito sin plazo/próximo paso ni focus management; tags del blog estilizados como pills
  pero inertes (`[slug]:91-98`); headlines con `\n` embebido (frágil i18n).

**Bien hecho:** `autoComplete` en ContactForm, `role="alert"`, Markdown sin `dangerouslySetInnerHTML`,
jerarquía de headings, metadata/SEO, fallback SSG de equipo.

---

## F. Landing y secciones

- 🟠 **`globals.css:207-215`** — `.reveal{opacity:0}` se limpia **solo** por JS
  (`RevealObserver`). Si la hidratación/observer falla, el `<h1>` del Hero y casi todo el
  contenido quedan invisibles; el fallback de `prefers-reduced-motion` no cubre el caso
  no-JS. → Default visible y animar solo al observar (o gatear el estado oculto tras una
  clase `js` en `<html>`).
- 🟠 **`SectionTitle.tsx:74`** — subtítulo `--dark-gray` sobre cream ≈ 3.2:1 (ver Transversales).
- 🟡 **Drift de secciones sin usar**: `Experiencia`, `Recetas`, `Testimonios`, `Precios`,
  `UrgencyBanner` no se renderizan en `app/page.tsx` pero `content/site.ts:208-397` mantiene
  su copy. → Decidir render-o-borrar para frenar el drift.
- 🟡 **`Contacto.tsx:11-15`** — sin WhatsApp/teléfono (canal por defecto del retail chileno).
  → Añadir WhatsApp a `site.brand`.
- 🟡 **`Distribuidores.tsx:23`** — "Ya estamos en tu ciudad" sobre-promete (los datos cubren
  solo la zona lacustre de Araucanía). → Suavizar; apoyarse en "Pedir online → todo Chile".
- ⚪ **`Hero.tsx:54` / `site.ts:128-129`** — el accent incluye el punto (`copa.` colorea la
  puntuación). → `accent: 'copa'`.

---

## G. Admin (back-office interno)

Prioridades distintas al sitio público: tablas de datos, CRUD y seguridad de operación.
Los transversales (A) aplican igual; aquí solo lo específico de admin.

### G.1 Shell, auth y tabla de pedidos

- 🔴 **`admin/pedidos/page.tsx:40`** — `limit(100)` fijo, sin paginación ni "mostrando 100 de
  N". Pasados 100 pedidos, el resto es inalcanzable desde el admin (pérdida de datos para el
  operador). → Paginación por cursor (`startAfter`) + "Cargar más" + conteo total/visible.
- 🟠 **`admin/pedidos/page.tsx:55-104`** — la "tabla" es un dump estático: sin orden, sin
  filtro por estado, sin búsqueda por id/email. Es el trabajo principal del admin. → Filtro de
  estado, búsqueda id+email, headers ordenables (Total/Fecha).
- 🟠 **`admin/pedidos/page.tsx:25-33,92-94`** — estado por color a `text-xs`; `pending` y
  `expired` comparten color, igual `failed`/`cancelled` → indistinguibles. → Chips con
  forma/fondo + texto, distinguibles sin color.
- 🟠 **`LoginScreen.tsx:91-126`** — sin recuperación de contraseña; un admin que la olvida
  queda bloqueado. → "¿Olvidaste tu contraseña?" con `sendPasswordResetEmail`.
- 🟠 **`AdminShell.tsx:42-56`** — nav activa solo por `border-b-2` (sin `aria-current`), `<nav>`
  sin nombre accesible, y sin estrategia responsive (5+ ítems uppercase desbordan en móvil).
  → `aria-current="page"` + `aria-label`; nav scrollable o menú colapsable bajo breakpoint.
- 🟡 **`AdminGate.tsx:29-30` + `LoginScreen.tsx:19`** — un usuario logueado sin permisos ve el
  mismo "MyGin Admin" con error embebido (parece fallo de login), sin mostrar con qué cuenta
  entró. → Pantalla "Sin permisos" con el email y "Cerrar sesión / cambiar de cuenta".
- 🟡 **`admin/pedidos/page.tsx:91-99`** — filas no accionables: no se puede abrir el pedido ni
  ver items/teléfono/RUT/dirección/estado Flow (todos existen en `types.order.ts:41-80`). →
  Fila enlaza a detalle (o fila expandible).
- 🟡 **`admin/page.tsx:8-49`** — dashboard solo muestra métricas de productos; ignora pedidos
  (sin pendientes de pago, por despachar, ventas). → KPIs de pedidos + atajo a los que requieren
  acción.
- 🟡 Estados de carga = una línea `animate-pulse` sin reintento (`pedidos/page.tsx:51-52`);
  "Salir" sin confirmación junto al email (`AdminShell.tsx:33-39`); `autoComplete` ausente en
  login (`LoginScreen.tsx:96-116`).
- ⚪ Id de pedido crudo de 20 chars como identificador (`pedidos:71` → truncar + copiar);
  `<table>` sin `caption`/`scope="col"` (`pedidos:56-103`); errores sin `role="alert"`
  (`LoginScreen:118`, `page:26`); Google vs email con prominencia casi igual (`LoginScreen:75-125`).

### G.2 CRUD (productos / cupones / blog)

- 🔴 **`productos/page.tsx:22`, `cupones/page.tsx:34`, `blog/page.tsx:27`** — delete con
  `window.confirm()` nativo: irreversible, sin undo, sin estado "eliminando…", inconsistente en
  teclado/AT. → Modal in-app que nombre el ítem + soft-delete con undo (toast 4-8s); deshabilitar
  fila durante el borrado.
- 🔴 **`ProductForm.tsx:65`, `CouponForm.tsx:59`, `BlogPostForm.tsx:74`** — al guardar hace
  `router.push` a la lista sin confirmación de éxito; no se distingue guardado de glitch. →
  Toast "Guardado" en el destino o flash de la fila.
- 🟠 **Los 3 forms** — sin aviso de cambios sin guardar: "Cancelar"/back/nav descartan todo
  (el body markdown del blog vive solo en estado, `BlogPostForm.tsx:163`). → Guard de dirty-state
  + `beforeunload`.
- 🟠 **`ProductForm.tsx:38`, `CouponForm.tsx:37`, `BlogPostForm.tsx:43`** — validación solo en
  submit; banner único al fondo (puede quedar bajo el fold). → Validar on-blur, error junto al
  campo, foco al primer inválido.
- 🟠 **Required sin marcar** (`ProductForm.tsx:79` etc.); varios semánticamente requeridos
  (price/stock/type) sin `required`. → Marcador visible + alinear `required` con el backend.
- 🟠 **Imágenes solo por URL** (`ProductForm.tsx:50,115`, `BlogPostForm.tsx:126`) sin preview,
  sin validar, sin alt. Una URL mal tipeada publica imagen rota. → Thumbnail en vivo + campo alt.
- 🟠 **Campos identidad bloqueados con `disabled`+`opacity-60`** (`ProductForm.tsx:84-90`,
  `CouponForm.tsx:73-81`) — no enfocables, color como único signo, sin explicar por qué. →
  `readonly`/texto estático con ícono candado + nota "no editable".
- 🟡 Cupón sin validar rango de fechas (vence < vigente) ni tope de % >100 (`CouponForm.tsx:98-126`);
  stock editable bajo `stockReserved` sin aviso (`ProductForm.tsx:53-54`); listas sin búsqueda/
  orden/filtro; estado activo/inactivo solo por color (`productos:84-91`); preview markdown a
  pantalla completa con toggle de bajo contraste (`BlogPostForm.tsx:144-170`); errores de delete
  lejos de la fila (`productos:25`).
- ⚪ Sin contador de caracteres en excerpt/SEO (`BlogPostForm.tsx:122,177`); convenciones de
  multi-valor inconsistentes (imágenes por línea vs tags por coma); "Cancelar" habilitado durante
  guardado; placeholder de preview renderizado como markdown (`BlogPostForm.tsx:159`); agrupación
  de campos inconsistente (solo blog usa `<fieldset>`).

---

## Orden sugerido de remediación

**Sprint 1 (bloqueantes / conversión):**
1. Popup de pago: status explícito + ramear confirmación por estado + salida de `waiting` (D).
2. Mostrar despacho/IVA/total real antes de pagar (D).
3. `:focus-visible` global + quitar `outline-none` (A/Transversal).
4. AgeGate como diálogo accesible; reconsiderar el "No"→google (B).

**Sprint 2 (accesibilidad + confianza):**
5. Contraste carmesí-on-navy y gris-on-cream (A).
6. Checkout: autocomplete, required markers, validación on-blur, RUT/phone (D).
7. Add-to-cart con toast/acceso al carrito (C).
8. Menú móvil inert + focus-trap; anchor `#recetas` (B).

**Sprint 3 (pulido):**
9. `prefers-reduced-motion` global, helper `Intl` de moneda, touch targets 44px (A/C).
10. Consolidar contacto, fecha en blog, robustez `.reveal`, WhatsApp, decidir secciones sin uso.

**Admin (paralelo, riesgo operativo):**
- A1. Delete con confirmación in-app + undo; confirmación de guardado; guard de cambios sin
  guardar (G.2) — evita pérdida de datos del operador.
- A2. Paginación + filtro/búsqueda/orden en pedidos; filas accionables a detalle (G.1).
- A3. Recuperación de contraseña + estado "sin permisos" claro (G.1).

---

## Cobertura y notas

- 8 superficies auditadas en paralelo: nav/chrome, tienda/producto, carrito/checkout,
  forms/marketing, landing, a11y/design-system (transversal), y **admin** (shell+auth+pedidos,
  y CRUD productos/cupones/blog).
- Cubre todo el sitio público + el back-office `/admin`.
- Los subagentes no pudieron leer los `references/*.md` del skill (permiso fuera del proyecto);
  auditaron con `SKILL.md` + heurísticas WCAG 2.2/NN/g/Baymard. Las citas `file:line` provienen
  del código del proyecto leído directamente.
