# 📋 Documentación Técnica - Sistema de Upload de Archivos Externos

## Para: Desarrollador Avanzado
## Proyecto: MBI-v4 - Sistema de Radio Automatizada

---

## 🎯 **CONTEXTO GENERAL**

El sistema MBI-v4 permite subir archivos de audio externos (MP3, WAV, FLAC, etc.) que los usuarios pueden programar para reproducción automática en la radio del mall. Este documento detalla la implementación actual y las mejoras potenciales basadas en la documentación oficial de AzuraCast.

---

## 🏗️ **ARQUITECTURA ACTUAL DE UPLOAD**

### **Flujo de Datos:**
```
Usuario (Frontend) → Campaign Library → biblioteca.php → AzuraCast API → Docker Container → BD
```

### **Archivos Críticos:**

#### **1. Frontend: `/modules/campaign-library/index.js`**
```javascript
// Función: uploadAudioFile() - Línea ~950
// Responsabilidad: Envío multipart desde navegador
const formData = new FormData();
formData.append('action', 'upload_external');
formData.append('audio', file);

const response = await apiClient.post('/biblioteca.php', formData);
```
**🚨 CRÍTICO**: No modificar la interfaz de usuario. Mantiene compatibilidad con usuarios.

#### **2. Backend: `/api/biblioteca.php`**
```php
// Función: uploadExternalFile() - Líneas 478-600
// Responsabilidad: Procesamiento y upload a AzuraCast

// IMPLEMENTACIÓN ACTUAL (Base64):
$fileContent = file_get_contents($uploadedFile['tmp_name']);
$base64Content = base64_encode($fileContent);
$url = '/api/station/1/files';  // SIN /upload
$data = ['path' => 'Grabaciones/file.mp3', 'file' => $base64Content];
```

#### **3. Configuración: `/api/config.php`**
```php
define('AZURACAST_BASE_URL', 'http://51.222.25.222');
define('AZURACAST_API_KEY', 'c3802cba5b5e61e8:fed31be9adb82ca57f1cf482d170851f');
define('AZURACAST_STATION_ID', 1);
define('PLAYLIST_ID_GRABACIONES', 3);
```

---

## ⚠️ **PUNTOS CRÍTICOS - NO ROMPER**

### **1. Base de Datos Unificada**
```sql
-- BD Principal: /calendario/api/db/calendar.db
-- Tabla: audio_metadata
-- CRÍTICO: Todos los módulos dependen de esta BD
INSERT INTO audio_metadata (filename, display_name, category, is_saved, ...)
```

### **2. Sistema de Playlists**
```php
// Función: assignToPlaylist() - CRÍTICO para reproducción
// DEBE ejecutarse después de upload exitoso
PUT /api/station/1/file/{fileId}
Body: {"playlists": [{"id": 3}]}  // ID 3 = "grabaciones"
```

### **3. Compatibilidad con Archivos TTS**
```php
// Archivos TTS usan MISMO flujo pero radio-service.php
// NO modificar generate.php ni radio-service.php
// Mantener validación dual: TTS + externos
```

### **4. Preview desde Calendar**
```php
// GET /biblioteca.php?filename=archivo.mp3
// DEBE buscar en:
// 1. /var/azuracast/stations/test/media/Grabaciones/ (nuevos)
// 2. /var/azuracast/stations/test/media/ (legacy)
```

---

## 📊 **ANÁLISIS: IMPLEMENTACIÓN ACTUAL vs DOCUMENTACIÓN**

### **Implementación Actual (FUNCIONAL):**
```php
// Endpoint: /api/station/1/files (SIN /upload)
// Método: JSON + Base64
// Ventaja: FUNCIONA y va a carpeta correcta
// Desventaja: Base64 aumenta tamaño ~33%
```

### **Documentación Oficial AzuraCast:**
```bash
# Endpoint: /api/station/1/files/upload (CON /upload)
# Método: multipart/form-data
curl -X POST 'http://azuracast/api/station/1/files/upload' \
  --header 'X-API-Key: api_key' \
  --form 'path="Grabaciones/song.mp3"' \
  --form 'file=@"/path/to/file.mp3"'
```

### **Discrepancia Crítica:**
- **Actual**: Endpoint `/files` con base64 → ✅ Va a Grabaciones
- **Documentado**: Endpoint `/files/upload` con multipart → ❓ Ubicación desconocida

---

## 🧪 **PLAN DE TESTING REQUERIDO**

