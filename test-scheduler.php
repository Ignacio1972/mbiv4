<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Test del audio-scheduler
require_once __DIR__ . '/api/audio-scheduler.php';

// Simular una petición de creación
$testData = [
    'action' => 'create',
    'filename' => 'test.mp3',
    'title' => 'Test Schedule',
    'category' => 'ofertas',
    'schedule_type' => 'interval',
    'interval_hours' => 1,
    'interval_minutes' => 0,
    'start_date' => date('Y-m-d'),
    'is_active' => true
];

// Simular JSON input
$_SERVER['REQUEST_METHOD'] = 'POST';
$input = json_encode($testData);

echo "Test de audio-scheduler.php:\n";
echo "Input: " . $input . "\n\n";

// Intentar procesar
try {
    $result = createSchedule(json_decode($input, true));
    echo "Resultado: " . json_encode($result) . "\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
