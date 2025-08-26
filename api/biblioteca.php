<?php
/**
 * API Biblioteca de Anuncios - VERSIÓN OPTIMIZADA
 * Gestión de archivos TTS generados
 */

// Incluir configuración y funciones
require_once 'config.php';
require_once 'services/radio-service.php';

// Función de logging
function logMessage($message) {
    $timestamp = date('Y-m-d H:i:s');
    $logFile = __DIR__ . '/logs/biblioteca-' . date('Y-m-d') . '.log';
    
    if (!file_exists(dirname($logFile))) {
        mkdir(dirname($logFile), 0755, true);
    }
    
    file_put_contents($logFile, "[$timestamp] $message\n", FILE_APPEND | LOCK_EX);
}

// Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Manejar GET requests para audio y descargas
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    $filename = $_GET['filename'] ?? '';
    
    // Si no hay filename, es un acceso directo - mostrar info
    if (empty($filename)) {
        header('Content-Type: application/json');
        echo json_encode(['status' => 'API Biblioteca funcionando', 'method' => 'GET']);
        exit;
    }
    
    // Validar filename - ACTUALIZADO PARA PERMITIR DESCRIPCIONES
    if (!preg_match('/^tts\d+(_[a-zA-Z0-9_\-ñÑáéíóúÁÉÍÓÚ]+)?\.mp3$/', $filename)) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Archivo inválido']);
        exit;
    }
    
    // Obtener archivo desde Docker
    $dockerPath = '/var/azuracast/stations/test/media/Grabaciones/' . $filename;
    $tempFile = UPLOAD_DIR . 'temp_' . $filename;
    
    // Copiar archivo desde Docker a temporal
    $copyCommand = sprintf(
        'sudo docker cp azuracast:%s %s 2>&1',
        escapeshellarg($dockerPath),
        escapeshellarg($tempFile)
    );
    
    
    logMessage("UPLOAD_DIR: " . UPLOAD_DIR);
    logMessage("tempFile path: " . $tempFile);
    logMessage("dockerPath: " . $dockerPath);
    logMessage("copyCommand: " . $copyCommand);
    $copyResult = shell_exec($copyCommand);
    
    
    logMessage("copyResult: " . $copyResult);
    logMessage("File exists check: " . (file_exists($tempFile) ? "YES" : "NO"));
    if (!file_exists($tempFile)) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Archivo no encontrado']);
        exit;
    }
    
    // Servir el archivo
    if ($action === 'download') {
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
    } else {
        header('Content-Type: audio/mpeg');
        header('Content-Disposition: inline; filename="' . $filename . '"');
    }
    
    header('Content-Length: ' . filesize($tempFile));
    header('Accept-Ranges: bytes');
    
    readfile($tempFile);
    
    // Limpiar archivo temporal
    unlink($tempFile);
    exit;
}

