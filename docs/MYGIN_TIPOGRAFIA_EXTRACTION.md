# MyGin — Tipografía del logo al web
## Extracción y aplicación de identidad tipográfica

---

## 1. Análisis: Qué tipografía usa la etiqueta

Tu **etiqueta del gin** usa una familia tipográfica clásica y coherente:

### Jerarquía visual de la etiqueta

```
┌─────────────────────────────────────┐
│  LONDON DRY GIN                     │  (Serif elegante, ALL CAPS)
│  + ornamentos decorativos           │  (Letras espaciadas)
├─────────────────────────────────────┤
│          MyGin                      │  (Serif similar, elegante)
│  GIN en rojo/crimsón                │  (Split color: blanco + rojo)
├─────────────────────────────────────┤
│    CHILEAN TASTE                    │  (Small caps, mismo serif)
│    (lo que es Chile)                │  (Subtítulo decorativo)
└─────────────────────────────────────┘
```

### Características tipográficas que extraemos

| Elemento | Característica | Propósito |
|----------|----------------|-----------|
| Headers (LONDON DRY, CHILEAN) | Serif clásico, ALL CAPS, espaciado generoso | Formalidad, lujo, tradición |
| Brand mark (MyGin) | Serif elegante, peso medio, lectura directa | Marca central, memorable |
| Body/decorativo | Serif fino, subtítulos, líneas finas | Detalles, elegancia, refinamiento |
| Espaciado | Letter-spacing 1.5–2px en headers | Respira, no apretado → lujo |
| Peso | Regular a Medium (no bold excesivo) | Elegante, no pesado |

---

## 2. El problema actual: Tipografía SaaS genérica

Tu sitio web usa:
```css
--font-headline: "Noto Serif", Georgia, serif;
--font-body:     "Manrope", system-ui, sans-serif;
```

**Análisis:**
- ✅ Noto Serif es legible
- ✅ Manrope es moderno y limpio
- ❌ Combinación serif + sans-serif es genérica (patrón SaaS)
- ❌ No refleja la elegancia clásica del logo
- ❌ Sin personalidad — podrías ser cualquier marca

**Resultado:** Inconsistencia visual logo ↔ web

---

## 3. Solución: Tipografía extraída de la etiqueta

### Fuentes recomendadas (Google Fonts + fallbacks)

#### Para headlines (h1, h2, h3)
**Propuesta: Playfair Display**

```css
font-family: "Playfair Display", Georgia, "Times New Roman", serif;
font-weight: 700;  /* Bold */
text-transform: uppercase;
letter-spacing: 1.2px;
```

**Por qué:**
- Serif clásico, alto contraste (como el logo)
- Diseñado para display elegante
- ALL CAPS se ve premium
- Letra-spacing generoso convierte en lujo
- Fallback a Georgia si falla (excelente)

**Uso en sitio:**
- `<h1>` — Hero headline
- `<h2>` — Section headlines (Historia, Producto, etc)
- Clase `.th` (text-headline) — labels destacados

#### Para body/subtítulos elegantes
**Propuesta: Cormorant Garamond**

```css
font-family: "Cormorant Garamond", Georgia, serif;
font-weight: 300;  /* Light */
letter-spacing: 0.8px;
```

**Por qué:**
- Serif ultra-elegante, refinado
- Peso light = sofisticado, no pesado
- Compatible con Playfair Display (familia serif coherente)
- Subtítulos y body text se ven cohesionados
- Raro verlo en webs → diferenciación

**Uso en sitio:**
- Subtítulos en cards
- Descripciones elegantes
- Clase `.ts` (text-secondary) cuando es decorativo

#### Para body regular (párrafos largos)
**Propuesta: Montserrat Light/Regular**

```css
font-family: "Montserrat", "Segoe UI", sans-serif;
font-weight: 300;  /* Light */
letter-spacing: 0.3px;
```

**Por qué:**
- Sans-serif limpio pero elegante (no tech/SaaS)
- Peso light mantiene sofisticación
- Mejor legibilidad en párrafos largos que serif puro
- Combina bien con Playfair Display en contraste clásico
- Google Fonts, cero costos

**Uso en sitio:**
- Párrafos de descripción del producto
- Body text en secciones texto-pesado
- Clase `.t` (text-body)

### Resumen de stack propuesto

```css
--font-headline: "Playfair Display", Georgia, "Times New Roman", serif;
--font-body:     "Montserrat", "Segoe UI", sans-serif;
--font-elegant:  "Cormorant Garamond", Georgia, serif;  /* Nuevo */
```

---

## 4. Cambios CSS concretos

### 4a. Importar fuentes de Google Fonts

Edita `index.html` y reemplaza la sección de fonts:

