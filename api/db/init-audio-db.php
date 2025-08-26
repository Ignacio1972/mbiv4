<?php
/**
 * Inicialización de Tablas de Audio en BD SQLite Existente
 * Agrega las tablas necesarias para la biblioteca de audio
 * REUTILIZA la BD existente del calendario
 */

// Configuración - usar la misma BD del calendario
$dbPath = __DIR__ . '/../../calendario/api/db/calendar.db';

// Verificar que la BD principal existe
if (!file_exists($dbPath)) {
    echo "❌ ERROR: La base de datos del calendario no existe en: $dbPath\n";
    echo "🔧 Ejecuta primero: php /var/www/mbi-v3/calendario/api/db/init-db.php\n";
    exit(1);
}

try {
    // Conectar a la BD existente
    $db = new PDO('sqlite:' . $dbPath);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "📊 Inicializando tablas de audio en BD existente...\n";
    echo "📁 BD ubicada en: $dbPath\n";
    
    // Verificar que las tablas del calendario existen
    $result = $db->query("SELECT name FROM sqlite_master WHERE type='table' AND name='calendar_events'");
    if (!$result->fetch()) {
        echo "❌ ERROR: La BD no contiene las tablas del calendario\n";
        echo "🔧 Ejecuta primero: php /var/www/mbi-v3/calendario/api/db/init-db.php\n";
        exit(1);
    }
    
    echo "✅ BD del calendario detectada correctamente\n";
    
    // ============================================
    // CREAR TABLAS DE AUDIO
    // ============================================
    
    // Tabla de favoritos
    echo "📋 Creando tabla audio_favorites...\n";
    $db->exec("
        CREATE TABLE IF NOT EXISTS audio_favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            user_session TEXT,
            is_active BOOLEAN DEFAULT 1,
            
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            
            UNIQUE(filename, user_session)
        )
    ");
    echo "✅ Tabla 'audio_favorites' creada\n";
    
    // Tabla de metadata
    echo "📋 Creando tabla audio_metadata...\n";
    $db->exec("
        CREATE TABLE IF NOT EXISTS audio_metadata (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL UNIQUE,
            display_name TEXT,
            description TEXT,
            category TEXT DEFAULT 'general',
            
            file_size INTEGER,
            duration_seconds INTEGER,
            
            play_count INTEGER DEFAULT 0,
            radio_sent_count INTEGER DEFAULT 0,
            last_played_at DATETIME,
            last_radio_sent_at DATETIME,
            
            is_active BOOLEAN DEFAULT 1,
            
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    echo "✅ Tabla 'audio_metadata' creada\n";
    
    // Tabla de schedule (para futuro)
    echo "📋 Creando tabla audio_schedule...\n";
    $db->exec("
        CREATE TABLE IF NOT EXISTS audio_schedule (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            title TEXT NOT NULL,
            
            schedule_time TIME NOT NULL,
            schedule_days TEXT DEFAULT 'daily',
            start_date DATE,
            end_date DATE,
            
            is_active BOOLEAN DEFAULT 1,
            priority INTEGER DEFAULT 5,
            
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_by TEXT,
            notes TEXT
        )
    ");
    echo "✅ Tabla 'audio_schedule' creada\n";
    
    // Tabla de log de acciones
    echo "📋 Creando tabla audio_actions_log...\n";
    $db->exec("
        CREATE TABLE IF NOT EXISTS audio_actions_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            action TEXT NOT NULL,
            user_session TEXT,
            details TEXT,
            
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    echo "✅ Tabla 'audio_actions_log' creada\n";
    
    // ============================================
    // CREAR ÍNDICES
    // ============================================
    
    echo "📋 Creando índices para performance...\n";
    
    // Favoritos
    $db->exec("CREATE INDEX IF NOT EXISTS idx_favorites_filename ON audio_favorites(filename)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_favorites_session ON audio_favorites(user_session)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_favorites_active ON audio_favorites(is_active, created_at)");
    
    // Metadata
    $db->exec("CREATE INDEX IF NOT EXISTS idx_metadata_filename ON audio_metadata(filename)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_metadata_category ON audio_metadata(category)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_metadata_active ON audio_metadata(is_active)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_metadata_usage ON audio_metadata(play_count DESC, radio_sent_count DESC)");
    
    // Schedule
    $db->exec("CREATE INDEX IF NOT EXISTS idx_schedule_time ON audio_schedule(schedule_time, is_active)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_schedule_active ON audio_schedule(is_active, priority)");
    
    // Log
    $db->exec("CREATE INDEX IF NOT EXISTS idx_actions_filename ON audio_actions_log(filename, created_at)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_actions_type ON audio_actions_log(action, created_at)");
    
    echo "✅ Índices creados\n";
    
    // ============================================
    // CREAR TRIGGERS
    // ============================================
    
    echo "📋 Creando triggers para auto-update...\n";
    
    $db->exec("
        CREATE TRIGGER IF NOT EXISTS update_audio_metadata_timestamp 
            AFTER UPDATE ON audio_metadata
            BEGIN
                UPDATE audio_metadata 
                SET updated_at = CURRENT_TIMESTAMP 
                WHERE id = NEW.id;
            END
    ");
    
    echo "✅ Triggers creados\n";
    
    // ============================================
    // CONFIGURACIÓN INICIAL
    // ============================================
    
    echo "📋 Insertando configuración inicial...\n";
    
    $audioConfig = [
        ['audio_favorites_enabled', '1'],
        ['audio_metadata_enabled', '1'],
        ['audio_schedule_enabled', '0'],
        ['audio_session_type', 'simple'],
        ['audio_cleanup_days', '365'],
        ['audio_db_version', '1.0.0']
    ];
    
    $stmt = $db->prepare("INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)");
    foreach ($audioConfig as $item) {
        $stmt->execute($item);
    }
    
    echo "✅ Configuración inicial insertada\n";
    
    // ============================================
    // VERIFICACIÓN FINAL
    // ============================================
    
    echo "📋 Verificando creación de tablas...\n";
    
    $audioTables = ['audio_favorites', 'audio_metadata', 'audio_schedule', 'audio_actions_log'];
    $stmt = $db->prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?");
    
    foreach ($audioTables as $table) {
        $stmt->execute([$table]);
        if ($stmt->fetch()) {
            echo "  ✅ $table\n";
        } else {
            echo "  ❌ $table - ERROR\n";
        }
    }
    
    // Mostrar estadísticas finales
    $size = round(filesize($dbPath) / 1024, 2);
    $tableCount = $db->query("SELECT COUNT(*) FROM sqlite_master WHERE type='table'")->fetchColumn();
    
    echo "\n🎉 ¡Inicialización de tablas de audio completada!\n";
    echo "📁 Ubicación BD: $dbPath\n";
    echo "📏 Tamaño BD: {$size} KB\n";
    echo "📊 Total tablas: $tableCount\n";
    echo "🔧 Versión audio: 1.0.0\n";
    
    echo "\n🚀 Siguiente paso: Crear APIs para usar estas tablas\n";
    echo "📖 Documentación: /docs/AUDIO_LIBRARY_MODULE.md\n";
    
} catch (Exception $e) {
    echo "\n❌ ERROR durante inicialización: " . $e->getMessage() . "\n";
    echo "📁 Verificar permisos en: $dbPath\n";
    echo "🔧 Verificar que la BD del calendario existe\n";
    exit(1);
}
?>