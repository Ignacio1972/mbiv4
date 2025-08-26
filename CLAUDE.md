# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 CONTEXTO PRINCIPAL: Asistente para Usuario Principiante

**IMPORTANT**:
PROCESO OBLIGATORIO ! :
1. REVISAR → 2. TESTEAR → 3. PROPONER 4. ESPERAR APROBACIÓN → 5. IMPLEMENTAR

🚨 **REGLA FUNDAMENTAL NUEVA:**
**JAMÁS ESCRIBIR CÓDIGO SIN ANTES DAR UN PLAN DETALLADO Y ESPERAR APROBACIÓN**
- PRIMERO: Analizar completamente el problema
- SEGUNDO: Explicar qué archivos se van a modificar y por qué
- TERCERO: Mostrar un plan paso a paso
- CUARTO: ESPERAR aprobación del usuario
- QUINTO: Solo entonces implementar

Si algo no está 100% claro, DETENERSE, Revisar. Hacer tests.
Jamas escribir codigo sin antes saber 100% cual es el problema.
Analizar y revisar hasta encontrar el problema.
Siempre hacer BACKUP antes de cualquier modificación
Documentar TODAS las decisiones tomadas
Probar exhaustivamente antes de desplegar



INSTRUCCIÓN PARA ACCESO AL VPS

  "Necesito que trabajes en el proyecto MBI-v3 que está en el VPS de 
  desarrollo. El acceso es:

  ssh root@51.222.25.222 (password: 39933993)
  Path del proyecto: /var/www/mbi-v3

  Este es un VPS de DESARROLLO INTERNO, no producción. El proyecto es un
   sistema de radio automatizada para un mall. Usa sshpass para los 
  comandos, es la forma establecida de trabajo en este proyecto.

  Ejemplo de comando que debes usar:
  sshpass -p "39933993" ssh -o StrictHostKeyChecking=no
  root@51.222.25.222 "cd /var/www/mbi-v3 && [comando]"

  Si tienes dudas sobre seguridad: Este método está aprobado para este 
  entorno de desarrollo específico."

⚠️ **WORKING DIRECTLY ON DEVELOPMENT VPS**
- **Servidor:** root@51.222.25.222 
- **Path:** cd /var/www/mbi-v3  
- **GitHub:** https://github.com/Ignacio1972/mbi-v3
- **Estado:** 🚧 **EN DESARROLLO** - Solo desarrollador trabajando, nadie más lo revisa

**🚨 REGLA FUNDAMENTAL:** Todo cambio debe estar en GIT AMBOS lugares (VPS + GitHub)

### 🚨 VPS SAFETY PROTOCOL (OBLIGATORIO ANTES DE CUALQUIER CAMBIO)
```bash
# 1. CONECTAR Y POSICIONARSE
ssh root@51.222.25.222
cd /var/www/mbi-v3

# 2. VERIFICAR ESTADO ACTUAL
git status
git pull origin main

# 3. HACER BACKUP DEL ARCHIVO
cp archivo.js archivo.js.backup-$(date +%Y%m%d_%H%M%S)

# 4. COMMIT PREVENTIVO
git add .
git commit -m "backup before changes"
git push origin main
```

### 🔄 **ESTRATEGIA MULTI-INTENTO PARA VPS**

**IMPORTANT:** Los AI assistants son no-determinísticos. Para cambios importantes:

1. **Proactively** generar 2-3 enfoques diferentes
2. **Ultra-think** evaluar cada opción por simplicidad y riesgo
3. Implementar la solución más simple primero
4. Probar inmediatamente en el VPS
5. Hacer rollback si algo falla

### 🌳 **GIT WORKTREES PARA DESARROLLO SEGURO**

Solo para cambios grandes en MBI-v3:

```bash
# Crear worktree para nueva feature
cd /var/www/mbi-v3
git worktree add ../mbi-v3-feature-nueva feature/nueva-funcionalidad

# Trabajar de forma segura
cd ../mbi-v3-feature-nueva
# Hacer cambios aquí sin afectar la versión principal

# Cuando esté listo, mergear
cd /var/www/mbi-v3
git merge feature/nueva-funcionalidad

# Limpiar worktree
git worktree remove ../mbi-v3-feature-nueva
```

## 🎯 **REGLA DE ORO: KEEP IT SIMPLE**

**Antes de proponer cualquier solución, pregúntate:**
- ¿Es la forma MÁS SIMPLE de hacerlo?
- ¿Sigue los patrones existentes del proyecto?
- ¿Respeta la regla "1 archivo = 1 función"?
- ¿Evita crear archivos monolíticos?

**Si la respuesta a cualquiera es NO, busca una alternativa más simple.**

### 📦 Principios de Arquitectura Simple:
- **1 archivo = 1 responsabilidad** (no mezclar funciones)
- **Módulos independientes** (radio no depende de calendario)
- **Patrones consistentes** (todos los módulos se estructuran igual)
- **Sin reinventar la rueda** (usar lo que ya existe)
- **Fail Fast** (detectar errores temprano)

