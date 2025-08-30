# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 CONTEXTO PRINCIPAL: Sistema Radio Automatizada MBI-v4

**IMPORTANT**:
PROCESO OBLIGATORIO:
1. REVISAR → 2. TESTEAR → 3. PROPONER → 4. ESPERAR APROBACIÓN → 5. IMPLEMENTAR

🚨 **REGLA FUNDAMENTAL:**
**JAMÁS ESCRIBIR CÓDIGO SIN ANTES DAR UN PLAN DETALLADO Y ESPERAR APROBACIÓN**
- PRIMERO: Analizar completamente el problema
- SEGUNDO: Explicar qué archivos se van a modificar y por qué
- TERCERO: Mostrar un plan paso a paso
- CUARTO: ESPERAR aprobación del usuario
- QUINTO: Solo entonces implementar

Si algo no está 100% claro, DETENERSE, revisar y hacer tests.
Jamás escribir código sin antes saber 100% cuál es el problema.
Analizar y revisar hasta encontrar el problema.
Siempre hacer BACKUP antes de cualquier modificación.
Documentar TODAS las decisiones tomadas.
Probar exhaustivamente antes de desplegar.

## ⚠️ WORKING DIRECTLY ON DEVELOPMENT VPS
- **Servidor:** root@51.222.25.222 
- **Path:** `/var/www/mbi-v4`
- **GitHub:** https://github.com/Ignacio1972/mbiv4.git
- **Estado:** 🚧 **EN DESARROLLO ACTIVO** - Solo desarrollador trabajando

**🚨 REGLA FUNDAMENTAL:** Todo cambio debe estar en GIT (VPS + GitHub)

## 🏗️ ARQUITECTURA ACTUAL DEL SISTEMA

### Sistema de Radio Automatizada para Mall Barrio Independencia

**¿Qué hace?** Sistema inteligente que convierte texto en voz (TTS) y lo programa automáticamente en la radio del mall.

**Estado actual:** ✅ **FUNCIONAL** - Todas las funcionalidades principales implementadas

### 📦 Módulos Principales

```
mbi-v4/
├── 🔧 API Backend (PHP)
│   ├── generate.php              # Generación TTS con ElevenLabs
│   ├── biblioteca.php            # Gestión biblioteca de audio + Upload archivos externos
│   ├── saved-messages.php        # API para Campaign Library
│   ├── audio-scheduler.php       # Sistema de programaciones automáticas
│   └── services/
│       ├── radio-service.php     # Integración AzuraCast + interrupciones
│       └── tts-service-enhanced.php
│
├── 🎮 Frontend Modular (JavaScript)
│   ├── modules/
│   │   ├── message-configurator/ # 🎤 Generador TTS principal
│   │   ├── campaign-library/     # 📚 Mensajes guardados + programación
│   │   ├── calendar/             # 📅 Visualización programaciones
│   │   ├── audio-library/        # 🎵 Historial completo archivos
│   │   ├── radio/                # 📻 Player de radio en vivo
│   │   └── dashboard-v2/         # 📊 Dashboard principal
│   │
│   └── shared/                   # 🔗 Infraestructura compartida
│       ├── event-bus.js          # Comunicación entre módulos
│       ├── module-loader.js      # Carga dinámica módulos
│       ├── api-client.js         # Cliente HTTP centralizado
│       ├── router.js             # Navegación SPA
│       └── storage-manager.js    # Gestión localStorage
│
├── 🗄️ Base de Datos
│   └── calendario/api/db/calendar.db  # SQLite principal
│
├── 🐳 Integración Externa
│   ├── AzuraCast (Docker)        # Sistema de radio streaming
│   └── ElevenLabs API            # Servicio TTS
│
└── 📚 Documentación Técnica
    ├── docs/AUDIO_SYSTEM_ARCHITECTURE.md  # Arquitectura completa
    └── new Docs/                 # Auditorías técnicas
```

## 🔄 FLUJO DE DATOS CRÍTICO

### 1. Generación TTS
```
Texto → generate.php → ElevenLabs → MP3 → AzuraCast Docker → BD calendar.db
```

