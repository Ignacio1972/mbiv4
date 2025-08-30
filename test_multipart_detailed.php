<?php
// Test detallado multipart para verificar carpeta Grabaciones y playlist
require_once 'api/config.php';

echo "=== TEST DETALLADO MULTIPART: GRABACIONES + PLAYLIST ===\n\n";

$testFile = '/var/www/mbi-v4/musica/PreGoblin - Combustion.mp3';
$timestamp = date('YmdHis');

if (!file_exists($testFile)) {
    echo "❌ Archivo de prueba no encontrado: $testFile\n";
    exit(1);
}

echo "📁 Archivo de prueba: " . basename($testFile) . "\n";
echo "📏 Tamaño: " . number_format(filesize($testFile)) . " bytes\n\n";

// ===========================================
// TEST 1: Multipart SIN especificar path
// ===========================================
echo "🔬 TEST 1: Multipart SIN path (default)\n";
echo "=======================================\n";

$filename1 = "test_multipart_nopath_$timestamp.mp3";

$tempFile1 = '/tmp/' . $filename1;
copy($testFile, $tempFile1);

$url1 = AZURACAST_BASE_URL . '/api/station/' . AZURACAST_STATION_ID . '/files/upload';

$ch1 = curl_init();
curl_setopt_array($ch1, [
    CURLOPT_URL => $url1,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => [
        'file' => new CURLFile($tempFile1, 'audio/mpeg', $filename1)
    ],
    CURLOPT_HTTPHEADER => [
        'X-API-Key: ' . AZURACAST_API_KEY
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 60
]);

$response1 = curl_exec($ch1);
$httpCode1 = curl_getinfo($ch1, CURLINFO_HTTP_CODE);
curl_close($ch1);
unlink($tempFile1);

echo "HTTP Code: $httpCode1\n";
if ($httpCode1 === 200) {
    echo "✅ Upload exitoso\n";
    $responseData1 = json_decode($response1, true);
    $fileId1 = $responseData1['id'] ?? 'N/A';
    echo "File ID: $fileId1\n";
} else {
    echo "❌ Error: $httpCode1\n";
    echo "Response: " . substr($response1, 0, 200) . "\n";
}

// Buscar ubicación
$findCmd1 = "sudo docker exec azuracast find /var/azuracast/stations/test/media/ -name '$filename1' 2>/dev/null";
$location1 = trim(shell_exec($findCmd1));
echo "Ubicación: " . ($location1 ?: "❌ No encontrado") . "\n";
if ($location1) {
    echo "✅ En Grabaciones: " . (strpos($location1, '/Grabaciones/') !== false ? "SÍ" : "NO") . "\n";
}
echo "\n";

// ===========================================
// TEST 2: Multipart CON path="Grabaciones/"
// ===========================================
echo "🔬 TEST 2: Multipart CON path='Grabaciones/'\n";
echo "==========================================\n";

$filename2 = "test_multipart_grabaciones_$timestamp.mp3";

$tempFile2 = '/tmp/' . $filename2;
copy($testFile, $tempFile2);

$ch2 = curl_init();
curl_setopt_array($ch2, [
    CURLOPT_URL => $url1,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => [
        'path' => 'Grabaciones/',
        'file' => new CURLFile($tempFile2, 'audio/mpeg', $filename2)
    ],
    CURLOPT_HTTPHEADER => [
        'X-API-Key: ' . AZURACAST_API_KEY
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 60
]);

$response2 = curl_exec($ch2);
$httpCode2 = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
curl_close($ch2);
unlink($tempFile2);

echo "HTTP Code: $httpCode2\n";
if ($httpCode2 === 200) {
    echo "✅ Upload exitoso\n";
    $responseData2 = json_decode($response2, true);
    $fileId2 = $responseData2['id'] ?? 'N/A';
    echo "File ID: $fileId2\n";
} else {
    echo "❌ Error: $httpCode2\n";
    echo "Response: " . substr($response2, 0, 200) . "\n";
}

// Buscar ubicación
$findCmd2 = "sudo docker exec azuracast find /var/azuracast/stations/test/media/ -name '$filename2' 2>/dev/null";
$location2 = trim(shell_exec($findCmd2));
echo "Ubicación: " . ($location2 ?: "❌ No encontrado") . "\n";
if ($location2) {
    echo "✅ En Grabaciones: " . (strpos($location2, '/Grabaciones/') !== false ? "SÍ" : "NO") . "\n";
}
echo "\n";

// ===========================================
// TEST 3: Multipart CON path="Grabaciones/archivo.mp3"
// ===========================================
echo "🔬 TEST 3: Multipart CON path='Grabaciones/archivo.mp3'\n";
echo "===================================================\n";

$filename3 = "test_multipart_fullpath_$timestamp.mp3";
$targetPath3 = 'Grabaciones/' . $filename3;

$tempFile3 = '/tmp/' . $filename3;
copy($testFile, $tempFile3);

$ch3 = curl_init();
curl_setopt_array($ch3, [
    CURLOPT_URL => $url1,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => [
        'path' => $targetPath3,
        'file' => new CURLFile($tempFile3, 'audio/mpeg', $filename3)
    ],
    CURLOPT_HTTPHEADER => [
        'X-API-Key: ' . AZURACAST_API_KEY
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 60
]);

$response3 = curl_exec($ch3);
$httpCode3 = curl_getinfo($ch3, CURLINFO_HTTP_CODE);
curl_close($ch3);
unlink($tempFile3);

echo "HTTP Code: $httpCode3\n";
if ($httpCode3 === 200) {
    echo "✅ Upload exitoso\n";
    $responseData3 = json_decode($response3, true);
    $fileId3 = $responseData3['id'] ?? 'N/A';
    echo "File ID: $fileId3\n";
} else {
    echo "❌ Error: $httpCode3\n";
    echo "Response: " . substr($response3, 0, 200) . "\n";
}

// Buscar ubicación
$findCmd3 = "sudo docker exec azuracast find /var/azuracast/stations/test/media/ -name '$filename3' 2>/dev/null";
$location3 = trim(shell_exec($findCmd3));
echo "Ubicación: " . ($location3 ?: "❌ No encontrado") . "\n";
if ($location3) {
    echo "✅ En Grabaciones: " . (strpos($location3, '/Grabaciones/') !== false ? "SÍ" : "NO") . "\n";
}
echo "\n";

// ===========================================
// VERIFICAR PLAYLIST ASSIGNMENTS
// ===========================================
echo "🎵 VERIFICACIÓN DE PLAYLIST 'grabaciones'\n";
echo "=========================================\n";

$playlistUrl = AZURACAST_BASE_URL . '/api/station/' . AZURACAST_STATION_ID . '/playlist/' . PLAYLIST_ID_GRABACIONES . '/files';

$ch4 = curl_init();
curl_setopt_array($ch4, [
    CURLOPT_URL => $playlistUrl,
    CURLOPT_HTTPHEADER => [
        'X-API-Key: ' . AZURACAST_API_KEY
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30
]);

$playlistResponse = curl_exec($ch4);
$playlistHttpCode = curl_getinfo($ch4, CURLINFO_HTTP_CODE);
curl_close($ch4);

echo "Playlist HTTP Code: $playlistHttpCode\n";

if ($playlistHttpCode === 200) {
    $playlistData = json_decode($playlistResponse, true);
    $playlistFiles = $playlistData;
    
    echo "Total archivos en playlist: " . count($playlistFiles) . "\n\n";
    
    // Verificar si alguno de nuestros archivos está en el playlist
    $testFiles = [$filename1, $filename2, $filename3];
    foreach ($testFiles as $testFile) {
        $found = false;
        foreach ($playlistFiles as $file) {
            if (strpos($file['path'] ?? '', $testFile) !== false) {
                echo "✅ $testFile ENCONTRADO en playlist (ID: " . ($file['id'] ?? 'N/A') . ")\n";
                $found = true;
                break;
            }
        }
        if (!$found) {
            echo "❌ $testFile NO está en playlist\n";
        }
    }
} else {
    echo "❌ Error obteniendo playlist: $playlistHttpCode\n";
    echo "Response: " . substr($playlistResponse, 0, 200) . "\n";
}

echo "\n";

// ===========================================
// RESUMEN FINAL
// ===========================================
echo "📊 RESUMEN DE RESULTADOS\n";
echo "========================\n";

$tests = [
    ['name' => 'Sin path', 'file' => $filename1, 'location' => $location1, 'code' => $httpCode1],
    ['name' => 'Path carpeta', 'file' => $filename2, 'location' => $location2, 'code' => $httpCode2],
    ['name' => 'Path completo', 'file' => $filename3, 'location' => $location3, 'code' => $httpCode3]
];

foreach ($tests as $test) {
    echo "• {$test['name']}: ";
    echo "HTTP {$test['code']} | ";
    if ($test['location']) {
        $inGrabaciones = strpos($test['location'], '/Grabaciones/') !== false;
        echo ($inGrabaciones ? "✅ Grabaciones" : "❌ Raíz");
    } else {
        echo "❌ No encontrado";
    }
    echo "\n";
}

echo "\n=== TEST COMPLETADO ===\n";