### **Test 1: Verificar Endpoint Documentado**
```bash
# Probar endpoint oficial con multipart
curl -X POST 'http://51.222.25.222/api/station/1/files/upload' \
  --header 'X-API-Key: c3802cba5b5e61e8:fed31be9adb82ca57f1cf482d170851f' \
  --form 'path="Grabaciones/test_multipart.mp3"' \
  --form 'file=@"/var/www/mbi-v4/musica/test.mp3"'

# Verificar ubicación final:
sudo docker exec azuracast find /var/azuracast/stations/test/media/ -name "test_multipart.mp3"
```

### **Test 2: Comparar Rendimiento**
```bash
# Medir tiempo y recursos:
# 1. Método actual (base64)
# 2. Método documentado (multipart)
# 3. Tamaño de payload
# 4. Uso de memoria PHP
```

### **Test 3: Verificar Asignación a Playlist**
```bash
# Confirmar que método documentado también requiere asignación manual:
curl -X GET 'http://51.222.25.222/api/station/1/playlist/3/files' \
  --header 'X-API-Key: api_key'
```

### **Test 4: Límites y Validaciones**
```bash
# Probar archivos de diferentes tamaños:
# - 5MB, 15MB, 25MB, 30MB
# - Diferentes formatos: MP3, WAV, FLAC
# - Verificar timeouts y límites
```

---

## 💾 **IMPLEMENTACIÓN RECOMENDADA (SI TESTS PASAN)**

### **Opción 1: Reemplazar Completamente**
```php
// En uploadExternalFile() - biblioteca.php
function uploadExternalFile() {
    // Mantener validaciones existentes
    
    // CAMBIAR de base64 a multipart directo
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => AZURACAST_BASE_URL . '/api/station/' . AZURACAST_STATION_ID . '/files/upload',
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => [
            'path' => 'Grabaciones/' . $safeFilename,
            'file' => new CURLFile($uploadedFile['tmp_name'], $uploadedFile['type'], $safeFilename)
        ],
        CURLOPT_HTTPHEADER => ['X-API-Key: ' . AZURACAST_API_KEY],
        // ... resto config
    ]);
    
    // MANTENER asignación a playlist
    if ($response_success && $fileId) {
        assignToPlaylist($fileId);
    }
}
```

### **Opción 2: Implementación Híbrida**
```php
// Intentar método documentado, fallback a actual
function uploadWithFallback($file) {
    try {
        return uploadMultipart($file);  // Nuevo método
    } catch (Exception $e) {
        logMessage("Fallback to base64: " . $e->getMessage());
        return uploadBase64($file);     // Método actual
    }
}
```

---

## 🔒 **VALIDACIONES OBLIGATORIAS**

### **Pre-Deploy Checklist:**
- [ ] ✅ Archivos van a `/media/Grabaciones/`
- [ ] ✅ Se asignan al playlist ID 3
- [ ] ✅ Aparecen en Campaign Library
- [ ] ✅ Preview funciona desde Calendar
- [ ] ✅ Modal de programación se abre
- [ ] ✅ Archivos TTS siguen funcionando
- [ ] ✅ Base de datos se actualiza correctamente
- [ ] ✅ Logs no muestran errores

### **Tests de Regresión:**
```bash
# 1. Upload archivo TTS (no tocar)
curl -X POST /api/generate.php -d '{"text":"test","action":"generate"}'

# 2. Upload archivo externo (nuevo método)
curl -X POST /api/biblioteca.php (con nuevo método)

# 3. Preview ambos tipos
curl /api/biblioteca.php?filename=tts123.mp3
curl /api/biblioteca.php?filename=external.mp3

# 4. Programación en calendar
# (Verificar manualmente en UI)
```

---

## 📈 **MÉTRICAS DE ÉXITO**

### **Performance:**
- Reducción de payload: ~25-33% (sin base64)
- Reducción de memoria PHP: ~33%
- Tiempo de upload: Mejorar 10-20%

### **Funcionalidad:**
- Upload exitoso: 100%
- Asignación playlist: 100%
- Preview funcional: 100%
- Compatibilidad TTS: 100%

---

## ⚡ **ROLLBACK PLAN**

### **Si algo falla:**
```bash
# 1. Restaurar backup
cp api/biblioteca.php.backup-YYYYMMDD_HHMMSS api/biblioteca.php

# 2. Verificar funcionamiento
php -l api/biblioteca.php
curl -X POST /api/biblioteca.php (test básico)

# 3. Commit rollback
git checkout HEAD~1 -- api/biblioteca.php
git commit -m "rollback: revert upload method change"
```

---

## 📞 **CONTACTO PARA DUDAS**

- **Sistema actual**: Desarrollado e implementado exitosamente
- **Tests documentación**: Responsabilidad del nuevo desarrollador
- **Cambios**: Solo después de tests exitosos
- **Rollback**: Plan documentado arriba

---

*Documento generado para MBI-v4 Radio Automatizada*  
*Fecha: 30 de Agosto, 2025*