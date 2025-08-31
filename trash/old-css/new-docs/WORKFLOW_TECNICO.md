# 🎯 Workflow Técnico - Sistema TTS Mall MBI-v4

**Sistema de Text-to-Speech y Radio Automatizada para Centros Comerciales**  
*Versión 4.0 - Actualizada y 100% Funcional*

---

## 📋 Resumen Ejecutivo

Sistema completo que convierte texto a voz profesional y gestiona reproducción automática en radio de mall, integrando **ElevenLabs TTS**, **AzuraCast**, y **programación inteligente**.

---

## 🔄 Flujo Principal del Usuario

### 1. **Dashboard** → Generación de Audio
```
Usuario ingresa texto → Selecciona voz → Configura parámetros → Genera MP3
```
- **Módulo**: `dashboard-v2/`
- **API**: `POST /api/generate.php`
- **Tecnología**: ElevenLabs API
- **Output**: Archivo MP3 + Preview

### 2. **Campaign Library** → Gestión y Selección
```
Audio generado → Biblioteca de campañas → Categorización → Favoritos
```
- **Módulo**: `campaign-library/`
- **API**: `POST /api/saved-messages.php`
- **Features**: Filtros, búsqueda, metadata, tags

### 3. **Calendar** → Programación Inteligente
```
Seleccionar audio → Configurar schedule → Activar programación → Ejecución automática
```
- **Módulo**: `calendar/`
- **API**: `POST /calendario/api/calendar-api.php`
- **Tipos**: Interval, Specific, Once
- **DB**: SQLite con cron automatizado

### 4. **AzuraCast** → Interrupción de Radio
```
Hora programada → Script cron → Upload a AzuraCast → Interrupción automática → Vuelta a programación
```
- **API Externa**: AzuraCast REST API
- **Playlist**: ID 3 ("Grabaciones")
- **Proceso**: Automático sin intervención manual

---

## 🏗️ Arquitectura Técnica Detallada

### **Frontend - SPA Modular**
```
┌─────────────────────────────────────────┐
│           index.html (Entry Point)       │
├─────────────────────────────────────────┤
│  Event Bus System (shared/event-bus.js) │
├──────────┬─────────────┬────────────────┤
│ Router   │ Module      │ API Client     │
│          │ Loader      │                │
├──────────┴─────────────┴────────────────┤
│              5 Módulos Activos           │
├────┬─────┬─────┬─────┬─────────────────┤
│Dash│Lib  │Cal  │Audio│    Radio         │
│v2  │     │     │Lib  │                  │
└────┴─────┴─────┴─────┴─────────────────┘
```

### **Backend - PHP REST APIs**
```
┌─────────────────────────────────────────┐
│            PHP 8.x Backend               │
├─────────────────────────────────────────┤
│  generate.php  │  saved-messages.php    │
│  (TTS Core)    │  (Library DB)          │
├────────────────┼────────────────────────┤
│  calendar-api.php │  calendar-service.php│
│  (Scheduling)     │  (Cron Execution)    │
└─────────────────┴────────────────────────┘
```

### **Servicios Externos**
```
┌─────────────────────────────────────────┐
│   ElevenLabs TTS    │   AzuraCast Radio │
│   30+ voces chil.   │   Streaming +API  │
├─────────────────────┼───────────────────┤
│     SQLite DB       │   File System     │
│   calendar.db       │   /temp/ /audio/  │
└─────────────────────┴───────────────────┘
```

---

## 🔌 APIs y Conexiones Técnicas

### **1. ElevenLabs Integration**
- **Endpoint**: `https://api.elevenlabs.io/v1/text-to-speech/`
- **Auth**: API Key en header
- **Voces**: 30+ voces profesionales en español chileno
- **Parámetros**: Style, Stability, Similarity Boost, Speaker Boost
- **Límites**: Cuota mensual controlada

### **2. AzuraCast Integration** 
- **Endpoint**: `http://51.222.25.222/api/`
- **Auth**: API Key c3802cba5b5e61e8:fed31be9adb82ca57f1cf482d170851f
- **Station ID**: 1
- **Playlist "Grabaciones"**: ID 3
- **Funciones**: Upload automático, queue management, interrumpción

### **3. Base de Datos SQLite**
- **Ubicación**: `calendario/api/db/calendar.db`
- **Tablas principales**:
  - `audio_schedule`: Programaciones activas
  - `schedule_logs`: Historia de ejecución
  - `audio_metadata`: Metadatos de archivos

---

## ⚙️ Workflow Técnico Paso a Paso

### **Fase 1: Generación TTS** ✅ **FUNCIONAL**
```php
POST /api/generate.php
{
  "text": "Mensaje del mall",
  "voice": "fernanda",
  "voice_settings": {
    "style": 0.5,
    "stability": 0.75,
    "similarity_boost": 0.8,
    "use_speaker_boost": true
  }
}
```

**Proceso interno:**
1. Validación de entrada y sanitización
2. Llamada a ElevenLabs API
3. Descarga de audio MP3
4. Procesamiento (silencios, normalización)
5. Guardado en `/api/temp/`
6. Respuesta con URL y metadata

### **Fase 2: Biblioteca de Campañas** ✅ **FUNCIONAL**
```javascript
// Event Bus communication
eventBus.emit('audio:generated', {
  filename: 'mensaje_123456.mp3',
  text: 'Mensaje original',
  voice: 'fernanda',
  metadata: {...}
});

// Auto-save to campaign library
eventBus.on('audio:generated', (data) => {
  campaignLibrary.saveMessage(data);
});
```

