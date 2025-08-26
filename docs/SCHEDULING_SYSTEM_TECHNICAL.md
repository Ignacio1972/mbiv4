# 📋 Sistema de Scheduling TTS Mall - Documentación Técnica

## 🎯 **ESTADO**: 100% FUNCIONAL ✅

**Fecha**: 17 de Agosto 2025, 22:30 hrs (Chile)  
**Sistema**: Completamente operativo end-to-end

---

## 📊 **RESUMEN EJECUTIVO**

Sistema de programación automática que permite crear schedules desde la interfaz web para reproducir audios TTS automáticamente en la radio del mall a intervalos específicos.

**Flujo Completo Funcional:**
```
UI → Crear Schedule → Guardar en BD → Cron detecta → Envía a Radio → Audio se reproduce
```

---

## 🏗️ **ARQUITECTURA DEL SISTEMA**

### **Componentes Principales:**

1. **Frontend (UI)**: Botones 🕐 en "Mensajes Guardados"
2. **API Backend**: Gestión de schedules y ejecución
3. **Base de Datos**: SQLite con tabla `audio_schedule`
4. **Cron Job**: Ejecución automática cada minuto
5. **Radio Service**: Integración con AzuraCast/Liquidsoap

### **Diagrama de Flujo:**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   UI (Frontend) │───▶│  API (Backend)   │───▶│  Base de Datos  │
│                 │    │                  │    │    (SQLite)     │
│ • Botón 🕐      │    │ • CRUD schedules │    │ • audio_schedule│
│ • Modal config  │    │ • check_execute  │    │ • 23 campos     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Radio/Audio   │◀───│   Cron Job       │───▶│   Logs Sistema  │
│                 │    │                  │    │                 │
│ • AzuraCast     │    │ • Cada minuto    │    │ • scheduler-*.log│
│ • Liquidsoap    │    │ • Auto-ejecución │    │ • Zona horaria  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

---

## 📁 **ARCHIVOS CRÍTICOS DEL SISTEMA**

### **1. Frontend (UI)**
```
/modules/campaign-library/index.js (línea 588)
├── scheduleMessage(id, title) ✅ 
├── Detecta click en botón 🕐
├── Busca datos del mensaje por ID
└── Abre modal con filename y title

/modules/campaign-library/schedule-modal.js
├── Modal de configuración de scheduling
├── 3 tipos: interval, specific, once
├── Valida datos y construye objeto
└── Envía POST a /api/audio-scheduler.php
```

### **2. Backend (API)**
```
/api/audio-scheduler.php (290 líneas)
├── create: Crea nuevos schedules
├── list: Lista todos los schedules  
├── check_execute: Detecta schedules listos ⭐
├── delete: Elimina schedules
├── update: Modifica schedules existentes
└── log_execution: Registra ejecuciones

/api/scheduler-cron.php (Script principal)
├── Ejecuta cada minuto vía cron
├── Llama a check_execute
├── Procesa schedules detectados
├── Envía a sendToRadio()
└── Registra resultados
```

### **3. Servicio de Radio**
```
/api/services/radio-service.php
├── interruptRadio($filename) ⭐
├── Usa comandos Liquidsoap via Docker
├── Socket Unix: /var/azuracast/stations/test/config/liquidsoap.sock
└── Comando: interrupting_requests.push file://[path]
```

### **4. Base de Datos**
```
/calendario/api/db/calendar.db
└── Tabla: audio_schedule
    ├── id (PRIMARY KEY)
    ├── filename ⭐ (archivo MP3)
    ├── title ⭐ (nombre del mensaje)
    ├── schedule_type (interval, specific, once)
    ├── interval_minutes/hours
    ├── schedule_time, schedule_days
    ├── start_date, end_date
    ├── is_active (1/0)
    └── created_at, updated_at
```

### **5. Configuración del Sistema**
```
Cron Job (crontab -l):
* * * * * /usr/bin/php /var/www/mbi-v3/api/scheduler-cron.php >> /var/www/mbi-v3/api/logs/cron.log 2>&1

Zona Horaria: America/Santiago (Chile)
Configurada en:
├── Sistema: timedatectl set-timezone America/Santiago
├── PHP: date_default_timezone_set('America/Santiago')
└── Archivos: scheduler-cron.php, audio-scheduler.php, generate.php
```

---

## ⚙️ **FUNCIONAMIENTO TÉCNICO DETALLADO**

### **1. Creación de Schedule (UI → BD)**
```javascript
// Desde campaign-library/index.js
function scheduleMessage(id, title) {
    // 1. Busca mensaje por ID en biblioteca
    const message = findMessageById(id);
    
    // 2. Extrae filename del objeto
    const filename = message.file || message.filename;
    
    // 3. Abre modal con datos
    window.scheduleModal.show({
        filename: filename,
        title: title,
        messageId: id
    });
}
```

