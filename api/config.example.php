<?php
// Configuración Text-to-Speech Radio - VERSIÓN SIMPLIFICADA
// Solo upload a carpeta "Grabaciones" y asignación a playlist

// ElevenLabs API
define('ELEVENLABS_API_KEY', 'sk_f5d2f711a5cb2c117a2c6e2a00ab50bf34dbaec234bc61b2');
define('ELEVENLABS_BASE_URL', 'https://api.elevenlabs.io/v1');

// AzuraCast API
define('AZURACAST_BASE_URL', 'http://51.222.25.222');
define('AZURACAST_API_KEY', 'c3802cba5b5e61e8:fed31be9adb82ca57f1cf482d170851f');
define('AZURACAST_STATION_ID', 1);

// Playlist "grabaciones"
define('PLAYLIST_ID_GRABACIONES', 3);

// Directorio temporal para archivos
define('UPLOAD_DIR', __DIR__ . '/temp/');
define('MAX_FILE_AGE', 3600); // 1 hora

// Crear directorio si no existe
if (!file_exists(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0755, true);
}

// Función de limpieza de archivos antiguos
function cleanOldFiles() {
    $files = glob(UPLOAD_DIR . '*.mp3');
    $now = time();
    foreach ($files as $file) {
        if (is_file($file) && ($now - filemtime($file) >= MAX_FILE_AGE)) {
            unlink($file);
        }
    }
}

// Ejecutar limpieza
cleanOldFiles();
?>