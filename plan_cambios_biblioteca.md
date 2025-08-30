# Plan Detallado de Cambios - biblioteca.php

## PROBLEMA ACTUAL:
- Archivos externos van a `/media/` en lugar de `/media/Grabaciones/`
- Preview de archivos externos falla (validación rechaza nombres no-TTS)

## SOLUCIÓN:

### 1. CAMBIO EN uploadExternalFile() (líneas 484-515)

**ANTES:**
```php
// Línea 484
$url = AZURACAST_BASE_URL . '/api/station/' . AZURACAST_STATION_ID . '/files/upload';

// Líneas 486-499 - Multipart
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => [
        'file' => new CURLFile($uploadedFile['tmp_name'], $uploadedFile['type'], $safeFilename),
        'path' => $azuracastPath  // ← IGNORADO por /files/upload
    ],
    // ...resto
]);
```

**DESPUÉS:**
```php
// Línea 484
$url = AZURACAST_BASE_URL . '/api/station/' . AZURACAST_STATION_ID . '/files';

// Leer archivo y convertir a base64 (como radio-service.php)
$fileContent = file_get_contents($uploadedFile['tmp_name']);
$base64Content = base64_encode($fileContent);

// Líneas 486-499 - JSON con base64
$data = [
    'path' => $azuracastPath,  // ← RESPETADO por /files
    'file' => $base64Content
];

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'X-API-Key: ' . AZURACAST_API_KEY
    ],
    CURLOPT_POSTFIELDS => json_encode($data),
    // ...resto
]);
```

### 2. AGREGAR ASIGNACIÓN A PLAYLIST (después línea 515)

```php
// Obtener ID del archivo de la respuesta
$responseData = json_decode($response, true);
$fileId = $responseData['id'] ?? null;

if ($fileId) {
    // Asignar al playlist "grabaciones" (ID 3)
    assignToPlaylist($fileId);
} else {
    logMessage("Warning: No se obtuvo ID del archivo para asignar a playlist");
}
```

### 3. FUNCIÓN assignToPlaylist() (inline o importada)

```php
function assignToPlaylist($fileId) {
    $url = AZURACAST_BASE_URL . '/api/station/' . AZURACAST_STATION_ID . '/file/' . $fileId;
    
    $data = [
        'playlists' => [
            ['id' => PLAYLIST_ID_GRABACIONES]  // ID 3
        ]
    ];
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_CUSTOMREQUEST => 'PUT',
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'X-API-Key: ' . AZURACAST_API_KEY
        ],
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        logMessage("Archivo $fileId asignado al playlist grabaciones");
        return true;
    } else {
        logMessage("Error asignando $fileId a playlist: HTTP $httpCode");
        return false;
    }
}
```

### 4. CAMBIO EN VALIDACIÓN GET (línea 47)

**ANTES:**
```php
if (!preg_match('/^tts\d+(_[a-zA-Z0-9_\-ñÑáéíóúÁÉÍÓÚ]+)?\.mp3$/', $filename)) {
```

**DESPUÉS:**
```php
// Validar si es archivo TTS o externo
$isTTSFile = preg_match('/^tts\d+(_[a-zA-Z0-9_\-ñÑáéíóúÁÉÍÓÚ]+)?\.mp3$/', $filename);
$isExternalFile = preg_match('/^[a-zA-Z0-9._\-ñÑáéíóúÁÉÍÓÚ]+\.(mp3|wav|flac|aac|ogg|m4a|opus)$/i', $filename);

if (!$isTTSFile && !$isExternalFile) {
```

### 5. CAMBIO EN BÚSQUEDA DE ARCHIVO (línea 55)

**ANTES:**
```php
$dockerPath = '/var/azuracast/stations/test/media/Grabaciones/' . $filename;
```

**DESPUÉS:**
```php
// Buscar primero en Grabaciones (TTS y algunos externos)
$dockerPath = '/var/azuracast/stations/test/media/Grabaciones/' . $filename;

// Si no existe, buscar en raíz (archivos externos mal ubicados)
$checkCommand = sprintf(
    'sudo docker exec azuracast test -f %s && echo "EXISTS" || echo "NOT_FOUND" 2>&1',
    escapeshellarg($dockerPath)
);
$exists = trim(shell_exec($checkCommand));

if ($exists !== 'EXISTS') {
    // Buscar en raíz
    $dockerPath = '/var/azuracast/stations/test/media/' . $filename;
}
```

### 6. AJUSTE DE LÍMITE DE TAMAÑO (línea 447)

**ANTES:**
```php
$maxSize = 12 * 1024 * 1024; // 12MB
```

**DESPUÉS:**
```php
$maxSize = 8 * 1024 * 1024; // 8MB (debido a límites PHP con base64)
```

## VERIFICACIONES REQUERIDAS:

1. ✅ Archivos TTS siguen funcionando normalmente
2. ✅ Archivos externos van a `/media/Grabaciones/`
3. ✅ Archivos externos se asignan al playlist ID 3
4. ✅ Preview funciona para ambos tipos
5. ✅ Todas las validaciones mantienen seguridad
6. ✅ Metadata se guarda correctamente en BD

## ARCHIVOS DE PRUEBA:

Usar archivos de `/var/www/mbi-v4/musica/` para verificar funcionamiento completo.