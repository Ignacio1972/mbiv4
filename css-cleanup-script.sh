#!/bin/bash

# CSS Cleanup Script - MBI-v4
# Extracción y organización de CSS limpio

echo "🧹 CSS Cleanup Script - MBI-v4"
echo "================================"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Crear backup antes de empezar
BACKUP_DIR="css-backup-$(date +%Y%m%d_%H%M%S)"
echo -e "${YELLOW}📦 Creando backup en $BACKUP_DIR...${NC}"
mkdir -p "$BACKUP_DIR"

# Backup de archivos CSS principales
cp -r modules/*/styles "$BACKUP_DIR/" 2>/dev/null
cp -r styles "$BACKUP_DIR/" 2>/dev/null
cp -r new-design "$BACKUP_DIR/" 2>/dev/null
echo -e "${GREEN}✓ Backup completado${NC}\n"

# Crear nueva estructura
echo -e "${BLUE}🏗️ Creando nueva estructura styles-v5...${NC}"
mkdir -p styles-v5/{1-core,2-components,3-modules}

# 1. EXTRAER VARIABLES Y TOKENS
echo -e "\n${YELLOW}1️⃣ Extrayendo variables y design tokens...${NC}"

cat > styles-v5/1-core/variables.css << 'VARIABLES'
/* ========================================
   VARIABLES CENTRALIZADAS - MBI-v4
   ======================================== */

:root {
  /* Colores principales */
  --color-primary: #7C3AED;
  --color-primary-dark: #6D28D9;
  --color-primary-light: #8B5CF6;
  
  --color-secondary: #10B981;
  --color-accent: #F59E0B;
  --color-danger: #EF4444;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-info: #3B82F6;
  
  /* Grises */
  --color-gray-50: #F9FAFB;
  --color-gray-100: #F3F4F6;
  --color-gray-200: #E5E7EB;
  --color-gray-300: #D1D5DB;
  --color-gray-400: #9CA3AF;
  --color-gray-500: #6B7280;
  --color-gray-600: #4B5563;
  --color-gray-700: #374151;
  --color-gray-800: #1F2937;
  --color-gray-900: #111827;
  
  /* Fondos dark mode */
  --bg-primary: #0F0F0F;
  --bg-secondary: #1A1A1A;
  --bg-tertiary: #252525;
  --bg-elevated: #2A2A2A;
  
  /* Texto */
  --text-primary: #FFFFFF;
  --text-secondary: #A0A0A0;
  --text-muted: #6B7280;
  
  /* Espaciado */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  
  /* Bordes */
  --border-radius-sm: 0.25rem;
  --border-radius-md: 0.5rem;
  --border-radius-lg: 0.75rem;
  --border-radius-xl: 1rem;
  --border-radius-full: 9999px;
  
  /* Sombras */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  
  /* Transiciones */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 350ms ease;
  
  /* Z-index */
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
}
VARIABLES

echo -e "${GREEN}✓ Variables creadas${NC}"

# 2. CREAR RESET BÁSICO
echo -e "\n${YELLOW}2️⃣ Creando reset CSS...${NC}"

cat > styles-v5/1-core/reset.css << 'RESET'
/* ========================================
   RESET & BASE - MBI-v4
   ======================================== */

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  line-height: 1.6;
  color: var(--text-primary);
  background: var(--bg-primary);
  min-height: 100vh;
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: var(--spacing-md);
}

h1 { font-size: 2.5rem; }
h2 { font-size: 2rem; }
h3 { font-size: 1.75rem; }
h4 { font-size: 1.5rem; }
h5 { font-size: 1.25rem; }
h6 { font-size: 1rem; }

