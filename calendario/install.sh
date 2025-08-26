#!/bin/bash
# Script de instalación del sistema de calendario

echo "📅 Instalando Sistema de Calendario TTS-Mall"
echo "==========================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -d "/var/www/tts-mall/v2/calendario" ]; then
    echo -e "${RED}Error: El directorio /var/www/tts-mall/v2/calendario no existe${NC}"
    exit 1
fi

cd /var/www/tts-mall/v2/calendario

# 1. Crear estructura de directorios
echo -e "\n${YELLOW}1. Creando estructura de directorios...${NC}"
mkdir -p api/db
mkdir -p logs/scheduler
chmod 777 logs logs/scheduler
echo -e "${GREEN}✓ Directorios creados${NC}"

# 2. Inicializar base de datos
echo -e "\n${YELLOW}2. Inicializando base de datos...${NC}"
if [ -f "api/db/calendar.db" ]; then
    echo -e "${YELLOW}La base de datos ya existe. ¿Desea reinicializarla? (s/n)${NC}"
    read -r response
    if [[ "$response" == "s" ]]; then
        rm -f api/db/calendar.db
        php api/db/init-db.php
    else
        echo "Manteniendo base de datos existente"
    fi
else
    php api/db/init-db.php
fi

# 3. Configurar permisos
echo -e "\n${YELLOW}3. Configurando permisos...${NC}"
chmod 666 api/db/calendar.db 2>/dev/null || true
chmod 777 api/db
chown -R www-data:www-data . 2>/dev/null || true
echo -e "${GREEN}✓ Permisos configurados${NC}"

# 4. Configurar cron job
echo -e "\n${YELLOW}4. Configurando cron job...${NC}"

# Verificar si el cron ya existe
if crontab -l 2>/dev/null | grep -q "calendario/api/scheduler.php"; then
    echo -e "${YELLOW}El cron job ya existe${NC}"
else
    # Agregar cron job
    (crontab -l 2>/dev/null; echo "* * * * * /usr/bin/php /var/www/tts-mall/v2/calendario/api/scheduler.php >> /var/www/tts-mall/v2/calendario/logs/scheduler/cron.log 2>&1") | crontab -
    echo -e "${GREEN}✓ Cron job configurado para ejecutarse cada minuto${NC}"
fi

# 5. Verificar dependencias
echo -e "\n${YELLOW}5. Verificando dependencias...${NC}"

# PHP
if command -v php &> /dev/null; then
    PHP_VERSION=$(php -v | head -n 1)
    echo -e "${GREEN}✓ PHP instalado: $PHP_VERSION${NC}"
else
    echo -e "${RED}✗ PHP no está instalado${NC}"
    exit 1
fi

# SQLite
if php -m | grep -q sqlite3; then
    echo -e "${GREEN}✓ Extensión SQLite3 de PHP instalada${NC}"
else
    echo -e "${RED}✗ Extensión SQLite3 de PHP no está instalada${NC}"
    echo "Instale con: sudo apt-get install php-sqlite3"
    exit 1
fi

# CURL
if php -m | grep -q curl; then
    echo -e "${GREEN}✓ Extensión CURL de PHP instalada${NC}"
else
    echo -e "${RED}✗ Extensión CURL de PHP no está instalada${NC}"
    echo "Instale con: sudo apt-get install php-curl"
    exit 1
fi

# 6. Test del scheduler
echo -e "\n${YELLOW}6. Probando scheduler...${NC}"
echo "Ejecutando prueba del scheduler (esto puede tomar unos segundos)..."

# Ejecutar scheduler manualmente
php api/scheduler.php

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Scheduler funcionando correctamente${NC}"
else
    echo -e "${RED}✗ Error en el scheduler${NC}"
    echo "Revise los logs en: logs/scheduler/"
fi

# 7. Información final
echo -e "\n${GREEN}=========================================="
echo "✓ INSTALACIÓN COMPLETADA"
echo "==========================================${NC}"
echo ""
echo "📋 Próximos pasos:"
echo "1. Acceda al calendario desde el sistema TTS"
echo "2. Programe su primer anuncio"
echo "3. Verifique los logs en: logs/scheduler/"
echo ""
echo "🔧 Comandos útiles:"
echo "- Ver logs del scheduler: tail -f logs/scheduler/$(date +%Y-%m-%d).log"
echo "- Ejecutar scheduler manualmente: php api/scheduler.php"
echo "- Ver cron jobs: crontab -l"
echo "- Editar cron jobs: crontab -e"
echo ""
echo "📊 Base de datos ubicada en: api/db/calendar.db"
echo ""