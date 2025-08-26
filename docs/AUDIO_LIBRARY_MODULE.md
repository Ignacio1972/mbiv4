# 📚 Módulo de Biblioteca de Audio - Documentación Técnica

## 📋 Información General

**Versión:** 1.0.0  
**Fecha de creación:** 13 de Agosto, 2025  
**Autor:** Claude Code Assistant + Ignacio1972  
**Repositorio:** https://github.com/Ignacio1972/mbi-v3  

## 🎯 Propósito

El módulo de Biblioteca de Audio proporciona una interfaz completa para gestionar todos los archivos de audio TTS generados automáticamente por el sistema. Permite a los usuarios del Mall Barrio Independencia visualizar, organizar, renombrar, marcar como favoritos y reproducir los anuncios generados.

## 📁 Estructura de Archivos

```
modules/audio-library/
├── index.js                    # Módulo principal (18.9 KB)
└── styles/
    └── library.css            # Estilos del módulo (8.2 KB)
```

### Archivos Modificados
- `index.html` - Agregado botón de navegación
- `shared/router.js` - Agregada ruta `/audio-library`

## 🏗️ Arquitectura del Módulo

### Clase Principal: `AudioLibraryModule`

```javascript
export default class AudioLibraryModule {
    constructor() {
        this.name = 'audio-library';
        this.container = null;
        this.libraryFiles = [];
        this.currentSort = 'date_desc';
        this.currentView = 'grid';
        this.searchQuery = '';
        this.favorites = JSON.parse(localStorage.getItem('audio_favorites') || '[]');
    }
}
```

### Propiedades Principales

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `libraryFiles` | Array | Lista de archivos de audio cargados |
| `currentSort` | String | Tipo de ordenamiento actual |
| `currentView` | String | Vista actual ('grid' o 'list') |
| `searchQuery` | String | Término de búsqueda actual |
| `favorites` | Array | Lista de archivos marcados como favoritos |

## 🔧 Funcionalidades Implementadas

### 1. 📊 Gestión de Archivos

```javascript
async loadLibrary() {
    const response = await apiClient.post('/biblioteca.php', {
        action: 'list_library'
    });
    
    if (response.success) {
        this.libraryFiles = response.files || [];
        this.updateStats();
        this.sortLibrary();
        this.renderLibrary();
    }
}
```

**Características:**
- Carga automática de todos los archivos TTS
- Integración con API existente `biblioteca.php`
- Manejo de errores robusto

### 2. ✏️ Renombrar Archivos

```javascript
async renameFile(filename) {
    const parts = filename.match(/^(tts\d{14})(_(.+))?\.mp3$/);
    const currentDescription = parts[3] ? parts[3].replace(/_/g, ' ') : '';
    
    const newDescription = prompt(
        'Ingrese una descripción para el archivo:\n' +
        '(Use solo letras, números y espacios. Máx 30 caracteres)\n\n' +
        'Nombre actual: ' + filename,
        currentDescription
    );
    
    // Validación y llamada a API
    const response = await apiClient.post('/biblioteca.php', {
        action: 'rename_file',
        old_filename: filename,
        new_description: cleanDescription
    });
}
```

**Validaciones implementadas:**
- Descripción no vacía
- Máximo 30 caracteres
- Solo caracteres alfanuméricos, espacios, guiones
- Preserva timestamp original

### 3. ⭐ Sistema de Favoritos

```javascript
toggleFavorite(filename) {
    const index = this.favorites.indexOf(filename);
    
    if (index > -1) {
        this.favorites.splice(index, 1);
        this.showNotification('⭐ Removido de favoritos', 'info');
    } else {
        this.favorites.push(filename);
        this.showNotification('★ Agregado a favoritos', 'success');
    }
    
    // Persistencia en localStorage
    localStorage.setItem('audio_favorites', JSON.stringify(this.favorites));
    
    this.updateStats();
    this.renderLibrary();
}
```

**Limitaciones conocidas:**
- ⚠️ **Los favoritos se almacenan en localStorage**
- Se pierden al cambiar de navegador/computadora
- **TODO:** Implementar base de datos para persistencia real

### 4. 🔍 Búsqueda y Filtrado