a {
  color: var(--color-primary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

a:hover {
  color: var(--color-primary-light);
}

img, video {
  max-width: 100%;
  height: auto;
  display: block;
}

button, input, select, textarea {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
}

button {
  cursor: pointer;
  border: none;
  background: none;
}
RESET

echo -e "${GREEN}✓ Reset creado${NC}"

# 3. CREAR UTILITIES
echo -e "\n${YELLOW}3️⃣ Creando utilidades...${NC}"

cat > styles-v5/1-core/utilities.css << 'UTILITIES'
/* ========================================
   UTILITIES - MBI-v4
   ======================================== */

/* Display */
.d-none { display: none !important; }
.d-block { display: block !important; }
.d-flex { display: flex !important; }
.d-grid { display: grid !important; }

/* Flexbox */
.flex-row { flex-direction: row; }
.flex-column { flex-direction: column; }
.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }
.align-start { align-items: flex-start; }
.align-center { align-items: center; }
.align-end { align-items: flex-end; }
.flex-wrap { flex-wrap: wrap; }
.flex-1 { flex: 1; }
.gap-1 { gap: var(--spacing-sm); }
.gap-2 { gap: var(--spacing-md); }
.gap-3 { gap: var(--spacing-lg); }

/* Spacing */
.m-0 { margin: 0 !important; }
.m-1 { margin: var(--spacing-sm); }
.m-2 { margin: var(--spacing-md); }
.m-3 { margin: var(--spacing-lg); }
.mt-1 { margin-top: var(--spacing-sm); }
.mt-2 { margin-top: var(--spacing-md); }
.mt-3 { margin-top: var(--spacing-lg); }
.mb-1 { margin-bottom: var(--spacing-sm); }
.mb-2 { margin-bottom: var(--spacing-md); }
.mb-3 { margin-bottom: var(--spacing-lg); }
.p-0 { padding: 0 !important; }
.p-1 { padding: var(--spacing-sm); }
.p-2 { padding: var(--spacing-md); }
.p-3 { padding: var(--spacing-lg); }

/* Text */
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.text-muted { color: var(--text-muted); }
.text-primary { color: var(--color-primary); }
.text-danger { color: var(--color-danger); }
.text-success { color: var(--color-success); }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }

/* Width */
.w-100 { width: 100%; }
.w-auto { width: auto; }

/* Border radius */
.rounded { border-radius: var(--border-radius-md); }
.rounded-lg { border-radius: var(--border-radius-lg); }
.rounded-full { border-radius: var(--border-radius-full); }

/* Visibility */
.visible { visibility: visible; }
.invisible { visibility: hidden; }

/* Opacity */
.opacity-0 { opacity: 0; }
.opacity-50 { opacity: 0.5; }
.opacity-100 { opacity: 1; }

/* Cursor */
.cursor-pointer { cursor: pointer; }
.cursor-not-allowed { cursor: not-allowed; }

/* Transitions */
.transition { transition: all var(--transition-base); }
.transition-fast { transition: all var(--transition-fast); }
.transition-slow { transition: all var(--transition-slow); }
UTILITIES

echo -e "${GREEN}✓ Utilidades creadas${NC}"

# 4. EXTRAER COMPONENTES COMUNES
echo -e "\n${YELLOW}4️⃣ Extrayendo componentes...${NC}"

# Botones
cat > styles-v5/2-components/buttons.css << 'BUTTONS'
/* ========================================
   BUTTONS - MBI-v4
   ======================================== */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-sm) var(--spacing-lg);
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: var(--border-radius-md);
  transition: all var(--transition-fast);
  cursor: pointer;
  outline: none;
  border: 2px solid transparent;
  gap: var(--spacing-sm);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Variantes */
.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border-color: var(--color-gray-700);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-elevated);
}

.btn-danger {
  background: var(--color-danger);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #DC2626;
}

.btn-success {
  background: var(--color-success);
  color: white;
}

.btn-ghost {
  background: transparent;
  color: var(--text-primary);
}

.btn-ghost:hover:not(:disabled) {
  background: var(--bg-tertiary);
}

/* Tamaños */
.btn-sm {
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: 0.75rem;
}

.btn-lg {
  padding: var(--spacing-md) var(--spacing-xl);
  font-size: 1rem;
}

.btn-icon {
  padding: var(--spacing-sm);
  width: 40px;
  height: 40px;
}

/* Estados */
.btn-loading {
  position: relative;
  color: transparent;
}