**Actual:**
```html
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400&family=Manrope:wght@300;400;600;800&display=swap" rel="stylesheet">
```

**Propuesto:**
```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Cormorant+Garamond:wght@300;400;500&family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
```

### 4b. Actualizar `css/main.css`

Busca la sección de variables de tipografía y reemplaza:

```css
@theme {
  /* ── Tipografía ── */
  --font-headline: "Playfair Display", Georgia, "Times New Roman", serif;
  --font-body:     "Montserrat", "Segoe UI", sans-serif;
  --font-label:    "Montserrat", "Segoe UI", sans-serif;
  /* ... resto de colores ... */
}
```

### 4c. Añadir clase para elegancia

Al final de `css/main.css`, agrega esta clase para usar en textos especiales:

```css
/* ── Tipografía elegante (para subtítulos, descripciones premium) ── */
.font-elegant {
  font-family: "Cormorant Garamond", Georgia, serif;
  font-weight: 300;
  letter-spacing: 0.8px;
}

/* ── Letter spacing en headlines para lujo ── */
h1, h2, h3, .th {
  letter-spacing: 1.2px;
}

/* ── ALL CAPS para verdadera elegancia (usado en headlines) ── */
.headline-caps {
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 700;
}
```

---

## 5. Dónde se aplican en el sitio

### Hero section
```html
<h1 class="headline-caps">El sabor que siempre fue chileno</h1>
<!-- Se renderiza como: -->
<!-- EL SABOR QUE SIEMPRE FUE CHILENO -->
<!-- en Playfair Display Bold, espaciado 1.5px -->
```

### Secciones (Historia, Producto, etc)
```html
<h2>Quiénes somos</h2>
<p class="font-elegant">Andrés Jeldres y Fernando Moreno fundaron MyGin...</p>
<!-- h2 = Playfair Display 700, uppercase -->
<!-- p.font-elegant = Cormorant Garamond 300, letra-spacing 0.8px -->
```

### Cards y componentes
```html
<div class="card">
  <h3>11 Botánicos</h3>
  <p class="font-elegant">Huesillo, tomillo y 9 más</p>
</div>
<!-- h3 = Playfair Display -->
<!-- p.font-elegant = Cormorant Garamond (subtítulo elegante) -->
```

### Body text regular (párrafos largos)
```html
<p>MyGin no es un gin que necesita explicación. Es reconocible...</p>
<!-- Montserrat 300-400, legible y sofisticado -->
```

### Footer/labels
```html
<a href="#">@mygin.cl</a>
<!-- Links = Montserrat con underline sutil, color crimson -->
```

---

## 6. Jerarquía tipográfica final

```
Playfair Display 800, ALL CAPS, letter-spacing 1.5px
↓ Hero headline (más importante)
└─ "EL SABOR QUE SIEMPRE FUE CHILENO"

Playfair Display 700, Sentence case, letter-spacing 1.2px
↓ Section headlines
└─ "Quiénes somos" / "El Gin" / "Recetas"

Cormorant Garamond 300, Regular case, letter-spacing 0.8px
↓ Subtítulos elegantes (decorativos)
└─ "Destilado a las orillas del Río Pedregoso"

Montserrat 400, Regular case
↓ Body text (párrafos, descripciones)
└─ "MyGin nació en 2025 de la amistad de..."

Montserrat 300, Regular case, smaller
↓ Labels, links, footer
└─ "@mygin.cl" / "Drink Responsibly"
```

---

## 7. Antes vs. Después: Cómo se vería

### ANTES
```
Noto Serif (genérico) +
Manrope sans-serif (moderno SaaS)
= Inconsistencia visual
```

### DESPUÉS
```
Playfair Display (clásico elegante) +
Cormorant Garamond (refinado) +
Montserrat (limpio pero sofisticado)
= Cohesión visual con el logo
```

### Ejemplo visual real

**ANTES:**
```
El sabor que siempre fue chileno.
(Noto Serif, normal case, weight 400, sin espaciado)
→ Legible pero sin personalidad
```

**DESPUÉS:**
```
EL SABOR QUE SIEMPRE FUE CHILENO
(Playfair Display, ALL CAPS, weight 700, letter-spacing 1.5px)
→ Elegante, premium, memorable
```

---

## 8. Plan de implementación

### Paso 1: Backup
```bash
cp index.html index.html.bak
cp css/main.css css/main.css.bak
```

### Paso 2: Actualizar fonts en index.html
Reemplaza el `<link>` de Google Fonts con el propuesto arriba.

### Paso 3: Actualizar variables en css/main.css
Reemplaza la sección `--font-headline` y `--font-body`.

### Paso 4: Añadir clases de tipografía
Agrega `.font-elegant` y `.headline-caps` al final de `css/main.css`.