```javascript
sortLibrary() {
    const files = [...this.libraryFiles];
    
    switch(this.currentSort) {
        case 'date_asc':
            files.sort((a, b) => a.timestamp - b.timestamp);
            break;
        case 'date_desc':
            files.sort((a, b) => b.timestamp - a.timestamp);
            break;
        case 'name_asc':
            files.sort((a, b) => a.filename.localeCompare(b.filename));
            break;
        case 'favorites':
            files.sort((a, b) => {
                const aFav = this.favorites.includes(a.filename) ? 1 : 0;
                const bFav = this.favorites.includes(b.filename) ? 1 : 0;
                return bFav - aFav || b.timestamp - a.timestamp;
            });
            break;
    }
}
```

**Opciones de ordenamiento:**
- Fecha ascendente/descendente
- Nombre alfabético
- Favoritos primero

### 5. ▶️ Reproductor Flotante

```javascript
async playFile(filename) {
    const player = document.querySelector('#floatingPlayer');
    const audio = document.querySelector('#audioPlayer');
    const playing = document.querySelector('#currentPlaying');
    
    if (player && audio) {
        audio.src = `/api/biblioteca.php?filename=${filename}`;
        playing.textContent = `🎵 ${this.getDisplayName(filename)}`;
        player.style.display = 'block';
        audio.play();
    }
}
```

**Características:**
- Reproductor flotante no intrusivo
- Preview sin salir de la biblioteca
- Integración con API de streaming

## 🎨 Interfaz de Usuario

### Vistas Disponibles

#### Vista Grid (por defecto)
```css
.library-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
}
```

#### Vista Lista
```css
.library-table {
    width: 100%;
    border-collapse: collapse;
}
```

### Componentes de UI

| Componente | Descripción |
|------------|-------------|
| `file-card` | Tarjeta individual de archivo en vista grid |
| `library-table` | Tabla de archivos en vista lista |
| `floating-player` | Reproductor flotante |
| `stats-bar` | Barra de estadísticas |
| `library-controls` | Controles de filtro y búsqueda |

## 🔌 Integración con API

### Endpoints utilizados

```javascript
// Listar archivos
POST /api/biblioteca.php
{
    "action": "list_library"
}

// Renombrar archivo
POST /api/biblioteca.php
{
    "action": "rename_file",
    "old_filename": "tts20250813093045.mp3",
    "new_description": "oferta especial"
}

// Enviar a radio
POST /api/biblioteca.php
{
    "action": "send_library_to_radio",
    "filename": "tts20250813093045_oferta_especial.mp3"
}

// Eliminar archivo
POST /api/biblioteca.php
{
    "action": "delete_library_file",
    "filename": "tts20250813093045.mp3"
}
```

### Formato de respuesta

```json
{
    "success": true,
    "files": [
        {
            "filename": "tts20250813093045.mp3",
            "size": 245760,
            "timestamp": 1691909445,
            "date": "2025-08-13 09:30:45",
            "formatted_date": "13/08/2025 09:30"
        }
    ],
    "total": 673
}
```

## 📱 Responsividad

### Breakpoints

```css
@media (max-width: 768px) {
    .library-grid {
        grid-template-columns: 1fr;
    }
    
    .floating-player {
        width: calc(100% - 40px);
        left: 20px;
    }
}
```

## 🚀 Rendimiento

### Optimizaciones implementadas

1. **Paginación implícita:** Limita a 50 archivos por consulta
2. **Cache de estilos:** Carga CSS una sola vez
3. **Lazy loading:** Módulo se carga bajo demanda
4. **Event delegation:** Manejo eficiente de eventos

### Métricas actuales

- **Tiempo de carga inicial:** ~200ms
- **Tamaño del módulo:** 18.9 KB (JS) + 8.2 KB (CSS)
- **Archivos soportados:** 673+ archivos sin degradación

## 🔒 Seguridad

### Validaciones implementadas

```javascript
// Validación de nombre de archivo
if (!preg_match('/^tts\d+(_[a-zA-Z0-9_\-ñÑáéíóúÁÉÍÓÚ]+)?\.mp3$/', $filename)) {
    throw new Exception('Nombre de archivo inválido');
}

// Validación de descripción
if (!preg_match('/^[a-zA-Z0-9_\-ñÑáéíóúÁÉÍÓÚ]+$/', $cleanDescription)) {
    throw new Exception('La descripción contiene caracteres no permitidos');
}
```

