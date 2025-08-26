#!/usr/bin/php
<?php
/**
 * Script cron para ejecutar programaciones automáticas
 * Ejecutar cada minuto: * * * * * /usr/bin/php /var/www/mbi-v3/api/scheduler-cron.php
 */
// Configurar zona horaria de Chile
date_default_timezone_set('America/Santiago');

// Configuración
$dbPath = __DIR__ . '/../calendario/api/db/calendar.db';
$logFile = __DIR__ . '/logs/scheduler-' . date('Y-m-d') . '.log';

// Función para log
function logMessage($message) {
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] $message\n", FILE_APPEND);
}

// Función para enviar audio a la radio
function sendToRadio($filename) {
    logMessage("Enviando a radio: $filename");
    
    // Usar el mismo endpoint que funciona en generate.php
    $ch = curl_init('http://localhost:3000/api/generate.php');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'action' => 'send_to_radio',
        'filename' => $filename
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        logMessage("CURL Error: $error");
        return false;
    }
    
    if ($httpCode !== 200) {
        logMessage("HTTP Error: $httpCode - Response: $response");
        return false;
    }
    
    $result = json_decode($response, true);
    if ($result && $result['success']) {
        logMessage("Radio response: " . $result['message']);
        return true;
    } else {
        logMessage("Radio API Error: " . ($result['message'] ?? 'Unknown error'));
        return false;
    }
}

// Inicio del script
logMessage("=== Iniciando verificación de programaciones ===");

try {
    // Conectar a BD
    $db = new PDO("sqlite:$dbPath");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Obtener programaciones a ejecutar
    $ch = curl_init('http://localhost:3000/api/audio-scheduler.php');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['action' => 'check_execute']));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        throw new Exception("Error conectando con scheduler API: $error");
    }
    
    $result = json_decode($response, true);
    
    if ($result && $result['success'] && !empty($result['schedules'])) {
        logMessage("Encontradas " . count($result['schedules']) . " programaciones para ejecutar");
        
        foreach ($result['schedules'] as $schedule) {
            $title = $schedule['title'] ?? 'Sin título';
            $filename = $schedule['filename'] ?? '';
            
            if (empty($filename)) {
                logMessage("Saltando schedule sin filename: ID " . $schedule['id']);
                continue;
            }
            
            logMessage("Ejecutando: $title ($filename)");
            
            // Enviar a la radio
            $success = sendToRadio($filename);
            
            // Registrar ejecución
            $ch = curl_init('http://localhost:3000/api/audio-scheduler.php');
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
                'action' => 'log_execution',
                'schedule_id' => $schedule['id'],
                'status' => $success ? 'success' : 'failed',
                'message' => $success ? 'Enviado correctamente' : 'Error al enviar'
            ]));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            curl_exec($ch);
            curl_close($ch);
            
            if ($success) {
                logMessage("✅ Ejecutado exitosamente: $filename");
            } else {
                logMessage("❌ Error ejecutando: $filename");
            }
        }
    } else {
        logMessage("No hay programaciones para ejecutar en este momento");
    }
    
} catch (Exception $e) {
    logMessage("ERROR: " . $e->getMessage());
}

logMessage("=== Verificación completada ===\n");
