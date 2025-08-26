<?php
echo "=== TEST DE CONFIGURACIÓN API V2 ===\n\n";

// Verificar config.php
if (file_exists('config.php')) {
    require_once 'config.php';
    echo "✅ config.php encontrado\n";
    echo "📍 AZURACAST_BASE_URL: " . (defined('AZURACAST_BASE_URL') ? AZURACAST_BASE_URL : 'NO DEFINIDA') . "\n";
    echo "🔑 AZURACAST_API_KEY: " . (defined('AZURACAST_API_KEY') ? 'DEFINIDA (oculta)' : 'NO DEFINIDA') . "\n";
    echo "📂 UPLOAD_DIR: " . (defined('UPLOAD_DIR') ? UPLOAD_DIR : 'NO DEFINIDA') . "\n";
} else {
    echo "❌ config.php NO encontrado\n";
}

echo "\n📁 Directorio actual: " . __DIR__ . "\n";
echo "📁 Temp dir: " . (is_dir(__DIR__ . '/temp') && is_writable(__DIR__ . '/temp') ? '✅ Existe y escribible' : '❌ Problema') . "\n";
echo "📁 Logs dir: " . (is_dir(__DIR__ . '/logs') && is_writable(__DIR__ . '/logs') ? '✅ Existe y escribible' : '❌ Problema') . "\n";

// Verificar servicios
echo "\n=== SERVICIOS ===\n";
echo "📡 radio-service.php: " . (file_exists('services/radio-service.php') ? '✅ Existe' : '❌ No encontrado') . "\n";
echo "🎤 tts-service-enhanced.php: " . (file_exists('services/tts-service-enhanced.php') ? '✅ Existe' : '❌ No encontrado') . "\n";
?>
