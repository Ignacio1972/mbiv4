<?php
/**
 * Inicialización de Base de Datos SQLite
 * Ejecutar una sola vez para crear las tablas
 */

// Configuración
$dbPath = __DIR__ . '/calendar.db';

try {
    // Crear conexión SQLite
    $db = new PDO('sqlite:' . $dbPath);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "📊 Inicializando base de datos del calendario...\n";
    
    // Tabla principal de eventos
    $db->exec("
        CREATE TABLE IF NOT EXISTS calendar_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_id TEXT,
            category TEXT NOT NULL,
            
            -- Programación
            start_datetime DATETIME NOT NULL,
            duration INTEGER DEFAULT 0,
            
            -- Estado y prioridad
            is_active BOOLEAN DEFAULT 1,
            priority INTEGER DEFAULT 5,
            
            -- Control de concurrencia
            status TEXT DEFAULT 'pending',
            locked_until DATETIME DEFAULT NULL,
            
            -- Metadata
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_by TEXT,
            notes TEXT
        )
    ");
    
    echo "✅ Tabla 'calendar_events' creada\n";
    
    // Tabla de historial de reproducción
    $db->exec("
        CREATE TABLE IF NOT EXISTS playback_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id INTEGER NOT NULL,
            scheduled_time DATETIME NOT NULL,
            actual_time DATETIME,
            status TEXT NOT NULL,
            error_message TEXT,
            azuracast_response TEXT,
            execution_time_ms INTEGER,
            
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            
            FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE
        )
    ");
    
    echo "✅ Tabla 'playback_history' creada\n";
    
    // Tabla de configuración del sistema
    $db->exec("
        CREATE TABLE IF NOT EXISTS system_config (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    echo "✅ Tabla 'system_config' creada\n";
    
    // Crear índices para performance
    $db->exec("CREATE INDEX IF NOT EXISTS idx_events_datetime ON calendar_events(start_datetime, is_active)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_events_status ON calendar_events(status, locked_until)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_history_event ON playback_history(event_id, scheduled_time)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_history_status ON playback_history(status, scheduled_time)");
    
    echo "✅ Índices creados\n";
    
    // Insertar configuración inicial
    $config = [
        ['scheduler_enabled', '1'],
        ['scheduler_interval_seconds', '60'],
        ['look_ahead_seconds', '90'],
        ['max_retry_attempts', '3'],
        ['lock_timeout_seconds', '300'],
        ['timezone', 'America/Santiago']
    ];
    
    $stmt = $db->prepare("INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)");
    foreach ($config as $item) {
        $stmt->execute($item);
    }
    
    echo "✅ Configuración inicial insertada\n";
    
    // Establecer permisos
    chmod($dbPath, 0666);
    chmod(__DIR__, 0777);
    
    echo "\n🎉 ¡Base de datos inicializada exitosamente!\n";
    echo "📁 Ubicación: $dbPath\n";
    echo "📏 Tamaño: " . round(filesize($dbPath) / 1024, 2) . " KB\n";
    
} catch (Exception $e) {
    echo "\n❌ ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
?>