# 🏗️ Arquitectura del Sistema MBI-v3
**Sistema de Radio y Anuncios Automatizados para Mall Barrio Independencia**

---

## 📋 Tabla de Contenidos
1. [Visión General](#visión-general)
2. [Arquitectura de Alto Nivel](#arquitectura-de-alto-nivel)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Módulos Principales](#módulos-principales)
6. [Sistema de Comunicación](#sistema-de-comunicación)
7. [APIs y Servicios](#apis-y-servicios)
8. [Flujo de Datos](#flujo-de-datos)
9. [Base de Datos](#base-de-datos)
10. [Seguridad](#seguridad)
11. [Despliegue](#despliegue)

---

## 🎯 Visión General

MBI-v3 es un sistema modular de gestión de audio automatizado diseñado para centros comerciales. Permite:
- Conversión de texto a voz (TTS) usando ElevenLabs
- Interrumpir música en AzuraCast para anuncios
- Programación automática de mensajes
- Gestión de biblioteca de audios

### Características Principales
- **Arquitectura Modular**: Sistema basado en módulos independientes
- **Event-Driven**: Comunicación entre módulos via Event Bus
- **SPA (Single Page Application)**: Frontend reactivo sin recarga de página
- **API RESTful**: Backend PHP para procesamiento y persistencia
- **Real-time**: Integración con sistema de radio en vivo

---

## 🏛️ Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND (SPA)                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Radio   │  │ Message  │  │ Campaign │  │ Calendar │   │
│  │  Module  │  │  Config  │  │  Library │  │  Module  │   │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘   │
│        │              │              │              │        │
│  ┌─────┴──────────────┴──────────────┴──────────────┴────┐ │
│  │                    Shared Core                         │ │
│  │  ┌────────────┐  ┌──────────────┐  ┌──────────────┐  │ │
│  │  │ Event Bus  │  │ Module Loader│  │  API Client  │  │ │
│  │  └────────────┘  └──────────────┘  └──────────────┘  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
└───────────────────────────┬───────────────────────────────────┘
                            │ HTTP/AJAX
┌───────────────────────────┴───────────────────────────────────┐
│                         BACKEND (PHP)                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  generate.php│  │biblioteca.php│  │scheduler.php │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│  ┌──────┴──────────────────┴──────────────────┴───────┐     │
│  │               Service Layer                         │     │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐           │     │
│  │  │TTS Mgr  │  │File Mgr │  │Schedule │           │     │
│  │  └─────────┘  └─────────┘  └─────────┘           │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                               │
└───────────────────────────┬───────────────────────────────────┘
                            │
┌───────────────────────────┴───────────────────────────────────┐
│                    EXTERNAL SERVICES                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  ElevenLabs  │  │  AzuraCast   │  │   SQLite DB  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 Stack Tecnológico

### Frontend
- **HTML5/CSS3**: Estructura y estilos base
- **JavaScript ES6+**: Lógica de aplicación con módulos nativos
- **FullCalendar v6**: Visualización de calendario
- **No Framework**: Vanilla JS para máximo control y mínimo overhead

### Backend
- **PHP 8.x**: Procesamiento del lado del servidor
- **SQLite**: Base de datos ligera para persistencia
- **cURL**: Comunicación con APIs externas

### Servicios Externos
- **ElevenLabs API**: Conversión texto a voz
- **AzuraCast API**: Control de radio streaming
- **GitHub**: Control de versiones

### Infraestructura
- **VPS Linux**: Servidor de desarrollo (51.222.25.222)
- **Apache/Nginx**: Servidor web
- **Git**: Versionado y deployment

---

## 📁 Estructura del Proyecto

```
mbi-v3/
├── index.html                  # Punto de entrada SPA
├── api/                        # Backend PHP
│   ├── config.php              # Configuración y credenciales
│   ├── generate.php            # API de generación TTS
│   ├── biblioteca.php          # Gestión de archivos
│   ├── library-metadata.php   # Metadatos de biblioteca
│   ├── audio-scheduler.php    # Sistema de programación
│   └── db/                    # SQLite databases
│       └── schedules.db       # DB de programaciones
├── shared/                     # Core del sistema
│   ├── event-bus.js           # Sistema de eventos
│   ├── module-loader.js       # Cargador dinámico
│   ├── router.js              # Enrutamiento SPA
│   ├── api-client.js          # Cliente HTTP
│   └── data-schemas.js       # Esquemas de datos
├── modules/                    # Módulos funcionales
│   ├── radio/                 # Control de radio en vivo
│   │   ├── index.js
│   │   ├── components/
│   │   └── templates/
│   ├── message-configurator/  # Creador de mensajes
│   │   ├── index.js
│   │   ├── services/
│   │   └── templates/
│   ├── campaign-library/      # Biblioteca de campañas
│   │   ├── index.js
│   │   ├── schedule-modal.js
│   │   └── templates/
│   └── calendar/              # Calendario de eventos
│       ├── index.js
│       ├── components/
│       │   ├── calendar-view.js
│       │   ├── calendar-filters.js
│       │   └── event-modal.js
│       ├── services/
│       └── templates/
├── assets/                    # Recursos estáticos
│   ├── css/
│   │   └── base.css
│   ├── images/
│   └── sounds/
└── docs/                      # Documentación

```

---

## 🧩 Módulos Principales

### 1. Radio Module (`/modules/radio/`)
**Propósito**: Control de radio en vivo y reproducción inmediata
- Interrumpir música para anuncios urgentes
- Preview de audios antes de transmitir
- Control de volumen y fade in/out
- Estado en tiempo real de AzuraCast

### 2. Message Configurator (`/modules/message-configurator/`)
**Propósito**: Creación y generación de mensajes TTS
- Editor de texto con preview
- Selección de voces de ElevenLabs
- Ajustes de velocidad y tono
- Generación y descarga de MP3

### 3. Campaign Library (`/modules/campaign-library/`)
**Propósito**: Gestión de biblioteca de audios
- Upload/download de archivos
- Organización por categorías
- Programación de reproducción (schedule-modal.js)
- Metadatos y búsqueda

### 4. Calendar Module (`/modules/calendar/`)
**Propósito**: Visualización y gestión de programación
- Vista calendario (día/semana/mes)
- Filtros por tipo de schedule (interval/specific/once)
- Eventos próximos
- Lista de todas las programaciones activas

---

## 📡 Sistema de Comunicación

### Event Bus (`/shared/event-bus.js`)
Sistema centralizado de eventos para comunicación entre módulos:

```javascript
// Eventos principales del sistema
'module:loaded'          // Módulo cargado
'module:unloaded'        // Módulo descargado
'navigate'               // Navegación entre módulos
'audio:generated'        // Audio TTS generado
'library:file:added'     // Archivo agregado a biblioteca
'schedule:created'       // Schedule creado
'schedule:updated'       // Schedule actualizado
'schedule:deleted'       // Schedule eliminado
'radio:playing'          // Radio reproduciendo
'radio:stopped'          // Radio detenida
```

### Module Loader (`/shared/module-loader.js`)
- Carga dinámica de módulos on-demand
- Gestión de ciclo de vida (load/unload)
- Inyección de dependencias
- Lazy loading de recursos

### Router (`/shared/router.js`)
- Navegación SPA sin recarga
- History API para URLs limpias
- Gestión de estado de navegación

---

## 🔌 APIs y Servicios

### APIs Internas (PHP)

#### 1. Generate API (`/api/generate.php`)
```
POST /api/generate.php
Body: {
    text: string,
    voice: string,
    language: string
}
Response: {
    success: boolean,
    file_url: string,
    error?: string
}
```

#### 2. Biblioteca API (`/api/biblioteca.php`)
```
GET /api/biblioteca.php?action=list
Response: {
    success: boolean,
    files: Array<{name, size, date}>
}

POST /api/biblioteca.php
Body: FormData (file upload)
Response: {
    success: boolean,
    filename: string
}
```

#### 3. Scheduler API (`/api/audio-scheduler.php`)
```
POST /api/audio-scheduler.php
Body: {
    action: 'create'|'list'|'delete'|'update',
    schedule_data?: {...}
}
Response: {
    success: boolean,
    schedules?: Array,
    id?: number
}
```

### APIs Externas

#### ElevenLabs TTS
- Endpoint: `https://api.elevenlabs.io/v1/text-to-speech/`
- Autenticación: API Key en headers
- Límites: 10,000 caracteres/mes (plan free)

#### AzuraCast
- Endpoint: `http://51.222.25.222:8000/api/`
- Autenticación: API Key
- Funciones: play, stop, skip, queue

---

## 🔄 Flujo de Datos

### Flujo de Generación TTS
```
1. Usuario ingresa texto en Message Configurator
2. Frontend valida y envía a generate.php
3. Backend llama a ElevenLabs API
4. Audio MP3 se guarda en /api/temp/
5. URL del archivo retorna al frontend
6. Usuario puede preview o descargar
```

### Flujo de Programación
```
1. Usuario selecciona archivo en Campaign Library
2. Abre schedule-modal.js
3. Configura tipo (interval/specific/once)
4. Datos se envían a audio-scheduler.php
5. Se guarda en SQLite
6. Calendar module se actualiza via Event Bus
7. Cron job ejecuta schedules activos
```

### Flujo de Reproducción en Vivo
```
1. Usuario hace clic en "Play" en Radio Module
2. Frontend envía comando a AzuraCast API
3. AzuraCast interrumpe stream actual
4. Reproduce archivo MP3
5. Retorna a programación normal
```

---

## 💾 Base de Datos

### SQLite Schema (`schedules.db`)

```sql
CREATE TABLE schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    title TEXT,
    schedule_type TEXT CHECK(schedule_type IN ('interval','specific','once')),
    interval_minutes INTEGER,
    interval_hours INTEGER,
    schedule_days TEXT,  -- JSON array para días específicos
    schedule_time TEXT,   -- Hora(s) de ejecución
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE schedule_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_id INTEGER,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT,
    error_message TEXT,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id)
);
```


## Base de Datos
- **Ubicación**: `/var/www/mbi-v3/calendario/api/db/calendar.db`
- **Tipo**: SQLite3
- **Backup automático**: Diario

## Tablas principales:
- `audio_schedule`: Programaciones de audio
- `calendar_events`: Eventos del calendario
- `audio_metadata`: Metadata de archivos de audio
---

## 🔒 Seguridad

### Medidas Implementadas
1. **API Keys**: Protección de endpoints sensibles
2. **CORS**: Configurado para dominios permitidos
3. **Validación**: Input sanitization en PHP
4. **Rate Limiting**: En APIs externas
5. **HTTPS**: En producción (pendiente en dev)

### Consideraciones
- Credenciales en `config.php` (fuera de git)
- Archivos temporales con limpieza automática
- Logs de acceso y errores
- Backup automático de DB

---

## 🚀 Despliegue

### Ambiente de Desarrollo
```bash
# VPS de desarrollo
ssh root@51.222.25.222
cd /var/www/mbi-v3

# Actualizar desde GitHub
git pull origin main

# Verificar servicios
systemctl status apache2
systemctl status php8.1-fpm
```

### Proceso de Deploy
1. **Development** (VPS): Cambios y pruebas
2. **GitHub**: Commit y push
3. **Production**: Pull desde GitHub (cuando esté listo)

### Comandos Útiles
```bash
# Logs de PHP
tail -f /var/log/php8.1-fpm.log

# Logs de Apache
tail -f /var/log/apache2/error.log

# Verificar schedules activos
sqlite3 /var/www/mbi-v3/api/db/schedules.db "SELECT * FROM schedules WHERE is_active=1;"

# Backup de base de datos
cp /var/www/mbi-v3/api/db/schedules.db /backup/schedules_$(date +%Y%m%d).db
```

---

## 📊 Métricas y Monitoreo

### KPIs del Sistema
- Uptime del servicio
- Cantidad de audios generados/día
- Schedules activos
- Uso de API (ElevenLabs quota)
- Espacio en disco

### Logs
- `/var/www/mbi-v3/logs/` - Logs de aplicación
- `/var/log/apache2/` - Logs del servidor
- `/api/logs/scheduler/` - Logs de programación

---

## 🔮 Roadmap Técnico

### Próximas Mejoras
1. **WebSockets**: Para actualizaciones en tiempo real
2. **Docker**: Containerización del ambiente
3. **CI/CD**: Pipeline automatizado
4. **Tests**: Suite de pruebas automatizadas
5. **PWA**: Capacidades offline
6. **Multi-tenant**: Soporte para múltiples malls

---

## 📝 Notas de Arquitectura

### Decisiones de Diseño
- **No Framework JS**: Para mantener simplicidad y control total
- **Módulos independientes**: Facilita mantenimiento y escalabilidad
- **Event-driven**: Desacoplamiento entre componentes
- **SQLite**: Suficiente para volumen actual, fácil backup
- **PHP nativo**: Sin frameworks para reducir complejidad

### Patrones Utilizados
- **Module Pattern**: Encapsulación de funcionalidad
- **Observer Pattern**: Event Bus
- **Singleton Pattern**: Module Loader, API Client
- **Factory Pattern**: Creación de componentes UI
- **Repository Pattern**: Acceso a datos

### Convenciones
- **Nomenclatura**: camelCase para JS, snake_case para PHP
- **Estructura**: 1 archivo = 1 responsabilidad
- **Comentarios**: JSDoc para documentación
- **Versionado**: Semantic Versioning

---

## 🤝 Contribución

### Para Desarrolladores
1. Clonar repositorio
2. Seguir estructura modular existente
3. Documentar cambios significativos
4. Probar en VPS de desarrollo
5. Crear PR con descripción clara

### Contacto
- **Repositorio**: https://github.com/Ignacio1972/mbi-v3
- **VPS Dev**: root@51.222.25.222
- **Documentación**: `/docs/` en el proyecto

---

*Documento generado el 22 de Agosto de 2024*
*Versión del Sistema: 3.0*
*Última actualización: Implementación de filtros por tipo de schedule*