// Procesar POST requests
header('Content-Type: application/json');

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('No se recibieron datos');
    }
    
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'list_library':
            listLibraryFiles();
            break;
            
        case 'delete_library_file':
            deleteLibraryFile($input);
            break;
            
        case 'send_library_to_radio':
            sendLibraryToRadio($input);
            break;
            
        case 'rename_file':
            renameLibraryFile($input);
            break;
            
        default:
            throw new Exception('Acción no reconocida: ' . $action);
    }
    
} catch (Exception $e) {
    logMessage("Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

/**
 * Listar archivos de biblioteca - VERSIÓN OPTIMIZADA
 */
function listLibraryFiles() {
    logMessage("Listando archivos de biblioteca - Versión optimizada");
    
    try {
        // Método 1: Usar find con -printf para obtener toda la info de una vez
        $findCommand = 'sudo docker exec azuracast find /var/azuracast/stations/test/media/Grabaciones/ -name "tts*.mp3" -printf "%f|%s|%T@\n" 2>/dev/null';
        $output = shell_exec($findCommand);
        
        if (!$output) {
            logMessage("No se encontraron archivos");
            echo json_encode([
                'success' => true,
                'files' => [],
                'total' => 0
            ]);
            return;
        }
        
        $library = [];
        $lines = explode("\n", trim($output));
        
        logMessage("Procesando " . count($lines) . " archivos");
        
        foreach ($lines as $line) {
            if (empty($line)) continue;
            
            $parts = explode('|', $line);
            if (count($parts) >= 3) {
                $filename = $parts[0];
                $size = intval($parts[1]);
                $timestamp = intval($parts[2]);
                
                $fileInfo = [
                    'filename' => $filename,
                    'size' => $size,
                    'timestamp' => $timestamp,
                    'date' => date('Y-m-d H:i:s', $timestamp),
                    'duration' => 0 // Lo dejamos en 0 por ahora para no hacer timeout
                ];
                
                // Formatear fecha desde el nombre
                if (preg_match('/tts(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/', $filename, $matches)) {
                    $fileInfo['formatted_date'] = sprintf(
                        "%s/%s/%s %s:%s",
                        $matches[3], $matches[2], $matches[1],
                        $matches[4], $matches[5]
                    );
                } else {
                    $fileInfo['formatted_date'] = date('d/m/Y H:i', $timestamp);
                }
                
                $library[] = $fileInfo;
            }
        }
        
        // Ordenar por timestamp descendente (más recientes primero)
        usort($library, function($a, $b) {
            return $b['timestamp'] - $a['timestamp'];
        });
        
        // Limitar a los primeros 50 archivos para evitar problemas
        $library = array_slice($library, 0, 50);
        
        logMessage("Retornando " . count($library) . " archivos");
        
        echo json_encode([
            'success' => true,
            'files' => $library,
            'total' => count($library)
        ]);
        
    } catch (Exception $e) {
        logMessage("Error en listLibraryFiles: " . $e->getMessage());
        throw $e;
    }
}

/**
 * Eliminar archivo de biblioteca
 */
function deleteLibraryFile($input) {
    $filename = $input['filename'] ?? '';
    
    // ACTUALIZADO PARA PERMITIR DESCRIPCIONES
    if (empty($filename) || !preg_match('/^tts\d+(_[a-zA-Z0-9_\-ñÑáéíóúÁÉÍÓÚ]+)?\.mp3$/', $filename)) {
        throw new Exception('Nombre de archivo inválido');
    }
    
    logMessage("Eliminando archivo: $filename");
    
    try {
        // Eliminar archivo usando Docker exec
        $dockerPath = '/var/azuracast/stations/test/media/Grabaciones/' . $filename;
        $deleteCommand = sprintf(
            'sudo docker exec azuracast rm -f %s 2>&1',
            escapeshellarg($dockerPath)
        );
        
        $result = shell_exec($deleteCommand);
        
        // Verificar si se eliminó
        $checkCommand = sprintf(
            'sudo docker exec azuracast test -f %s && echo "EXISTS" || echo "DELETED" 2>&1',
            escapeshellarg($dockerPath)
        );
        $checkResult = trim(shell_exec($checkCommand));
        
        if ($checkResult === 'DELETED') {
            logMessage("Archivo eliminado exitosamente: $filename");
            echo json_encode([
                'success' => true,
                'message' => 'Archivo eliminado exitosamente'
            ]);
        } else {
            throw new Exception('No se pudo eliminar el archivo');
        }
        
    } catch (Exception $e) {
        throw new Exception('Error al eliminar: ' . $e->getMessage());
    }
}

/**
 * Enviar archivo de biblioteca a radio
 */
function sendLibraryToRadio($input) {
    $filename = $input['filename'] ?? '';
    
    // ACTUALIZADO PARA PERMITIR DESCRIPCIONES
    if (empty($filename) || !preg_match('/^tts\d+(_[a-zA-Z0-9_\-ñÑáéíóúÁÉÍÓÚ]+)?\.mp3$/', $filename)) {
        throw new Exception('Nombre de archivo inválido');
    }
    
    logMessage("Enviando archivo de biblioteca a radio: $filename");
    
    try {
        // Verificar que existe en Docker
        $dockerPath = '/var/azuracast/stations/test/media/Grabaciones/' . $filename;
        $checkCommand = sprintf(
            'sudo docker exec azuracast test -f %s && echo "EXISTS" || echo "NOT_FOUND" 2>&1',
            escapeshellarg($dockerPath)
        );
        $exists = trim(shell_exec($checkCommand));
        
        if ($exists !== 'EXISTS') {
            throw new Exception('Archivo no encontrado en biblioteca');
        }
        
        // Usar la función existente de radio-service.php
        $success = interruptRadio($filename);
        
        if ($success) {
            logMessage("Archivo de biblioteca enviado exitosamente: $filename");
            echo json_encode([
                'success' => true,
                'message' => 'Anuncio reproduciéndose en Radio OVH'
            ]);
        } else {
            throw new Exception('Error al interrumpir la radio');
        }
        
    } catch (Exception $e) {
        throw new Exception('Error al enviar a radio: ' . $e->getMessage());
    }
}

/**
 * Renombrar archivo de biblioteca con descripción legible
 */
function renameLibraryFile($input) {
    $oldFilename = $input['old_filename'] ?? '';
    $newDescription = $input['new_description'] ?? '';
    
    // Validación de entrada
    if (empty($oldFilename) || !preg_match('/^tts\d+(_[a-zA-Z0-9_\-ñÑáéíóúÁÉÍÓÚ]+)?\.mp3$/', $oldFilename)) {
        throw new Exception('Nombre de archivo original inválido');
    }
    
    if (empty($newDescription)) {
        throw new Exception('La descripción no puede estar vacía');
    }
    
    // Limpiar y validar descripción
    $cleanDescription = trim($newDescription);
    $cleanDescription = str_replace(' ', '_', $cleanDescription); // Espacios a guiones bajos
    
    // Validar caracteres permitidos
    if (!preg_match('/^[a-zA-Z0-9_\-ñÑáéíóúÁÉÍÓÚ]+$/', $cleanDescription)) {
        throw new Exception('La descripción contiene caracteres no permitidos. Use solo letras, números, guiones y guiones bajos.');
    }
    
    // Limitar longitud
    if (strlen($cleanDescription) > 30) {
        throw new Exception('La descripción es demasiado larga (máximo 30 caracteres)');
    }
    
    // Extraer timestamp del nombre original
    if (!preg_match('/^(tts\d{14})/', $oldFilename, $matches)) {
        throw new Exception('No se pudo extraer el timestamp del archivo original');
    }
    
    $timestamp = $matches[1];
    $newFilename = $timestamp . '_' . $cleanDescription . '.mp3';
    
    logMessage("Renombrando archivo: $oldFilename -> $newFilename");
    
    try {
        // Rutas completas en Docker
        $oldPath = '/var/azuracast/stations/test/media/Grabaciones/' . $oldFilename;
        $newPath = '/var/azuracast/stations/test/media/Grabaciones/' . $newFilename;
        
        // Verificar que el archivo original existe
        $checkCommand = sprintf(
            'sudo docker exec azuracast test -f %s && echo "EXISTS" || echo "NOT_FOUND" 2>&1',
            escapeshellarg($oldPath)
        );
        $exists = trim(shell_exec($checkCommand));
        
        if ($exists !== 'EXISTS') {
            throw new Exception('El archivo original no existe');
        }
        
        // Verificar que el nuevo nombre no existe
        $checkNewCommand = sprintf(
            'sudo docker exec azuracast test -f %s && echo "EXISTS" || echo "AVAILABLE" 2>&1',
            escapeshellarg($newPath)
        );
        $newExists = trim(shell_exec($checkNewCommand));
        
        if ($newExists === 'EXISTS') {
            throw new Exception('Ya existe un archivo con ese nombre');
        }
        
        // Ejecutar rename en Docker
        $renameCommand = sprintf(
            'sudo docker exec azuracast mv %s %s 2>&1',
            escapeshellarg($oldPath),
            escapeshellarg($newPath)
        );
        
        logMessage("Ejecutando comando: $renameCommand");
        $renameResult = shell_exec($renameCommand);
        
        // Verificar que el rename fue exitoso
        $verifyCommand = sprintf(
            'sudo docker exec azuracast test -f %s && echo "SUCCESS" || echo "FAILED" 2>&1',
            escapeshellarg($newPath)
        );
        $verified = trim(shell_exec($verifyCommand));
        
        if ($verified !== 'SUCCESS') {
            logMessage("Error en rename: $renameResult");
            throw new Exception('No se pudo renombrar el archivo');
        }
        
        logMessage("Archivo renombrado exitosamente. Sincronizando AzuraCast...");
        
        // Sincronizar AzuraCast (reprocess media)
$syncCommand = 'sudo docker exec azuracast php /var/azuracast/www/backend/bin/console azuracast:media:reprocess 1 2>&1';        logMessage("Ejecutando sincronización: $syncCommand");
        
        $syncResult = shell_exec($syncCommand);
        logMessage("Resultado sincronización: " . substr($syncResult, 0, 200)); // Solo primeros 200 chars
        
        // Retornar éxito
        echo json_encode([
            'success' => true,
            'message' => 'Archivo renombrado exitosamente',
            'old_filename' => $oldFilename,
            'new_filename' => $newFilename,
            'description' => str_replace('_', ' ', $cleanDescription)
        ]);
        
    } catch (Exception $e) {
        logMessage("Error en renameLibraryFile: " . $e->getMessage());
        throw new Exception('Error al renombrar: ' . $e->getMessage());
    }
}
?>