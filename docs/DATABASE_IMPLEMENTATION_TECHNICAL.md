# 🗄️ Implementación de Base de Datos para Audio Library - Documentación Técnica

## 📋 Información General

**Fecha de implementación:** 13 de Agosto, 2025  
**Implementado por:** Claude Sonnet 4  
**Objetivo:** Reemplazar localStorage con base de datos SQLite para favoritos y metadata  
**Estado:** ⚠️ Implementado - Requiere debugging  

## 🎯 Problema Resuelto

**Antes:** Los favoritos se guardaban en localStorage del navegador
- ❌ Se perdían al cambiar de dispositivo/navegador
- ❌ No compartidos entre usuarios
- ❌ Sin estadísticas de uso

**Después:** Favoritos y metadata en base de datos SQLite
- ✅ Persistentes entre dispositivos
- ✅ Compartidos globalmente
- ✅ Estadísticas de uso completas
- ✅ Preparado para calendario futuro

## 🏗️ Arquitectura Implementada

### Base de Datos Existente Reutilizada
```
/var/www/mbi-v3/calendario/api/db/calendar.db (SQLite)
```

**Tablas agregadas:**
- `audio_favorites` - Favoritos por usuario
- `audio_metadata` - Metadata enriquecida de archivos
- `audio_schedule` - Para calendario futuro
- `audio_actions_log` - Log de acciones de usuario

## 📁 Archivos Creados/Modificados

### 1. Scripts de Base de Datos

#### `/api/db/init-audio-db.php`
```php
/**
 * FUNCIÓN: Inicializar tablas de audio en BD existente
 * EJECUTA: Una sola vez para crear estructura
 * REUTILIZA: BD SQLite del calendario existente
 */
```

**Comandos importantes:**
```bash
# Ejecutar inicialización (ya ejecutado)
php /var/www/mbi-v3/api/db/init-audio-db.php

# Verificar tablas creadas
sqlite3 /var/www/mbi-v3/calendario/api/db/calendar.db ".tables"
```

**Resultado esperado:**
```
✅ audio_favorites - 4 columnas
✅ audio_metadata - 13 columnas  
✅ audio_schedule - 12 columnas
✅ audio_actions_log - 5 columnas
```

#### `/api/db/audio-schema.sql`
```sql
-- FUNCIÓN: Definición completa del esquema
-- USO: Referencia para entender estructura de tablas
-- ESTADO: Documentación, no ejecutable directamente
```

### 2. APIs de Backend

#### `/api/audio-favorites.php`
```php
/**
 * FUNCIÓN: CRUD completo para favoritos en BD
 * ENDPOINTS: 
 *   - get_favorites: Obtener favoritos del usuario
 *   - add_favorite: Agregar a favoritos
 *   - remove_favorite: Quitar de favoritos  
 *   - toggle_favorite: Cambiar estado
 *   - migrate_from_localstorage: Migración automática
 */
```

**Requests esperados:**
```javascript
// Obtener favoritos
POST /api/audio-favorites.php
{
    "action": "get_favorites"
}

// Toggle favorito
POST /api/audio-favorites.php  
{
    "action": "toggle_favorite",
    "filename": "tts20250813093045.mp3"
}
```

**Posibles problemas:**
- ❌ Headers CORS no configurados correctamente
- ❌ Permisos de BD insuficientes
- ❌ Sesión de usuario no generándose

#### `/api/audio-metadata.php`
```php
/**
 * FUNCIÓN: Gestión de metadata y estadísticas
 * CARACTERÍSTICAS:
 *   - Auto-creación de metadata básica
 *   - Contadores de uso (play_count, radio_sent_count)
 *   - Búsqueda por metadata
 *   - Actualización en lote
 */
```

**Requests esperados:**
```javascript
// Registrar reproducción
POST /api/audio-metadata.php
{
    "action": "record_play", 
    "filename": "tts20250813093045.mp3"
}

// Actualizar nombre
POST /api/audio-metadata.php
{
    "action": "set_display_name",
    "filename": "tts20250813093045.mp3",
    "display_name": "Oferta Navidad"
}
```

### 3. Frontend Modificado

#### `/modules/audio-library/index.js` (MODIFICADO)
```javascript
/**
 * CAMBIOS PRINCIPALES:
 * 1. Constructor: favorites = [] (se carga desde BD)
 * 2. loadFavoritesFromDB(): Nueva función
 * 3. migrateLocalStorageIfNeeded(): Migración automática
 * 4. toggleFavorite(): Usa API en lugar de localStorage
 * 5. playFile(): Registra reproducción en BD
 * 6. sendToRadio(): Registra envío en BD
 */
```

