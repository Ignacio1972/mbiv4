<?php
// /var/www/tts-mall/api/services/tts-service-enhanced-clean.php
// VERSIÓN LIMPIA - Solo parámetros válidos para eleven_multilingual_v2

require_once dirname(__DIR__) . '/config.php';

function generateEnhancedTTS($text, $voice, $options = []) {
    logMessage("=== TTS-SERVICE-CLEAN: Iniciando generación");
    
    // Mapeo de voces
    $voiceMap = [
        'fernanda' => 'JM2A9JbRp8XUJ7bdCXJc',
        'cristian' => 'nNS8uylvF9GBWVSiIt5h',
        'valeria' => '22VndfJPBU7AZORAZZTT',
        // ... resto de voces
    ];
    
    $voiceId = $voiceMap[$voice] ?? $voice;
    $url = ELEVENLABS_BASE_URL . "/text-to-speech/$voiceId";
    
    // Voice settings con valores correctos y validación
    $voiceSettings = [
        'stability' => 0.75,
        'similarity_boost' => 0.85,
        'style' => 0.5,
        'use_speaker_boost' => true
    ];
    
    // Si vienen del frontend, mezclar y validar
    if (isset($options['voice_settings'])) {
        $vs = $options['voice_settings'];
        $voiceSettings['stability'] = max(0.0, min(1.0, floatval($vs['stability'] ?? 0.75)));
        $voiceSettings['similarity_boost'] = max(0.0, min(1.0, floatval($vs['similarity_boost'] ?? 0.85)));
        $voiceSettings['style'] = max(0.0, min(1.0, floatval($vs['style'] ?? 0.5)));
        $voiceSettings['use_speaker_boost'] = (bool)($vs['use_speaker_boost'] ?? true);
    }
    
    // Datos LIMPIOS - Solo lo necesario
    $data = [
        'text' => $text,
        'model_id' => 'eleven_multilingual_v2',
        'voice_settings' => $voiceSettings
    ];
    
    logMessage("Request LIMPIO: " . json_encode($data));
    
    // Hacer petición
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Accept: audio/mpeg',
            'Content-Type: application/json',
            'xi-api-key: ' . ELEVENLABS_API_KEY
        ],
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_TIMEOUT => 30
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        throw new Exception("Error API: HTTP $httpCode");
    }
    
    logMessage("Audio generado OK, tamaño: " . strlen($response) . " bytes");
    return $response;
}
?>