### **2. Procesamiento del Schedule (API)**
```php
// audio-scheduler.php - función create()
function createSchedule($input) {
    // 1. Valida datos requeridos
    $filename = $input['filename'] ?? '';
    $title = $input['title'] ?? '';
    
    // 2. Procesa tipo de schedule
    if ($scheduleType === 'interval') {
        $scheduleTime = sprintf("%02d:%02d", 
            $intervalHours, $intervalMinutes);
    }
    
    // 3. Inserta en BD
    $stmt = $db->prepare("INSERT INTO audio_schedule (...) VALUES (...)");
    $stmt->execute([...]);
}
```

### **3. Detección Automática (Cron)**
```php
// scheduler-cron.php - flujo principal
function main() {
    // 1. Conecta a BD
    $db = new PDO("sqlite:$dbPath");
    
    // 2. Llama a check_execute vía HTTP
    $response = curl_exec($checkExecuteCall);
    
    // 3. Procesa schedules detectados
    foreach ($schedules as $schedule) {
        if (!empty($schedule['filename'])) {
            sendToRadio($schedule['filename']);
            logExecution($schedule['id'], 'success');
        }
    }
}
```

### **4. Lógica de Detección (`check_execute`)**
```php
// audio-scheduler.php - check_execute()
function checkExecute() {
    $now = new DateTime();
    
    // Para schedules tipo 'interval'
    if ($schedule['schedule_type'] === 'interval') {
        $lastExecution = getLastExecution($schedule['id']);
        $intervalMinutes = (int)$schedule['interval_minutes'];
        
        if ($now >= $lastExecution + $intervalMinutes) {
            return true; // Listo para ejecutar
        }
    }
}
```

### **5. Envío a Radio (Liquidsoap)**
```php
// services/radio-service.php
function interruptRadio($filename) {
    $fileUri = "file:///var/azuracast/stations/test/media/Grabaciones/" . $filename;
    $command = "interrupting_requests.push $fileUri";
    
    $dockerCommand = 'sudo docker exec azuracast bash -c \'echo "' . $command . 
        '" | socat - UNIX-CONNECT:/var/azuracast/stations/test/config/liquidsoap.sock\'';
    
    $output = shell_exec($dockerCommand . ' 2>&1');
    
    // Output exitoso: número (RID) + "END"
    return is_numeric(trim($output));
}
```

---

## 🔧 **CONFIGURACIÓN CRÍTICA**

### **Problemas Resueltos y Configuración Actual:**

1. **Zona Horaria Chile**: ✅ Configurada en sistema y PHP
2. **Conflicto de Crons**: ✅ Deshabilitado scheduler anterior `/var/www/tts-mall/v2/`
3. **Función sendToRadio**: ✅ Corregida para usar endpoint correcto
4. **Filtrado de Schedules**: ✅ Ignora schedules sin filename

### **URLs y Endpoints Importantes:**
```
Interfaz Web: http://51.222.25.222:3000/
API Schedule: http://localhost:3000/api/audio-scheduler.php
API Radio: http://localhost:3000/api/generate.php (action: send_to_radio)
AzuraCast: http://51.222.25.222/ (API Station ID: 1)
```

---

## 📊 **PRÓXIMA FUNCIONALIDAD: INTEGRACIÓN CON CALENDARIO**

### **OBJETIVO**: Visualizar schedules en calendario y permitir edición/eliminación

### **Análisis del Módulo Calendario Existente:**
```
/modules/calendar/
├── index.js (Módulo principal)
├── components/
│   ├── calendar-view.js ⭐ (Vista del calendario)
│   ├── event-list.js (Lista de eventos)
│   └── event-modal.js ⭐ (Modal de edición)
├── services/
│   └── calendar-api.js (API del calendario)
└── templates/
    └── calendar.html (Template HTML)
```

### **Base de Datos Calendario:**
```
/calendario/api/db/calendar.db
├── Tabla principal: events (para eventos normales)
└── Tabla nueva: audio_schedule (ya existe, para schedules)
```

### **TAREAS PARA EL PRÓXIMO CLAUDE:**

#### **1. Conectar Calendario con Schedules**
```javascript
// En calendar-view.js - agregar función
async function loadAudioSchedules() {
    const response = await fetch('/api/audio-scheduler.php', {
        method: 'POST',
        body: JSON.stringify({action: 'list'})
    });
    const data = await response.json();
    
    // Convertir schedules a eventos del calendario
    return data.schedules.map(schedule => ({
        id: 'schedule_' + schedule.id,
        title: '🎵 ' + schedule.title,
        start: calculateNextExecution(schedule),
        backgroundColor: '#e74c3c', // Rojo para schedules
        extendedProps: {
            type: 'audio_schedule',
            filename: schedule.filename,
            scheduleData: schedule
        }
    }));
}
```

