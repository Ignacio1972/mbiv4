<?php
// Test simple del scheduler
date_default_timezone_set('America/Santiago');

$dbPath = __DIR__ . '/db/calendar.db';

echo "Testing scheduler...\n";
echo "DB Path: $dbPath\n";
echo "DB Exists: " . (file_exists($dbPath) ? "YES" : "NO") . "\n";

try {
    $db = new PDO("sqlite:$dbPath");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "DB Connection: OK\n";
    
    $stmt = $db->query("SELECT COUNT(*) FROM audio_schedule");
    $count = $stmt->fetchColumn();
    echo "Total schedules: $count\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}