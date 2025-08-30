<?php
// Test de upload usando endpoint /files con base64
// Como lo hace radio-service.php para archivos TTS

require_once 'api/config.php';

$testFile = '/var/www/mbi-v4/musica/To Rococo Rot - Portrait Song.mp3';
$targetFilename = 'test_base64_' . date('YmdHis') . '.mp3';
$targetPath = 'Grabaciones/' . $targetFilename;

echo "=== TEST UPLOAD CON BASE64 ===\n";
echo "Archivo origen: $testFile\n";
echo "Destino deseado: $targetPath\n\n";

// Leer archivo y convertir a base64
$fileContent = file_get_contents($testFile);
$base64Content = base64_encode($fileContent);

echo "Tamaño original: " . strlen($fileContent) . " bytes\n";
echo "Tamaño base64: " . strlen($base64Content) . " bytes\n\n";

// Preparar datos como lo hace radio-service.php
$data = [
    'path' => $targetPath,
    'file' => $base64Content
];

// Enviar a AzuraCast usando endpoint /files (NO /files/upload)
$url = AZURACAST_BASE_URL . '/api/station/' . AZURACAST_STATION_ID . '/files';

echo "Enviando a: $url\n";
echo "Método: JSON con base64\n\n";

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

echo "Respuesta HTTP: $httpCode\n";
echo "Respuesta: " . substr($response, 0, 200) . "\n\n";

if ($httpCode === 200) {
    echo "✅ Upload exitoso!\n";
    echo "Verificar en Docker:\n";
    echo "sudo docker exec azuracast ls -la /var/azuracast/stations/test/media/Grabaciones/ | grep $targetFilename\n";
} else {
    echo "❌ Error en upload\n";
}