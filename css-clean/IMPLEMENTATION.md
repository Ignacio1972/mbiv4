# MBI v4 - CSS Clean Implementation Guide

## 🎯 Overview

This new CSS structure replaces the messy 61 CSS files with a clean, modern, and maintainable system.

## 📁 New Structure

```
css-clean/
├── main.css                    # Single import file
├── core/
│   ├── tokens.css             # Design tokens (colors, spacing, etc.)
│   └── reset.css              # Modern CSS reset
├── components/
│   ├── buttons.css            # Button components
│   ├── forms.css              # Form components
│   ├── cards.css              # Card components
│   ├── badges.css             # Badge components
│   └── modals.css             # Modal components
└── modules/
    ├── dashboard.css          # Dashboard-specific styles
    └── campaign-library.css   # Campaign library styles
```

## 🔄 Implementation Steps

### Step 1: Update HTML Files

Replace all existing CSS imports with a single line:

```html
<!-- OLD (Multiple files) -->
<link rel="stylesheet" href="/assets/css/base.css">
<link rel="stylesheet" href="/modules/message-configurator/styles/configurator-layout.css">
<link rel="stylesheet" href="/new-design/css/mbi-corporate-dark.css">
<link rel="stylesheet" href="/new-design/css/palette-custom.css">

<!-- NEW (Single file) -->
<link rel="stylesheet" href="/css-clean/main.css">
```

### Step 2: Update Main Files

#### index.html
```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TTS Mall - Sistema de Mensajes</title>
    
    <!-- Single CSS import -->
    <link rel="stylesheet" href="/css-clean/main.css">
    
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎙️</text></svg>">
</head>
```

#### modules/dashboard-v2/template.html
```html
<style>
    @import url('/css-clean/main.css');
    @import url('/css-clean/modules/dashboard.css');
</style>
```

### Step 3: Update Module Templates

Each module should import the base CSS plus its specific styles:

```html
<!-- Dashboard -->
@import url('/css-clean/main.css');
@import url('/css-clean/modules/dashboard.css');

<!-- Campaign Library -->
@import url('/css-clean/main.css');
@import url('/css-clean/modules/campaign-library.css');
```

## 🎨 Key Features

### 1. Standardized Colors
All category colors are now centralized in `tokens.css`:
- Ofertas: #8ac926 (Green)
- Eventos: #ff924c (Orange)
- Información: #ffca3a (Yellow)
- Servicios: #1982c4 (Blue)
- Horarios: #6a4c93 (Purple)
- Emergencias: #ff595e (Red)

### 2. Consistent Components
- `.btn`, `.btn--primary`, `.btn--success`, etc.
- `.card`, `.message-card`, `.dashboard-card`, etc.
- `.badge`, `.badge-ofertas`, `.category-ofertas`, etc.
- `.modal`, `.modal__header`, `.modal__body`, etc.

### 3. Utility Classes
- Spacing: `.p-4`, `.m-3`, `.gap-2`, etc.
- Layout: `.flex`, `.grid`, `.grid-cols-3`, etc.
- Text: `.text-sm`, `.font-medium`, `.text-primary`, etc.

### 4. Responsive Design
- Mobile-first approach
- Consistent breakpoints
- Responsive utilities (`.sm:grid-cols-2`, `.md:flex-row`, etc.)

## 🧹 Files to Remove

After implementation, these files can be safely removed:

### Legacy CSS Files
```
assets/css/app old.css
assets/css/base-old.css
assets/css/base old.css
new-design/palette-custom.css
new-design/mbi-corporate-dark.css
modules/dashboard-v2/styles/old/
```

### Duplicate Files
All duplicate `palette-custom.css`, `mbi-corporate-dark.css`, and similar files.

## ✅ Benefits

1. **Performance**: Single CSS file vs 61 files
2. **Maintainability**: One place to change colors/styles
3. **Consistency**: Standardized components and utilities
4. **Modern**: Uses CSS custom properties and modern patterns
5. **Responsive**: Mobile-first, consistent breakpoints
6. **Clean**: No more duplicate or conflicting styles

## 🔧 Migration Commands

```bash
# Backup current CSS
mkdir css-backup
cp -r assets/css css-backup/
cp -r new-design css-backup/
cp -r modules/*/styles css-backup/

# Copy new CSS
cp -r css-clean/* /path/to/css/

# Update HTML files (manual or script)
# Test and verify all modules work
# Remove old CSS files when confident
```

## 🐛 Troubleshooting

If something breaks after migration:
1. Check browser console for missing CSS
2. Verify HTML class names match new components
3. Check that all imports are correctly updated
4. Compare with backup files if needed

## 📝 Notes

- All existing class names are preserved for compatibility
- Colors are exactly as specified (ofertas = green)
- Modern CSS features used (custom properties, grid, flexbox)
- Fully responsive and accessible
- Easy to extend and maintain