#### **2. Mostrar Schedules en Vista Calendario**
```javascript
// En calendar-view.js - modificar renderCalendar()
function renderCalendar() {
    // Código existente...
    
    // Agregar eventos de audio schedules
    const audioSchedules = await loadAudioSchedules();
    calendar.addEventSource(audioSchedules);
    
    // Configurar click handler
    calendar.on('eventClick', function(info) {
        if (info.event.extendedProps.type === 'audio_schedule') {
            openScheduleEditModal(info.event.extendedProps.scheduleData);
        }
    });
}
```

#### **3. Modal de Edición de Schedules**
```javascript
// Nuevo archivo: /modules/calendar/components/schedule-edit-modal.js
class ScheduleEditModal {
    constructor() {
        this.modal = this.createModal();
    }
    
    open(scheduleData) {
        // Cargar datos del schedule
        this.populateForm(scheduleData);
        this.modal.show();
    }
    
    async saveChanges() {
        const formData = this.getFormData();
        
        // Llamar a API para actualizar
        await fetch('/api/audio-scheduler.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'update',
                id: this.currentSchedule.id,
                ...formData
            })
        });
        
        // Recargar calendario
        window.calendarView.refresh();
    }
    
    async deleteSchedule() {
        await fetch('/api/audio-scheduler.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'delete',
                id: this.currentSchedule.id
            })
        });
        
        window.calendarView.refresh();
    }
}
```

#### **4. Cálculo de Próximas Ejecuciones**
```javascript
// Función helper para calcular cuándo se ejecutará el schedule
function calculateNextExecution(schedule) {
    const now = new Date();
    
    if (schedule.schedule_type === 'interval') {
        // Obtener última ejecución de logs
        const lastExecution = getLastExecutionTime(schedule.id);
        const intervalMs = schedule.interval_minutes * 60 * 1000;
        return new Date(lastExecution.getTime() + intervalMs);
    }
    
    if (schedule.schedule_type === 'specific') {
        // Calcular próxima fecha/hora específica
        return calculateNextSpecificTime(schedule.schedule_times, schedule.schedule_days);
    }
    
    if (schedule.schedule_type === 'once') {
        // Usar start_date + schedule_time
        return new Date(schedule.start_date + 'T' + schedule.schedule_time);
    }
}
```

#### **5. API Extensions Necesarias**
```php
// Agregar a audio-scheduler.php
case 'get_executions':
    // Obtener historial de ejecuciones para un schedule
    echo json_encode(getExecutionHistory($input['schedule_id']));
    break;

case 'get_next_execution':
    // Calcular próxima ejecución
    echo json_encode(calculateNextExecution($input['schedule_id']));
    break;
```

### **6. Estilos CSS Específicos**
```css
/* En calendar/styles/style.css */
.fc-event.audio-schedule {
    background-color: #e74c3c !important;
    border-color: #c0392b !important;
}

.fc-event.audio-schedule:before {
    content: "🎵 ";
}

.schedule-edit-modal .schedule-status {
    padding: 10px;
    border-radius: 4px;
}

.schedule-status.active {
    background-color: #d4edda;
    color: #155724;
}

.schedule-status.inactive {
    background-color: #f8d7da;
    color: #721c24;
}
```

---

## 🚨 **CONSIDERACIONES IMPORTANTES**

### **Para el Próximo Claude:**

1. **NO tocar el cron existente** - Ya funciona perfectamente
2. **NO modificar audio-scheduler.php** sin backup - Es crítico
3. **Mantener zona horaria Chile** en todos los archivos nuevos
4. **Usar mismo patrón de logs** que scheduler-cron.php
5. **Respetar estructura existente** del módulo calendario

### **Archivos que NO se deben modificar:**
- ✅ `/api/scheduler-cron.php` (funcionando perfecto)
- ✅ `/api/services/radio-service.php` (funcionando perfecto)
- ✅ Crontab del sistema (funcionando perfecto)

### **Testing Requerido:**
1. Crear schedule desde UI
2. Verificar aparición en calendario
3. Probar edición desde calendario
4. Probar eliminación desde calendario
5. Confirmar que el cron sigue funcionando
6. Verificar que cambios se reflejen en ambos lados

---

## 📝 **COMANDOS ÚTILES PARA DEBUGGING**

```bash
# Ver schedules actuales
curl -X POST http://localhost:3000/api/audio-scheduler.php -H 'Content-Type: application/json' -d '{"action": "list"}'

# Ver logs en tiempo real
tail -f /var/www/mbi-v3/api/logs/scheduler-2025-08-17.log

# Ejecutar scheduler manualmente
php /var/www/mbi-v3/api/scheduler-cron.php

# Ver cron status
crontab -l
systemctl status cron

# Verificar zona horaria
date
timedatectl
```

---

## ✅ **ESTADO FINAL**

**Sistema de Scheduling TTS**: 100% Funcional ✅  
**Próximo Objetivo**: Integración visual con calendario + CRUD desde UI  
**Preparado para**: Desarrollo de funcionalidades de calendario avanzadas

**El sistema base está sólido y probado. La integración con calendario será puramente frontend + conectores, sin tocar la lógica de scheduling que ya funciona perfectamente.**