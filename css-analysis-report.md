# Análisis de Dependencias CSS - MBI-v4

## 📊 RESUMEN EJECUTIVO
- **Total CSS Files**: 67+ archivos
- **Ubicaciones**: 8 carpetas diferentes
- **Tamaño estimado**: ~2.5MB de CSS total
- **Estado**: CAOS COMPLETO - requiere reorganización urgente

## 🔍 DEPENDENCIAS POR MÓDULO

### 🏠 **index.html** (Página Principal)
```html
<!-- CSS ACTUALMENTE CARGADOS -->
<link rel="stylesheet" href="/assets/css/base.css">
<link rel="stylesheet" href="/modules/message-configurator/styles/configurator-layout.css">
```
**Estado**: ✅ Simple y limpio

---

### 📊 **Dashboard v2**
**Ubicación**: `/modules/dashboard-v2/`
**CSS Files**:
```
/styles/components/buttons.css      ← DUPLICADO (existe en 4+ lugares)
/styles/components/cards.css        ← DUPLICADO
/styles/components/forms.css        ← DUPLICADO
/styles/components/modals.css       ← DUPLICADO
/styles/core/design-tokens.css      ← DUPLICADO
/styles/core/reset.css              ← DUPLICADO
/styles/core/typography.css         ← DUPLICADO
/styles/core/variables.css          ← DUPLICADO
/styles/dashboard.css               ← ESPECÍFICO del módulo
/styles/modules/controls.css        ← ESPECÍFICO
/styles/modules/generator.css       ← ESPECÍFICO
/styles/modules/messages.css        ← ESPECÍFICO
```
**Carga**: Automática vía JavaScript module loader
**Estado**: 🚨 DUPLICACIONES MASIVAS

---

### 📚 **Campaign Library**
**Ubicación**: `/modules/campaign-library/`
**CSS Files**:
```
/styles/library.css                 ← Principal
/styles/library-v2.css              ← ❓ ¿Se usa?
/styles/schedule-modal.css          ← Modal específico
```
**Dependencias**:
```
@import url('/new-design/css/mbi-corporate-dark.css');  ← PROBLEMA
@import url('/new-design/css/palette-custom.css');      ← PROBLEMA
```
**Estado**: 🚨 IMPORTS a ubicaciones inconsistentes

---

### 📅 **Calendar**
**Ubicación**: `/modules/calendar/`
**CSS Files**:
```
/style.css                          ← Principal
/styles/style.css                   ← ❓ DUPLICADO del anterior
/styles/style corneta.css           ← ❓ ¿Experimental?
/styles/calendar-tooltips.css       ← Tooltips específicos
```
**Dependencias Externas**:
```html
<!-- Carga FullCalendar CSS vía CDN -->
<link href="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.css">
```
**Estado**: 🚨 3 ARCHIVOS CSS SIMILARES

---

### 🎵 **Audio Library**
**Ubicación**: `/modules/audio-library/`
**CSS Files**:
```
/styles/library.css                 ← Simple, específico
```
**Estado**: ✅ Limpio

---

### 🎙️ **Message Configurator**
**Ubicación**: `/modules/message-configurator/`
**CSS Files**:
```
/style.css                          ← Principal
/style old.css                      ← ❓ ARCHIVO VIEJO
/styles/configurator-layout.css     ← Layout específico ✅ USADO EN index.html
/styles/save-message-modal.css      ← Modal específico
/styles/speaker-boost-toggle.css    ← Toggle específico
```
**Estado**: 🔧 Requiere limpieza de archivos viejos

---

### 📻 **Radio**
**Ubicación**: `/modules/radio/`
**CSS Files**:
```
/style.css                          ← Simple, específico
```
**Estado**: ✅ Limpio

## 🏗️ CARPETAS CSS GLOBALES

