# 📝 Estrategia para Implementar Renombrado de Archivos de Audio

## 📊 Análisis Actual

### Situación Actual:
- **Mensajes de texto** (`type !== 'audio'`): ✅ YA tienen botón de editar título (✏️)
- **Archivos de audio** (`type === 'audio'`): ❌ NO tienen botón de editar título

### Código Actual (línea ~280 en `/modules/campaign-library/index.js`):
```javascript
${!isAudio ? `<button class="btn-icon" onclick="window.campaignLibrary.editMessage('${message.id}')" title="Editar título">
    ✏️
</button>` : ''}
```

La condición `!isAudio` está EXCLUYENDO el botón de editar para archivos de audio.

### Función editMessage existente:
```javascript
async editMessage(id) {
    const message = this.messages.find(m => m.id === id);
    if (!message) return;
    
    const newTitle = prompt('Editar título del mensaje:', message.title);
    if (!newTitle || newTitle === message.title) return;
    
    // Validación y guardado...
    message.title = newTitle.trim();
    
    // Guardar en localStorage
    storageManager.save(`library_message_${message.id}`, message);
    
    // Guardar en backend
    await fetch('/api/library-metadata.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'update',
            id: message.id,
            data: { title: newTitle }
        })
    });
}
```

## 🎯 Estrategia de Implementación

### Opción 1: SOLUCIÓN SIMPLE (Recomendada) ⭐
**Permitir que los archivos de audio usen la misma función editMessage**

#### Cambios necesarios:

**1. En la interfaz (línea ~280):**
```javascript
// CAMBIAR DE:
${!isAudio ? `<button...` : ''}

// A:
<button class="btn-icon" onclick="window.campaignLibrary.editMessage('${message.id}')" title="Editar título">
    ✏️
</button>
```
Simplemente ELIMINAR la condición `!isAudio` para que TODOS los mensajes tengan el botón.

**2. Verificar que editMessage funcione para audios:**
La función actual ya debería funcionar porque:
- Busca el mensaje por ID
- Actualiza el título
- Guarda en localStorage
- Envía al backend

### Opción 2: SOLUCIÓN DIFERENCIADA
**Crear una función específica para renombrar archivos de audio**

#### Cambios necesarios:

**1. Agregar botón específico para audios:**
```javascript
${isAudio ? `<button class="btn-icon" onclick="window.campaignLibrary.renameAudioFile('${message.id}')" title="Renombrar archivo">
    ✏️
</button>` : `<button class="btn-icon" onclick="window.campaignLibrary.editMessage('${message.id}')" title="Editar título">
    ✏️
</button>`}
```

**2. Crear nueva función renameAudioFile:**
```javascript
async renameAudioFile(id) {
    const message = this.messages.find(m => m.id === id);
    if (!message || message.type !== 'audio') return;
    
    const currentName = message.title || message.filename;
    const newName = prompt('Nuevo nombre para el archivo:', currentName);
    
    if (!newName || newName === currentName) return;
    
    // Validación específica para nombres de archivo
    if (!/^[a-zA-Z0-9_\-\s]+$/.test(newName)) {
        this.showError('El nombre solo puede contener letras, números, espacios, guiones y guión bajo');
        return;
    }
    
    message.title = newName.trim();
    message.updatedAt = Date.now();
    
    // Guardar en localStorage
    storageManager.save(`library_message_${message.id}`, message);
    
    // Actualizar en backend - podría necesitar endpoint específico
    try {
        await fetch('/api/biblioteca.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'rename',
                id: message.id,
                filename: message.filename,
                newTitle: newName
            })
        });
    } catch (error) {
        console.error('Error renombrando archivo:', error);
    }
    
    this.showSuccess('Archivo renombrado correctamente');
    this.renderLibrary();
}
```

## 📋 Plan de Implementación Paso a Paso

### Para Opción 1 (SIMPLE - Recomendada):

1. **Modificar `/modules/campaign-library/index.js`**
   - Línea ~280: Eliminar condición `!isAudio`
   - El botón aparecerá para TODOS los mensajes

2. **Probar con archivos de audio existentes:**
   - Verificar que el título se actualiza correctamente
   - Verificar que se guarda en localStorage
   - Verificar que persiste al recargar

3. **Verificar backend `/api/library-metadata.php`:**
   - Confirmar que acepta actualizaciones para archivos tipo 'audio'
   - Si no, agregar soporte

### Para Opción 2 (DIFERENCIADA):

1. **Modificar UI en index.js**
   - Cambiar condición para mostrar botón diferente según tipo

2. **Agregar función `renameAudioFile`**
   - Copiar lógica de `editMessage`
   - Adaptar para archivos de audio

3. **Modificar backend si es necesario**
   - Agregar endpoint o acción específica para renombrar

4. **Agregar al objeto window**
   - En `window.campaignLibrary` agregar referencia a nueva función

## 🔍 Consideraciones Adicionales

### 1. Sincronización del nombre:
- **title**: Nombre mostrado en la UI
- **filename**: Nombre real del archivo en el servidor
- Decidir si cambiar solo el título de display o también el archivo físico

### 2. Validación de nombres:
- Para archivos: caracteres válidos en sistema de archivos
- Para títulos: más permisivo, puede incluir emojis, etc.

### 3. Backend:
- Verificar si `/api/library-metadata.php` ya maneja archivos de audio
- Podría necesitar crear nueva tabla o campo en DB para metadata de archivos

### 4. Caché y actualización:
- Asegurar que la UI se actualiza inmediatamente
- Considerar si hay caché que limpiar

## ✅ Recomendación Final

**Ir con Opción 1 (SIMPLE)** porque:
1. Menos código nuevo = menos bugs
2. Reutiliza lógica existente y probada
3. Experiencia uniforme para el usuario
4. El backend probablemente ya lo soporta

**Cambio mínimo requerido:**
```javascript
// En línea ~280 de /modules/campaign-library/index.js
// ELIMINAR la condición !isAudio del botón de editar
// De esto:
${!isAudio ? `<button...` : ''}
// A esto:
<button class="btn-icon" onclick="window.campaignLibrary.editMessage('${message.id}')" title="Editar título">
    ✏️
</button>
```

## 🧪 Testing

1. Subir un archivo de audio nuevo
2. Hacer clic en ✏️ 
3. Cambiar el título
4. Verificar que se muestra el nuevo título
5. Recargar página
6. Verificar que el título persiste
7. Verificar en otros módulos que usen el archivo

---

*Documento creado: 22 de Agosto 2024*
*Autor: Análisis del sistema MBI-v3*