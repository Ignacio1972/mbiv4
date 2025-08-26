#!/bin/bash

# Script para analizar logs y entender el flujo de datos

echo "================================"
echo "  ANÁLISIS DE LOGS TTS"
echo "================================"

LOG_FILE="/var/www/tts-radio/api/logs/tts-$(date +%Y-%m-%d).log"

echo ""
echo "1. ÚLTIMOS VOICE SETTINGS ENVIADOS:"
echo "-----------------------------------"
grep -E "voice_settings|Voice settings" "$LOG_FILE" | tail -5

echo ""
echo "2. ÚLTIMOS SSML PROCESADOS:"
echo "--------------------------"
grep -E "procesado con SSML|SSML generado" "$LOG_FILE" | tail -5

echo ""
echo "3. REQUESTS A ELEVENLABS:"
echo "------------------------"
grep -E "Request a ElevenLabs|Request:" "$LOG_FILE" | tail -5

echo ""
echo "4. ERRORES RECIENTES:"
echo "--------------------"
grep -E "ERROR|Error" "$LOG_FILE" | tail -10

echo ""
echo "5. FLUJO COMPLETO DE LA ÚLTIMA GENERACIÓN:"
echo "-----------------------------------------"
tail -50 "$LOG_FILE" | grep -E "(Iniciando generación|options recibidas|processText|Voice settings|Request a ElevenLabs|Audio generado)"

echo ""
echo "6. VERIFICAR SI LLEGAN SETTINGS AVANZADOS:"
echo "------------------------------------------"
grep -E "(pause_settings|emphasis_settings|modulation_settings)" "$LOG_FILE" | tail -5

echo ""
echo "7. COMPARAR ENTRADA vs SALIDA:"
echo "------------------------------"
echo "Buscar patron: options recibidas -> Voice settings finales"
tail -100 "$LOG_FILE" | grep -A2 -B2 "Voice settings"