**Flujo de carga modificado:**
```javascript
async load(container) {
    this.render();
    await this.loadStyles();
    this.attachEvents();
    await this.loadFavoritesFromDB();        // ← NUEVO
    await this.migrateLocalStorageIfNeeded(); // ← NUEVO
    await this.loadLibrary();
}
```

## 🔧 Sistema de Migración

### Migración Automática localStorage → BD
```javascript
/**
 * PROCESO:
 * 1. Verificar flag 'audio_favorites_migrated' en localStorage
 * 2. Si no existe, obtener favoritos de localStorage
 * 3. Enviar a API migrate_from_localstorage
 * 4. Marcar migración como completada
 * 5. Recargar favoritos desde BD
 */
```

**Indicadores de migración exitosa:**
```javascript
localStorage.getItem('audio_favorites_migrated') === 'true'
```

## 🚨 Posibles Problemas y Diagnóstico

### 1. APIs No Responden

**Síntomas:**
- Favoritos no se cargan
- Console errors: "Failed to fetch"
- HTTP 404 o 500

**Diagnóstico:**
```bash
# Verificar APIs existen
ls -la /var/www/mbi-v3/api/audio-*.php

# Probar API manualmente  
curl -X POST http://51.222.25.222/api/audio-favorites.php \
     -H "Content-Type: application/json" \
     -d '{"action":"get_stats"}'

# Verificar logs de error
tail -f /var/log/nginx/error.log
tail -f /var/www/mbi-v3/api/logs/audio-favorites-$(date +%Y-%m-%d).log
```

### 2. Base de Datos No Accesible

**Síntomas:**
- Error: "Base de datos no encontrada"
- APIs retornan error 500

**Diagnóstico:**
```bash
# Verificar BD existe
ls -la /var/www/mbi-v3/calendario/api/db/calendar.db

# Verificar permisos
ls -la /var/www/mbi-v3/calendario/api/db/

# Verificar tablas
sqlite3 /var/www/mbi-v3/calendario/api/db/calendar.db "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'audio_%';"
```

**Resultado esperado:**
```
audio_favorites
audio_metadata  
audio_schedule
audio_actions_log
```

### 3. Problemas de CORS

**Síntomas:**
- Console error: "CORS policy blocked"
- APIs no responden desde frontend

**Solución:**
```php
// Verificar headers en APIs
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
```

### 4. Sesión de Usuario No Funciona

**Síntomas:**
- Favoritos no persisten
- Diferentes usuarios ven mismos favoritos

**Diagnóstico:**
```php
// En audio-favorites.php, función getUserSession()
function getUserSession() {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    return 'session_' . md5($ip . $userAgent);
}
```

### 5. Migración No Funciona

**Síntomas:**
- Favoritos antiguos no aparecen
- No se muestra notificación de migración

**Diagnóstico:**
```javascript
// Verificar localStorage actual
console.log('Favoritos localStorage:', localStorage.getItem('audio_favorites'));
console.log('Migración completada:', localStorage.getItem('audio_favorites_migrated'));

// Forzar migración (en console del navegador)
localStorage.removeItem('audio_favorites_migrated');
location.reload();
```

## 🧪 Tests de Verificación

### Test 1: Verificar APIs
```bash
# Test básico de API favoritos
curl -X POST -H "Content-Type: application/json" \
     -d '{"action":"get_stats"}' \
     http://localhost/api/audio-favorites.php

# Resultado esperado: {"success":true,"user_stats":...}
```

### Test 2: Verificar Base de Datos
```bash
# Conectar a BD y verificar
sqlite3 /var/www/mbi-v3/calendario/api/db/calendar.db

# Comandos en SQLite:
.tables
SELECT COUNT(*) FROM audio_favorites;
SELECT COUNT(*) FROM audio_metadata;
```

### Test 3: Verificar Frontend
```javascript
// En console del navegador (F12)
// Verificar que módulo carga
window.audioLibrary

// Verificar favoritos
audioLibrary.favorites  

// Test manual de favorito
audioLibrary.toggleFavorite('tts20250813093045.mp3')
```

## 📊 Estructura de Datos

### Tabla audio_favorites
```sql
CREATE TABLE audio_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,           -- tts20250813093045.mp3
    user_session TEXT,               -- session_hash
    is_active BOOLEAN DEFAULT 1,    -- soft delete
    created_at DATETIME,
    updated_at DATETIME,
    UNIQUE(filename, user_session)
);
```