### 2. Upload Archivos Externos (✅ NUEVO - Funcional)
```
Usuario → Campaign Library → biblioteca.php → AzuraCast /files/upload → BD calendar.db
```

### 3. Programación Automática
```
Calendar → audio-scheduler.php (cron) → radio-service.php → Liquidsoap → Interrupción Radio
```

### 4. Campaign Library (Centro del Sistema)
```
saved-messages.php → BD (is_saved=1) → UI Campaign Library → Modal Programación → Calendar
```

## 🗄️ BASE DE DATOS UNIFICADA

**Ubicación Principal:** `/var/www/mbi-v4/calendario/api/db/calendar.db`

### Tablas Críticas:
```sql
-- Todos los archivos de audio (TTS + externos)
audio_metadata {
    filename, display_name, category, is_saved, 
    file_size, created_at, tags, notes
}

-- Programaciones activas
audio_schedule {
    filename, schedule_type, schedule_time, 
    schedule_days, is_active, priority
}

-- Historial ejecuciones
audio_schedule_log {
    schedule_id, executed_at, status, error_message
}
```

### ⚠️ Base de Datos Legacy (NO USAR)
`/var/www/mbi-v4/api/db/calendar.db` - Solo para compatibilidad

## 🔧 CONFIGURACIONES CRÍTICAS

### AzuraCast Integration
```php
// /api/config.php
AZURACAST_BASE_URL = 'http://51.222.25.222'
AZURACAST_STATION_ID = 1
PLAYLIST_ID_GRABACIONES = 3

// Carpeta Docker: /var/azuracast/stations/test/media/Grabaciones/
// Playlist: "grabaciones" (minúscula)
```

### ElevenLabs TTS
```php
ELEVENLABS_API_KEY = 'sk_...'
ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1'
```

## 🎯 FUNCIONALIDADES IMPLEMENTADAS (Estado Actual)

### ✅ COMPLETAMENTE FUNCIONAL
- 🎤 **Generación TTS**: ElevenLabs → AzuraCast
- 📻 **Interrupción Radio**: Inmediata via Liquidsoap
- 📚 **Campaign Library**: Gestión mensajes guardados
- 📅 **Programación**: Interval, Specific, Once
- 🎵 **Upload Externos**: MP3/WAV/FLAC → AzuraCast (12MB máx)
- 🔄 **Scheduler Automático**: Cron cada minuto
- 📊 **Dashboard**: Vista general sistema

### 🚧 EN DESARROLLO/MEJORAS
- 🎵 Reproducción archivos externos (carpeta AzuraCast)
- 📱 Responsive design completo
- 🔍 Búsqueda avanzada en bibliotecas

## 📁 ARCHIVOS CRÍTICOS - NO ROMPER

### Backend PHP (APIs)
- `/api/generate.php` - **CRÍTICO**: Generación TTS
- `/api/biblioteca.php` - **CRÍTICO**: Biblioteca + Upload externos
- `/api/services/radio-service.php` - **CRÍTICO**: Interrupciones radio
- `/api/audio-scheduler.php` - **CRÍTICO**: Cron scheduler
- `/api/saved-messages.php` - **CRÍTICO**: Campaign Library API

### Frontend Core
- `/shared/event-bus.js` - **CRÍTICO**: Comunicación módulos
- `/shared/module-loader.js` - **CRÍTICO**: Carga dinámica
- `/shared/api-client.js` - **CRÍTICO**: HTTP cliente
- `/modules/campaign-library/index.js` - **CRÍTICO**: Centro funcional
- `/modules/message-configurator/index.js` - **CRÍTICO**: Generador principal

### Base de Datos
- `/calendario/api/db/calendar.db` - **CRÍTICO**: BD principal

## 🔄 COMANDOS DESARROLLO VPS

### Backup Obligatorio antes de cambios
```bash
# 1. POSICIONARSE
cd /var/www/mbi-v4

# 2. VERIFICAR ESTADO
git status
git pull origin main

# 3. BACKUP ARCHIVO
cp archivo.js archivo.js.backup-$(date +%Y%m%d_%H%M%S)

# 4. COMMIT PREVENTIVO
git add .
git commit -m "backup before changes"
git push origin main
```

