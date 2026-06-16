# MyGin Redesign — Claude Code Implementation Guide
## Automatiza el rediseño de UI usando Claude Code

---

## 1. Requisitos previos

### 1.1 Verificar que Claude Code esté instalado
```bash
claude --version
```

Debe mostrar algo como `claude-code/1.x.x`.

**Si no está instalado:**
```bash
# En macOS/Linux
npm install -g @anthropic-ai/claude-code

# O con Homebrew (macOS)
brew install claude-code
```

### 1.2 Autenticar Claude
```bash
claude auth login
```

Te pedirá tu API key de Anthropic. Sigue los pasos en pantalla.

### 1.3 Navegar al proyecto MyGin
```bash
cd /ruta/a/mygin.cl
# Ejemplo:
# cd ~/projects/mygin.cl
```

Verifica que veas los archivos:
```bash
ls -la
# Debe mostrar: index.html, css/, js/, firebase.json, package.json, etc.
```

---

## 2. Paso 1: Backup de archivos críticos

Antes de hacer cambios, crea un backup:

```bash
# Backup de CSS
cp css/main.css css/main.css.bak.$(date +%s)

# Backup de HTML
cp index.html index.html.bak.$(date +%s)

# Verifica
ls -la css/main.css.bak.*
ls -la index.html.bak.*
```

Crea una rama Git para esta tarea:
```bash
git checkout -b redesign/navy-crimson-typography
git status
# Debe mostrar que estás en la rama nueva
```

---

## 3. Paso 2: Actualizar fonts en index.html

### Opción A: Usar Claude Code (recomendado)

```bash
claude code \
  --file index.html \
  --prompt "
Tu tarea: actualizar el <link> de Google Fonts en index.html para incluir las nuevas tipografías.

REEMPLAZA esto (busca la línea con 'fonts.googleapis.com'):
  <link href=\"https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400&family=Manrope:wght@300;400;600;800&display=swap\" rel=\"stylesheet\">

POR esto (exactamente):
  <link href=\"https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Cormorant+Garamond:wght@300;400;500&family=Montserrat:wght@300;400;500;600&display=swap\" rel=\"stylesheet\">

NOTAS CRÍTICAS:
- Solo reemplaza el <link> de fonts
- NO toques ningún otro código
- Mantén el resto del archivo idéntico
- Si hay múltiples <link> de Google Fonts, solo cambia el primero

Después de hacer el cambio, muestra solo la línea que actualizaste (con 5 líneas de contexto arriba y abajo).
"
```

### Opción B: Manual (si Claude Code falla)

Abre `index.html` en tu editor y:

1. Busca: `fonts.googleapis.com`
2. Reemplaza esta línea:
   ```html
   <link href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400&family=Manrope:wght@300;400;600;800&display=swap" rel="stylesheet">
   ```
   
   Con esta:
   ```html
   <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Cormorant+Garamond:wght@300;400;500&family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet">
   ```

3. Guarda con Ctrl+S (o Cmd+S en macOS)

### Verificar que funcionó
```bash
grep "Playfair+Display" index.html
# Debe mostrar la línea con el nuevo link
```

---

## 4. Paso 3: Actualizar CSS (colores + tipografía)

### Opción A: Usar Claude Code (recomendado para todo el archivo)