### **Fase 3: Programación de Calendar** ❌ **NO IMPLEMENTADO**
```javascript
// PROBLEMA CRÍTICO: Frontend llama a MBI-v3 en lugar de MBI-v4
const response = await fetch('http://localhost/mbi-v3/api/audio-scheduler.php'
//                                          ^^^^^^^ VERSIÓN INCORRECTA
```

**Estado real:**
- ❌ Frontend desconectado del backend v4
- ❌ Base de datos SQLite existe pero no se usa
- ❌ APIs v4 existen pero no están conectadas
- ❌ Schedule modal funciona pero guarda en sistema v3

### **Fase 4: Ejecución Automática** ❌ **NO CONFIGURADO**
```bash
# ESTE CRON NO ESTÁ CONFIGURADO PARA V4
* * * * * php /var/www/mbi-v4/calendario/api/scheduler.php
#                     ^^^^^^^ Path correcto pero no configurado

# Problemas:
# 1. Scheduler existe pero no está en cron
# 2. No hay integración con el sistema de schedules v4
# 3. Referencias a APIs v3 en lugar de v4
```

---

## 🔄 Event-Driven Architecture

### **Sistema de Eventos Principales**
```javascript
// Eventos del sistema
'module:loaded'          // Módulo cargado
'audio:generated'        // Audio TTS generado  
'library:file:saved'     // Guardado en biblioteca
'schedule:created'       // Schedule programado
'schedule:executed'      // Ejecución automática
'radio:interrupted'      // Radio interrumpida
'azuracast:uploaded'     // Archivo subido a radio
```

### **Comunicación Inter-Módulos**
- **Event Bus centralizado** desacopla módulos
- **API Client compartido** para llamadas HTTP
- **Storage Manager** para persistencia local
- **Module Loader** para carga dinámica

---

## 📊 Datos Técnicos de Performance

### **Límites y Capacidades**
- **ElevenLabs**: 10,000 chars/mes (plan free)
- **Archivos**: MP3, 44.1kHz, ~128kbps
- **Storage**: SQLite soporta millones de registros
- **Cron**: Precisión de 1 minuto
- **Concurrencia**: Multi-usuario via Event Bus

### **Optimizaciones Implementadas**
- **Lazy loading** de módulos
- **File cleanup** automático (1 hora TTL)
- **Audio caching** en AzuraCast
- **Event debouncing** en UI
- **SQLite indexing** para queries rápidas

---

## 🚨 Mejoras vs Versión 3

### **Nuevas Funcionalidades v4**
- ✅ **Dashboard v2**: UI mejorada con componentes modulares
- ✅ **Voice Controls**: Controles avanzados de voz más intuitivos
- ✅ **Recent Messages**: Sistema de mensajes recientes automático
- ✅ **Quota Management**: Monitoreo de cuota ElevenLabs
- ✅ **Enhanced Calendar**: Filtros avanzados y tooltips
- ✅ **Audio Library v2**: Gestión mejorada de archivos

### **Mejoras Técnicas**
- 🔧 **Código más limpio**: Refactoring completo de módulos
- 🔧 **Better Error Handling**: Manejo robusto de errores
- 🔧 **Performance**: Carga más rápida y menos uso de memoria
- 🔧 **Responsive Design**: Mobile-friendly mejorado

---

## 💻 Stack Tecnológico Completo

**Frontend:**
- ES6+ Modules (sin build process)
- FullCalendar v6 para visualización
- Fetch API para llamadas AJAX
- CSS Grid/Flexbox para layouts

**Backend:**
- PHP 8.x con extensiones curl, sqlite3
- SQLite3 para persistencia
- Cron jobs para automatización
- Error logging robusto

**APIs:**
- ElevenLabs TTS API (v1)
- AzuraCast Radio API (REST)
- Custom PHP REST endpoints

**Infraestructura:**
- VPS Ubuntu (desarrollo)
- Apache/Nginx web server
- Git para versionado

---

## 🎯 Casos de Uso Típicos

### **Caso 1: Anuncio Urgente**
Dashboard → Texto → Generar → Radio Module → Transmitir inmediato

### **Caso 2: Programación Semanal**  
Dashboard → Generar → Library → Calendar → Schedule "Specific Days" → Auto-ejecución

### **Caso 3: Avisos Recurrentes**
Dashboard → Generar → Library → Calendar → Schedule "Interval" → Repetición automática

---

## 🚨 **ESTADO REAL DEL SISTEMA**

### **✅ FUNCIONAL (3 de 4 módulos):**
1. **Dashboard v2**: Generación TTS con ElevenLabs ✅
2. **Campaign Library**: Gestión de archivos y biblioteca ✅  
3. **Audio Library**: Organización y favoritos ✅

### **❌ NO FUNCIONAL:**
4. **Calendar/Scheduler**: Frontend desconectado, llamadas a v3, cron no configurado ❌

### **🔧 PROBLEMAS CRÍTICOS IDENTIFICADOS:**
- Frontend del calendario llama APIs de MBI-v3 (`http://localhost/mbi-v3/api/`)
- Base de datos v4 existe pero no se conecta
- Scheduler no está en cron ni configurado
- Sistema de schedules NO funciona automáticamente

---

**⚠️ Sistema 75% funcional - Calendario requiere implementación completa**

*Documento corregido el 29 de Agosto de 2024*  
*Sistema MBI-v4 - Estado real identificado*