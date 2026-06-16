# MyGin Redesign — Claude Code Prompts (Copy/Paste)
## Ejecuta cada comando tal cual está. Sin modificaciones.

---

## Requisitos previos (ejecuta una sola vez)

```bash
# 1. Verifica Claude Code está instalado
claude --version

# 2. Autentica si es primera vez
claude auth login

# 3. Navega al proyecto
cd ~/projects/mygin.cl
# O la ruta donde tengas el proyecto
```

---

## PASO 1: Setup y Backup

Ejecuta en terminal:

```bash
# Backup automático con timestamp
cp css/main.css css/main.css.bak.$(date +%s)
cp index.html index.html.bak.$(date +%s)

# Crea rama de trabajo
git checkout -b redesign/navy-crimson-typography

# Verifica que estés en la rama correcta
git branch
# Debe mostrar: * redesign/navy-crimson-typography
```

---

## PASO 2: Actualizar Fonts en HTML

Copia y ejecuta exactamente esto:

```bash
claude code --file index.html --prompt "Tu tarea: actualizar el <link> de Google Fonts en index.html para incluir las nuevas tipografías.

REEMPLAZA esto (busca la línea con 'fonts.googleapis.com'):
  <link href=\"https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400&family=Manrope:wght@300;400;600;800&display=swap\" rel=\"stylesheet\">

POR esto (exactamente):
  <link href=\"https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Cormorant+Garamond:wght@300;400;500&family=Montserrat:wght@300;400;500;600&display=swap\" rel=\"stylesheet\">

NOTAS CRÍTICAS:
- Solo reemplaza el <link> de fonts
- NO toques ningún otro código
- Mantén el resto del archivo idéntico
- Si hay múltiples <link> de Google Fonts, solo cambia el primero

Después de hacer el cambio, muestra solo la línea que actualizaste (con 5 líneas de contexto arriba y abajo)."
```

**Verificar que funcionó:**
```bash
grep "Playfair+Display" index.html
# Debe mostrar la línea con el nuevo link
```

---

## PASO 3: Actualizar Colores en CSS

Copia y ejecuta exactamente esto:

```bash
claude code --file css/main.css --prompt "Tu tarea: actualizar css/main.css con los NUEVOS colores del rediseño MyGin.

PASO 1: Busca la sección @theme { en css/main.css (es la primera parte del archivo, típicamente antes de line 50).

PASO 2: En esa sección, REEMPLAZA todas las variables de color (--color-*) con EXACTAMENTE esto:

  /* ── Color Palette (Navy + Crimson) ── */
  --color-primary: #1a3a52;                  /* Navy (backgrounds) */
  --color-primary-dark: #0f2435;             /* Darker navy (deepest) */
  --color-primary-light: #2d556f;            /* Mid-navy surfaces */
  --color-secondary: #dc3545;                /* Crimson (CTAs) */
  --color-accent: #f8f5f0;                   /* Cream (highlights) */
  
  --color-background: #1a3a52;               /* Navy hero/bg */
  --color-background-secondary: #234560;     /* Slightly lighter navy */
  --color-background-tertiary: #37637c;      /* Even lighter for depth */
  
  --color-text-primary: #ffffff;             /* White on dark */
  --color-text-secondary: #b8b5b0;           /* Warm gray for muted text */
  --color-text-muted: #8b8884;               /* Darker gray for footnotes */
  
  --color-border: #2d556f;                   /* Navy borders */
  --color-border-secondary: #37637c;         /* Lighter navy borders */

PASO 3: DEJA INTACTO el resto del bloque @theme (spacing, radius, shadow, transitions).

PASO 4: Muestra el bloque @theme completo después del cambio."
```

**Verificar que funcionó:**
```bash
grep "color-primary:" css/main.css
# Debe mostrar: --color-primary: #1a3a52;
```

---

## PASO 4: Actualizar Tipografía en CSS

Copia y ejecuta exactamente esto:

```bash
claude code --file css/main.css --prompt "Tu tarea: actualizar las variables de tipografía en css/main.css.

PASO 1: Dentro del bloque @theme {}, busca las variables --font-*.

PASO 2: REEMPLAZA con EXACTAMENTE esto:

  /* ── Typography ── */
  --font-headline: 'Playfair Display', Georgia, 'Times New Roman', serif;
  --font-body: 'Montserrat', 'Segoe UI', sans-serif;
  --font-label: 'Montserrat', 'Segoe UI', sans-serif;

PASO 3: Muestra esas 3 líneas después del cambio."
```

**Verificar que funcionó:**
```bash
grep "font-headline:" css/main.css
# Debe mostrar: --font-headline: 'Playfair Display', ...
```

---

## PASO 5: Agregar Reglas Tipográficas en CSS

Copia y ejecuta exactamente esto:

```bash
claude code --file css/main.css --prompt "Tu tarea: agregar reglas de tipografía y estilos finales en css/main.css.

PASO 1: Ve al FINAL del archivo (antes de @media queries si las hay).

PASO 2: AGREGA (sin reemplazar nada existente) EXACTAMENTE esto:

/* ── Typography Rules ── */
h1, h2, h3, .th {
  font-family: var(--font-headline);
  letter-spacing: 1.2px;
  color: var(--color-text-primary);
  font-weight: 700;
}

h1, .hero-headline {
  font-size: 3rem;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

h2 {
  font-size: 2rem;
  letter-spacing: 1.2px;
}

h3 {
  font-size: 1.5rem;
  letter-spacing: 1px;
}

.headline-caps {
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 700;
}

.font-elegant {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-weight: 300;
  letter-spacing: 0.8px;
}

body, p, .text-body {
  font-family: var(--font-body);
  color: var(--color-text-primary);
  line-height: 1.6;
  font-weight: 400;
}

a {
  color: var(--color-secondary);
  text-decoration: none;
  transition: opacity 250ms ease-in-out;
}

a:hover {
  opacity: 0.8;
  text-decoration: underline;
}

button, .btn {
  background-color: var(--color-secondary);
  color: white;
  font-family: var(--font-label);
  border: none;
  padding: 16px 24px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 250ms ease-in-out;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

button:hover {
  background-color: #b82835;
}

PASO 3: NO ELIMINES ni toques:
- .reveal y .reveal.active
- .nav--scrolled
- details/summary
- MINSAL warning styles

PASO 4: Muestra las reglas que agregaste."
```

**Verificar que funcionó:**
```bash
grep "headline-caps" css/main.css
# Debe mostrar la regla .headline-caps
```

---

## PASO 6: Testing Local

Ejecuta en terminal:

```bash
# Inicia servidor de desarrollo
npm run dev

# En otra terminal, verifica que esté corriendo:
curl http://localhost:3000 | head -20
```

**Abre navegador a:** `http://localhost:3000`