```bash
claude code \
  --file css/main.css \
  --prompt "
Tu tarea: actualizar css/main.css con colores y tipografías NUEVAS del rediseño MyGin.

PASO 1: Busca la sección @theme { ... } (es la primera parte del archivo, típicamente antes de line 50).

PASO 2: En esa sección, REEMPLAZA completamente el bloque de variables (desde @theme { hasta }) con esto:

@theme {
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
  
  /* ── Typography ── */
  --font-headline: 'Playfair Display', Georgia, 'Times New Roman', serif;
  --font-body: 'Montserrat', 'Segoe UI', sans-serif;
  --font-label: 'Montserrat', 'Segoe UI', sans-serif;
  
  /* ── Spacing ── */
  --spacing-unit: 8px;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* ── Border Radius ── */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  
  /* ── Shadow ── */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.2);
  
  /* ── Transitions ── */
  --transition-fast: 150ms ease-in-out;
  --transition-base: 250ms ease-in-out;
  --transition-slow: 350ms ease-in-out;
}

PASO 3: DESPUÉS del bloque @theme, busca donde están los selectores para h1, h2, h3, .th (text-headline).

AGREGA o REEMPLAZA estas reglas:

h1, h2, h3, .th {
  font-family: var(--font-headline);
  letter-spacing: 1.2px;
  color: var(--color-text-primary);
  font-weight: 700;
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

body, p, .text-body {
  font-family: var(--font-body);
  color: var(--color-text-primary);
  line-height: 1.6;
  font-weight: 400;
}

a {
  color: var(--color-secondary);
  text-decoration: none;
  transition: opacity var(--transition-base);
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
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--transition-base);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

button:hover {
  background-color: #b82835;
}

/* ── Preserve existing scroll reveal and nav states ── */
.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.reveal.active {
  opacity: 1;
  transform: translateY(0);
}

.nav--scrolled {
  background-color: rgba(15, 36, 53, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

CRÍTICO:
- NO elimines reglas existentes de .reveal, .nav--scrolled, details/summary, MINSAL
- Solo AGREGA o REEMPLAZA lo que se menciona arriba
- Mantén toda la lógica de scroll reveal intacta
- Si hay estilos de media queries, NO los toques

Cuando termines, muestra el bloque @theme completo y los selectores h1/h2/h3 que actualizaste (con 3 líneas de contexto antes y después).
"
```

### Opción B: Actualización manual en partes

Si prefieres hacerlo en pasos más pequeños:

#### Paso B.1: Actualizar colores
```bash
claude code \
  --file css/main.css \
  --prompt "
Busca el bloque @theme { en css/main.css (primeras 100 líneas).
REEMPLAZA todos los --color-* variables con:

  --color-primary: #1a3a52;
  --color-primary-dark: #0f2435;
  --color-secondary: #dc3545;
  --color-accent: #f8f5f0;
  --color-background: #1a3a52;
  --color-background-secondary: #234560;
  --color-text-primary: #ffffff;
  --color-text-secondary: #b8b5b0;
  --color-border: #2d556f;
  --color-border-secondary: #37637c;

Muestra el bloque @theme después del cambio.
"
```

#### Paso B.2: Actualizar tipografías
```bash
claude code \
  --file css/main.css \
  --prompt "
En css/main.css, dentro del bloque @theme { }, busca las variables --font-*.

REEMPLAZA con:
  --font-headline: 'Playfair Display', Georgia, 'Times New Roman', serif;
  --font-body: 'Montserrat', 'Segoe UI', sans-serif;
  --font-label: 'Montserrat', 'Segoe UI', sans-serif;

Muestra esas 3 líneas después del cambio.
"
```

#### Paso B.3: Agregar reglas tipográficas
```bash
claude code \
  --file css/main.css \
  --prompt "
En css/main.css, al final del archivo (ANTES de cualquier media query), AGREGA estas reglas:

h1, h2, h3, .th {
  font-family: var(--font-headline);
  letter-spacing: 1.2px;
  font-weight: 700;
}

h1 {
  text-transform: uppercase;
  letter-spacing: 1.5px;
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

button, .btn {
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

a {
  color: var(--color-secondary);
}

Muestra las reglas que agregaste.
"
```

### Verificar que funcionó
```bash
# Verificar colores
grep "color-primary:" css/main.css | head -3

# Verificar tipografías
grep "font-headline" css/main.css

# Verificar reglas nuevas
grep "headline-caps" css/main.css
```

---

## 5. Paso 4: Testing local

### 5.1 Iniciar servidor local
```bash
npm run dev
# O si uses un servidor diferente:
# python3 -m http.server 8000
# npx http-server -p 8000
```

Accede a `http://localhost:3000` (o el puerto configurado).

### 5.2 Checklist visual
Verifica en tu navegador:

- [ ] Fondo es **azul marino** (#1a3a52), no negro
- [ ] Botones CTA son **rojo crismón** (#dc3545)
- [ ] Texto es **blanco** en fondos oscuros
- [ ] Headlines se ven en **Playfair Display** (serif elegante, con espaciado)
- [ ] Body text es **Montserrat** (sans-serif limpio)
- [ ] Subtítulos (si existen) en **Cormorant Garamond** (serif refinado)
- [ ] ALL CAPS en hero headline se ve premium
- [ ] Links son **crismón** y clickeables
- [ ] NO hay errores en consola (F12 → Console)

### 5.3 Checklist técnico
```bash
# Verificar que no hay errores de sintaxis CSS
npm run build
# O:
# npx postcss css/main.css -o css/main.min.css

# Validar HTML
curl -s http://localhost:3000 | head -50
```

---

## 6. Paso 5: Ediciones finales con Claude Code

Si algo necesita ajuste, usa Claude Code de forma quirúrgica:

### Ejemplo: Si los links no se ven bien
```bash
claude code \
  --file css/main.css \
  --prompt "
Busca la regla 'a {' en css/main.css.

Reemplaza:
a {
  color: var(--color-secondary);
  text-decoration: none;
  transition: opacity var(--transition-base);
}

a:hover {
  opacity: 0.8;
  text-decoration: underline;
}

Muestra esas reglas después del cambio.
"
```

### Ejemplo: Si necesitas ajustar tamaños de fuente
```bash
claude code \
  --file css/main.css \
  --prompt "
En css/main.css, busca 'h1, .hero-headline {'.

Aumenta font-size a 3.5rem (en lugar de 3rem) si se ve pequeño en desktop.

Reemplaza:
h1, .hero-headline {
  font-size: 3.5rem;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

Muestra esa regla después del cambio.
"
```

---

## 7. Paso 6: Commit y Push

Una vez estés satisfecho:

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

# Push a la rama
git push origin redesign/navy-crimson-typography
```

---

## 8. Paso 7: Deploy

### Opción A: Firebase (si está configurado)
```bash
npm run build
firebase deploy
# Verifica: https://mygin.cl
```

### Opción B: Git-based deploy (Vercel, Netlify, etc)
El push a la rama debería triggerear un build automático.  
Espera a que terminen los checks, luego merge a `main`:

```bash
git checkout main
git pull origin main
git merge redesign/navy-crimson-typography
git push origin main
# El deploy se activa automáticamente
```

### Opción C: Manual
```bash
# Copiar archivos al servidor
scp -r * user@mygin.cl:/var/www/mygin.cl/

# O vía SFTP/FTP si lo prefieres
```

---

## 9. Rollback (si algo va mal)

### Rollback inmediato
```bash
# Revertir cambios en CSS y HTML
git checkout HEAD -- css/main.css index.html

# Verificar
git status
# Debe mostrar workspace limpio

# Redeploy versión anterior
npm run build
firebase deploy
```

### Rollback desde backup
```bash
# Si guardaste con timestamp:
cp css/main.css.bak.1718542342 css/main.css
# Redeploy y commit como hotfix
```

---

## 10. Troubleshooting

### Google Fonts no cargan
**Síntoma:** Headlines en serif genérico, body en system font.

**Causa:** Link de Google Fonts no se actualizó o está roto.

**Solución:**
```bash
# Verifica que el link esté bien
grep "googleapis.com" index.html

# Abre en navegador para probar:
# https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Montserrat:wght@300;400;500;600&display=swap
```

### Colores no cambian
**Síntoma:** Sigue viéndose negro + rosa.

**Causa:** CSS no se actualizó o está cacheado.

**Solución:**
```bash
# Hard refresh en navegador:
# Ctrl+Shift+R (Windows/Linux)
# Cmd+Shift+R (macOS)

# O limpia caché:
rm -rf .cache node_modules/.vite
npm run dev
```

### Letter-spacing muy grande
**Síntoma:** Títulos con espacios enormes entre letras.

**Causa:** letter-spacing 1.5px es mucho en móvil.

**Solución:**
```bash
claude code \
  --file css/main.css \
  --prompt "
En css/main.css, busca @media (max-width: 768px).

AGREGA dentro de esa media query:
h1, h2, h3 {
  letter-spacing: 0.8px;
}

.headline-caps {
  letter-spacing: 1px;
}

Esto reduce el espaciado en móvil para mejor legibilidad.
"
```

### Claude Code no encuentra el archivo
**Error:** "File not found"

**Solución:**
```bash
# Verifica que estés en la carpeta correcta
pwd
# Debe mostrar: /Users/tu-usuario/projects/mygin.cl

# Verifica que el archivo existe
ls css/main.css
# Debe existir
```

---

## 11. Cheatsheet de comandos Claude Code

### Editar un archivo completo
```bash
claude code --file css/main.css --prompt "Tu prompt aquí"
```

### Editar múltiples archivos
```bash
claude code \
  --file index.html \
  --file css/main.css \
  --prompt "Actualiza ambos archivos para usar colores navy+crimson"
```

### Ver status del proyecto
```bash
git status
git log --oneline -5
```

### Verificar cambios antes de commit
```bash
git diff css/main.css
# Muestra línea por línea qué cambió
```

---

## 12. Próximos pasos (después de deploy)

Una vez live:

1. **Testing en móvil real**
   ```bash
   # Accede desde tu teléfono a: https://mygin.cl
   # Verifica que se vea bien en pantalla pequeña
   ```

2. **Lighthouse audit**
   ```bash
   # En Chrome DevTools: Lighthouse tab
   # Target: Performance >90, Accessibility >90
   ```

3. **Cross-browser testing**
   - Safari (macOS + iOS)
   - Chrome (Windows, macOS, Linux)
   - Firefox
   - Edge

4. **Monitoreo de errores**
   - Verifica Google Analytics
   - Revisa error logs en Firebase Console

5. **Feedback de clientes/usuarios**
   - Enseña a stakeholders
   - Recolecta feedback
   - Itera si es necesario

---

## 13. Arquitectura de cambios (resumen)

```
mygin.cl/
├── index.html
│   └── [CAMBIO] <link> de Google Fonts (Playfair + Montserrat + Cormorant)
├── css/
│   └── main.css
│       ├── [CAMBIO] @theme { --color-* y --font-* variables }
│       ├── [AGREGADO] h1, h2, h3, .headline-caps rules
│       ├── [AGREGADO] .font-elegant class
│       ├── [PRESERVADO] .reveal, .nav--scrolled, details/summary
│       └── [PRESERVADO] MINSAL warning styles
└── [SIN CAMBIOS] Resto del proyecto (JS, estructura, lógica)
```

---

## 14. Documentación de referencia

Estos archivos tienen el análisis completo:
- `/mnt/user-data/outputs/MYGIN_UI_REDESIGN_PROPOSAL.md` — Análisis de colores
- `/mnt/user-data/outputs/MYGIN_TIPOGRAFIA_EXTRACTION.md` — Análisis de tipografía
- `/mnt/user-data/outputs/MYGIN_IMPLEMENTACION_PASO_A_PASO.md` — Guía manual paso a paso

---

## 15. Quick reference: Comandos útiles

```bash
# Iniciar proyecto
cd ~/projects/mygin.cl && npm run dev

# Hacer cambios con Claude Code
claude code --file css/main.css --prompt "Mensaje"

# Ver cambios
git diff

# Commit
git add . && git commit -m "mensaje"

# Deploy
npm run build && firebase deploy

# Rollback
git checkout HEAD -- css/main.css index.html

# Ver logs
git log --oneline -10

# Clean (si algo está roto)
rm -rf .cache && npm run dev
```

---

**¡Listo!** Sigue estos pasos y tu rediseño estará live en minutos. 🎉

Cualquier duda, usa Claude Code directamente en cada paso. Es tu asistente interactivo para todo el proyecto.