### Paso 5: Testing
```bash
npm run dev
```

Verifica:
- [ ] Headlines en Playfair Display (serif clásico)
- [ ] Subtítulos elegantes en Cormorant Garamond
- [ ] Body text en Montserrat (limpio)
- [ ] ALL CAPS en hero se ve premium
- [ ] Letra-spacing genera respiro, no apriete
- [ ] Tipografías cargan sin errores (no hay FOUT)

### Paso 6: Git & Deploy
```bash
git add index.html css/main.css
git commit -m "feat: Extract typography from gin label

- Add Playfair Display for elegant headlines
- Add Cormorant Garamond for sophisticated subtitles
- Replace Manrope with Montserrat (lighter, more elegant)
- Implement proper letter-spacing for premium feel
- Align web typography with logo identity"

git push origin redesign/navy-crimson
npm run build
firebase deploy
```

---

## 9. Variantes y ajustes

### Si Playfair Display se carga lento
Fallback:
```css
--font-headline: "Playfair Display", "Times New Roman", Georgia, serif;
```

### Si quieres que body sea 100% serif (muy clásico)
```css
--font-body: "Cormorant Garamond", Georgia, serif;
font-weight: 400;
```
Pero entonces reads menos moderno. No recomendado.

### Si quieres más pesado que light
```css
--font-elegant: "Cormorant Garamond"
font-weight: 400;  /* En lugar de 300 */
```
Más impactante pero menos elegante.

### Para accesibilidad (lectura fácil)
Si alguien tiene dispraxia o dislexia:
- Body sigue siendo Montserrat 400
- Headlines puedes mantener Playfair pero sin ALL CAPS
- Aumenta line-height a 1.8 en body (desde 1.5)

---

## 10. Testing de carga (Performance)

Las fuentes propuestas son:
- **Playfair Display:** ~20KB (variable font, muy optimizada)
- **Cormorant Garamond:** ~15KB
- **Montserrat:** ~10KB

**Total:** ~45KB en Google Fonts (cacheable)

Esto es similar a lo que tenías. Sin penalty de performance.

---

## 11. Cheatsheet final

### Para developers (copy/paste)

```html
<!-- En <head> de index.html -->
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Cormorant+Garamond:wght@300;400;500&family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet">
```

```css
/* En css/main.css, dentro de @theme {} */
--font-headline: "Playfair Display", Georgia, "Times New Roman", serif;
--font-body:     "Montserrat", "Segoe UI", sans-serif;
--font-label:    "Montserrat", "Segoe UI", sans-serif;

/* Al final de css/main.css */
h1, h2, h3, .th {
  letter-spacing: 1.2px;
}

.headline-caps {
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 700;
}

.font-elegant {
  font-family: "Cormorant Garamond", Georgia, serif;
  font-weight: 300;
  letter-spacing: 0.8px;
}
```

---

## 12. Preguntas frecuentes

**P: ¿Playfair Display es difícil de leer?**  
R: En headlines (grandes) no. En body text sí. Por eso lo usamos solo para h1/h2/h3. Body es Montserrat.

**P: ¿Y si no carga Google Fonts?**  
R: Fallback a Georgia (serif built-in). Se verá bien pero menos elegante.

**P: ¿Puedo usar otra combinación de fuentes?**  
R: Sí, pero mantén estos principios:
- Headline: serif clásico (Bodoni, Didot, Abril Fatface, Playfair)
- Body: sans-serif limpio y ligero (Montserrat, Raleway, Lato)
- Elegancia: serif fino (Cormorant, Libre Baskerville)

**P: ¿Esto se ve bien en mobile?**  
R: Sí. Playfair Display es variable font (responsive). En mobile, reduce letter-spacing de 1.5px a 1px si es muy grande.

---

## 13. Próximo paso: Aplicar al sitio

Combina esto con el rediseño de colores (navy + crimson):

| Elemento | Color | Tipografía |
|----------|-------|-----------|
| Hero headline | Navy (#1a3a52) | Playfair Display 800, ALL CAPS |
| Hero accent | Crimson (#dc3545) | (mismo) |
| Section headlines | White (#ffffff) | Playfair Display 700, Sentence case |
| Subtítulos | Cream (#f8f5f0) | Cormorant Garamond 300 |
| Body | White (#ffffff) | Montserrat 400 |
| Links | Crimson (#dc3545) | Montserrat 500, underline |

---

**Resultado final:** Un sitio que visualmente, tonalmente y tipográficamente es **uno con la botella**. 

No es un sitio SaaS que vende gin.  
Es un **sitio de gin** que transmite lujo clásico desde el primer pixel.

¿Listo para implementar tipografía + colores juntos?
