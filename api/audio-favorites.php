<?php
/**
 * API para Favoritos de Audio - Base de Datos
 * Reemplaza localStorage con persistencia real en BD SQLite
 */

// Configuración y headers
require_once 'config.php';
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Manejar preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Función de logging
function logFavoriteAction($message, $filename = null) {
    $timestamp = date('Y-m-d H:i:s');
    $logFile = __DIR__ . '/logs/audio-favorites-' . date('Y-m-d') . '.log';
    
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

// Obtener sesión de usuario (simple por ahora)
function getUserSession() {
    // Por ahora usamos IP + User Agent como sesión simple
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
    
    logFavoriteAction("Acción solicitada: $action");
    
    switch ($action) {
        case 'get_favorites':
            getFavorites();
            break;
            
        case 'add_favorite':
            addFavorite($input);
            break;
            
        case 'remove_favorite':
            removeFavorite($input);
            break;
            
        case 'toggle_favorite':
            toggleFavorite($input);
            break;
            
        case 'get_stats':
            getFavoriteStats();
            break;
            
        case 'migrate_from_localstorage':
            migrateFromLocalStorage($input);
            break;
            
        default:
            throw new Exception('Acción no reconocida: ' . $action);
    }
    
} catch (Exception $e) {
    logFavoriteAction("ERROR: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

/**
 * Obtener lista de favoritos del usuario actual
 */
function getFavorites() {
    $db = getDBConnection();
    $userSession = getUserSession();
    
    $stmt = $db->prepare("
        SELECT filename, created_at 
        FROM audio_favorites 
        WHERE user_session = ? AND is_active = 1 
        ORDER BY created_at DESC
    ");
    $stmt->execute([$userSession]);
    $favorites = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Convertir a array simple de filenames para compatibilidad
    $favoriteList = array_column($favorites, 'filename');
    
    logFavoriteAction("Favoritos obtenidos", "count: " . count($favoriteList));
    
    echo json_encode([
        'success' => true,
        'favorites' => $favoriteList,
        'detailed' => $favorites,
        'total' => count($favoriteList)
    ]);
}

/**
 * Agregar archivo a favoritos
 */
function addFavorite($input) {
    $filename = $input['filename'] ?? '';
    
    if (empty($filename)) {
        throw new Exception('Nombre de archivo requerido');
    }
    
    // Validar formato de archivo
    if (!preg_match('/^tts\d+(_[a-zA-Z0-9_\-ñÑáéíóúÁÉÍÓÚ]+)?\.mp3$/', $filename)) {
        throw new Exception('Formato de archivo inválido');
    }
    
    $db = getDBConnection();
    $userSession = getUserSession();
    
    try {
        // Intentar insertar (IGNORE si ya existe)
        $stmt = $db->prepare("
            INSERT OR IGNORE INTO audio_favorites 
            (filename, user_session, created_at) 
            VALUES (?, ?, CURRENT_TIMESTAMP)
        ");
        $stmt->execute([$filename, $userSession]);
        
        // Verificar si se insertó o ya existía
        $stmt2 = $db->prepare("
            SELECT id FROM audio_favorites 
            WHERE filename = ? AND user_session = ? AND is_active = 1
        ");
        $stmt2->execute([$filename, $userSession]);
        $exists = $stmt2->fetch();
        
        if ($exists) {
            // Log la acción en tabla de historial
            logActionToDB($db, $filename, 'favorited', $userSession);
            
            logFavoriteAction("Favorito agregado", $filename);
            
            echo json_encode([
                'success' => true,
                'message' => 'Archivo agregado a favoritos',
                'filename' => $filename
            ]);
        } else {
            throw new Exception('No se pudo agregar a favoritos');
        }
        
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'UNIQUE constraint') !== false) {
            echo json_encode([
                'success' => true,
                'message' => 'El archivo ya está en favoritos',
                'filename' => $filename
            ]);
        } else {
            throw $e;
        }
    }
}

/**
 * Remover archivo de favoritos
 */
function removeFavorite($input) {
    $filename = $input['filename'] ?? '';
    
    if (empty($filename)) {
        throw new Exception('Nombre de archivo requerido');
    }
    
    $db = getDBConnection();
    $userSession = getUserSession();
    
    // Soft delete
    $stmt = $db->prepare("
        UPDATE audio_favorites 
        SET is_active = 0, updated_at = CURRENT_TIMESTAMP 
        WHERE filename = ? AND user_session = ? AND is_active = 1
    ");
    $stmt->execute([$filename, $userSession]);
    
    if ($stmt->rowCount() > 0) {
        logActionToDB($db, $filename, 'unfavorited', $userSession);
        logFavoriteAction("Favorito removido", $filename);
        
        echo json_encode([
            'success' => true,
            'message' => 'Archivo removido de favoritos',
            'filename' => $filename
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'message' => 'El archivo no estaba en favoritos',
            'filename' => $filename
        ]);
    }
}

/**
 * Toggle favorito (agregar si no existe, remover si existe)
 */
function toggleFavorite($input) {
    $filename = $input['filename'] ?? '';
    
    if (empty($filename)) {
        throw new Exception('Nombre de archivo requerido');
    }
    
    $db = getDBConnection();
    $userSession = getUserSession();
    
    // Verificar si ya es favorito
    $stmt = $db->prepare("
        SELECT id FROM audio_favorites 
        WHERE filename = ? AND user_session = ? AND is_active = 1
    ");
    $stmt->execute([$filename, $userSession]);
    $exists = $stmt->fetch();
    
    if ($exists) {
        // Remover de favoritos
        removeFavorite($input);
    } else {
        // Agregar a favoritos
        addFavorite($input);
    }
}

/**
 * Obtener estadísticas de favoritos
 */
function getFavoriteStats() {
    $db = getDBConnection();
    $userSession = getUserSession();
    
    // Stats del usuario actual
    $stmt = $db->prepare("
        SELECT COUNT(*) as total
        FROM audio_favorites 
        WHERE user_session = ? AND is_active = 1
    ");
    $stmt->execute([$userSession]);
    $userStats = $stmt->fetch();
    
    // Stats globales (opcional)
    $stmt2 = $db->query("
        SELECT 
            COUNT(DISTINCT filename) as unique_files,
            COUNT(*) as total_favorites,
            COUNT(DISTINCT user_session) as unique_users
        FROM audio_favorites 
        WHERE is_active = 1
    ");
    $globalStats = $stmt2->fetch();
    
    logFavoriteAction("Stats obtenidas");
    
    echo json_encode([
        'success' => true,
        'user_stats' => [
            'total_favorites' => (int)$userStats['total']
        ],
        'global_stats' => [
            'unique_files' => (int)$globalStats['unique_files'],
            'total_favorites' => (int)$globalStats['total_favorites'],
            'unique_users' => (int)$globalStats['unique_users']
        ]
    ]);
}

/**
 * Migrar favoritos desde localStorage a BD
 */
function migrateFromLocalStorage($input) {
    $favorites = $input['favorites'] ?? [];
    
    if (!is_array($favorites)) {
        throw new Exception('Formato de favoritos inválido');
    }
    
    $db = getDBConnection();
    $userSession = getUserSession();
    $migrated = 0;
    $errors = [];
    
    $db->beginTransaction();
    
    try {
        foreach ($favorites as $filename) {
            if (preg_match('/^tts\d+(_[a-zA-Z0-9_\-ñÑáéíóúÁÉÍÓÚ]+)?\.mp3$/', $filename)) {
                $stmt = $db->prepare("
                    INSERT OR IGNORE INTO audio_favorites 
                    (filename, user_session, created_at) 
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                ");
                $stmt->execute([$filename, $userSession]);
                
                if ($stmt->rowCount() > 0) {
                    $migrated++;
                }
            } else {
                $errors[] = "Formato inválido: $filename";
            }
        }
        
        $db->commit();
        
        logFavoriteAction("Migración desde localStorage", "migrated: $migrated, errors: " . count($errors));
        
        echo json_encode([
            'success' => true,
            'message' => 'Migración completada',
            'migrated' => $migrated,
            'total_received' => count($favorites),
            'errors' => $errors
        ]);
        
    } catch (Exception $e) {
        $db->rollback();
        throw new Exception('Error en migración: ' . $e->getMessage());
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
        logFavoriteAction("Error logging action: " . $e->getMessage());
    }
}
?>