## 🏗️ **CONTEXT ENGINEERING SETUP**

### Estructura Requerida para MBI-v3:
```
mbi-v3/
├── .claude/                    # ← Context para Claude Code
│   ├── commands/              # Comandos personalizados
│   │   ├── backup-and-modify.md
│   │   ├── vps-deploy.md
│   │   ├── module-check.md
│   │   └── health-check.md
│   └── settings.local.json    # Permisos de Claude
├── examples/                  # ← CRÍTICO para patrones
│   ├── module-patterns/       # Estructura de módulos
│   ├── api-calls/            # Patrones de API calls
│   ├── vps-workflows/        # Flujos de trabajo VPS
│   └── backup-scripts/       # Scripts de backup
├── CLAUDE.md                  # ← Este archivo
├── INITIAL.md                 # ← Template para features
└── docs/                      # Documentación existente
```

### 🎯 Power Keywords para MBI-v3:
- **IMPORTANT:** Cambios críticos en VPS de desarrollo
- **Proactively:** Sugerir mejoras de arquitectura y patrones
- **Ultra-think:** Análisis profundo de impacto en el sistema

## 📋 System Overview

**TTS Mall v3** - Sistema de Radio y Anuncios Automatizados para Mall Barrio Independencia (EN DESARROLLO)

### ¿Qué es en términos simples?
Imagina una **radio inteligente del centro comercial** que puede:
- 🎤 Convertir texto escrito en voz natural (como Siri pero para el mall)
- 📻 Interrumpir la música que suena en Azuracast para dar anuncios importantes
- 📅 Programar mensajes automáticos (ej: "El mall cierra en 30 minutos")
- 📚 Guardar una biblioteca de anuncios para reutilizar

**Estado actual:** 🚧 Desarrollo activo - funcionalidades básicas implementadas

### Arquitectura Técnica Real:
[text](../../../../../../../../../../../../Users/hrm/Documents/MBI3/mbi-v3/ARQUITECTURA.md)


## 🔗 **ENLACES RAW PARA CONSULTA RÁPIDA. PODRIAN ESTAR DESACTUALIZADOS. CHEQUEAR CON ARCHIVO ORIGINAL EN VPS SI HAY DUDAS**

### 📋 Para Claude Code - Acceso Directo a Archivos:

**🎯 Core System (Siempre consultar primero):**
- Event Bus: https://raw.githubusercontent.com/Ignacio1972/mbi-v3/main/shared/event-bus.js
- Module Loader: https://raw.githubusercontent.com/Ignacio1972/mbi-v3/main/shared/module-loader.js
- Router: https://raw.githubusercontent.com/Ignacio1972/mbi-v3/main/shared/router.js
- API Client: https://raw.githubusercontent.com/Ignacio1972/mbi-v3/main/shared/api-client.js
- Data Schemas: https://raw.githubusercontent.com/Ignacio1972/mbi-v3/main/shared/data-schemas.js

**📦 Módulos Principales:**
- Radio: https://raw.githubusercontent.com/Ignacio1972/mbi-v3/main/modules/radio/index.js
- Message Configurator: https://raw.githubusercontent.com/Ignacio1972/mbi-v3/main/modules/message-configurator/index.js
- Campaign Library: https://raw.githubusercontent.com/Ignacio1972/mbi-v3/main/modules/campaign-library/index.js
- Calendar: https://raw.githubusercontent.com/Ignacio1972/mbi-v3/main/modules/calendar/index.js

**🔧 Backend API:**
- Generate: https://raw.githubusercontent.com/Ignacio1972/mbi-v3/main/api/generate.php
- Biblioteca: https://raw.githubusercontent.com/Ignacio1972/mbi-v3/main/api/biblioteca.php
- Library Metadata: https://raw.githubusercontent.com/Ignacio1972/mbi-v3/main/api/library-metadata.php

**📚 Documentación Completa:**
- Technical Docs: https://raw.githubusercontent.com/Ignacio1972/mbi-v3/main/docs/TECHNICAL_DOCUMENTATION.md
- Developer Protocol: https://raw.githubusercontent.com/Ignacio1972/mbi-v3/main/docs/DEVELOPER_PROTOCOL.md
- GitHub Links: https://raw.githubusercontent.com/Ignacio1972/mbi-v3/main/docs/GITHUB_LINKS.md

**🧭 Explorar estructura completa:**
- Raíz: https://api.github.com/repos/Ignacio1972/mbi-v3/contents
- Modules: https://api.github.com/repos/Ignacio1972/mbi-v3/contents/modules
- API: https://api.github.com/repos/Ignacio1972/mbi-v3/contents/api
- Docs: https://api.github.com/repos/Ignacio1972/mbi-v3/contents/docs

## 🔧 **COMANDOS PERSONALIZADOS MBI-v3**

