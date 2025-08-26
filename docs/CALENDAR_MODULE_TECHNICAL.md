# Calendar Module v2 - Documentación Técnica Completa

## 📋 Índice
1. [Overview](#overview)
2. [Arquitectura del Módulo](#arquitectura-del-módulo)
3. [Flujo de Trabajo](#flujo-de-trabajo)
4. [Componentes Frontend](#componentes-frontend)
5. [Backend y API](#backend-y-api)
6. [Base de Datos](#base-de-datos)
7. [Sistema de Cron](#sistema-de-cron)
8. [Tipos de Programación](#tipos-de-programación)
9. [Categorías y Filtros](#categorías-y-filtros)
10. [Integración con Radio](#integración-con-radio)
11. [Debugging y Logs](#debugging-y-logs)
12. [Extensibilidad](#extensibilidad)

## Overview

El **Calendar Module v2** es el sistema de programación automática de anuncios para el Mall Barrio Independencia. Permite programar la reproducción de audio en la radio en horarios específicos, con tres tipos de programación diferentes y categorización por tipo de mensaje.

### Características Principales
- **3 tipos de programación**: Interval, Specific, Once
- **6 categorías** con colores y emojis distintivos
- **Base de datos SQLite** para persistencia
- **Cron job** para ejecución automática cada minuto
- **Integración** con AzuraCast para reproducción
- **Filtrado visual** por categorías
- **Vista de tabla** con todas las programaciones activas

### Stack Técnico
- **Frontend**: Vanilla JS con ES6 modules
- **UI Calendar**: FullCalendar v6.1 (opcional)
- **Backend**: PHP 7.4+
- **Base de Datos**: SQLite3
- **Scheduler**: Cron (Linux)
- **Radio**: AzuraCast API

## Arquitectura del Módulo

```
modules/calendar/
├── index.js                    # Clase principal del módulo
├── components/
│   ├── calendar-view.js        # Vista del calendario (FullCalendar wrapper)
│   ├── calendar-filters.js     # Sistema de filtros por categoría
│   ├── event-modal.js          # Modal para crear/editar eventos
│   └── event-list.js           # Lista de eventos activos
├── services/
│   └── calendar-api.js         # Comunicación con backend
├── templates/
│   └── calendar.html           # Template HTML del módulo
└── styles/
    └── calendar.css            # Estilos específicos del calendario

api/
├── audio-scheduler.php         # API principal de scheduling
└── scheduler-cron.php          # Script ejecutado por cron

calendario/api/
├── db/
│   └── calendar.db            # Base de datos SQLite
└── cron.php                   # Script cron principal
```

## Flujo de Trabajo

### 1. Creación de Schedule

```javascript
// Frontend: Usuario crea nueva programación
const scheduleData = {
    filename: 'anuncio.mp3',
    title: 'Oferta del día',
    schedule_type: 'interval',
    interval_hours: 2,
    interval_minutes: 30,
    category: 'ofertas',
    is_active: true
};

// Envío al backend
await apiClient.post('/api/audio-scheduler.php', {
    action: 'create',
    ...scheduleData
});
```

### 2. Procesamiento Backend

```php
// audio-scheduler.php
function createSchedule($input) {
    $db = getDBConnection();
    
    // Validar y preparar datos
    $schedule_type = $input['schedule_type'];
    $category = $input['category'] ?? 'sin_categoria';
    
    // Calcular schedule_time según tipo
    if ($schedule_type === 'interval') {
        $schedule_time = sprintf("%02d:%02d", 
            $input['interval_hours'], 
            $input['interval_minutes']
        );
    }
    
    // Insertar en base de datos
    $stmt = $db->prepare("
        INSERT INTO audio_schedule (
            filename, title, schedule_type, schedule_time,
            interval_hours, interval_minutes, category,
            is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ");
    
    $stmt->execute([...]);
}
```

### 3. Ejecución por Cron

```php
// cron.php - Ejecuta cada minuto
function checkAndExecuteSchedules() {
    $now = new DateTime();
    $schedules = getActiveSchedules();
    
    foreach ($schedules as $schedule) {
        if (shouldExecute($schedule, $now)) {
            executeSchedule($schedule);
            logExecution($schedule);
        }
    }
}
```

## Componentes Frontend

### CalendarModule (index.js)

```javascript
export default class CalendarModule {
    constructor() {
        this.name = 'calendar';
        this.container = null;
        this.calendarView = null;
        this.calendarFilters = null;
        this.availableFiles = [];
        this.activeSchedules = [];
    }
    
    async load(container) {
        // 1. Cargar template HTML
        await this.loadTemplate();
        
        // 2. Cargar archivos disponibles
        await this.loadAvailableFiles();
        
        // 3. Inicializar componentes
        await this.initializeComponents();
        
        // 4. Cargar schedules activos
        await this.loadSchedulesList();
        
        // 5. Configurar event listeners
        this.attachEventListeners();
    }
    
    async loadSchedulesList() {
        const response = await apiClient.post('/api/audio-scheduler.php', {
            action: 'list'
        });
        
        if (response.success) {
            this.activeSchedules = response.schedules;
            this.displaySchedulesTable(response.schedules);
        }
    }
    
    displaySchedulesTable(schedules) {
        // Renderizar tabla con categorías visuales
        const categoryInfo = {
            'ofertas': { emoji: '🛒', color: '#22c55e' },
            'eventos': { emoji: '🎉', color: '#3b82f6' },
            'informacion': { emoji: 'ℹ️', color: '#06b6d4' },
            'emergencias': { emoji: '🚨', color: '#ef4444' },
            'servicios': { emoji: '🛎️', color: '#a855f7' },
            'horarios': { emoji: '🕐', color: '#f59e0b' }
        };
        
        // Crear HTML con badges de categoría
        schedules.forEach(schedule => {
            const catInfo = categoryInfo[schedule.category];
            // Renderizar fila con badge visual
        });
    }
}
```

### CalendarFilters (calendar-filters.js)

```javascript
export class CalendarFilters {
    constructor(container, onFilterChange) {
        this.container = container;
        this.onFilterChange = onFilterChange;
        this.activeFilters = new Set();
        this.init();
    }
    
    init() {
        const categories = [
            { id: 'ofertas', label: 'Ofertas', emoji: '🛒', color: '#22c55e' },
            { id: 'eventos', label: 'Eventos', emoji: '🎉', color: '#3b82f6' },
            // ... más categorías
        ];
        
        categories.forEach(cat => {
            const button = this.createFilterButton(cat);
            button.addEventListener('click', () => {
                this.toggleFilter(cat.id);
            });
        });
    }
    
    toggleFilter(categoryId) {
        if (this.activeFilters.has(categoryId)) {
            this.activeFilters.delete(categoryId);
        } else {
            this.activeFilters.add(categoryId);
        }
        
        this.onFilterChange(Array.from(this.activeFilters));
    }
}
```

### Schedule Modal

```javascript
// Crear nuevo schedule
async createSchedule() {
    const formData = this.getFormData();
    
    // Validar según tipo
    if (formData.schedule_type === 'interval') {
        if (!formData.interval_hours && !formData.interval_minutes) {
            throw new Error('Debe especificar intervalo');
        }
    } else if (formData.schedule_type === 'specific') {
        if (!formData.specific_days || !formData.specific_times) {
            throw new Error('Debe seleccionar días y horas');
        }
    } else if (formData.schedule_type === 'once') {
        if (!formData.once_datetime) {
            throw new Error('Debe especificar fecha y hora');
        }
    }
    
    // Enviar al backend
    const response = await apiClient.post('/api/audio-scheduler.php', {
        action: 'create',
        ...formData
    });
    
    if (response.success) {
        this.close();
        eventBus.emit('schedule:created', response.schedule);
    }
}
```

## Backend y API

### audio-scheduler.php

```php
<?php
// Configuración
$dbPath = __DIR__ . '/../calendario/api/db/calendar.db';
date_default_timezone_set('America/Santiago');

// Router principal
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

try {
    switch($action) {
        case 'create':
            $result = createSchedule($input);
            break;
            
        case 'list':
            $result = listSchedules($input);
            break;
            
        case 'update':
            $result = updateSchedule($input);
            break;
            
        case 'delete':
            $result = deleteSchedule($input['id']);
            break;
            
        case 'toggle':
            $result = toggleSchedule($input['id']);
            break;
            
        default:
            throw new Exception('Acción no válida');
    }
    
    echo json_encode(['success' => true, ...$result]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
```

### Funciones principales

```php
/**
 * Lista schedules con filtros opcionales
 */
function listSchedules($input) {
    $db = getDBConnection();
    
    $query = "SELECT * FROM audio_schedule WHERE 1=1";
    $params = [];
    
    // Filtrar por categoría
    if (isset($input['category'])) {
        $query .= " AND category = ?";
        $params[] = $input['category'];
    }
    
    // Filtrar por estado
    if (isset($input['is_active'])) {
        $query .= " AND is_active = ?";
        $params[] = $input['is_active'];
    }
    
    // Filtrar por tipo
    if (isset($input['schedule_type'])) {
        $query .= " AND schedule_type = ?";
        $params[] = $input['schedule_type'];
    }
    
    $query .= " ORDER BY priority DESC, created_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    
    return ['schedules' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
}

/**
 * Validar si un schedule debe ejecutarse
 */
function shouldExecuteSchedule($schedule, $now) {
    // Verificar si está activo
    if (!$schedule['is_active']) {
        return false;
    }
    
    // Verificar fechas
    if ($schedule['start_date'] && $now < new DateTime($schedule['start_date'])) {
        return false;
    }
    if ($schedule['end_date'] && $now > new DateTime($schedule['end_date'])) {
        return false;
    }
    
    // Según tipo de schedule
    switch($schedule['schedule_type']) {
        case 'interval':
            return checkIntervalSchedule($schedule, $now);
            
        case 'specific':
            return checkSpecificSchedule($schedule, $now);
            
        case 'once':
            return checkOnceSchedule($schedule, $now);
    }
    
    return false;
}
```

## Base de Datos

### Esquema principal

```sql
CREATE TABLE audio_schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Información básica
    filename TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'sin_categoria',
    
    -- Tipo de programación
    schedule_type TEXT DEFAULT 'interval', -- interval, specific, once
    
    -- Para tipo 'interval'
    interval_hours INTEGER DEFAULT 0,
    interval_minutes INTEGER DEFAULT 30,
    
    -- Para tipo 'specific'
    specific_days TEXT, -- JSON array: ["monday", "tuesday"]
    specific_times TEXT, -- JSON array: ["09:00", "14:00"]
    
    -- Para tipo 'once'
    once_datetime DATETIME,
    
    -- Control
    is_active BOOLEAN DEFAULT 1,
    priority INTEGER DEFAULT 5,
    
    -- Fechas límite
    start_date DATE,
    end_date DATE,
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_executed DATETIME,
    execution_count INTEGER DEFAULT 0,
    
    -- Notas
    notes TEXT
);

-- Índices para performance
CREATE INDEX idx_schedule_active ON audio_schedule(is_active, schedule_type);
CREATE INDEX idx_schedule_category ON audio_schedule(category, is_active);
CREATE INDEX idx_last_executed ON audio_schedule(last_executed);
```

### Tabla de logs

```sql
CREATE TABLE schedule_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_id INTEGER,
    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT, -- 'success', 'failed', 'skipped'
    message TEXT,
    FOREIGN KEY (schedule_id) REFERENCES audio_schedule(id)
);
```

## Sistema de Cron

### Configuración crontab

```bash
# Ejecutar cada minuto
* * * * * php /var/www/mbi-v3/calendario/api/cron.php >> /var/www/mbi-v3/calendario/logs/cron.log 2>&1
```

### cron.php

```php
<?php
// calendario/api/cron.php

require_once __DIR__ . '/../../api/config.php';
require_once __DIR__ . '/../../api/services/radio-service.php';

// Configurar timezone
date_default_timezone_set('America/Santiago');

// Log de inicio
$logFile = __DIR__ . '/../logs/scheduler/' . date('Y-m-d') . '.log';
$now = date('Y-m-d H:i:s');
file_put_contents($logFile, "[$now] Iniciando verificación de schedules\n", FILE_APPEND);

try {
    $db = new PDO("sqlite:" . __DIR__ . "/db/calendar.db");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Obtener schedules activos
    $stmt = $db->prepare("
        SELECT * FROM audio_schedule 
        WHERE is_active = 1 
        ORDER BY priority DESC
    ");
    $stmt->execute();
    $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($schedules as $schedule) {
        if (shouldExecute($schedule)) {
            executeSchedule($schedule);
            updateLastExecuted($db, $schedule['id']);
            logExecution($logFile, $schedule, 'success');
        }
    }
    
} catch (Exception $e) {
    file_put_contents($logFile, "[$now] ERROR: " . $e->getMessage() . "\n", FILE_APPEND);
}

/**
 * Determinar si un schedule debe ejecutarse
 */
function shouldExecute($schedule) {
    $now = new DateTime();
    
    switch($schedule['schedule_type']) {
        case 'interval':
            // Calcular si ha pasado el intervalo
            if ($schedule['last_executed']) {
                $lastExec = new DateTime($schedule['last_executed']);
                $interval = new DateInterval(sprintf('PT%dH%dM', 
                    $schedule['interval_hours'] ?? 0,
                    $schedule['interval_minutes'] ?? 30
                ));
                $nextExec = $lastExec->add($interval);
                return $now >= $nextExec;
            }
            return true; // Primera ejecución
            
        case 'specific':
            // Verificar día y hora
            $currentDay = strtolower($now->format('l'));
            $currentTime = $now->format('H:i');
            
            $days = json_decode($schedule['specific_days'], true);
            $times = json_decode($schedule['specific_times'], true);
            
            if (in_array($currentDay, $days)) {
                foreach ($times as $time) {
                    if ($currentTime === $time) {
                        // Verificar que no se haya ejecutado en el último minuto
                        if ($schedule['last_executed']) {
                            $lastExec = new DateTime($schedule['last_executed']);
                            $diff = $now->getTimestamp() - $lastExec->getTimestamp();
                            if ($diff < 60) return false;
                        }
                        return true;
                    }
                }
            }
            return false;
            
        case 'once':
            // Ejecutar una sola vez en fecha específica
            if ($schedule['once_datetime']) {
                $targetTime = new DateTime($schedule['once_datetime']);
                $diff = abs($now->getTimestamp() - $targetTime->getTimestamp());
                
                // Ejecutar si estamos dentro del minuto objetivo
                // y no se ha ejecutado antes
                return $diff < 60 && $schedule['execution_count'] == 0;
            }
            return false;
    }
    
    return false;
}

/**
 * Ejecutar el schedule (enviar audio a radio)
 */
function executeSchedule($schedule) {
    // Usar la función existente de radio-service.php
    $result = sendToRadio($schedule['filename']);
    
    if (!$result['success']) {
        throw new Exception("Error enviando a radio: " . $result['error']);
    }
    
    return true;
}
```

## Tipos de Programación

### 1. Interval (Repetir cada X tiempo)

```javascript
// Frontend
const intervalSchedule = {
    schedule_type: 'interval',
    interval_hours: 2,
    interval_minutes: 30,
    // Se ejecutará cada 2 horas y 30 minutos
};

// Backend - Cálculo de próxima ejecución
function calculateNextInterval($lastExecuted, $hours, $minutes) {
    $last = new DateTime($lastExecuted);
    $interval = new DateInterval(sprintf('PT%dH%dM', $hours, $minutes));
    return $last->add($interval);
}
```

### 2. Specific (Días y horas específicas)

```javascript
// Frontend
const specificSchedule = {
    schedule_type: 'specific',
    specific_days: ['monday', 'wednesday', 'friday'],
    specific_times: ['09:00', '14:00', '18:00'],
    // Se ejecutará L-M-V a las 9:00, 14:00 y 18:00
};

// Backend - Verificación
function checkSpecificDay($schedule, $now) {
    $currentDay = strtolower($now->format('l'));
    $currentTime = $now->format('H:i');
    
    $days = json_decode($schedule['specific_days'], true);
    $times = json_decode($schedule['specific_times'], true);
    
    return in_array($currentDay, $days) && 
           in_array($currentTime, $times);
}
```

### 3. Once (Una sola vez)

```javascript
// Frontend
const onceSchedule = {
    schedule_type: 'once',
    once_datetime: '2024-12-25 12:00:00',
    // Se ejecutará solo el 25/12/2024 a las 12:00
};

// Backend - Verificación
function checkOnceSchedule($schedule, $now) {
    $target = new DateTime($schedule['once_datetime']);
    $diff = abs($now->getTimestamp() - $target->getTimestamp());
    
    // Ejecutar si estamos dentro del minuto y no se ha ejecutado
    return $diff < 60 && $schedule['execution_count'] == 0;
}
```

## Categorías y Filtros

### Definición de Categorías

```javascript
const CATEGORIES = {
    'ofertas': {
        name: 'Ofertas',
        emoji: '🛒',
        color: '#22c55e',
        description: 'Promociones y descuentos'
    },
    'eventos': {
        name: 'Eventos',
        emoji: '🎉',
        color: '#3b82f6',
        description: 'Actividades y shows'
    },
    'informacion': {
        name: 'Información',
        emoji: 'ℹ️',
        color: '#06b6d4',
        description: 'Avisos generales'
    },
    'emergencias': {
        name: 'Emergencias',
        emoji: '🚨',
        color: '#ef4444',
        description: 'Alertas urgentes'
    },
    'servicios': {
        name: 'Servicios',
        emoji: '🛎️',
        color: '#a855f7',
        description: 'Servicios del mall'
    },
    'horarios': {
        name: 'Horarios',
        emoji: '🕐',
        color: '#f59e0b',
        description: 'Apertura y cierre'
    }
};
```

### Sistema de Filtrado

```javascript
// Filtrar schedules por categoría
filterSchedulesByCategory(schedules, activeCategories) {
    if (activeCategories.length === 0) {
        return schedules; // Sin filtros, mostrar todo
    }
    
    return schedules.filter(schedule => 
        activeCategories.includes(schedule.category)
    );
}

// Aplicar filtros visuales
applyVisualFilters() {
    const filtered = this.filterSchedulesByCategory(
        this.allSchedules,
        this.activeFilters
    );
    
    this.displaySchedulesTable(filtered);
    this.updateCalendarView(filtered);
}
```

## Integración con Radio

### Envío a AzuraCast

```php
// Función para interrumpir radio con archivo programado
function sendScheduledAudioToRadio($filename) {
    require_once __DIR__ . '/../../api/config.php';
    
    // Construir path completo
    $audioPath = BIBLIOTECA_DIR . $filename;
    
    if (!file_exists($audioPath)) {
        throw new Exception("Archivo no encontrado: $filename");
    }
    
    // Llamar a AzuraCast API
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => AZURACAST_BASE_URL . '/api/station/' . 
                       AZURACAST_STATION_ID . '/files/play',
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'X-API-Key: ' . AZURACAST_API_KEY,
            'Content-Type: application/json'
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'path' => $filename,
            'interrupt': true
        ]),
        CURLOPT_RETURNTRANSFER => true
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        throw new Exception("Error en AzuraCast: HTTP $httpCode");
    }
    
    return json_decode($response, true);
}
```

## Debugging y Logs

### Sistema de Logs

```php
// Estructura de logs
calendario/logs/
├── scheduler/
│   ├── 2024-11-23.log    # Log diario del scheduler
│   └── errors.log         # Solo errores
├── cron.log               # Output directo del cron
└── execution.log          # Historial de ejecuciones

// Función de logging
function logSchedulerEvent($type, $schedule, $message) {
    $logDir = __DIR__ . '/../logs/scheduler/';
    $logFile = $logDir . date('Y-m-d') . '.log';
    
    $entry = sprintf(
        "[%s] [%s] Schedule #%d (%s): %s\n",
        date('Y-m-d H:i:s'),
        strtoupper($type),
        $schedule['id'],
        $schedule['title'],
        $message
    );
    
    file_put_contents($logFile, $entry, FILE_APPEND | LOCK_EX);
    
    // También log de errores si es crítico
    if ($type === 'error') {
        file_put_contents($logDir . 'errors.log', $entry, FILE_APPEND);
    }
}
```

### Debug en Frontend

```javascript
// Habilitar modo debug
window.DEBUG_CALENDAR = true;

// En el código
if (window.DEBUG_CALENDAR) {
    console.group('Calendar Schedule Creation');
    console.log('Type:', scheduleType);
    console.log('Data:', scheduleData);
    console.log('Validation:', validationResult);
    console.groupEnd();
}

// Monitor de eventos
eventBus.on('*', (eventName, data) => {
    if (window.DEBUG_CALENDAR) {
        console.log(`[Calendar Event] ${eventName}:`, data);
    }
});
```

### Comandos útiles para debugging

```bash
# Ver últimas ejecuciones del cron
tail -f /var/www/mbi-v3/calendario/logs/cron.log

# Ver logs del día actual
tail -f /var/www/mbi-v3/calendario/logs/scheduler/$(date +%Y-%m-%d).log

# Verificar próximas ejecuciones
sqlite3 /var/www/mbi-v3/calendario/api/db/calendar.db \
  "SELECT title, schedule_type, last_executed FROM audio_schedule WHERE is_active=1"

# Ejecutar cron manualmente para test
php /var/www/mbi-v3/calendario/api/cron.php

# Ver schedules por categoría
sqlite3 /var/www/mbi-v3/calendario/api/db/calendar.db \
  "SELECT category, COUNT(*) FROM audio_schedule GROUP BY category"
```

## Extensibilidad

### Agregar nuevo tipo de programación

```javascript
// 1. Frontend - Agregar al enum
const SCHEDULE_TYPES = {
    interval: 'Repetir cada X tiempo',
    specific: 'Días específicos',
    once: 'Una sola vez',
    custom: 'Personalizado' // NUEVO
};

// 2. Agregar UI para configuración
if (scheduleType === 'custom') {
    // Mostrar controles específicos
    showCustomScheduleControls();
}

// 3. Backend - Agregar lógica de verificación
function shouldExecuteCustomSchedule($schedule, $now) {
    // Implementar lógica personalizada
    // Por ejemplo: ejecutar en días pares del mes
    $dayOfMonth = (int)$now->format('d');
    return $dayOfMonth % 2 === 0;
}

// 4. Actualizar el switch en cron.php
case 'custom':
    return shouldExecuteCustomSchedule($schedule, $now);
```

### Agregar nueva categoría

```javascript
// 1. Definir en constantes
const CATEGORIES = {
    // ...existentes
    'promociones': {
        name: 'Promociones',
        emoji: '💰',
        color: '#fbbf24',
        description: 'Promociones especiales'
    }
};

// 2. Agregar al filtro UI
<button class="category-filter" data-category="promociones">
    💰 Promociones
</button>

// 3. Actualizar base de datos (opcional)
// Las categorías son strings libres, no requieren migración
```

### Integrar con otro sistema de radio

```php
// Crear adapter para nuevo sistema
interface RadioAdapter {
    public function interrupt($filename);
    public function getStatus();
}

class AzuraCastAdapter implements RadioAdapter {
    public function interrupt($filename) {
        // Implementación actual
    }
}

class CustomRadioAdapter implements RadioAdapter {
    public function interrupt($filename) {
        // Nueva implementación
    }
}

// En config.php
define('RADIO_ADAPTER', 'CustomRadioAdapter');

// En cron.php
$adapter = new (RADIO_ADAPTER)();
$adapter->interrupt($schedule['filename']);
```

### Agregar notificaciones

```javascript
// Agregar sistema de notificaciones cuando se ejecuta schedule
eventBus.on('schedule:executed', (data) => {
    // Mostrar notificación en UI
    showNotification({
        title: 'Programación ejecutada',
        message: `${data.title} se reprodujo exitosamente`,
        type: 'success',
        duration: 5000
    });
    
    // Opcional: Enviar a webhook
    fetch('/api/webhook/schedule-executed', {
        method: 'POST',
        body: JSON.stringify(data)
    });
});
```

## Performance y Optimización

### Índices de base de datos

```sql
-- Índices críticos para performance
CREATE INDEX idx_active_schedules 
    ON audio_schedule(is_active, schedule_type, priority);

CREATE INDEX idx_category_active 
    ON audio_schedule(category, is_active);

CREATE INDEX idx_last_executed 
    ON audio_schedule(last_executed, is_active);

CREATE INDEX idx_schedule_dates 
    ON audio_schedule(start_date, end_date, is_active);
```

### Cache de schedules

```javascript
class ScheduleCache {
    constructor() {
        this.cache = new Map();
        this.ttl = 60000; // 1 minuto
    }
    
    async getSchedules(filters = {}) {
        const key = JSON.stringify(filters);
        const cached = this.cache.get(key);
        
        if (cached && Date.now() - cached.timestamp < this.ttl) {
            return cached.data;
        }
        
        const fresh = await this.fetchSchedules(filters);
        this.cache.set(key, {
            data: fresh,
            timestamp: Date.now()
        });
        
        return fresh;
    }
    
    invalidate() {
        this.cache.clear();
    }
}
```

### Optimización del cron

```php
// Ejecutar solo schedules que podrían activarse pronto
function getRelevantSchedules($db) {
    $now = new DateTime();
    $tenMinutesAgo = clone $now;
    $tenMinutesAgo->sub(new DateInterval('PT10M'));
    
    // Para interval: solo los que su último exec + interval está cerca
    // Para specific: solo si estamos en el día correcto
    // Para once: solo si la fecha está cerca
    
    $query = "
        SELECT * FROM audio_schedule 
        WHERE is_active = 1 
        AND (
            -- Interval schedules
            (schedule_type = 'interval' AND 
             (last_executed IS NULL OR 
              last_executed < :tenMinutesAgo))
            OR
            -- Specific schedules para hoy
            (schedule_type = 'specific' AND 
             specific_days LIKE :today)
            OR
            -- Once schedules para hoy
            (schedule_type = 'once' AND 
             DATE(once_datetime) = DATE(:now))
        )
        ORDER BY priority DESC
    ";
    
    // Esto reduce significativamente las verificaciones
}
```

## Troubleshooting

### Schedule no se ejecuta

```bash
# 1. Verificar que cron está activo
crontab -l | grep mbi-v3

# 2. Ver logs de errores
tail -f calendario/logs/scheduler/errors.log

# 3. Verificar schedule en BD
sqlite3 calendario/api/db/calendar.db \
  "SELECT * FROM audio_schedule WHERE id=X"

# 4. Ejecutar manualmente
php calendario/api/cron.php

# 5. Verificar timezone
php -r "echo date_default_timezone_get();"
```

### Categorías no se muestran

```javascript
// Verificar en consola
console.log(schedule.category); // Debe existir

// Verificar mapping
const categoryInfo = CATEGORIES[schedule.category];
console.log(categoryInfo); // No debe ser undefined

// Fallback para categorías desconocidas
const catInfo = CATEGORIES[schedule.category] || 
                CATEGORIES['sin_categoria'];
```

### Problema con intervalos

```php
// Debug de cálculo de intervalos
function debugInterval($schedule) {
    $last = new DateTime($schedule['last_executed']);
    $now = new DateTime();
    
    $interval = sprintf('PT%dH%dM', 
        $schedule['interval_hours'],
        $schedule['interval_minutes']
    );
    
    $next = clone $last;
    $next->add(new DateInterval($interval));
    
    echo "Last: " . $last->format('Y-m-d H:i:s') . "\n";
    echo "Now:  " . $now->format('Y-m-d H:i:s') . "\n";
    echo "Next: " . $next->format('Y-m-d H:i:s') . "\n";
    echo "Should execute: " . ($now >= $next ? 'YES' : 'NO') . "\n";
}
```

## Seguridad

### Validaciones importantes

```php
// Validar entrada de usuario
function validateScheduleInput($input) {
    // Validar tipo de schedule
    $validTypes = ['interval', 'specific', 'once'];
    if (!in_array($input['schedule_type'], $validTypes)) {
        throw new Exception('Tipo de schedule inválido');
    }
    
    // Validar archivo existe
    if (!file_exists(BIBLIOTECA_DIR . $input['filename'])) {
        throw new Exception('Archivo no encontrado');
    }
    
    // Validar categoría
    $validCategories = ['ofertas', 'eventos', 'informacion', 
                       'emergencias', 'servicios', 'horarios'];
    if (!in_array($input['category'], $validCategories)) {
        $input['category'] = 'sin_categoria';
    }
    
    // Sanitizar título
    $input['title'] = filter_var($input['title'], 
                                 FILTER_SANITIZE_STRING);
    
    return $input;
}
```

### Prevención de loops infinitos

```php
// Evitar que un schedule se ejecute múltiples veces por minuto
function preventExecutionLoop($schedule) {
    if ($schedule['last_executed']) {
        $last = new DateTime($schedule['last_executed']);
        $now = new DateTime();
        $diff = $now->getTimestamp() - $last->getTimestamp();
        
        // No ejecutar si se ejecutó hace menos de 60 segundos
        if ($diff < 60) {
            return false;
        }
    }
    return true;
}
```

## Resumen de Archivos Clave

| Archivo | Función | Ubicación |
|---------|---------|-----------|
| **index.js** | Módulo principal del calendario | `/modules/calendar/` |
| **audio-scheduler.php** | API de scheduling | `/api/` |
| **calendar.db** | Base de datos SQLite | `/calendario/api/db/` |
| **cron.php** | Script ejecutado cada minuto | `/calendario/api/` |
| **calendar-filters.js** | Sistema de filtros UI | `/modules/calendar/components/` |
| **schedule_logs** | Tabla de logs en BD | SQLite database |

---

## Conclusión

El Calendar Module v2 es un sistema robusto de programación automática que:
- ✅ Soporta múltiples tipos de programación
- ✅ Categoriza visualmente los contenidos
- ✅ Se ejecuta automáticamente vía cron
- ✅ Integra perfectamente con AzuraCast
- ✅ Mantiene logs detallados
- ✅ Es fácilmente extensible

Para desarrolladores nuevos, los puntos de entrada principales son:
1. **Frontend**: `/modules/calendar/index.js`
2. **Backend**: `/api/audio-scheduler.php`
3. **Cron**: `/calendario/api/cron.php`
4. **Base de datos**: `/calendario/api/db/calendar.db`

---

*Última actualización: Noviembre 2024*
*Versión del módulo: 2.1*