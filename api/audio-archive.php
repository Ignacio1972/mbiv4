<?php
/**
 * Audio Archive API - Historial Completo de Archivos de Audio
 * Sistema MBI-v4 Radio Automatizada
 * 
 * FUNCIONALIDAD:
 * - Lista TODOS los archivos (activos + soft-deleted)
 * - Solo lectura (historial completo)
 * - Incluye TTS generados + archivos externos
 * - Preview de archivos
 */

require_once 'config.php';

// Headers CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Logging function
function logMessage($message) {
    $timestamp = date('Y-m-d H:i:s');
    $logFile = __DIR__ . '/logs/audio-archive-' . date('Y-m-d') . '.log';
    
    if (!file_exists(dirname($logFile))) {
        mkdir(dirname($logFile), 0755, true);
    }
    
    file_put_contents($logFile, "[$timestamp] $message\n", FILE_APPEND | LOCK_EX);
}

// Database connection
function getDB() {
    $dbPath = __DIR__ . '/../calendario/api/db/calendar.db';
    
    if (!file_exists($dbPath)) {
        throw new Exception("Base de datos no encontrada: $dbPath");
    }
    
    try {
        $pdo = new PDO("sqlite:$dbPath");
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        throw new Exception("Error conectando a BD: " . $e->getMessage());
    }
}

// Get all audio files (including soft-deleted)
function getAllAudioFiles() {
    $db = getDB();
    
    try {
        $sql = "
            SELECT 
                filename,
                display_name,
                description,
                category,
                created_at,
                updated_at,
                file_size,
                duration_seconds,
                is_saved,
                is_active,
                saved_at,
                play_count,
                radio_sent_count,
                last_played_at,
                last_radio_sent_at,
                tags,
                notes,
                CASE 
                    WHEN is_active = 0 THEN 'deleted'
                    WHEN is_saved = 1 THEN 'saved'
                    ELSE 'generated'
                END as status
            FROM audio_metadata 
            ORDER BY created_at DESC
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $files = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format dates and extract info
        foreach ($files as &$file) {
            // Format creation date
            $file['formatted_date'] = formatDate($file['created_at']);
            
            // Extract display name from filename if not set
            if (empty($file['display_name'])) {
                $file['display_name'] = extractDisplayName($file['filename']);
            }
            
            // Format file size
            $file['formatted_size'] = formatFileSize($file['file_size']);
            
            // Extract voice from filename for TTS files
            $file['voice'] = (strpos($file['filename'], 'tts') === 0) ? 
                extractVoiceFromFilename($file['filename']) : 'Usuario';
            
            // Category label
            $file['category_label'] = getCategoryLabel($file['category']);
        }
        
        logMessage("Cargados " . count($files) . " archivos del historial completo");
        return $files;
        
    } catch (Exception $e) {
        logMessage("Error cargando archivos: " . $e->getMessage());
        throw $e;
    }
}

// Extract display name from filename
function extractDisplayName($filename) {
    // Pattern: tts{timestamp}[_description].mp3
    if (preg_match('/^tts\d{14}(_(.+))?\\.mp3$/', $filename, $matches)) {
        if (isset($matches[2])) {
            return str_replace('_', ' ', $matches[2]);
        }
        return "Mensaje TTS";
    }
    
    // External files - use filename without extension
    return pathinfo($filename, PATHINFO_FILENAME);
}

// Extract voice from filename (for TTS files)
function extractVoiceFromFilename($filename) {
    // This is a simple implementation - you may need to adjust based on your naming convention
    if (strpos($filename, 'fernanda') !== false) return 'Fernanda';
    if (strpos($filename, 'cristian') !== false) return 'Cristian';
    if (strpos($filename, 'rosa') !== false) return 'Rosa';
    if (strpos($filename, 'diego') !== false) return 'Diego';
    if (strpos($filename, 'laura') !== false) return 'Laura';
    
    return 'TTS';
}

// Format date for display
function formatDate($dateString) {
    try {
        $date = new DateTime($dateString);
        return $date->format('d/m/Y H:i');
    } catch (Exception $e) {
        return $dateString;
    }
}

// Format file size
function formatFileSize($bytes) {
    if (!$bytes || $bytes == 0) return '0 B';
    
    $units = ['B', 'KB', 'MB', 'GB'];
    $i = floor(log($bytes, 1024));
    
    return round($bytes / pow(1024, $i), 2) . ' ' . $units[$i];
}

// Get category label
function getCategoryLabel($category) {
    $labels = [
        'ofertas' => 'Ofertas',
        'eventos' => 'Eventos', 
        'informacion' => 'Información',
        'servicios' => 'Servicios',
        'horarios' => 'Horarios',
        'emergencias' => 'Emergencias',
        'sin_categoria' => 'Sin Categoría'
    ];
    
    return $labels[$category] ?? 'General';
}

// Serve audio file for preview
function serveAudioFile($filename) {
    logMessage("Solicitud preview para: $filename");
    
    // Security: validate filename
    if (!preg_match('/^[a-zA-Z0-9_\-\.]+$/', $filename)) {
        throw new Exception("Nombre de archivo inválido");
    }
    
    $filePath = null;
    
    // Try different paths
    $paths = [
        "/var/azuracast/stations/test/media/Grabaciones/$filename",
        "/var/azuracast/stations/test/media/$filename"
    ];
    
    foreach ($paths as $path) {
        if (file_exists($path)) {
            $filePath = $path;
            break;
        }
    }
    
    if (!$filePath) {
        throw new Exception("Archivo no encontrado: $filename");
    }
    
    // Determine content type
    $contentType = 'audio/mpeg'; // Default for MP3
    $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    
    switch ($ext) {
        case 'wav': $contentType = 'audio/wav'; break;
        case 'flac': $contentType = 'audio/flac'; break;
        case 'm4a': $contentType = 'audio/mp4'; break;
        case 'ogg': $contentType = 'audio/ogg'; break;
    }
    
    // Set headers for audio streaming
    header('Content-Type: ' . $contentType);
    header('Content-Length: ' . filesize($filePath));
    header('Accept-Ranges: bytes');
    header('Cache-Control: public, max-age=3600');
    
    // Stream the file
    readfile($filePath);
    exit;
}

// Main request handler
try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Parse JSON request
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? '';
        
        switch ($action) {
            case 'list_all':
                $files = getAllAudioFiles();
                
                echo json_encode([
                    'success' => true,
                    'files' => $files,
                    'total' => count($files),
                    'timestamp' => date('c')
                ]);
                break;
                
            default:
                throw new Exception("Acción no válida: $action");
        }
        
    } else {
        throw new Exception("Método no permitido");
    }
    
} catch (Exception $e) {
    logMessage("ERROR: " . $e->getMessage());
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'timestamp' => date('c')
    ]);
}
?>