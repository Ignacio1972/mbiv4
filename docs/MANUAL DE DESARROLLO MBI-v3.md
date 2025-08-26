MANUAL DE DESARROLLO MBI-v3

  Estructura Propuesta:

  docs/
  ├── README.md                          # Punto de
   entrada - "Empieza aquí"
  ├── 01-ENTENDIENDO-EL-SISTEMA.md      # Qué hace
  MBI-v3 y por qué existe
  ├── 02-ARQUITECTURA-GENERAL.md        # Cómo está
   construido (decisiones clave)
  ├── 03-COMO-AGREGAR-FUNCIONES.md      # Guía
  práctica para extender el sistema
  ├── 04-MODULOS-CORE.md                # Los
  módulos principales explicados
  ├── 05-PATRONES-Y-CONVENCIONES.md     # "Así
  hacemos las cosas aquí"
  ├── 06-PUNTOS-DE-EXTENSION.md         # Dónde y
  cómo agregar nuevas features
  ├── 07-FLUJO-DE-DATOS.md              # Cómo
  viaja la información
  ├── 08-INTEGRACIONES-EXTERNAS.md      # APIs
  externas y cómo funcionan
  ├── 09-PROBLEMAS-CONOCIDOS.md         # Gotchas y
   workarounds
  └── 10-ROADMAP-TECNICO.md             # Qué falta
   hacer y mejoras pendientes

  Contenido de cada sección:

  01-ENTENDIENDO-EL-SISTEMA.md

  # Entendiendo MBI-v3

  ## ¿Qué problema resuelve?
  Sistema de radio automatizada para Mall Barrio
  Independencia que permite:
  - Interrumpir música de AzuraCast con anuncios
  - Generar voz sintética con ElevenLabs
  - Programar mensajes automáticos

  ## Contexto del negocio
  - Usuario final: Administrador del mall (no
  técnico)
  - Crítico: Debe funcionar 24/7 sin supervisión
  - Limitación: VPS con recursos limitados (2GB
  RAM)

  ## Stack tecnológico y por qué
  - **Frontend**: Vanilla JS (sin build process,
  simplicidad)
  - **Backend**: PHP 7.4 (ya instalado en VPS)
  - **Base de datos**: SQLite (sin servidor
  adicional)
  - **Radio**: AzuraCast API (sistema existente del
   mall)

  02-ARQUITECTURA-GENERAL.md

  # Arquitectura del Sistema

  ## Decisiones de diseño fundamentales

  ### 1. Módulos independientes
  **Decisión**: Cada módulo es autónomo
  **Por qué**: Facilita mantenimiento y debugging
  **Cómo**: Event Bus para comunicación

  ### 2. No framework frontend
  **Decisión**: Vanilla JS con ES6 modules
  **Por qué**: Evitar complejidad de build tools
  **Trade-off**: Más código boilerplate

  ### 3. Event-driven architecture
  **Decisión**: Comunicación por eventos
  **Por qué**: Desacoplar módulos
  **Ejemplo**:
  ```javascript
  // Módulo A emite
  eventBus.emit('audio:generated', { file:
  'audio.mp3' });

  // Módulo B escucha
  eventBus.on('audio:generated', (data) => {
      this.playAudio(data.file);
  });

  Flujo típico de una función

  1. Usuario interactúa con UI (módulo)
  2. Módulo emite evento
  3. Event Bus distribuye a listeners
  4. API client hace request a backend
  5. PHP procesa y retorna
  6. UI se actualiza

  #### **03-COMO-AGREGAR-FUNCIONES.md**
  ```markdown
  # Cómo agregar nuevas funcionalidades

  ## Caso 1: Agregar función a módulo existente

  ### Ejemplo: Agregar botón "preview" en
  calendario
  1. **Localiza el módulo**:
  `modules/calendar/index.js`
  2. **Agrega el método**:
  ```javascript
  previewSchedule(scheduleId) {
      // Tu lógica aquí
      this.eventBus.emit('schedule:preview', { id:
  scheduleId });
  }
  3. Actualiza la UI en el método render()
  4. Emite eventos si otros módulos necesitan
  saberlo

  Caso 2: Crear nuevo módulo

  Estructura requerida:

  modules/tu-modulo/
  ├── index.js         # Clase principal
  ├── styles.css       # Estilos del módulo
  └── templates.js     # HTML templates (opcional)

  Template de módulo nuevo:

  // modules/tu-modulo/index.js
  export default class TuModulo {
      constructor(eventBus) {
          this.eventBus = eventBus;
          this.container = null;
          this.setupEventListeners();
      }

      initialize(container) {
          this.container = container;
          this.render();
      }

      setupEventListeners() {
          // Escuchar eventos del sistema
          this.eventBus.on('some:event', (data) =>
  {
              this.handleEvent(data);
          });
      }

      render() {
          this.container.innerHTML = `
              <div class="tu-modulo">
                  <!-- Tu UI aquí -->
              </div>
          `;
      }
  }

  Registrar el módulo:

  // En index.html o module-loader.js
  moduleLoader.register('tu-modulo',
  '/modules/tu-modulo/index.js');

  #### **04-MODULOS-CORE.md**
  ```markdown
  # Módulos Core del Sistema

  ## 1. Radio Module (`/modules/radio/`)
  **Función**: Control de radio en vivo
  **Características clave**:
  - WebSocket con AzuraCast
  - Control de volumen/play/pause
  - Interrupción para anuncios

  **Punto de extensión**:
  ```javascript
  // Para agregar nuevo tipo de interrupción
  interruptWithCustom(audioFile, priority = 'high')
   {
      // Agregar aquí lógica personalizada
  }

  2. Calendar Module (/modules/calendar/)

  Función: Programación de eventos
  Base de datos: SQLite en
  /calendario/api/db/calendar.db
  Tipos de schedule:
  - interval: Cada X tiempo
  - specific: Días específicos
  - once: Una sola vez

  Para agregar nuevo tipo:
  1. Actualizar getScheduleTypeLabel()
  2. Agregar lógica en saveSchedule()
  3. Modificar UI en renderScheduleForm()

  3. Message Configurator 
  (/modules/message-configurator/)

  Función: Crear mensajes TTS
  API: ElevenLabs (key en api/config.php)
  Límite: 10,000 caracteres/mes

  Para cambiar proveedor TTS:
  1. Modificar api/generate.php
  2. Actualizar método generateAudio()
  3. Mantener misma estructura de response

  4. Event Bus (/shared/event-bus.js)

  Función: Comunicación entre módulos
  Patrón: Publisher/Subscriber

  Eventos principales:
  - audio:generated - Audio creado
  - schedule:created - Programación creada
  - radio:interrupted - Radio interrumpida
  - module:loaded - Módulo cargado

  #### **05-PATRONES-Y-CONVENCIONES.md**
  ```markdown
  # Patrones y Convenciones

  ## Convenciones de código

  ### Nombres
  - Clases: PascalCase (`CalendarModule`)
  - Métodos: camelCase (`getSchedules()`)
  - Eventos: namespace:action (`audio:generated`)
  - Archivos: kebab-case
  (`message-configurator.js`)

  ### Estructura de métodos
  ```javascript
  // SIEMPRE validar inputs
  methodName(param) {
      if (!param) {
          console.error('methodName: param
  required');
          return;
      }

      try {
          // Lógica principal
      } catch (error) {
          console.error('methodName failed:',
  error);
          // Emitir evento de error si es crítico
          this.eventBus.emit('error:critical', {
  error });
      }
  }

  Manejo de API calls

  // SIEMPRE usar async/await con try/catch
  async fetchData() {
      try {
          const response = await
  fetch('/api/endpoint');
          if (!response.ok) throw new Error('API 
  Error');
          return await response.json();
      } catch (error) {
          // Mostrar feedback al usuario
          this.showError('No se pudo cargar los 
  datos');
          return null;
      }
  }

  Patrones establecidos

  1. Singleton para módulos

  // Cada módulo es una única instancia
  let instance = null;
  export default class Module {
      constructor() {
          if (instance) return instance;
          instance = this;
      }
  }

  2. Template literals para UI

  // NO usar createElement, usar templates
  render() {
      this.container.innerHTML = `
          <div class="module">
              ${this.items.map(item => `
                  <div>${item.name}</div>
              `).join('')}
          </div>
      `;
  }

  3. CSS Modules simulados

  /* Prefijar con nombre del módulo */
  .calendar-module { }
  .calendar-module__header { }
  .calendar-module__item { }

  #### **06-PUNTOS-DE-EXTENSION.md**
  ```markdown
  # Puntos de Extensión

  ## Dónde agregar funcionalidades

  ### 1. Nuevos tipos de anuncios
  **Ubicación**: `/modules/message-configurator/`
  **Método**: `addMessageType()`
  ```javascript
  // Agregar en messageTypes
  const messageTypes = {
      'oferta': { icon: '🛒', label: 'Oferta' },
      'nuevo-tipo': { icon: '🆕', label: 'Nuevo' }
  // <- Agregar aquí
  };

  2. Nuevos proveedores de audio

  Ubicación: /api/generate.php
  Función: generateAudioWithProvider()
  // Agregar nuevo case
  switch($provider) {
      case 'elevenlabs':
          return generateWithElevenLabs($text);
      case 'google':
          return generateWithGoogle($text); // <- 
  Nuevo
  }

  3. Nuevas integraciones de radio

  Ubicación: /modules/radio/adapters/
  Crear: nuevo-adapter.js
  export class NuevoRadioAdapter {
      async connect() { }
      async interrupt() { }
      async resume() { }
  }

  4. Nuevos formatos de exportación

  Ubicación: /modules/campaign-library/exporters/
  // Agregar nuevo formato
  exportFormats = {
      'json': this.exportJSON,
      'csv': this.exportCSV,
      'xml': this.exportXML  // <- Nuevo
  };

  Hooks disponibles

  Antes/después de operaciones críticas

  // En cualquier módulo
  beforeSave(data) {
      this.eventBus.emit('before:save', data);
      // Otros módulos pueden modificar data
  }

  afterSave(result) {
      this.eventBus.emit('after:save', result);
      // Otros módulos reaccionan al guardado
  }

  #### **07-FLUJO-DE-DATOS.md**
  ```markdown
  # Flujo de Datos

  ## Ciclo de vida de un mensaje

  Usuario ingresa texto
      ↓
  Message Configurator valida
      ↓
  API Client envía a /api/generate.php
      ↓
  ElevenLabs genera audio
      ↓
  Archivo guardado en /temp/
      ↓
  Event: 'audio:generated'
      ↓
  Calendar puede programarlo
      ↓
  Cron ejecuta schedule
      ↓
  Radio module interrumpe
      ↓
  Audio se reproduce
      ↓
  Radio resume música

  ## Estados del sistema

  ### Audio States
  - `idle` - Sin actividad
  - `generating` - Creando audio
  - `ready` - Audio listo
  - `playing` - Reproduciendo
  - `error` - Fallo en generación

  ### Schedule States
  - `pending` - Esperando hora
  - `active` - En ejecución
  - `completed` - Finalizado
  - `failed` - Error en ejecución

  ## Flujo de errores
  ```javascript
  // Todos los errores burbujean al Event Bus
  try {
      operacion();
  } catch (error) {
      eventBus.emit('error', {
          module: 'calendar',
          operation: 'save',
          error: error.message,
          timestamp: Date.now()
      });
  }

  // Un error handler central los procesa
  eventBus.on('error', (data) => {
      logger.log(data);
      ui.showNotification(data);
  });

  #### **08-INTEGRACIONES-EXTERNAS.md**
  ```markdown
  # Integraciones Externas

  ## AzuraCast API
  **URL**: http://51.222.25.222
  **Auth**: API Key en header
  **Endpoints principales**:
  - `/api/station/1/nowplaying` - Qué está sonando
  - `/api/station/1/queue` - Cola de reproducción
  - `/api/station/1/files` - Archivos de audio

  **Ejemplo interrupción**:
  ```php
  $ch = curl_init();
  curl_setopt($ch, CURLOPT_URL, $azuracast_url .
  '/api/station/1/fallback');
  curl_setopt($ch, CURLOPT_HTTPHEADER, [
      'X-API-Key: ' . $api_key
  ]);
  curl_setopt($ch, CURLOPT_POSTFIELDS, [
      'path' => $audio_file
  ]);

  ElevenLabs TTS

  Límites:
  - 10,000 chars/mes (plan free)
  - Max 5000 chars por request
  - Rate limit: 10 req/min

  Voices disponibles:
  - 21m00Tcm4TlvDq8ikWAM - Rachel (default)
  - ErXwobaYiN019PkySvjV - Antoni

  Para cambiar voz:
  // En api/generate.php línea 45
  $voice_id = '21m00Tcm4TlvDq8ikWAM'; // <- Cambiar
   aquí

  Manejo de caídas de servicio

  // Implementar retry con backoff
  async callWithRetry(fn, retries = 3) {
      for (let i = 0; i < retries; i++) {
          try {
              return await fn();
          } catch (error) {
              if (i === retries - 1) throw error;
              await sleep(Math.pow(2, i) * 1000);
  // Exponential backoff
          }
      }
  }

  #### **09-PROBLEMAS-CONOCIDOS.md**
  ```markdown
  # Problemas Conocidos y Soluciones

  ## 1. Memory leak en Calendar module
  **Síntoma**: Página lenta después de 1 hora
  **Causa**: Event listeners no se limpian
  **Workaround**:
  ```javascript
  // Agregar en destroy()
  destroy() {
      this.eventBus.removeAllListeners();
      this.intervals.forEach(clearInterval);
  }

  2. CORS con AzuraCast

  Problema: Bloqueo CORS en algunas operaciones
  Solución: Proxy través de PHP
  // api/azuracast-proxy.php
  header('Access-Control-Allow-Origin: *');
  // Hacer request desde PHP

  3. Timezone issues

  Problema: Schedules ejecutan en hora incorrecta
  Causa: VPS en UTC, usuario en hora local
  Fix actual: Todo se maneja en UTC
  // SIEMPRE usar UTC
  const now = new Date().toISOString();

  4. Límite de archivo SQLite

  Problema: DB crece sin límite
  Solución pendiente: Implementar limpieza
  automática
  -- Ejecutar mensualmente
  DELETE FROM schedules WHERE created_at <
  datetime('now', '-90 days');

  5. Cache de audio no se limpia

  Ubicación: /temp/ y /api/temp/
  Workaround manual:
  find /var/www/mbi-v3/temp -mtime +7 -delete

  Errores comunes de desarrollo

  "Module not found"

  // Error: Ruta relativa incorrecta
  import Module from './module'; // ❌

  // Correcto: Ruta desde root
  import Module from '/modules/module/index.js'; //
   ✅

  "eventBus is undefined"

  // Error: No inyectar dependencia
  class Module {
      constructor() { } // ❌
  }

  // Correcto: Recibir eventBus
  class Module {
      constructor(eventBus) { // ✅
          this.eventBus = eventBus;
      }
  }

  #### **10-ROADMAP-TECNICO.md**
  ```markdown
  # Roadmap Técnico

  ## Mejoras urgentes (Technical Debt)

  ### 1. Sistema de logs centralizado
  **Problema**: Logs dispersos o inexistentes
  **Propuesta**:
  ```javascript
  class Logger {
      log(level, module, message, data) {
          // Enviar a archivo
          // Enviar a consola
          // Enviar a servidor si crítico
      }
  }

  2. Tests automatizados

  Estado actual: Sin tests
  Necesario:
  - Unit tests para módulos core
  - Integration tests para API
  - E2E para flujos críticos

  3. Build process

  Problema: No hay minificación
  Solución: Webpack o Rollup config simple

  Features planeadas

  Corto plazo (1-2 meses)

  - Dashboard con métricas
  - Backup automático de DB
  - Gestión de usuarios/permisos
  - Historial de reproducciones

  Mediano plazo (3-6 meses)

  - App móvil (React Native)
  - Webhooks para eventos
  - API pública documentada
  - Multi-idioma

  Largo plazo (6+ meses)

  - Machine Learning para horarios óptimos
  - Integración con redes sociales
  - Analytics avanzado
  - Multi-tenant (varios malls)

  Refactors necesarios

  1. Separar lógica de UI

  // Actual: Todo mezclado
  class Module {
      render() {
          // Lógica Y presentación
      }
  }

  // Propuesto: Separación
  class ModuleController {
      // Lógica
  }
  class ModuleView {
      // Presentación
  }

  2. Mover a TypeScript

  Beneficios:
  - Type safety
  - Mejor IDE support
  - Menos bugs en runtime

  3. API REST completa

  Actual: Endpoints ad-hoc
  Propuesto: RESTful API
  GET    /api/schedules
  POST   /api/schedules
  PUT    /api/schedules/:id
  DELETE /api/schedules/:id

  Optimizaciones pendientes

  Performance

  - Lazy loading de módulos
  - Service Worker para offline
  - Comprimir assets
  - CDN para librerías

  Seguridad

  - Rate limiting por IP
  - CSRF tokens
  - Input sanitization mejorada
  - Audit log de acciones

  Cómo contribuir a estas mejoras

  1. Elegir item del roadmap
  2. Crear branch: feature/nombre-feature
  3. Implementar con tests
  4. PR con descripción clara
  5. Code review
  6. Merge a main

  ### **README.md principal:**
  ```markdown
  # Manual de Desarrollo MBI-v3

  ## 🚀 Quick Start para nuevos desarrolladores

  ### Primero lee esto:
  1. **01-ENTENDIENDO-EL-SISTEMA.md** - Contexto
  general
  2. **02-ARQUITECTURA-GENERAL.md** - Cómo está
  construido
  3. **05-PATRONES-Y-CONVENCIONES.md** - Cómo
  escribimos código aquí

  ### Para agregar features:
  - **03-COMO-AGREGAR-FUNCIONES.md** - Guía paso a
  paso
  - **06-PUNTOS-DE-EXTENSION.md** - Dónde hacer
  cambios

  ### Referencias técnicas:
  - **04-MODULOS-CORE.md** - Detalles de cada
  módulo
  - **07-FLUJO-DE-DATOS.md** - Cómo viaja la
  información
  - **08-INTEGRACIONES-EXTERNAS.md** - APIs que
  usamos

  ### Antes de deployar:
  - **09-PROBLEMAS-CONOCIDOS.md** - Gotchas y
  workarounds
  - **10-ROADMAP-TECNICO.md** - Qué está pendiente

  ## 📝 Regla de oro
  Si modificas algo, actualiza la documentación
  correspondiente.