# Message Configurator - Documentación Técnica Completa

## 📋 Índice
1. [Overview](#overview)
2. [Arquitectura del Módulo](#arquitectura-del-módulo)
3. [Flujo de Trabajo Completo](#flujo-de-trabajo-completo)
4. [Componentes Frontend](#componentes-frontend)
5. [Integración con ElevenLabs API](#integración-con-elevenlabs-api)
6. [Backend PHP Pipeline](#backend-php-pipeline)
7. [Voice Settings y Parámetros](#voice-settings-y-parámetros)
8. [Manejo de Estados](#manejo-de-estados)
9. [Optimizaciones y Cache](#optimizaciones-y-cache)
10. [Errores Comunes y Soluciones](#errores-comunes-y-soluciones)

## Overview

El módulo **Message Configurator** es el corazón del sistema TTS, donde los usuarios crean y configuran mensajes de voz. Es una interfaz visual que permite:
- Escribir o seleccionar plantillas de texto
- Elegir entre 30+ voces disponibles
- Ajustar parámetros de voz en tiempo real
- Generar audio con ElevenLabs API
- Previsualizar antes de enviar a radio

### Stack Técnico
- **Frontend**: Vanilla JS con ES6 modules
- **Backend**: PHP 7.4+ 
- **TTS Engine**: ElevenLabs API v1
- **Audio Format**: MP3 (128kbps)
- **Storage**: LocalStorage + FileSystem

## Arquitectura del Módulo

```
modules/message-configurator/
├── index.js                    # Clase principal del módulo
├── api-integration.js          # Comunicación con backend
├── state-manager.js            # Gestión de estado del mensaje
├── component-factory.js        # Fábrica de componentes UI
├── voice-presets.js           # Configuraciones de voces
├── handlers/
│   ├── ui-handler.js          # Manejo de interfaz
│   ├── audio-handler.js       # Control de audio
│   ├── template-handler.js    # Gestión de plantillas
│   └── profile-handler.js     # Perfiles de voz
├── components/
│   ├── simple-slider.js       # Slider personalizado
│   ├── voice-selector.js      # Selector de voces
│   └── save-message-modal.js  # Modal de guardado
└── styles/
    ├── configurator-layout.css # Estilos principales
    └── save-message-modal.css  # Estilos del modal
```

## Flujo de Trabajo Completo

### 1. Entrada de Texto

```javascript
// Usuario escribe en textarea
<textarea id="message-text" maxlength="5000">

// El texto se actualiza en state-manager.js
stateManager.updateMessage({
    text: userInput,
    timestamp: Date.now()
});
```

### 2. Selección de Voz

```javascript
// Voces disponibles (voice-presets.js)
const voices = {
    // Voces principales chilenas
    'cristian': { id: 'nNS8uylvF9GBWVSiIt5h', label: 'Cristian', gender: 'M' },
    'fernanda': { id: 'JM2A9JbRp8XUJ7bdCXJc', label: 'Fernanda', gender: 'F' },
    'rosa': { id: 'Yeu6FDmacNCxWs1YwWdK', label: 'Rosa', gender: 'F' },
    
    // 30+ voces más...
};
```

### 3. Configuración de Parámetros

```javascript
// Parámetros ajustables por el usuario
const voiceSettings = {
    style: 0.5,           // 0-1 (Neutral → Expresivo)
    stability: 0.75,      // 0-1 (Variable → Estable)
    similarity_boost: 0.8, // 0-1 (Bajo → Alto)
    use_speaker_boost: true // Mejora de calidad
};
```

### 4. Generación de Audio

```javascript
// Frontend: api-integration.js
async generateAudio(message) {
    const params = {
        text: message.text,
        voice: message.voice,
        voice_settings: message.settings
    };
    
    const response = await apiClient.post('/api/generate.php', {
        action: 'generate_audio',
        ...params
    });
    
    return {
        filename: response.filename,           // Para preview local
        azuracast_filename: response.azuracast_filename // Para radio
    };
}
```

## Componentes Frontend

### MessageConfiguratorModule (index.js)

```javascript
export default class MessageConfiguratorModule {
    constructor() {
        this.stateManager = new StateManager();
        this.apiIntegration = new APIIntegration();
        this.audioHandler = new AudioHandler();
        // ...
    }
    
    async load(container) {
        // 1. Cargar recursos (CSS, templates)
        await this.loadResources();
        
        // 2. Inicializar UI
        this.uiHandler = new UIHandler(container, handlers);
        
        // 3. Configurar componentes
        await this.initializeComponents();
        
        // 4. Cargar datos iniciales
        await this.loadInitialData();
    }
}
```

### StateManager (state-manager.js)

```javascript
class StateManager {
    constructor() {
        this.currentMessage = {
            id: null,
            text: '',
            voice: 'fernanda',
            settings: { /* defaults */ },
            audioFilename: null,
            azuracastFilename: null
        };
        this.history = [];
        this.hasUnsavedChanges = false;
    }
    
    updateMessage(updates) {
        // Mantener historial para undo
        this.history.push({...this.currentMessage});
        
        // Actualizar estado
        this.currentMessage = {
            ...this.currentMessage,
            ...updates,
            lastModified: Date.now()
        };
        
        this.hasUnsavedChanges = true;
    }
}
```

### APIIntegration (api-integration.js)

```javascript
class APIIntegration {
    prepareGenerationParams(message) {
        return {
            text: message.text,
            voice: message.voice,
            voice_settings: {
                // IMPORTANTE: Respetar valor 0
                style: message.settings.style !== undefined 
                    ? message.settings.style : 0.5,
                stability: message.settings.stability !== undefined 
                    ? message.settings.stability : 0.75,
                similarity_boost: message.settings.similarity_boost !== undefined 
                    ? message.settings.similarity_boost : 0.8,
                use_speaker_boost: message.settings.use_speaker_boost !== false
            }
        };
    }
}
```

## Integración con ElevenLabs API

### Endpoint Principal
```
https://api.elevenlabs.io/v1/text-to-speech/{voice_id}
```

### Autenticación
```php
// api/config.php
define('ELEVENLABS_API_KEY', 'sk_...');
define('ELEVENLABS_BASE_URL', 'https://api.elevenlabs.io/v1');
```

### Request Format
```json
{
    "text": "Texto a convertir",
    "model_id": "eleven_multilingual_v2",
    "voice_settings": {
        "stability": 0.75,
        "similarity_boost": 0.8,
        "style": 0.5,
        "use_speaker_boost": true
    }
}
```

### Llamada desde PHP (tts-service-enhanced.php)

```php
function generateEnhancedTTS($text, $voice, $options = []) {
    // 1. Mapear nombre de voz a ID
    $voiceMap = [
        'cristian' => 'nNS8uylvF9GBWVSiIt5h',
        'fernanda' => 'JM2A9JbRp8XUJ7bdCXJc',
        // ...
    ];
    
    $voiceId = $voiceMap[$voice] ?? $voice;
    
    // 2. Preparar request
    $url = ELEVENLABS_BASE_URL . "/text-to-speech/$voiceId";
    
    $data = [
        'text' => $text,
        'model_id' => 'eleven_multilingual_v2',
        'voice_settings' => $voiceSettings
    ];
    
    // 3. Hacer llamada CURL
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Accept: audio/mpeg',
            'Content-Type: application/json',
            'xi-api-key: ' . ELEVENLABS_API_KEY
        ],
        CURLOPT_POSTFIELDS => json_encode($data)
    ]);
    
    $audioData = curl_exec($ch);
    
    // 4. Retornar audio MP3
    return $audioData;
}
```

## Backend PHP Pipeline

### Flujo Completo (generate.php)

```php
// 1. Recibir request
$input = json_decode(file_get_contents('php://input'), true);

// 2. Generar audio con ElevenLabs
if ($input['action'] === 'generate_audio') {
    
    // Generar desde texto directo
    $result = AnnouncementGenerator::generateSimple(
        $input['text'],
        $input['voice'],
        ['voice_settings' => $input['voice_settings']]
    );
    
    // 3. Guardar archivo temporal para preview
    $filename = 'test_' . time() . '.mp3';
    $filepath = UPLOAD_DIR . $filename;
    file_put_contents($filepath, $result['audio']);
    
    // 4. Procesar audio (agregar silencios)
    $processedFile = addSilenceToAudio($filepath);
    
    // 5. Subir a AzuraCast
    $uploadResult = uploadFileToAzuraCast($processedFile, $filename);
    
    // 6. Asignar a playlist
    assignFileToPlaylist($uploadResult['id']);
    
    // 7. Retornar respuesta
    return [
        'success' => true,
        'filename' => $filename,              // Local
        'azuracast_filename' => $uploadResult['filename'] // Radio
    ];
}
```

### AnnouncementGenerator (announcement-generator.php)

```php
class AnnouncementGenerator {
    
    public static function generate($options) {
        // 1. Obtener texto (directo o template)
        $text = $options['text'] ?? 
                self::getTextFromTemplate($options);
        
        // 2. Optimizar voice settings según tipo
        $voiceSettings = self::optimizeVoiceSettings(
            $options['voice_settings'],
            $options['template']
        );
        
        // 3. Generar audio
        $audioData = generateEnhancedTTS(
            $text, 
            $options['voice'], 
            ['voice_settings' => $voiceSettings]
        );
        
        return [
            'audio' => $audioData,
            'processed_text' => $text,
            'settings_used' => $voiceSettings
        ];
    }
    
    private static function optimizeVoiceSettings($base, $template) {
        // Ajustar 'style' según tipo de mensaje
        if (strpos($template, 'celebracion') !== false) {
            $base['style'] = 0.8; // Muy expresivo
        } elseif (strpos($template, 'emergencia') !== false) {
            $base['style'] = 0.7; // Urgente
        } elseif (strpos($template, 'recordatorio') !== false) {
            $base['style'] = 0.2; // Formal
        }
        
        return $base;
    }
}
```

## Voice Settings y Parámetros

### Parámetros de ElevenLabs

| Parámetro | Rango | Default | Descripción |
|-----------|-------|---------|-------------|
| **style** | 0.0 - 1.0 | 0.5 | Estilo de habla (0=Neutral, 1=Expresivo) |
| **stability** | 0.0 - 1.0 | 0.75 | Consistencia de voz (0=Variable, 1=Estable) |
| **similarity_boost** | 0.0 - 1.0 | 0.8 | Claridad de voz (0=Baja, 1=Alta) |
| **use_speaker_boost** | boolean | true | Mejora de calidad de voz |

### Optimización por Tipo de Mensaje

```javascript
// Valores recomendados por categoría
const presets = {
    'ofertas': {
        style: 0.6,      // Energético
        stability: 0.7
    },
    'emergencias': {
        style: 0.7,      // Urgente
        stability: 0.9   // Muy estable
    },
    'informacion': {
        style: 0.3,      // Formal
        stability: 0.8
    },
    'celebraciones': {
        style: 0.8,      // Muy expresivo
        stability: 0.6   // Más natural
    }
};
```

### UI Components (Simple Slider)

```javascript
// components/simple-slider.js
class SimpleSlider {
    constructor(container, options) {
        this.min = options.min || 0;
        this.max = options.max || 100;
        this.value = options.value || 50;
        this.step = options.step || 1;
        
        // Convertir a rango 0-1 para API
        this.apiValue = this.value / 100;
    }
    
    getValue() {
        return this.apiValue; // 0-1 para ElevenLabs
    }
    
    setValue(apiValue) {
        this.value = apiValue * 100; // Mostrar como %
        this.updateUI();
    }
}
```

## Manejo de Estados

### Flujo de Estados del Mensaje

```
IDLE → EDITING → GENERATING → GENERATED → SAVED
  ↑                    ↓
  ←──── ERROR ←────────┘
```

### Persistencia Local

```javascript
// Guardar borrador automáticamente
const autosave = () => {
    if (stateManager.hasChanges()) {
        const draft = stateManager.getCurrentMessage();
        storageManager.save(`draft_${draft.id}`, draft);
    }
};

// Cada 30 segundos
setInterval(autosave, 30000);

// Al cambiar de módulo
eventBus.on('module:unloading', autosave);
```

### Sincronización con Backend

```javascript
// Guardar mensaje completo
async saveMessage(message) {
    // 1. Guardar localmente
    storageManager.save(`message_${message.id}`, message);
    
    // 2. Sincronizar con backend
    const response = await apiClient.post('/api/saved-messages.php', {
        action: 'save',
        data: message
    });
    
    // 3. Actualizar estado
    if (response.success) {
        message.syncedAt = Date.now();
        stateManager.markAsSaved();
    }
}
```

## Optimizaciones y Cache

### Cache de Templates

```javascript
class TemplateCache {
    constructor() {
        this.cache = new Map();
        this.ttl = 5 * 60 * 1000; // 5 minutos
    }
    
    async getTemplates() {
        const cached = this.cache.get('templates');
        
        if (cached && Date.now() - cached.timestamp < this.ttl) {
            return cached.data;
        }
        
        const fresh = await apiClient.getTemplates();
        this.cache.set('templates', {
            data: fresh,
            timestamp: Date.now()
        });
        
        return fresh;
    }
}
```

### Audio Preview Cache

```javascript
// Cache de últimos 5 audios generados
class AudioCache {
    constructor(maxSize = 5) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }
    
    add(key, audioUrl) {
        // LRU: eliminar más antiguo si excede tamaño
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            URL.revokeObjectURL(this.cache.get(firstKey));
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, audioUrl);
    }
    
    get(text, voice, settings) {
        const key = this.generateKey(text, voice, settings);
        return this.cache.get(key);
    }
    
    generateKey(text, voice, settings) {
        return `${voice}_${settings.style}_${text.substring(0, 50)}`;
    }
}
```

## Errores Comunes y Soluciones

### 1. Error 401: API Key Inválida

```php
// Verificar en config.php
define('ELEVENLABS_API_KEY', 'sk_...'); // Key correcta?

// Log para debug
logMessage("Using API key: " . substr(ELEVENLABS_API_KEY, 0, 10) . "...");
```

### 2. Error 422: Parámetros Inválidos

```javascript
// Validar antes de enviar
function validateVoiceSettings(settings) {
    const valid = {};
    
    // Asegurar rangos correctos
    valid.style = Math.max(0, Math.min(1, settings.style));
    valid.stability = Math.max(0, Math.min(1, settings.stability));
    valid.similarity_boost = Math.max(0, Math.min(1, settings.similarity_boost));
    valid.use_speaker_boost = Boolean(settings.use_speaker_boost);
    
    return valid;
}
```

### 3. Error 429: Rate Limit

```javascript
// Implementar retry con backoff
async function retryWithBackoff(fn, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (error.code === 429 && i < retries - 1) {
                const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
                await sleep(delay);
                continue;
            }
            throw error;
        }
    }
}
```

### 4. Texto Muy Largo

```javascript
// Validar longitud antes de enviar
const MAX_CHARS = 5000; // Límite de ElevenLabs

if (text.length > MAX_CHARS) {
    // Opción 1: Truncar
    text = text.substring(0, MAX_CHARS);
    
    // Opción 2: Dividir en chunks
    const chunks = splitTextIntoChunks(text, MAX_CHARS);
    const audioChunks = await Promise.all(
        chunks.map(chunk => generateAudio(chunk))
    );
    return concatenateAudio(audioChunks);
}
```

### 5. Pérdida de Configuración

```javascript
// Recuperar desde localStorage si se pierde
function recoverSettings() {
    const saved = localStorage.getItem('tts_mall_last_settings');
    if (saved) {
        return JSON.parse(saved);
    }
    
    // Defaults seguros
    return {
        voice: 'fernanda',
        style: 0.5,
        stability: 0.75,
        similarity_boost: 0.8,
        use_speaker_boost: true
    };
}
```

## Debugging y Logs

### Frontend Debugging

```javascript
// Habilitar logs detallados
window.DEBUG_TTS = true;

// En el código
if (window.DEBUG_TTS) {
    console.group('TTS Generation');
    console.log('Text:', text);
    console.log('Voice:', voice);
    console.log('Settings:', settings);
    console.time('API Call');
}

// Después de la respuesta
if (window.DEBUG_TTS) {
    console.timeEnd('API Call');
    console.log('Response:', response);
    console.groupEnd();
}
```

### Backend Logging

```php
// api/generate.php
function logMessage($message) {
    $timestamp = date('Y-m-d H:i:s');
    $logFile = __DIR__ . '/logs/tts-' . date('Y-m-d') . '.log';
    
    $logEntry = "[$timestamp] $message\n";
    
    // También log a error_log para desarrollo
    if (defined('DEBUG_MODE') && DEBUG_MODE) {
        error_log("[TTS] $message");
    }
    
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

// Uso
logMessage("Voice settings: " . json_encode($voiceSettings));
logMessage("ElevenLabs response: $httpCode");
```

## Performance Metrics

### Tiempos Típicos

| Operación | Tiempo Promedio | Máximo Aceptable |
|-----------|----------------|------------------|
| Generar audio (100 chars) | 1-2s | 5s |
| Generar audio (500 chars) | 3-5s | 10s |
| Subir a AzuraCast | 500ms | 2s |
| Preview local | 100ms | 500ms |

### Optimizaciones Implementadas

1. **Lazy Loading**: Componentes se cargan solo cuando se necesitan
2. **Debouncing**: Actualización de sliders con delay de 100ms
3. **Cache de Templates**: 5 minutos de TTL
4. **Audio Reuse**: No regenerar si no cambian parámetros
5. **Compression**: MP3 128kbps en lugar de 320kbps

## Extensibilidad

### Agregar Nueva Voz

```javascript
// 1. En voice-presets.js
export const voices = {
    // ...existing voices
    'nueva_voz': {
        id: 'voice_id_from_elevenlabs',
        label: 'Nueva Voz',
        gender: 'M/F',
        language: 'es-CL'
    }
};

// 2. En PHP voiceMap
$voiceMap = [
    // ...
    'nueva_voz' => 'voice_id_from_elevenlabs'
];
```

### Agregar Nuevo Parámetro

```javascript
// 1. Frontend: Agregar al schema
const voiceSettings = {
    // ...existing
    new_parameter: 0.5  // Nuevo
};

// 2. Backend: Procesar en PHP
$voiceSettings['new_parameter'] = 
    $input['voice_settings']['new_parameter'] ?? 0.5;

// 3. UI: Agregar control
<SimpleSlider
    id="new-parameter"
    label="Nuevo Parámetro"
    min={0}
    max={100}
    value={50}
    onChange={updateNewParameter}
/>
```

### Integrar Otro TTS Provider

```php
// Crear nuevo service
class GoogleTTSService implements TTSInterface {
    public function generate($text, $voice, $options) {
        // Implementación Google TTS
    }
}

// En generate.php
$provider = $input['provider'] ?? 'elevenlabs';

switch($provider) {
    case 'google':
        $tts = new GoogleTTSService();
        break;
    default:
        $tts = new ElevenLabsService();
}

$audio = $tts->generate($text, $voice, $options);
```

## Seguridad

### Validaciones Importantes

```php
// 1. Sanitizar texto
$text = strip_tags($input['text']);
$text = htmlspecialchars($text, ENT_QUOTES, 'UTF-8');

// 2. Validar longitud
if (strlen($text) > 5000) {
    throw new Exception('Texto demasiado largo');
}

// 3. Rate limiting
$ip = $_SERVER['REMOTE_ADDR'];
$requests = checkRateLimit($ip);
if ($requests > 10) {
    throw new Exception('Demasiadas solicitudes');
}

// 4. Validar voz existe
if (!isset($voiceMap[$voice])) {
    throw new Exception('Voz inválida');
}
```

## Testing

### Test Cases Críticos

```javascript
// 1. Test generación básica
describe('Audio Generation', () => {
    it('should generate audio with default settings', async () => {
        const result = await generateAudio({
            text: 'Prueba',
            voice: 'fernanda'
        });
        
        expect(result.filename).toBeDefined();
        expect(result.azuracast_filename).toBeDefined();
    });
    
    // 2. Test parámetros extremos
    it('should handle extreme style values', async () => {
        const result = await generateAudio({
            text: 'Test',
            voice: 'cristian',
            settings: { style: 0 } // Mínimo
        });
        
        expect(result.success).toBe(true);
    });
    
    // 3. Test error handling
    it('should handle API errors gracefully', async () => {
        // Mock API failure
        apiClient.post = jest.fn().mockRejectedValue(
            new Error('API Error')
        );
        
        const result = await generateAudio({text: 'Test'});
        expect(result.error).toBeDefined();
    });
});
```

## Recursos y Referencias

### Documentación ElevenLabs
- [API Reference](https://docs.elevenlabs.io/api-reference/text-to-speech)
- [Voice Settings Guide](https://docs.elevenlabs.io/voice-settings)
- [Rate Limits](https://docs.elevenlabs.io/rate-limiting)

### Herramientas Útiles
- [Postman Collection](./postman/elevenlabs-api.json)
- [Voice ID Mapper](./tools/voice-mapper.js)
- [Audio Analyzer](./tools/audio-quality-check.js)

### Límites del Sistema
- **Caracteres por request**: 5,000
- **Requests por minuto**: 20 (plan actual)
- **Caracteres mensuales**: 100,000
- **Voces simultáneas**: 1
- **Tamaño máximo audio**: 10MB

---

*Última actualización: Noviembre 2024*  
*Versión del módulo: 2.0.0*