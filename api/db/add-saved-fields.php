<?php
/**
 * Script para agregar campos is_saved y saved_at a la tabla audio_metadata
 * Ejecutar una vez para actualizar la estructura de la BD
 */

// Configuración
$dbPath = __DIR__ . '/../../calendario/api/db/calendar.db';

try {
    // Conectar a BD
    $db = new PDO("sqlite:$dbPath");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "📊 Agregando campos para Mensajes Guardados...\n";
    
    // Verificar si los campos ya existen
    $stmt = $db->query("PRAGMA table_info(audio_metadata)");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $columnNames = array_column($columns, 'name');
    
    $fieldsToAdd = [];
    
    if (!in_array('is_saved', $columnNames)) {
        $fieldsToAdd[] = "ALTER TABLE audio_metadata ADD COLUMN is_saved BOOLEAN DEFAULT 0";
    }
    
    if (!in_array('saved_at', $columnNames)) {
        $fieldsToAdd[] = "ALTER TABLE audio_metadata ADD COLUMN saved_at DATETIME";
    }
    
    if (!in_array('tags', $columnNames)) {
        $fieldsToAdd[] = "ALTER TABLE audio_metadata ADD COLUMN tags TEXT";
    }
    
    if (!in_array('notes', $columnNames)) {
        $fieldsToAdd[] = "ALTER TABLE audio_metadata ADD COLUMN notes TEXT";
    }
    
    if (empty($fieldsToAdd)) {
        echo "✅ Los campos ya existen, no se requieren cambios\n";
    } else {
        foreach ($fieldsToAdd as $sql) {
            $db->exec($sql);
            echo "✅ Campo agregado: " . substr($sql, strpos($sql, 'COLUMN') + 7) . "\n";
        }
        
        // Migrar favoritos existentes a is_saved
        echo "📋 Migrando favoritos existentes...\n";
        $sql = "UPDATE audio_metadata 
                SET is_saved = 1, 
                    saved_at = CURRENT_TIMESTAMP,
                    category = COALESCE(category, 'sin_categoria')
                WHERE filename IN (
                    SELECT filename FROM audio_favorites WHERE is_active = 1
                )";
        $affected = $db->exec($sql);
        echo "✅ $affected archivos marcados como guardados\n";
    }
    
    // Verificar resultado
    $stmt = $db->query("SELECT COUNT(*) as total, SUM(is_saved) as saved FROM audio_metadata");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "\n🎉 ¡Actualización completada!\n";
    echo "📊 Total archivos: " . $result['total'] . "\n";
    echo "💾 Archivos guardados: " . ($result['saved'] ?? 0) . "\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}