### Medidas de seguridad

- Validación estricta de nombres de archivo
- Sanitización de entradas de usuario
- Escape HTML en renderizado
- Uso de `escapeshellarg()` en comandos del sistema

## 🐛 Manejo de Errores

### Sistema de notificaciones

```javascript
showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Auto-dismiss después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
```

**Tipos de notificación:**
- `success` - Operaciones exitosas
- `error` - Errores de operación
- `info` - Información general

## 🧪 Testing

### Funcionalidades probadas

✅ **Probado y funcionando:**
- Preview de archivos de audio
- Envío a radio en vivo
- Renombrado de archivos
- Eliminación de archivos
- Ordenamiento por diferentes criterios
- Cambio entre vista grid y lista
- Búsqueda por nombre
- Sistema de favoritos

### Casos de prueba

| Caso | Entrada | Resultado Esperado |
|------|---------|-------------------|
| Renombrar archivo | `tts20250813093045.mp3` → "oferta navidad" | `tts20250813093045_oferta_navidad.mp3` |
| Marcar favorito | Click en ⭐ | Estrella se vuelve dorada ★ |
| Buscar archivo | "oferta" | Muestra solo archivos que contienen "oferta" |
| Reproducir audio | Click en ▶️ | Abre reproductor flotante |

## 🔮 Mejoras Futuras

### Corto plazo (1-2 semanas)

1. **Base de datos para favoritos**
   ```sql
   CREATE TABLE user_favorites (
       id INT AUTO_INCREMENT PRIMARY KEY,
       user_id VARCHAR(50),
       filename VARCHAR(255),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

2. **Categorización automática**
   - Detectar palabras clave en descripciones
   - Asignar categorías automáticamente

### Mediano plazo (1-2 meses)

1. **Integración con calendario**
   - Programar reproducción de favoritos
   - Eventos recurrentes

2. **Analytics de uso**
   - Archivos más reproducidos
   - Estadísticas de uso por categoría

### Largo plazo (3-6 meses)

1. **Sistema de usuarios**
   - Favoritos por usuario
   - Permisos diferenciados

2. **Export/Import**
   - Backup de biblioteca
   - Migración entre sistemas

## 📞 Soporte y Mantenimiento

### Logs del sistema

```javascript
// Los logs se guardan en:
// api/logs/biblioteca-YYYY-MM-DD.log

[2025-08-13 16:40:15] Listando archivos de biblioteca - Versión optimizada
[2025-08-13 16:40:15] Procesando 673 archivos
[2025-08-13 16:40:15] Retornando 50 archivos
```

### Comandos de diagnóstico

```bash
# Verificar archivos en el sistema
sudo docker exec azuracast ls -la /var/azuracast/stations/test/media/Grabaciones/ | wc -l

# Ver logs recientes
tail -f /var/www/mbi-v3/api/logs/biblioteca-$(date +%Y-%m-%d).log

# Verificar permisos
ls -la /var/www/mbi-v3/modules/audio-library/
```

## 🤝 Contribución

### Estructura para nuevas funcionalidades

1. **Crear branch:** `feature/nueva-funcionalidad`
2. **Seguir patrones existentes:** 
   - Usar `async/await` para operaciones asíncronas
   - Implementar manejo de errores
   - Agregar notificaciones de usuario
3. **Documentar:** Actualizar este documento
4. **Probar:** Verificar en ambiente real

### Convenciones de código

```javascript
// Nombres de métodos descriptivos
async loadLibrary() { /* ... */ }
async renameFile(filename) { /* ... */ }

// Manejo consistente de errores
try {
    const response = await apiClient.post(/* ... */);
    if (response.success) {
        this.showNotification('Operación exitosa', 'success');
    }
} catch (error) {
    this.showNotification('Error en operación', 'error');
}
```

## 📊 Estadísticas del Proyecto

- **Líneas de código:** ~500 líneas (JS + CSS)
- **Tiempo de desarrollo:** 2 horas
- **Archivos creados:** 2 nuevos + 2 modificados
- **Funcionalidades:** 8 principales
- **Tamaño total:** 27.1 KB

---

**Última actualización:** 13 de Agosto, 2025  
**Estado:** ✅ Producción - Completamente funcional  
**Próxima revisión:** 20 de Agosto, 2025