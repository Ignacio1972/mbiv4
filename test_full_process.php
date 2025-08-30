<?php
// Test completo replicando exactamente el proceso de radio-service.php
// PASO 1: Upload con carpeta en path
// PASO 2: Asignación a playlist

require_once 'api/config.php';

echo "=== TEST PROCESO COMPLETO (como radio-service.php) ===\n\n";

// Archivo de prueba
$testFile = '/var/www/mbi-v4/musica/Martin Roth - Just Sine Waves.mp3';
$targetFilename = 'test_full_' . date('YmdHis') . '.mp3';
$targetPath = 'Grabaciones/' . $targetFilename;  // Carpeta incluida en path

echo "📁 Archivo origen: " . basename($testFile) . "\n";
echo "📍 Destino: $targetPath\n";
echo "🎵 Playlist destino: ID " . PLAYLIST_ID_GRABACIONES . " (grabaciones)\n\n";

// ===========================================
// PASO 1: Upload con carpeta (como línea 16 de radio-service.php)
// ===========================================
echo "PASO 1: Upload del archivo con carpeta en path...\n";

$fileContent = file_get_contents($testFile);
$base64Content = base64_encode($fileContent);

// Datos exactamente como radio-service.php líneas 22-25
$data = [
    'path' => $targetPath,     // Carpeta incluida aquí
    'file' => $base64Content
];

// Endpoint como radio-service.php línea 11
$url = AZURACAST_BASE_URL . '/api/station/' . AZURACAST_STATION_ID . '/files';

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'X-API-Key: ' . AZURACAST_API_KEY
    ],
    CURLOPT_POSTFIELDS => json_encode($data),
    CURLOPT_TIMEOUT => 60
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    echo "❌ Error en upload: HTTP $httpCode\n";
    echo "Respuesta: $response\n";
    exit(1);
}

$responseData = json_decode($response, true);
$fileId = $responseData['id'] ?? null;

echo "✅ Upload exitoso!\n";
echo "   - ID del archivo: $fileId\n";
echo "   - Ubicación: /media/Grabaciones/$targetFilename\n\n";

// ===========================================
// PASO 2: Asignación a playlist (como assignFileToPlaylist líneas 65-89)
// ===========================================
if (!$fileId) {
    echo "❌ No se obtuvo ID del archivo\n";
    exit(1);
}

echo "PASO 2: Asignando archivo al playlist...\n";

// Endpoint como radio-service.php línea 66
$url = AZURACAST_BASE_URL . '/api/station/' . AZURACAST_STATION_ID . '/file/' . $fileId;

// Datos como radio-service.php líneas 68-72
$data = [
    'playlists' => [
        ['id' => PLAYLIST_ID_GRABACIONES]  // ID 3 desde config.php
    ]
];

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'PUT',  // PUT request
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'X-API-Key: ' . AZURACAST_API_KEY
    ],
    CURLOPT_POSTFIELDS => json_encode($data),
    CURLOPT_TIMEOUT => 30
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    echo "✅ Archivo asignado al playlist exitosamente!\n\n";
} else {
    echo "❌ Error asignando a playlist: HTTP $httpCode\n";
    echo "Respuesta: " . substr($response, 0, 200) . "\n\n";
}

// ===========================================
// VERIFICACIÓN
// ===========================================
echo "=== VERIFICACIÓN ===\n";
echo "Para verificar el resultado:\n";
echo "1. Carpeta: sudo docker exec azuracast ls -la /var/azuracast/stations/test/media/Grabaciones/ | grep $targetFilename\n";
echo "2. Playlist: curl -X GET -H 'X-API-Key: " . AZURACAST_API_KEY . "' http://51.222.25.222/api/station/1/playlist/3/files\n\n";

echo "✨ Proceso completo terminado\n";