.btn-loading::after {
  content: "";
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
BUTTONS

echo -e "${GREEN}✓ Botones creados${NC}"

# Forms
cat > styles-v5/2-components/forms.css << 'FORMS'
/* ========================================
   FORMS - MBI-v4
   ======================================== */

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-label {
  display: block;
  margin-bottom: var(--spacing-sm);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-control {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 0.875rem;
  color: var(--text-primary);
  background: var(--bg-tertiary);
  border: 1px solid var(--color-gray-700);
  border-radius: var(--border-radius-md);
  transition: all var(--transition-fast);
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.form-control:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Textarea */
.form-textarea {
  min-height: 100px;
  resize: vertical;
}

/* Select */
.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right var(--spacing-md) center;
  padding-right: calc(var(--spacing-md) * 2.5);
}

/* Checkbox & Radio */
.form-check {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.form-check-input {
  width: 18px;
  height: 18px;
  margin-right: var(--spacing-sm);
  accent-color: var(--color-primary);
}

/* Input Group */
.input-group {
  display: flex;
  align-items: stretch;
}

.input-group .form-control {
  border-radius: 0;
}

.input-group .form-control:first-child {
  border-radius: var(--border-radius-md) 0 0 var(--border-radius-md);
}

.input-group .form-control:last-child {
  border-radius: 0 var(--border-radius-md) var(--border-radius-md) 0;
}

.input-group-addon {
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-md);
  background: var(--bg-elevated);
  border: 1px solid var(--color-gray-700);
  color: var(--text-secondary);
  font-size: 0.875rem;
}

/* Validation */
.is-invalid {
  border-color: var(--color-danger) !important;
}

.invalid-feedback {
  display: block;
  margin-top: var(--spacing-xs);
  font-size: 0.75rem;
  color: var(--color-danger);
}
FORMS

echo -e "${GREEN}✓ Formularios creados${NC}"

# 5. CREAR ARCHIVO PRINCIPAL
echo -e "\n${YELLOW}5️⃣ Creando archivo principal...${NC}"

cat > styles-v5/main.css << 'MAIN'
/* ========================================
   MAIN CSS - MBI-v4 Sistema Optimizado
   ======================================== */

/* 1. Core - Variables y base */
@import url('./1-core/variables.css');
@import url('./1-core/reset.css');
@import url('./1-core/utilities.css');

/* 2. Componentes reutilizables */
@import url('./2-components/buttons.css');
@import url('./2-components/forms.css');

/* 3. Módulos específicos (se agregarán después) */
/* @import url('./3-modules/dashboard.css'); */
/* @import url('./3-modules/calendar.css'); */
/* @import url('./3-modules/campaign-library.css'); */
/* @import url('./3-modules/audio-archive.css'); */
MAIN

echo -e "${GREEN}✓ Archivo principal creado${NC}"

# 6. CREAR ARCHIVO DE PRUEBA
echo -e "\n${YELLOW}6️⃣ Creando página de prueba...${NC}"

cat > test-new-styles.html << 'TEST'
<!DOCTYPE html>
<html lang="es" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test - Nuevos Estilos MBI-v4</title>
    <link rel="stylesheet" href="styles-v5/main.css">
</head>
<body>
    <div style="padding: 2rem;">
        <h1>Sistema de Diseño MBI-v4</h1>
        <p class="text-muted mb-3">Prueba de nuevos estilos optimizados</p>
        
        <section class="mb-3">
            <h2>Botones</h2>
            <div class="d-flex gap-2 flex-wrap">
                <button class="btn btn-primary">Primary</button>
                <button class="btn btn-secondary">Secondary</button>
                <button class="btn btn-success">Success</button>
                <button class="btn btn-danger">Danger</button>
                <button class="btn btn-ghost">Ghost</button>
                <button class="btn btn-primary" disabled>Disabled</button>
            </div>
        </section>

        <section class="mb-3">
            <h2>Formularios</h2>
            <div class="form-group">
                <label class="form-label">Texto</label>
                <input type="text" class="form-control" placeholder="Ingrese texto">
            </div>
            <div class="form-group">
                <label class="form-label">Área de texto</label>
                <textarea class="form-control form-textarea" placeholder="Mensaje"></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Selector</label>
                <select class="form-control form-select">
                    <option>Opción 1</option>
                    <option>Opción 2</option>
                    <option>Opción 3</option>
                </select>
            </div>
        </section>

        <section>
            <h2>Utilidades</h2>
            <div class="p-3 rounded" style="background: var(--bg-tertiary);">
                <p class="text-center">Texto centrado con padding</p>
            </div>
        </section>
    </div>
</body>
</html>
TEST

echo -e "${GREEN}✓ Página de prueba creada${NC}"

# RESUMEN FINAL
echo ""
echo "================================================"
echo -e "${GREEN}✅ LIMPIEZA CSS COMPLETADA${NC}"
echo "================================================"
echo ""
echo "📁 Estructura creada en: styles-v5/"
echo "   ├── 1-core/          (variables, reset, utilities)"
echo "   ├── 2-components/    (buttons, forms, etc.)"
echo "   ├── 3-modules/       (específicos por módulo)"
echo "   └── main.css         (importador principal)"
echo ""
echo "📦 Backup guardado en: $BACKUP_DIR/"
echo ""
echo "🧪 Prueba los nuevos estilos:"
echo "   Abre test-new-styles.html en el navegador"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Revisar test-new-styles.html"
echo "   2. Extraer estilos específicos de cada módulo"
echo "   3. Migrar gradualmente index.html"
echo "   4. Eliminar CSS legacy una vez confirmado"
echo ""
