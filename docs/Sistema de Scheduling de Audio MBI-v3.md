DOCUMENTACIÓN TÉCNICA - Sistema de Scheduling de Audio MBI-v3
🏗️ Arquitectura del Sistema
Flujo Principal: Programación → Calendario
mermaid[Biblioteca] → [Schedule Modal] → [API Backend] → [SQLite] → [Calendar View]
📊 Workflow Completo
1. Creación de Schedule (Biblioteca → Modal)
javascript// campaign-library/index.js (línea ~600)
scheduleMessage(id, title) {
    const message = this.messages.find(m => m.id === id);
    window.scheduleModal = new ScheduleModal();
    modal.show(message.filename, title);
}
2. Configuración del Schedule (Modal)
El modal (schedule-modal.js) ofrece 3 tipos:

interval: Repetición por tiempo (horas/minutos)
specific: Días específicos + horas
once: Una sola vez

3. Guardado en Backend
javascript// schedule-modal.js → audio-scheduler.php
POST /api/audio-scheduler.php
{
    action: 'create',
    filename: 'tts20250818153913.mp3',
    schedule_type: 'specific',
    schedule_days: ['friday', 'saturday'],  // Array
    schedule_times: ['14:00'],              // Array
    start_date: '2025-08-21'
}
4. Almacenamiento en BD
sql-- Tabla: audio_schedule
schedule_days: '["friday","saturday"]'  -- JSON string
schedule_time: '["14:00"]'              -- JSON string  
notes: '{"type":"specific","interval_hours":null,...}'
5. Carga en Calendario
javascript// calendar-view.js
loadAudioSchedules() → fetch('/api/audio-scheduler.php', {action: 'list'})
    ↓
transformSchedulesToEvents() → Convierte schedules en eventos FullCalendar
    ↓
calculateNextExecution() → Calcula próxima ejecución según tipo
🔑 APIs Principales
/api/audio-scheduler.php

create: Crear schedule
list: Listar schedules activos
delete: Eliminar schedule
update: Actualizar estado

/api/biblioteca.php

GET ?filename=X: Streaming de audio
POST list_library: Listar archivos
POST send_library_to_radio: Enviar a radio

📁 Archivos Críticos
/modules/
├── campaign-library/
│   ├── index.js          # Biblioteca - botón schedule (línea 600)
│   └── schedule-modal.js  # Modal de configuración
├── calendar/
│   ├── index.js          # Controlador principal
│   └── components/
│       └── calendar-view.js  # Renderizado y cálculo (línea 380-500)
/api/
├── audio-scheduler.php   # CRUD de schedules
└── biblioteca.php        # Gestión de archivos MP3
🖱️ Modal de Información (Click en Evento)
Detección del Click
javascript// calendar/index.js (línea 190)
handleEventClick(event) {
    const isAudioSchedule = 
        event.type === 'audio_schedule' ||
        event.id?.includes('audio_schedule') ||
        event.scheduleId !== undefined;
    
    if (isAudioSchedule) {
        this.showScheduleInfoModal(event);
    }
}
Estructura del Modal
javascript// calendar/index.js (línea 210)
showScheduleInfoModal(scheduleData) {
    // Muestra:
    // - Título y archivo
    // - Tipo de programación formateada
    // - Estado (activo/inactivo)
    // - Preview de audio (<audio src="/api/biblioteca.php?filename=X">)
    // - Botones: Editar (TODO), Eliminar
}
Funcionalidades del Modal

Preview de Audio:

URL: /api/biblioteca.php?filename=${filename}
Elemento: <audio controls>


Eliminar Schedule:
javascriptconfirmDeleteSchedule(scheduleId) → 
POST /api/audio-scheduler.php {action: 'delete', id: scheduleId}

Editar (NO IMPLEMENTADO):

Actualmente muestra mensaje de "próximamente"
TODO: Integrar schedule-modal.js en modo edición



⚠️ Puntos Críticos
1. Formato de Datos

schedule_days: Array en frontend → JSON string en BD
schedule_time: String/Array → JSON string "[\"14:00\"]"
Conversión en calculateNextExecution() línea 380-500

2. Timezone

Fix aplicado: Resta 4 horas para UTC-4 Chile
Línea crítica: checkDate.setHours(hours - 4)

3. Compatibilidad Navegadores

Sin optional chaining (?.)
Sin spread operator (...)
Loops tradicionales en lugar de .map().filter()

🔄 Event Bus
Eventos principales:

schedule:created → Refresca calendario
schedule:deleted → Refresca calendario
library:file:added → Actualiza archivos disponibles

🚀 Para Continuar Desarrollo
Pendientes Inmediatos:

Editar Schedule: Implementar modo edición en schedule-modal.js
Múltiples Eventos: Un schedule puede generar múltiples eventos en calendario
Validación: Verificar archivos existen antes de crear schedule

Mejoras Sugeridas:

Unificar formato de datos (evitar JSON strings)
Mover lógica de cálculo al backend
Agregar logs de ejecución de schedules
Implementar vista de lista de schedules activos

📝 Notas Técnicas

event-modal.js: DESHABILITADO - usar schedule-modal.js
calendar-api.js: NO SE USA - comunicación directa con audio-scheduler.php
Archivos MP3: Almacenados en Docker AzuraCast /var/azuracast/stations/test/media/Grabaciones/
Formato nombres: tts{timestamp}_{descripcion}.mp3