<?php
// Test directo del sistema de voces
require_once __DIR__ . '/config.php';

echo "=== TEST DEL SISTEMA DE VOCES ===\n\n";

// Test 1: Verificar archivo de configuración
$voicesFile = __DIR__ . '/data/voices-config.json';
echo "1. Verificando archivo de voces:\n";
if (file_exists($voicesFile)) {
    echo "   ✅ Archivo existe: $voicesFile\n";
    $config = json_decode(file_get_contents($voicesFile), true);
    echo "   ✅ Voces cargadas: " . count($config['voices']) . "\n";
    foreach ($config['voices'] as $key => $voice) {
        echo "      - $key: {$voice['label']} (Active: " . ($voice['active'] ? 'YES' : 'NO') . ")\n";
    }
} else {
    echo "   ❌ Archivo NO existe\n";
}

// Test 2: Probar la función de TTS
echo "\n2. Probando función TTS:\n";
require_once __DIR__ . '/services/tts-service-enhanced.php';

try {
    $testVoice = 'juan_carlos';
    echo "   Testing voice mapping for: $testVoice\n";
    
    if (file_exists($voicesFile)) {
        $config = json_decode(file_get_contents($voicesFile), true);
        if (isset($config['voices'][$testVoice])) {
            $voiceId = $config['voices'][$testVoice]['id'];
            echo "   ✅ Voice mapped: $testVoice -> $voiceId\n";
        } else {
            echo "   ⚠️ Voice not found in config\n";
        }
    }
} catch (Exception $e) {
    echo "   ❌ Error: " . $e->getMessage() . "\n";
}

echo "\n=== TEST COMPLETADO ===\n";
?>