### 📂 `/styles/` (Supuesto CSS Central)
```
/components/buttons.css             ← DUPLICADO en dashboard-v2
/components/cards.css               ← DUPLICADO
/components/forms.css               ← DUPLICADO
/components/modals.css              ← DUPLICADO
/core/design-tokens.css             ← DUPLICADO
/core/reset.css                     ← DUPLICADO
/core/typography.css                ← DUPLICADO
/core/variables.css                 ← DUPLICADO
/modules/calendar-v4.css            ← ❓ Específico pero en carpeta global
/modules/controls.css               ← DUPLICADO
/modules/generator.css              ← DUPLICADO
/modules/messages.css               ← DUPLICADO
```
**Estado**: 🚨 DUPLICACIONES MASIVAS

### 📂 `/css-clean/` (¿Intento de limpieza?)
```
/components/badges.css              ← ÚNICO
/components/buttons.css             ← DUPLICADO (3ra versión)
/components/cards.css               ← DUPLICADO
/components/forms.css               ← DUPLICADO
/components/modals.css              ← DUPLICADO
/core/reset.css                     ← DUPLICADO
/core/tokens.css                    ← ¿Variables?
/main.css                           ← Import master
/modules/campaign-library.css       ← Específico
/modules/dashboard.css              ← Específico
```
**Estado**: 🤔 VERSIÓN LIMPIA PARCIAL - No se usa

### 📂 `/new-design/` (CSS de diseño)
```
/css/mbi-corporate-dark.css         ← TEMA PRINCIPAL
/css/palette-custom.css             ← PALETA DE COLORES
/mbi-corporate-dark.css             ← ❓ DUPLICADO
/palette-custom.css                 ← ❓ DUPLICADO
```
**Estado**: 🚨 DUPLICADOS + Referenciado por modules

### 📂 `/assets/css/` (CSS Legacy)
```
/app old.css                        ← ARCHIVO VIEJO
/base.css                           ← ✅ USADO EN index.html
/base old.css                       ← ARCHIVO VIEJO
/base-old.css                       ← ARCHIVO VIEJO
/header-mbi.css                     ← ❓ Se usa?
/palette-ocean.css                  ← ❓ Paleta alternativa
```

## 🚨 PROBLEMAS CRÍTICOS IDENTIFICADOS

1. **DUPLICACIONES MASIVAS**:
   - `buttons.css` existe en 4 lugares
   - `cards.css` existe en 4 lugares  
   - `forms.css` existe en 4 lugares
   - `variables.css` existe en 3 lugares

2. **IMPORTS ROTOS**:
   - Campaign Library importa desde `/new-design/css/`
   - Rutas inconsistentes entre módulos

3. **ARCHIVOS HUÉRFANOS**:
   - 12+ archivos con sufijo "old" 
   - `/css-clean/` no se usa
   - 2 versiones de archivos en `/new-design/`

4. **CARGA INCONSISTENTE**:
   - Algunos módulos cargan CSS automáticamente
   - Otros requieren imports manuales
   - Sin sistema centralizado

## 💡 RECOMENDACIONES INMEDIATAS

### FASE 1: Consolidación Segura
1. ✅ Crear estructura unificada en `/styles-unified/`
2. 🔄 Mantener archivos existentes como fallback
3. 📝 Mapear TODAS las dependencias activas
4. 🧪 Testing exhaustivo antes de eliminar nada

### FASE 2: Migración Gradual  
1. 🎯 Migrar un módulo a la vez
2. 📊 Dashboard v2 primero (más complejo)
3. 🔍 Verificar funcionalidad después de cada cambio
4. 📦 Campaign Library segundo (tiene imports)

### FASE 3: Limpieza Final
1. 🗑️ Eliminar duplicados después de migración completa
2. 📁 Mover archivos viejos a `/css-archive/`
3. 📖 Documentar nueva estructura
4. 🚀 Optimizar carga de CSS

## ⚠️ NOTAS CRÍTICAS
- **NO TOCAR NADA** hasta tener plan completo
- **BACKUP COMPLETO** ya realizado ✅
- **TESTING REQUERIDO** en cada paso
- **ROLLBACK PLAN** debe estar listo antes de iniciar