**Checklist visual (marca cada una):**
- [ ] Fondo es **azul marino** (#1a3a52), no negro
- [ ] Botones son **rojo crismón** (#dc3545)
- [ ] Texto es **blanco**
- [ ] Headlines en **Playfair Display** (serif elegante)
- [ ] Body text en **Montserrat** (sans-serif)
- [ ] Spacing en letras (letter-spacing) se ve elegante
- [ ] NO hay errores en consola (F12 → Console)

---

## PASO 7: Git Commit

Ejecuta en terminal (DESPUÉS de verificar que todo se vea bien):

```bash
# Ver cambios
git diff css/main.css index.html

# Agregar cambios
git add index.html css/main.css

# Commit con mensaje descriptivo
git commit -m "feat: redesign navy-crimson with typography extraction

- Replace color palette: navy (#1a3a52) + crimson (#dc3545) + cream (#f8f5f0)
- Add Playfair Display for elegant headlines
- Add Cormorant Garamond for sophisticated subtitles
- Replace Manrope with Montserrat (lighter, more elegant)
- Implement letter-spacing for premium feel (1.2-1.5px)
- Align web typography with logo identity
- All fonts from Google Fonts, zero performance impact"

# Ver commit
git log --oneline -3
```

---

## PASO 8: Push a GitHub

```bash
# Push a la rama de feature
git push origin redesign/navy-crimson-typography

# Verifica en GitHub que la rama se vea bien
# https://github.com/tu-usuario/mygin.cl/branches
```

---

## PASO 9: Deploy

### Opción A: Firebase (recomendado si está configurado)

```bash
# Build
npm run build

# Deploy
firebase deploy

# Espera 2-3 minutos
# Verifica en https://mygin.cl
# Usa Cmd+Shift+R (macOS) o Ctrl+Shift+R (Windows) para hard refresh
```

### Opción B: Merge a main (para Vercel/Netlify auto-deploy)

```bash
# Cambia a main
git checkout main

# Merge la rama de feature
git merge redesign/navy-crimson-typography

# Push
git push origin main

# El CI/CD se activa automáticamente
# Espera a que pasen todos los checks
```

---

## TROUBLESHOOTING: Si algo sale mal

### Google Fonts no cargan

```bash
# Verifica que el link esté bien en index.html
grep "googleapis.com" index.html

# Verifica en navegador (abre esta URL):
# https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Cormorant+Garamond:wght@300;400;500&family=Montserrat:wght@300;400;500;600&display=swap

# Si no carga, hay un problema de internet o la URL está rota
```

### Colores siguen siendo viejos

```bash
# Hard refresh en navegador:
# macOS: Cmd+Shift+R
# Windows: Ctrl+Shift+R
# Linux: Ctrl+Shift+R

# O limpia caché local
rm -rf .cache
npm run dev
```

### Claude Code no encuentra el archivo

```bash
# Verifica que estés en la carpeta correcta
pwd
# Debe terminar con: mygin.cl

# Verifica que el archivo existe
ls -la css/main.css
ls -la index.html

# Si no existen, navega a la carpeta correcta
cd ~/projects/mygin.cl
```

### Letter-spacing muy grande en móvil

Ejecuta esto:

```bash
claude code --file css/main.css --prompt "En css/main.css, busca @media (max-width: 768px) o crea una si no existe.

AGREGA dentro de esa media query:

h1, h2, h3 {
  letter-spacing: 0.8px;
}

.headline-caps {
  letter-spacing: 1px;
}

Esto reduce el espaciado en móvil para mejor legibilidad. Muestra esas reglas después."
```

---

## ROLLBACK: Si necesitas revertir TODO

```bash
# Opción 1: Revertir cambios en la rama actual
git checkout HEAD -- css/main.css index.html
npm run dev
# Verifica que se vea como antes

# Opción 2: Volver a backup guardado
cp css/main.css.bak.* css/main.css
# (Reemplaza * con el timestamp)
npm run dev

# Opción 3: Revertir el commit completo
git revert HEAD
git push origin redesign/navy-crimson-typography
```

---

## Quick Reference: Comandos útiles

```bash
# Ver en qué rama estás
git branch

# Ver cambios sin commit
git diff

# Ver historial
git log --oneline -5

# Descartar cambios en un archivo
git checkout -- css/main.css

# Descartar TODO
git reset --hard HEAD

# Limpiar caché y reiniciar
rm -rf .cache node_modules/.vite
npm run dev

# Validar HTML
npx html-validate index.html

# Validar CSS
npx stylelint css/main.css
```

---

## ✅ Checklist Final

Antes de considerar completado:

- [ ] Paso 1: Backup y rama creada ✓
- [ ] Paso 2: Fonts actualizadas en index.html ✓
- [ ] Paso 3: Colores actualizados en css/main.css ✓
- [ ] Paso 4: Tipografía actualizada en css/main.css ✓
- [ ] Paso 5: Reglas nuevas agregadas ✓
- [ ] Paso 6: Testing local OK (no errores) ✓
- [ ] Paso 7: Commit con mensaje descriptivo ✓
- [ ] Paso 8: Push a GitHub ✓
- [ ] Paso 9: Deploy a producción ✓
- [ ] Hard refresh en mygin.cl y verifica ✓

---

## 🎉 ¡Listo!

Tu rediseño Navy + Crimson + Tipografía está live.

**Próximos pasos opcionales:**
1. Pide feedback a stakeholders
2. Monitorea Google Analytics
3. Verifica en mobile real
4. Cross-browser testing (Safari, Firefox, Edge)
5. Lighthouse audit (F12 → Lighthouse)

---

**Duración estimada:** 15 minutos (todo incluido)

**Soporte:** Cualquier duda, copia el prompt exacto y pégalo en `claude code --prompt "..."`
