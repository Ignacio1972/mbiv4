# MBI-v3: Sistema de Radio y Text-to-Speech
**Mall Barrio Independencia - Sistema de Anuncios Automatizados**

![Version](https://img.shields.io/badge/version-3.1.0-blue)
![Status](https://img.shields.io/badge/status-stable-green)
![License](https://img.shields.io/badge/license-MIT-blue)

Sistema profesional de generación y gestión de anuncios por voz para centros comerciales con integración de radio en vivo.

[Demo](http://51.222.25.222/mbi-v3/) • [Documentación](docs/) • [GitHub](https://github.com/Ignacio1972/mbi-v3) • [Milestone v3.1.0](MILESTONE-v3.1.0.md)

---

## 📋 Tabla de Contenidos

- [Características](#-características-principales)
- [Arquitectura](#-arquitectura)
- [Requisitos](#-requisitos-del-sistema)
- [Instalación](#-instalación-rápida)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Módulos](#-módulos-del-sistema)
- [API](#-api-reference)
- [Desarrollo](#-desarrollo)
- [Troubleshooting](#-troubleshooting)
- [Documentación](#-documentación-técnica)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## ✨ Características Principales

### 🎯 Core Features

- **🎤 Text-to-Speech Avanzado**: 30+ voces chilenas naturales con ElevenLabs
- **📻 Radio en Vivo**: Interrupción automática vía AzuraCast
- **📚 Biblioteca de Mensajes**: Sistema CMS completo para anuncios
- **📅 Calendario v2**: Programación con 3 tipos de eventos (interval, specific, once)
- **🎵 Audio Library**: Gestión completa de archivos con favoritos
- **📊 Mensajes Guardados**: Sistema de templates y drafts
- **🎨 Interfaz Moderna**: SPA con módulos lazy-loaded
- **🔄 Sin Compilación**: ES6 modules nativos, no requiere build

### 🎙️ Sistema de Voces

- **30+ voces profesionales** en español chileno
- **Parámetros ajustables**:
  - Style (0-1): Neutral → Expresivo
  - Stability (0-1): Variable → Estable  
  - Similarity Boost (0-1): Claridad de voz
  - Speaker Boost: Mejora de calidad
- **Optimización automática** por tipo de mensaje
- **Preview en tiempo real** antes de transmitir

### 📡 Integración con Radio

- Interrupción inmediata de programación
- Cola de mensajes prioritarios
- Historial de reproducción
- Monitoreo en tiempo real
- Procesamiento de audio (agregar silencios)

---

## 🏗️ Arquitectura

### Frontend
```
┌─────────────────────────────────────┐
│         index.html (SPA)            │
├─────────────────────────────────────┤
│          Event Bus System           │
├──────────┬──────────┬──────────────┤
│  Router  │  Module  │   Storage    │
│          │  Loader  │   Manager    │
├──────────┴──────────┴──────────────┤
│            5 Modules                │
├────┬────┬────┬────┬────────────────┤
│Conf│Lib │Cal │Audio│    Radio      │
└────┴────┴────┴────┴────────────────┘
```

### Backend
```
┌─────────────────────────────────────┐
│         PHP 7.4 REST API            │
├─────────────────────────────────────┤
│     ElevenLabs  │   AzuraCast       │
├─────────────────┴───────────────────┤
│     SQLite DB   │   File System     │
└─────────────────────────────────────┘
```

---

## 📦 Requisitos del Sistema

### Servidor
- **OS**: Ubuntu 20.04+ / Debian 11+
- **Web Server**: Nginx 1.18+ o Apache 2.4+
- **PHP**: 7.4+ con extensiones:
  - curl
  - json
  - sqlite3
  - mbstring
- **FFmpeg**: Para procesamiento de audio (opcional)
- **RAM**: Mínimo 2GB
- **Storage**: 10GB+

### Cliente
- **Navegadores soportados**:
  - Chrome 90+
  - Firefox 88+
  - Safari 14+
  - Edge 90+
- **JavaScript**: ES6 modules support requerido

### APIs Externas
- **ElevenLabs**: API key requerida (v1)
- **AzuraCast**: Instancia configurada con API key

---

## 🚀 Instalación Rápida

### 1. Clonar el repositorio
```bash
git clone https://github.com/Ignacio1972/mbi-v3.git
cd mbi-v3
```

### 2. Configurar permisos
```bash
# Crear directorios necesarios
mkdir -p api/temp api/logs api/biblioteca calendario/api/db

# Asignar permisos
chmod -R 755 .
chmod -R 777 api/temp api/logs api/biblioteca calendario/api/db
chown -R www-data:www-data .
```

### 3. Configurar API keys
```bash
# Copiar archivo de configuración
cp api/config.example.php api/config.php

# Editar con tus credenciales
nano api/config.php
```

### 4. Inicializar base de datos
```bash
# Crear base de datos SQLite
php calendario/api/db/init-db.php
```

### 5. Configurar servidor web

#### Nginx
```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    root /var/www/mbi-v3;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|mp3)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6. Configurar cron para calendario
```bash
# Agregar al crontab
crontab -e

# Ejecutar cada minuto
* * * * * php /var/www/mbi-v3/calendario/api/cron.php
```

---

## ⚙️ Configuración

### API Keys (`api/config.php`)
```php
<?php
// ElevenLabs
define('ELEVENLABS_API_KEY', 'sk_...');
define('ELEVENLABS_BASE_URL', 'https://api.elevenlabs.io/v1');

// AzuraCast
define('AZURACAST_BASE_URL', 'http://51.222.25.222');
define('AZURACAST_API_KEY', 'tu_api_key');
define('AZURACAST_STATION_ID', 1);
define('PLAYLIST_ID_GRABACIONES', 3);

// Directorios
define('UPLOAD_DIR', __DIR__ . '/temp/');
define('BIBLIOTECA_DIR', __DIR__ . '/biblioteca/');
?>
```

---

## 💻 Uso

### Acceso al Sistema
1. Navegar a `http://tu-dominio.com/mbi-v3/`
2. El sistema carga automáticamente en el módulo Radio

### Flujo de Trabajo Típico

#### 1. Crear un Mensaje
- Ir a **"✏️ Texto Personalizado"**
- Escribir texto o seleccionar plantilla
- Elegir voz y ajustar configuración
- Click en **"Generar Audio"**
- Escuchar preview
- **"Guardar en Biblioteca"** o **"Enviar a Radio"**

#### 2. Programar Anuncios
- Ir a **"📅 Calendario"**
- Crear nuevo schedule
- Seleccionar tipo:
  - **Interval**: Cada X tiempo
  - **Specific**: Días específicos
  - **Once**: Una sola vez
- Elegir archivo de audio
- Activar programación

#### 3. Gestionar Biblioteca
- Ir a **"📂 Archivos de Audio"**
- Buscar, filtrar, favoritos
- Renombrar archivos
- Enviar directamente a radio

---

## 📦 Módulos del Sistema

### 1. 📻 Radio
- Control de transmisión en vivo
- Interrupción inmediata para anuncios
- Monitor de estado en tiempo real
- Historial de reproducción

### 2. ✏️ Message Configurator
- Editor de texto con contador (max 5000 chars)
- 30+ voces chilenas disponibles
- Controles avanzados de voz (sliders)
- Plantillas predefinidas por categoría
- Preview antes de generar

### 3. 📚 Campaign Library  
- Mensajes guardados con metadata
- Categorización y búsqueda
- Sincronización local/servidor
- Exportación de campañas
- Drafts automáticos

### 4. 📅 Calendar v2
- Programación con 3 tipos de eventos
- Categorías con colores y emojis
- Filtrado por categoría
- Ejecución automática vía cron
- Base de datos SQLite

### 5. 📂 Audio Library
- Gestión de archivos MP3
- Sistema de favoritos
- Búsqueda y filtrado
- Renombrado de archivos
- Envío directo a radio

---

## 🔌 API Reference

### Endpoints Principales

#### POST `/api/generate.php`
Genera audio desde texto usando ElevenLabs.

**Request:**
```json
{
  "action": "generate_audio",
  "text": "Texto del mensaje",
  "voice": "fernanda",
  "voice_settings": {
    "style": 0.5,
    "stability": 0.75,
    "similarity_boost": 0.8,
    "use_speaker_boost": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "filename": "test_1234567890.mp3",
  "azuracast_filename": "tts20241123120000.mp3",
  "processed_text": "Texto procesado"
}
```

#### POST `/api/audio-scheduler.php`
Gestión de programaciones.

**Actions:**
- `create`: Crear nueva programación
- `list`: Listar todas las programaciones
- `update`: Actualizar programación
- `delete`: Eliminar programación
- `toggle`: Activar/desactivar

#### POST `/api/saved-messages.php`
Gestión de mensajes guardados.

**Actions:**
- `save`: Guardar mensaje con metadata
- `list`: Listar mensajes guardados
- `get`: Obtener mensaje específico
- `update`: Actualizar mensaje
- `delete`: Eliminar mensaje

### Eventos del Sistema

El sistema usa un event bus para comunicación entre módulos:

```javascript
// Escuchar evento
eventBus.on('audio:generated', (data) => {
  console.log('Audio generado:', data);
});

// Emitir evento
eventBus.emit('message:saved', messageData);
```

**Eventos principales:**
- `module:loaded` - Módulo cargado
- `audio:generated` - Audio generado
- `message:saved` - Mensaje guardado
- `radio:interrupted` - Radio interrumpida
- `schedule:created` - Programación creada

---

## 🛠️ Desarrollo

### Estructura del Proyecto
```
mbi-v3/
├── 📄 index.html               # Entry point
├── 📁 api/                     # Backend PHP
│   ├── generate.php            # TTS generation
│   ├── audio-scheduler.php     # Scheduling
│   ├── saved-messages.php      # Messages DB
│   └── config.php              # Configuration
├── 📁 shared/                  # Core modules
│   ├── event-bus.js            # Event system
│   ├── module-loader.js        # Dynamic loading
│   └── router.js               # Navigation
├── 📁 modules/                 # Feature modules
│   ├── message-configurator/   # TTS UI
│   ├── campaign-library/       # Messages library
│   ├── calendar/               # Scheduler v2
│   ├── audio-library/          # Audio files
│   └── radio/                  # Live radio
├── 📁 docs/                    # Documentation
└── 📁 assets/                  # Static resources
```

### Crear un Nuevo Módulo

1. **Crear estructura de carpetas**
```bash
mkdir -p modules/mi-modulo/{components,services,styles}
```

2. **Crear archivo principal** (`modules/mi-modulo/index.js`)
```javascript
export default class MiModulo {
    constructor() {
        this.name = 'mi-modulo';
        this.container = null;
        this.eventBus = window.eventBus;
    }
    
    getName() { return this.name; }
    
    async load(container) {
        this.container = container;
        this.render();
        this.eventBus.emit('module:loaded', { module: this.name });
    }
    
    render() {
        this.container.innerHTML = `
            <div class="${this.name}">
                <!-- Tu UI aquí -->
            </div>
        `;
    }
    
    async unload() {
        this.container = null;
    }
}
```

3. **Registrar ruta** (`shared/router.js`)
```javascript
this.routes.set('/mi-modulo', 'mi-modulo');
```

4. **Agregar navegación** (`index.html`)
```html
<button class="tab-button" data-route="/mi-modulo">
    🆕 Mi Módulo
</button>
```

### Convenciones de Código

#### JavaScript
- ES6 modules nativos
- camelCase para variables y funciones
- PascalCase para clases
- Async/await sobre callbacks
- JSDoc para documentación

#### PHP
- PSR-12 coding standard
- Type hints cuando sea posible
- Try-catch para manejo de errores
- Logging de operaciones críticas

#### CSS
- BEM methodology para clases
- CSS variables para temas
- Mobile-first responsive design
- No frameworks CSS (vanilla)

---

## 🐛 Troubleshooting

### Problemas Comunes

#### "Module not loading"
```javascript
// Verificar en consola
console.log(moduleLoader.getLoadedModules());
// Check: Ruta en router.js
// Check: Export default en módulo
```

#### "Audio no se genera"
```bash
# Verificar API key
grep ELEVENLABS_API_KEY api/config.php

# Check logs
tail -f api/logs/tts-*.log

# Verificar cuota ElevenLabs
curl -H "xi-api-key: YOUR_KEY" \
  https://api.elevenlabs.io/v1/user
```

#### "Radio no se interrumpe"
```bash
# Test AzuraCast connection
php api/test-azuracast.php

# Check playlist ID
curl -H "X-API-Key: YOUR_KEY" \
  http://51.222.25.222/api/station/1/playlists
```

#### "Schedule no ejecuta"
```bash
# Verificar cron
crontab -l | grep mbi-v3

# Check logs
tail -f calendario/logs/scheduler/*.log

# Verificar timezone
php -r "echo date_default_timezone_get();"
```

#### "Permisos denegados"
```bash
# Fix permissions
sudo chown -R www-data:www-data /var/www/mbi-v3
sudo chmod -R 755 /var/www/mbi-v3
sudo chmod -R 777 api/temp api/logs api/biblioteca
```

### Logs del Sistema

**Ubicación de logs:**
- PHP: `/api/logs/`
- Calendario: `/calendario/logs/`
- Browser: Console del navegador (F12)

**Habilitar debug mode:**
```javascript
// En browser console
window.DEBUG_TTS = true;
```

---

## 📚 Documentación Técnica

### Documentos Disponibles

- **[TECHNICAL_DOCUMENTATION.md](docs/TECHNICAL_DOCUMENTATION.md)** - Documentación general del sistema
- **[MESSAGE_CONFIGURATOR_TECHNICAL.md](docs/MESSAGE_CONFIGURATOR_TECHNICAL.md)** - Documentación del módulo TTS
- **[ARQUITECTURA.md](docs/ARQUITECTURA.md)** - Arquitectura completa
- **[MANUAL DE DESARROLLO MBI-v3.md](docs/MANUAL%20DE%20DESARROLLO%20MBI-v3.md)** - Guía para desarrolladores
- **[DEVELOPER_PROTOCOL.md](docs/DEVELOPER_PROTOCOL.md)** - Protocolo de desarrollo
- **[AUDIO_LIBRARY_MODULE.md](docs/AUDIO_LIBRARY_MODULE.md)** - Módulo de audio
- **[DATABASE_IMPLEMENTATION_TECHNICAL.md](docs/DATABASE_IMPLEMENTATION_TECHNICAL.md)** - Base de datos
- **[SCHEDULING_SYSTEM_TECHNICAL.md](docs/SCHEDULING_SYSTEM_TECHNICAL.md)** - Sistema de programación
- **[MILESTONE-v3.1.0.md](MILESTONE-v3.1.0.md)** - Versión estable actual

---

## 🤝 Contribuir

### Cómo Contribuir

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'feat: Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Commit Messages
```
feat: Agregar nueva voz
fix: Corregir error en calendario
docs: Actualizar README
style: Formatear código
refactor: Reorganizar módulo X
test: Agregar tests para Y
chore: Actualizar dependencias
```

---

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

```
MIT License

Copyright (c) 2024 Mall Barrio Independencia

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

## 👥 Equipo

- **Desarrollo**: Ignacio1972
- **Documentación**: Team MBI
- **Infraestructura**: DevOps MBI
- **QA**: Testing Team

---

## 🙏 Agradecimientos

- **ElevenLabs** - Por su increíble API de TTS
- **AzuraCast** - Por el sistema de radio
- **La comunidad open source**

---

## 📞 Contacto y Soporte

- **Issues**: [GitHub Issues](https://github.com/Ignacio1972/mbi-v3/issues)
- **Email**: soporte@mallbarrioindependencia.cl
- **Documentación**: [Wiki](https://github.com/Ignacio1972/mbi-v3/wiki)

---

## 🔄 Estado del Proyecto

- ✅ **v3.1.0** - Versión estable actual (Nov 2024)
- 🚧 **v3.2.0** - En desarrollo (Dashboard, Auth)
- 📋 **Roadmap**: Ver [MILESTONE-v3.1.0.md](MILESTONE-v3.1.0.md#-próximos-pasos-roadmap)

---

<div align="center">

**Hecho con ❤️ para Mall Barrio Independencia**

[⬆ Volver arriba](#mbi-v3-sistema-de-radio-y-text-to-speech)

</div>