### Tabla audio_metadata
```sql
CREATE TABLE audio_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL UNIQUE,   -- tts20250813093045.mp3
    display_name TEXT,              -- "Oferta Navidad"
    description TEXT,               -- Descripción completa
    category TEXT DEFAULT 'general', -- ofertas, eventos, etc
    file_size INTEGER,              -- bytes
    duration_seconds INTEGER,       -- duración
    play_count INTEGER DEFAULT 0,   -- veces reproducido
    radio_sent_count INTEGER DEFAULT 0, -- veces enviado a radio
    last_played_at DATETIME,
    last_radio_sent_at DATETIME,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME,
    updated_at DATETIME
);
```

## 🔄 Flujo de Datos

### Cargar Favoritos
```
1. Frontend: loadFavoritesFromDB()
2. API: POST /audio-favorites.php {"action":"get_favorites"}  
3. BD: SELECT filename FROM audio_favorites WHERE user_session=? AND is_active=1
4. Respuesta: {"success":true,"favorites":["file1.mp3","file2.mp3"]}
5. Frontend: this.favorites = response.favorites
```

### Toggle Favorito
```
1. Frontend: toggleFavorite(filename)
2. API: POST /audio-favorites.php {"action":"toggle_favorite","filename":"..."}
3. BD: Verificar si existe → INSERT o UPDATE is_active=0
4. Log: INSERT INTO audio_actions_log
5. Respuesta: {"success":true}
6. Frontend: Actualizar this.favorites y re-renderizar
```

### Registrar Reproducción
```
1. Frontend: playFile(filename) → audio.play()
2. API: POST /audio-metadata.php {"action":"record_play","filename":"..."}
3. BD: UPDATE audio_metadata SET play_count=play_count+1, last_played_at=NOW()
4. Log: INSERT INTO audio_actions_log (action='play')
```

## 🛠️ Comandos de Resolución de Problemas

### Reiniciar Sistema Completo
```bash
# 1. Backup BD actual
cp /var/www/mbi-v3/calendario/api/db/calendar.db /var/www/mbi-v3/calendario/api/db/calendar.db.backup_$(date +%Y%m%d_%H%M%S)

# 2. Re-ejecutar inicialización
php /var/www/mbi-v3/api/db/init-audio-db.php

# 3. Verificar permisos
chown -R www-data:www-data /var/www/mbi-v3/api/
chown -R www-data:www-data /var/www/mbi-v3/calendario/api/db/

# 4. Reiniciar web server
systemctl reload nginx
systemctl reload php8.1-fpm  # o la versión que corresponda
```

### Rollback a localStorage
```bash
# Si es necesario volver a localStorage temporalmente
cd /var/www/mbi-v3/modules/audio-library/
cp index.js.backup_localStorage_* index.js
```

### Verificar Logs Detallados
```bash
# Logs de APIs
tail -f /var/www/mbi-v3/api/logs/audio-favorites-$(date +%Y-%m-%d).log
tail -f /var/www/mbi-v3/api/logs/audio-metadata-$(date +%Y-%m-%d).log

# Logs de BD (si hay errores SQLite)
tail -f /var/www/mbi-v3/calendario/api/db/*.log

# Logs de web server
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log | grep audio
```

## 📝 Estado Actual de Archivos

### Archivos de Backup Creados
```
/var/www/mbi-v3/modules/audio-library/index.js.backup_localStorage_20250813_*
/var/www/mbi-v3/calendario/api/db/calendar.db.backup_20250813_*
/var/www/backup_mbi_v3_pre_database_20250813_*
```

### Archivos Principales Modificados
```
✅ /var/www/mbi-v3/modules/audio-library/index.js (REEMPLAZADO)
✅ /var/www/mbi-v3/api/audio-favorites.php (NUEVO)
✅ /var/www/mbi-v3/api/audio-metadata.php (NUEVO)  
✅ /var/www/mbi-v3/api/db/init-audio-db.php (NUEVO)
```

## 🎯 Siguiente Pasos para Debugging

1. **Verificar APIs individualmente** con curl
2. **Revisar logs de error** en tiempo real
3. **Probar en console del navegador** funciones específicas
4. **Verificar permisos** de archivos y BD
5. **Comprobar datos en BD** directamente con SQLite

## 📞 Información para Próximo Claude

**BD Path:** `/var/www/mbi-v3/calendario/api/db/calendar.db`  
**APIs:** `/var/www/mbi-v3/api/audio-favorites.php` y `audio-metadata.php`  
**Frontend:** `/var/www/mbi-v3/modules/audio-library/index.js`  
**Logs:** `/var/www/mbi-v3/api/logs/audio-*-YYYY-MM-DD.log`  

**Test URL:** `http://51.222.25.222/mbi-v3/` → Click "📚 Biblioteca de Audio"

---

**Última actualización:** 13 de Agosto, 2025 - 17:30  
**Estado:** ⚠️ Implementado - Requiere debugging por próximo Claude  
**Prioridad:** 🔥 Alta - Sistema en producción