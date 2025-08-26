// Crear /var/www/tts-mall/api/library-metadata.php

<?php
/**
 * API Library Metadata - Gestión de metadatos de mensajes
 */

require_once 'config.php';

// Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Archivo de metadatos (JSON simple por ahora)
define('METADATA_FILE', __DIR__ . '/data/library_metadata.json');

// Crear directorio si no existe
if (!file_exists(dirname(METADATA_FILE))) {
    mkdir(dirname(METADATA_FILE), 0755, true);
}

// Inicializar archivo si no existe
if (!file_exists(METADATA_FILE)) {
    file_put_contents(METADATA_FILE, json_encode(['messages' => []], JSON_PRETTY_PRINT));
}

// Manejar OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? $_GET['action'] ?? '';
    
    switch ($action) {
        case 'save':
            saveMessageMetadata($input['data']);
            break;
            
        case 'list':
            listMessages();
            break;
            
        case 'get':
            getMessageById($input['id'] ?? $_GET['id']);
            break;
            
        case 'update':
            updateMessage($input['id'], $input['data']);
            break;
            
        case 'delete':
            deleteMessage($input['id']);
            break;
            
        default:
            throw new Exception('Acción no válida');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

/**
 * Guarda metadatos de mensaje
 */
function saveMessageMetadata($data) {
    $metadata = json_decode(file_get_contents(METADATA_FILE), true);
    
    // Agregar timestamp si no existe
    if (!isset($data['savedAt'])) {
        $data['savedAt'] = time() * 1000;
    }
    
    // Agregar o actualizar mensaje
    $metadata['messages'][$data['id']] = $data;
    
    // Guardar
    file_put_contents(METADATA_FILE, json_encode($metadata, JSON_PRETTY_PRINT));
    
    echo json_encode([
        'success' => true,
        'message' => 'Metadatos guardados',
        'id' => $data['id']
    ]);
}

/**
 * Lista todos los mensajes
 */
function listMessages() {
    $metadata = json_decode(file_get_contents(METADATA_FILE), true);
    $messages = array_values($metadata['messages'] ?? []);
    
    // Ordenar por fecha (más recientes primero)
    usort($messages, function($a, $b) {
        return ($b['savedAt'] ?? 0) - ($a['savedAt'] ?? 0);
    });
    
    echo json_encode([
        'success' => true,
        'messages' => $messages,
        'total' => count($messages)
    ]);
}

/**
 * Obtiene un mensaje por ID
 */
function getMessageById($id) {
    if (empty($id)) {
        throw new Exception('ID requerido');
    }
    
    $metadata = json_decode(file_get_contents(METADATA_FILE), true);
    $message = $metadata['messages'][$id] ?? null;
    
    if (!$message) {
        throw new Exception('Mensaje no encontrado');
    }
    
    echo json_encode([
        'success' => true,
        'message' => $message
    ]);
}

/**
 * Actualiza un mensaje
 */
function updateMessage($id, $data) {
    if (empty($id)) {
        throw new Exception('ID requerido');
    }
    
    $metadata = json_decode(file_get_contents(METADATA_FILE), true);
    
    if (!isset($metadata['messages'][$id])) {
        throw new Exception('Mensaje no encontrado');
    }
    
    // Actualizar datos
    $metadata['messages'][$id] = array_merge(
        $metadata['messages'][$id],
        $data,
        ['updatedAt' => time() * 1000]
    );
    
    // Guardar
    file_put_contents(METADATA_FILE, json_encode($metadata, JSON_PRETTY_PRINT));
    
    echo json_encode([
        'success' => true,
        'message' => 'Mensaje actualizado'
    ]);
}

/**
 * Elimina un mensaje
 */
function deleteMessage($id) {
    if (empty($id)) {
        throw new Exception('ID requerido');
    }
    
    $metadata = json_decode(file_get_contents(METADATA_FILE), true);
    
    if (!isset($metadata['messages'][$id])) {
        throw new Exception('Mensaje no encontrado');
    }
    
    // Eliminar
    unset($metadata['messages'][$id]);
    
    // Guardar
    file_put_contents(METADATA_FILE, json_encode($metadata, JSON_PRETTY_PRINT));
    
    echo json_encode([
        'success' => true,
        'message' => 'Mensaje eliminado'
    ]);
}
?>