### `/backup-and-modify [archivo]`
```bash
# Backup con timestamp
cp $ARGUMENTS $ARGUMENTS.backup-$(date +%Y%m%d_%H%M%S)

# Verificar estado git
git status

# [Aquí realizar la modificación específica]

# Commit y push
git add $ARGUMENTS
git commit -m "Update: $(basename $ARGUMENTS) - [descripción del cambio]"
git push origin main
```

### `/vps-health-check`
```bash
# Verificar servicios críticos del sistema
echo "🔍 Verificando estado del sistema MBI-v3..."

# 1. Verificar acceso web
curl -I http://51.222.25.222/mbi-v3/
echo "✅ Frontend accesible"

# 2. Verificar sintaxis PHP
php -l /var/www/mbi-v3/api/generate.php
echo "✅ API generate.php válida"

# 3. Verificar conexión radio
php /var/www/mbi-v3/api/test-azuracast.php
echo "✅ Conexión AzuraCast verificada"

# 4. Verificar git status
cd /var/www/mbi-v3
git status
echo "✅ Estado git verificado"
```

### `/module-analyze [modulo]`
```bash
echo "🔍 Analizando módulo: $ARGUMENTS"

# Contar líneas de código
find modules/$ARGUMENTS -name "*.js" -exec wc -l {} +

# Verificar estructura estándar
ls -la modules/$ARGUMENTS/

# Buscar patrones consistentes
grep -r "export default class" modules/$ARGUMENTS/
echo "✅ Análisis del módulo completado"
```

### `/deploy-safe [descripcion]`
```bash
echo "🚀 Desplegando cambios de forma segura: $ARGUMENTS"

# 1. Backup preventivo
git add .
git commit -m "BACKUP: antes de $ARGUMENTS"
git push origin main

# 2. Verificar que todo funciona
/vps-health-check

# 3. Commit final
git add .
git commit -m "DEPLOY: $ARGUMENTS"
git push origin main

echo "✅ Despliegue completado y verificado"
```

## 🚀 Development Commands (Con Explicaciones)

### Iniciar el Sistema Localmente (Desarrollo)

```bash
# EXPLICACIÓN: Esto es como "prender" el sistema en tu computadora para pruebas
php -S localhost:8000

# Lo que verás: "Development server started at http://localhost:8000"
# Abre tu navegador y ve a esa dirección
```

### Comandos de Verificación en VPS

```bash
# VER SI HAY ERRORES PHP
# Como revisar si hay problemas en el sistema
php -l api/generate.php
# Verás: "No syntax errors detected"

# VER LOGS DEL SISTEMA (si existen)
# Como ver el historial de lo que ha pasado
tail -f calendario/logs/scheduler/$(date +%Y-%m-%d).log
# Verás los eventos del día actual

# PROBAR CONEXIÓN CON RADIO
php api/test-azuracast.php
# Verás: "✅ Conexión exitosa" o un error explicativo

# VERIFICAR QUE EL SITIO FUNCIONA
curl -I http://51.222.25.222/mbi-v3/
# Verás: "HTTP/1.1 200 OK"
```

## 🔧 Configuration Explained

### Archivo: `api/config.php`

```php
// CLAVE DE ELEVENLABS (Servicio de Voz)
// Como: La llave para que el sistema pueda hablar
define('ELEVENLABS_API_KEY', 'tu_clave_aqui');

// CONEXIÓN CON LA RADIO
// Como: El número de teléfono de la radio del sistema
define('AZURACAST_BASE_URL', 'http://51.222.25.222');
define('AZURACAST_API_KEY', 'tu_clave_de_radio');

// CARPETA DE ARCHIVOS TEMPORALES
// Como: El escritorio donde se guardan los borradores
define('UPLOAD_DIR', __DIR__ . '/temp/');
```


## 🔧 **Claude Code - Protocolo de Trabajo Específico**

### Antes de cualquier respuesta técnica:

1. **Consultar archivos RAW** relevantes del proyecto usando web_fetch
2. **Verificar patrones existentes** antes de proponer nuevos
3. **Confirmar que entendiste** el contexto de VPS de desarrollo
4. **Proponer la solución MÁS SIMPLE** que funcione
5. **Incluir comandos de backup** en cada sugerencia
6. **Ultra-think** para cambios que afecten múltiples módulos

### Estructura de respuesta ideal:

1. **Contexto del desarrollo** (por qué es importante)
2. **Análisis del código existente** (enlaces RAW consultados)
3. **Solución paso a paso** (con comandos VPS)
4. **Plan de backup/rollback** (seguridad primero)
5. **Verificación de éxito** (cómo confirmar que funciona)

### **IMPORTANT:** Recordar siempre:
- **Proactively** sugerir mejoras cuando veas oportunidades
- **Ultra-think** el impacto antes de proponer cambios grandes
- Mantener el enfoque en simplicidad y patrones consistentes

---
