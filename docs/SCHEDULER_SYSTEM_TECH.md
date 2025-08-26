# Sistema de Programación Automática - Documentación Técnica

## Estado Actual
**PARCIALMENTE IMPLEMENTADO** - Requiere completar integración

## Arquitectura
Sistema modular basado en plugins para evitar archivos monolíticos (800+ líneas)

## Componentes Implementados

### 1. Base de Datos
```sql
tabla: audio_schedule (ya existe en calendar.db)
- id, filename, title, schedule_time, schedule_days
- start_date, end_date, is_active, priority, notes
```

### 2. API Backend
`/api/audio-scheduler.php` (290 líneas)
```php
Endpoints:
- POST {action: 'create'} - Crear programación
- POST {action: 'list'} - Listar programaciones
- POST {action: 'check_execute'} - Verificar qué ejecutar
- POST {action: 'delete'} - Eliminar programación
- POST {action: 'log_execution'} - Registrar ejecución
```

### 3. Cron Job
`/api/scheduler-cron.php` (100 líneas)
```bash
# Configurado en crontab:
* * * * * /usr/bin/php /var/www/mbi-v3/api/scheduler-cron.php
```
- Ejecuta cada minuto
- Verifica programaciones pendientes
- Llama a `/api/biblioteca.php` para enviar a radio

### 4. Frontend Plugin
`/modules/campaign-library/plugins/scheduler-plugin.js` (120 líneas)
```javascript
class SchedulerPlugin {
    - Auto-inicializa al detectar campaign-library
    - Inyecta botón 🕐 en tarjetas de audio
    - Carga modal cuando se necesita
    - No modifica archivo principal
}
```

### 5. Modal UI
`/modules/campaign-library/schedule-modal.js` (280 líneas)
```javascript
class ScheduleModal {
    - 3 tipos: interval, specific, once
    - Selector visual de días/horas
    - Validación de formulario
}
```

## Tipos de Programación

1. **Por intervalos**: Cada X horas/minutos
2. **Días específicos**: Lun-Vie 14:00, 16:00
3. **Una vez**: Fecha/hora específica

## Flujo de Datos

```
Usuario → Modal → API → BD
                ↓
Cron → check_execute → biblioteca.php → AzuraCast
         ↓
    log_execution
```

## Problema Actual

El plugin se carga pero los botones no se inyectan correctamente. 
Posibles causas:
- Timing de carga de campaign-library
- Selector CSS incorrecto para `.audio-card`
- Plugin carga antes que los mensajes

## Solución Rápida

```javascript
// En campaign-library/index.js, agregar al final de displayMessages():
if (window.schedulerPlugin) {
    window.schedulerPlugin.addButtonsToCards();
}
```

## Para Completar

1. **Integración correcta del plugin**
   - Verificar que detecte tarjetas de audio
   - Ajustar selectores CSS si necesario

2. **Verificar rutas de API**
   - nginx debe servir `/api/audio-scheduler.php`
   - O ajustar rutas en el código

3. **Testing**
   - Crear programación manual vía API
   - Verificar logs del cron
   - Confirmar envío a AzuraCast

## Archivos Clave

```
/var/www/mbi-v3/
├── api/
│   ├── audio-scheduler.php      # API principal
│   ├── scheduler-cron.php       # Script cron
│   └── logs/                     # Logs de ejecución
├── modules/campaign-library/
│   ├── index.js                  # NO MODIFICAR (800 líneas)
│   ├── schedule-modal.js         # Modal de programación
│   └── plugins/
│       └── scheduler-plugin.js   # Plugin modular
└── calendario/api/db/
    └── calendar.db               # BD con tabla audio_schedule
```

## Comandos Útiles

```bash
# Ver programaciones en BD
sqlite3 /var/www/mbi-v3/calendario/api/db/calendar.db "SELECT * FROM audio_schedule;"

# Test API
php -r '$r=file_get_contents("http://localhost/api/audio-scheduler.php", false, stream_context_create(["http"=>["method"=>"POST","header"=>"Content-Type: application/json","content"=>json_encode(["action"=>"list"])]])); echo $r;'

# Ver logs cron
tail -f /var/www/mbi-v3/api/logs/scheduler-*.log

# Test manual del cron
php /var/www/mbi-v3/api/scheduler-cron.php
```

## Notas Importantes

- Sistema diseñado para ser modular y evitar archivos grandes
- Plugin pattern permite agregar funcionalidad sin tocar core
- Cron activo en producción - cuidado con pruebas
- BD compartida con sistema de calendario