### Health Check Sistema
```bash
# Verificar sintaxis PHP
php -l api/generate.php
php -l api/biblioteca.php

# Test APIs principales
curl -X POST -H "Content-Type: application/json" \\
  -d '{"action":"list"}' \\
  http://localhost:3001/api/saved-messages.php

# Verificar BD principal
sqlite3 calendario/api/db/calendar.db \\
  "SELECT COUNT(*) FROM audio_metadata WHERE is_saved=1;"

# Ver logs recientes
tail -f api/logs/biblioteca-$(date +%Y-%m-%d).log
```

### Deploy Seguro
```bash
# Después de cambios aprobados
git add .
git commit -m "feat: [descripción detallada]"
git push origin main

# Verificar que funciona
curl -I http://localhost:3001/
```

## 🚨 PATRONES DE SEGURIDAD

### Validaciones Implementadas
```php
// Archivos TTS: tts{timestamp}[_descripcion].mp3
'/^tts\\d{14}(_[a-zA-Z0-9_\\-ñÑáéíóúÁÉÍÓÚ]+)?\\.mp3$/'

// Upload externos: Sanitización + validación MIME
$allowedMimeTypes = ['audio/mpeg', 'audio/wav', 'audio/flac']
$maxSize = 12 * 1024 * 1024; // 12MB
```

### Rutas de API
```javascript
// ✅ CORRECTO con apiClient
apiClient.post('/generate.php', data)

// ❌ INCORRECTO - causa duplicación /apiapi/
apiClient.post('api/generate.php', data)
```

## 🎯 DESARROLLO GUIDELINES

### Antes de cualquier respuesta técnica:
1. **Consultar docs** `docs/AUDIO_SYSTEM_ARCHITECTURE.md`
2. **Verificar patrones existentes** en código
3. **Confirmar contexto VPS** de desarrollo
4. **Proponer solución MÁS SIMPLE**
5. **Incluir comandos backup** obligatorios

### Estructura de respuesta ideal:
1. **Contexto del desarrollo** (por qué es importante)
2. **Análisis del código existente** (archivos consultados)
3. **Solución paso a paso** (con comandos VPS)
4. **Plan de backup/rollback** (seguridad primero)
5. **Verificación de éxito** (cómo confirmar que funciona)

### Principios de Arquitectura:
- **1 archivo = 1 responsabilidad**
- **Módulos independientes** (loose coupling)
- **Patrones consistentes** (seguir existentes)
- **Event-driven** (usar event-bus.js)
- **Fail fast** (detectar errores temprano)

## 📊 MÉTRICAS SISTEMA ACTUAL

- **Módulos Frontend**: 6 principales + shared
- **APIs Backend**: 5 principales + services
- **Base de datos**: SQLite unificada
- **Integraciones**: AzuraCast + ElevenLabs
- **Archivos audio soportados**: 800+ (sin degradación)
- **Upload máximo**: 12MB
- **Formatos**: MP3, WAV, FLAC, AAC, Ogg, M4A, Opus

## 🔮 ROADMAP FUTURO

### Corto Plazo (Próximas versiones)
- 🎵 Resolver reproducción archivos externos
- 🔄 Migrar audio-scheduler.php a BD principal
- 📱 Mejorar responsive design

### Mediano Plazo
- 🔍 Búsqueda avanzada y filtros
- 👥 Sistema de usuarios y permisos
- 📊 Analytics y estadísticas uso

### Largo Plazo
- ☁️ Backup automático cloud
- 🌐 API REST completa
- 📱 App móvil complementaria

---

## 🚨 REMEMBER: DEVELOPMENT VPS ACTIVE

Este sistema está en desarrollo. Cualquier cambio debe ser:
1. **Testeado exhaustivamente**
2. **Con backup completo**
3. **Documentado apropiadamente**
4. **Committed inmediatamente**


---

*Documentación actualizada: 29 de Agosto, 2025*  
*Sistema MBI-v4 - Radio Automatizada Mall Barrio Independencia*