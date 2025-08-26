<?php
/**
 * API para Metadata de Audio - Base de Datos
 * Maneja renombrados, descripciones, categorías y estadísticas
 */

// Configuración y headers
require_once 'config.php';
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Manejar preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Función de logging
function logMetadataAction($message, $filename = null) {
    $timestamp = date('Y-m-d H:i:s');
    $logFile = __DIR__ . '/logs/audio-metadata-' . date('Y-m-d') . '.log';
    
    if (!file_exists(dirname($logFile))) {
        mkdir(dirname($logFile), 0755, true);
    }
    
    $logMessage = "[$timestamp] $message";
    if ($filename) {
        $logMessage .= " | File: $filename";
    }
    
    file_put_contents($logFile, $logMessage . "\n", FILE_APPEND | LOCK_EX);
}

// Conexión a BD
function getDBConnection() {
    $dbPath = __DIR__ . '/../calendario/api/db/calendar.db';
    
    if (!file_exists($dbPath)) {
        throw new Exception('Base de datos no encontrada. Ejecutar init-audio-db.php primero.');
    }
    
    $db = new PDO('sqlite:' . $dbPath);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    return $db;
}

// Obtener sesión de usuario
function getUserSession() {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    return 'session_' . md5($ip . $userAgent);
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? $_GET['action'] ?? '';
    
    if (!$action) {
        throw new Exception('Acción no especificada');
    }
    
    logMetadataAction("Acción solicitada: $action");
    
    switch ($action) {
        case 'get_metadata':
            getMetadata($input);
            break;
            
        case 'set_display_name':
            setDisplayName($input);
            break;
            
        case 'set_description':
            setDescription($input);
            break;
            
        case 'set_category':
            setCategory($input);
            break;
            
        case 'update_metadata':
            updateMetadata($input);
            break;
            
        case 'record_play':
            recordPlay($input);
            break;
            
        case 'record_radio_sent':
            recordRadioSent($input);
            break;
            
        case 'get_stats':
            getStats($input);
            break;
            
        case 'get_popular':
            getPopular();
            break;
            
        case 'search_files':
            searchFiles($input);
            break;
            
        case 'bulk_update':
            bulkUpdate($input);
            break;
            
        case 'update_metadata':
            updateMetadata($input);
            break;
            
        default:
            throw new Exception('Acción no reconocida: ' . $action);
    }
    
} catch (Exception $e) {
    logMetadataAction("ERROR: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

/**
 * Obtener metadata de uno o varios archivos
 */
function getMetadata($input) {
    $filename = $input['filename'] ?? null;
    $filenames = $input['filenames'] ?? null;
    
    $db = getDBConnection();
    
    if ($filename) {
        // Un solo archivo
        $stmt = $db->prepare("
            SELECT * FROM audio_metadata 
            WHERE filename = ? AND is_active = 1
        ");
        $stmt->execute([$filename]);
        $metadata = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$metadata) {
            // Crear metadata básica si no existe
            $metadata = createBasicMetadata($db, $filename);
        }
        
        echo json_encode([
            'success' => true,
            'metadata' => $metadata
        ]);
        
    } else if ($filenames && is_array($filenames)) {
        // Múltiples archivos
        $placeholders = str_repeat('?,', count($filenames) - 1) . '?';
        $stmt = $db->prepare("
            SELECT filename, display_name, category, play_count, radio_sent_count 
            FROM audio_metadata 
            WHERE filename IN ($placeholders) AND is_active = 1
        ");
        $stmt->execute($filenames);
        $metadata = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Crear índice por filename para respuesta
        $indexed = [];
        foreach ($metadata as $item) {
            $indexed[$item['filename']] = $item;
        }
        
        echo json_encode([
            'success' => true,
            'metadata' => $indexed,
            'total' => count($metadata)
        ]);
        
    } else {
        throw new Exception('Filename o filenames requerido');
    }
}

/**
 * Crear metadata básica para archivo nuevo
 */
function createBasicMetadata($db, $filename) {
    // Extraer info básica del nombre
    $displayName = extractDisplayName($filename);
    $category = 'general';
    
    try {
        $stmt = $db->prepare("
            INSERT OR IGNORE INTO audio_metadata 
            (filename, display_name, category, created_at) 
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ");
        $stmt->execute([$filename, $displayName, $category]);
        
        // Obtener el registro creado
        $stmt2 = $db->prepare("SELECT * FROM audio_metadata WHERE filename = ?");
        $stmt2->execute([$filename]);
        return $stmt2->fetch(PDO::FETCH_ASSOC);
        
    } catch (Exception $e) {
        // Si falla la inserción, retornar metadata temporal
        return [
            'filename' => $filename,
            'display_name' => $displayName,
            'category' => $category,
            'play_count' => 0,
            'radio_sent_count' => 0
        ];
    }
}

/**
 * Extraer nombre para mostrar desde filename
 */
function extractDisplayName($filename) {
    $match = preg_match('/^tts\d{14}(_(.+))?\.mp3$/', $filename, $matches);
    if ($match && isset($matches[2])) {
        return str_replace('_', ' ', $matches[2]);
    }
    return $filename;
}

/**
 * Establecer nombre para mostrar
 */
function setDisplayName($input) {
    $filename = $input['filename'] ?? '';
    $displayName = $input['display_name'] ?? '';
    
    if (empty($filename) || empty($displayName)) {
        throw new Exception('Filename y display_name requeridos');
    }
    
    // Validar formato
    if (!preg_match('/^tts\d+(_[a-zA-Z0-9_\-ñÑáéíóúÁÉÍÓÚ]+)?\.mp3$/', $filename)) {
        throw new Exception('Formato de archivo inválido');
    }
    
    $db = getDBConnection();
    $userSession = getUserSession();
    
    // Actualizar o insertar
    $stmt = $db->prepare("
        INSERT OR REPLACE INTO audio_metadata 
        (filename, display_name, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
    ");
    $stmt->execute([$filename, $displayName]);
    
    // Log la acción
    logActionToDB($db, $filename, 'renamed', $userSession, json_encode(['new_name' => $displayName]));
    
    logMetadataAction("Display name actualizado", $filename);
    
    echo json_encode([
        'success' => true,
        'message' => 'Nombre actualizado',
        'filename' => $filename,
        'display_name' => $displayName
    ]);
}

/**
 * Establecer descripción
 */
function setDescription($input) {
    $filename = $input['filename'] ?? '';
    $description = $input['description'] ?? '';
    
    if (empty($filename)) {
        throw new Exception('Filename requerido');
    }
    
    $db = getDBConnection();
    
    $stmt = $db->prepare("
        INSERT OR REPLACE INTO audio_metadata 
        (filename, description, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
    ");
    $stmt->execute([$filename, $description]);
    
    logMetadataAction("Descripción actualizada", $filename);
    
    echo json_encode([
        'success' => true,
        'message' => 'Descripción actualizada',
        'filename' => $filename
    ]);
}

/**
 * Establecer categoría
 */
function setCategory($input) {
    $filename = $input['filename'] ?? '';
    $category = $input['category'] ?? 'general';
    
    if (empty($filename)) {
        throw new Exception('Filename requerido');
    }
    
    $validCategories = ['general', 'ofertas', 'eventos', 'informacion', 'emergencias', 'servicios', 'horarios'];
    if (!in_array($category, $validCategories)) {
        $category = 'general';
    }
    
    $db = getDBConnection();
    
    $stmt = $db->prepare("
        INSERT OR REPLACE INTO audio_metadata 
        (filename, category, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
    ");
    $stmt->execute([$filename, $category]);
    
    logMetadataAction("Categoría actualizada", $filename);
    
    echo json_encode([
        'success' => true,
        'message' => 'Categoría actualizada',
        'filename' => $filename,
        'category' => $category
    ]);
}

/**
 * Registrar reproducción
 */
function recordPlay($input) {
    $filename = $input['filename'] ?? '';
    
    if (empty($filename)) {
        throw new Exception('Filename requerido');
    }
    
    $db = getDBConnection();
    $userSession = getUserSession();
    
    // Actualizar contador y timestamp
    $stmt = $db->prepare("
        INSERT OR REPLACE INTO audio_metadata 
        (filename, play_count, last_played_at, updated_at) 
        VALUES (
            ?, 
            COALESCE((SELECT play_count FROM audio_metadata WHERE filename = ?), 0) + 1,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
    ");
    $stmt->execute([$filename, $filename]);
    
    // Log la acción
    logActionToDB($db, $filename, 'play', $userSession);
    
    echo json_encode([
        'success' => true,
        'message' => 'Reproducción registrada',
        'filename' => $filename
    ]);
}

/**
 * Registrar envío a radio
 */
function recordRadioSent($input) {
    $filename = $input['filename'] ?? '';
    
    if (empty($filename)) {
        throw new Exception('Filename requerido');
    }
    
    $db = getDBConnection();
    $userSession = getUserSession();
    
    // Actualizar contador y timestamp
    $stmt = $db->prepare("
        INSERT OR REPLACE INTO audio_metadata 
        (filename, radio_sent_count, last_radio_sent_at, updated_at) 
        VALUES (
            ?, 
            COALESCE((SELECT radio_sent_count FROM audio_metadata WHERE filename = ?), 0) + 1,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
    ");
    $stmt->execute([$filename, $filename]);
    
    // Log la acción
    logActionToDB($db, $filename, 'radio_sent', $userSession);
    
    echo json_encode([
        'success' => true,
        'message' => 'Envío a radio registrado',
        'filename' => $filename
    ]);
}

/**
 * Obtener estadísticas
 */
function getStats($input) {
    $filename = $input['filename'] ?? null;
    
    $db = getDBConnection();
    
    if ($filename) {
        // Stats de un archivo específico
        $stmt = $db->prepare("
            SELECT play_count, radio_sent_count, last_played_at, last_radio_sent_at 
            FROM audio_metadata 
            WHERE filename = ?
        ");
        $stmt->execute([$filename]);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'filename' => $filename,
            'stats' => $stats ?: ['play_count' => 0, 'radio_sent_count' => 0]
        ]);
    } else {
        // Stats globales
        $stmt = $db->query("
            SELECT 
                COUNT(*) as total_files,
                SUM(play_count) as total_plays,
                SUM(radio_sent_count) as total_radio_sends,
                AVG(play_count) as avg_plays_per_file,
                COUNT(DISTINCT category) as total_categories
            FROM audio_metadata 
            WHERE is_active = 1
        ");
        $globalStats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'global_stats' => $globalStats
        ]);
    }
}

/**
 * Obtener archivos más populares
 */
function getPopular() {
    $db = getDBConnection();
    
    $stmt = $db->query("
        SELECT filename, display_name, play_count, radio_sent_count,
               (play_count * 1 + radio_sent_count * 2) as popularity_score
        FROM audio_metadata 
        WHERE is_active = 1 
        ORDER BY popularity_score DESC, play_count DESC 
        LIMIT 10
    ");
    $popular = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'popular_files' => $popular
    ]);
}

/**
 * Buscar archivos por metadata
 */
function searchFiles($input) {
    $query = $input['query'] ?? '';
    $category = $input['category'] ?? null;
    
    if (empty($query) && empty($category)) {
        throw new Exception('Query o category requerido');
    }
    
    $db = getDBConnection();
    $conditions = [];
    $params = [];
    
    if ($query) {
        $conditions[] = "(filename LIKE ? OR display_name LIKE ? OR description LIKE ?)";
        $searchTerm = "%$query%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }
    
    if ($category) {
        $conditions[] = "category = ?";
        $params[] = $category;
    }
    
    $conditions[] = "is_active = 1";
    
    $sql = "SELECT filename, display_name, category, play_count, radio_sent_count 
            FROM audio_metadata 
            WHERE " . implode(' AND ', $conditions) . "
            ORDER BY play_count DESC 
            LIMIT 50";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'results' => $results,
        'total' => count($results),
        'query' => $query,
        'category' => $category
    ]);
}

/**
 * Actualizar metadata de un archivo
 */
function updateMetadata($input) {
    $filename = $input['filename'] ?? '';
    $metadata = $input['metadata'] ?? [];
    
    if (empty($filename)) {
        throw new Exception('Filename requerido');
    }
    
    $db = getDBConnection();
    
    // Primero verificar si existe
    $stmt = $db->prepare("SELECT id FROM audio_metadata WHERE filename = ?");
    $stmt->execute([$filename]);
    $exists = $stmt->fetch();
    
    if (!$exists) {
        // Crear metadata básica primero
        createBasicMetadata($db, $filename);
    }
    
    // Campos permitidos para actualizar
    $allowedFields = [
        'display_name', 'description', 'category', 
        'is_saved', 'saved_at', 'tags', 'notes'
    ];
    
    $fields = [];
    $values = [];
    
    foreach ($metadata as $field => $value) {
        if (in_array($field, $allowedFields)) {
            $fields[] = "$field = ?";
            $values[] = $value;
        }
    }
    
    if (!empty($fields)) {
        $fields[] = "updated_at = CURRENT_TIMESTAMP";
        $values[] = $filename;
        
        $sql = "UPDATE audio_metadata SET " . 
               implode(', ', $fields) . 
               " WHERE filename = ?";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($values);
        
        logMetadataAction("Metadata actualizada para: $filename");
        
        echo json_encode([
            'success' => true,
            'message' => 'Metadata actualizada',
            'filename' => $filename,
            'updated_fields' => array_keys($metadata)
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'message' => 'No hay campos para actualizar',
            'filename' => $filename
        ]);
    }
}

/**
 * Actualización en lote
 */
function bulkUpdate($input) {
    $updates = $input['updates'] ?? [];
    
    if (empty($updates) || !is_array($updates)) {
        throw new Exception('Updates array requerido');
    }
    
    $db = getDBConnection();
    $db->beginTransaction();
    
    try {
        $updated = 0;
        foreach ($updates as $update) {
            $filename = $update['filename'] ?? '';
            $metadata = $update['metadata'] ?? [];
            
            if (!empty($filename) && !empty($metadata)) {
                // Reutilizar lógica de updateMetadata
                updateSingleFile($db, $filename, $metadata);
                $updated++;
            }
        }
        
        $db->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Actualización en lote completada',
            'updated' => $updated,
            'total' => count($updates)
        ]);
        
    } catch (Exception $e) {
        $db->rollback();
        throw new Exception('Error en actualización en lote: ' . $e->getMessage());
    }
}

/**
 * Helper para actualizar un solo archivo
 */
function updateSingleFile($db, $filename, $metadata) {
    $fields = [];
    $values = [];
    
    $allowedFields = ['display_name', 'description', 'category'];
    
    foreach ($allowedFields as $field) {
        if (isset($metadata[$field])) {
            $fields[] = "$field = ?";
            $values[] = $metadata[$field];
        }
    }
    
    if (!empty($fields)) {
        $fields[] = "updated_at = CURRENT_TIMESTAMP";
        $values[] = $filename;
        
        $sql = "INSERT OR REPLACE INTO audio_metadata (" . 
               implode(', ', array_keys($metadata)) . ", filename, updated_at) VALUES (" .
               str_repeat('?,', count($metadata)) . "?, CURRENT_TIMESTAMP)";
        
        $allValues = array_values($metadata);
        $allValues[] = $filename;
        
        $stmt = $db->prepare($sql);
        $stmt->execute($allValues);
    }
}

/**
 * Log de acciones en BD
 */
function logActionToDB($db, $filename, $action, $userSession, $details = null) {
    try {
        $stmt = $db->prepare("
            INSERT INTO audio_actions_log 
            (filename, action, user_session, details) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$filename, $action, $userSession, $details]);
    } catch (Exception $e) {
        // Log error pero no fallar la operación principal
        logMetadataAction("Error logging action: " . $e->getMessage());
    }
}
?>