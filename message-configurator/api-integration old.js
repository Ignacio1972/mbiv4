// /var/www/tts-mall/v2/modules/message-configurator/api-integration.js
/**
 * API Integration - VERSIÓN CORREGIDA PARA ELEVENLABS
 * Solo envía los parámetros que funcionan
 */

import { apiClient } from '../../shared/api-client.js';

export class APIIntegration {
    constructor() {
        this.templatesCache = null;
        this.lastTemplatesFetch = 0;
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
    }
    
    /**
     * Carga las plantillas disponibles
     */
    async loadTemplates() {
        // Usar cache si es reciente
        if (this.templatesCache && 
            (Date.now() - this.lastTemplatesFetch) < this.cacheTimeout) {
            return this.templatesCache;
        }
        
        try {
            const response = await apiClient.getTemplates();
            
            if (response.success) {
                this.templatesCache = response.templates;
                this.lastTemplatesFetch = Date.now();
                return response.templates;
            } else {
                throw new Error(response.error || 'Error cargando plantillas');
            }
        } catch (error) {
            console.error('[APIIntegration] Error loading templates:', error);
            return {};
        }
    }
    
    /**
     * Prepara parámetros para generación de audio - SIMPLIFICADO
     */
    prepareGenerationParams(message) {
        console.log('[APIIntegration] Preparando parámetros para:', message);
        
        // === PARÁMETROS BASE REQUERIDOS ===
        const params = {
            text: message.text,
            voice: message.voice || 'fernanda',
            // ELIMINADO: speed, emphasis, pause_settings, etc.
        };
        
        // === VOICE SETTINGS - SOLO LOS 4 PARÁMETROS VÁLIDOS ===
        if (message.settings) {
            params.voice_settings = {
                style: this.normalizeValue(message.settings.style, 0.5),
                stability: this.normalizeValue(message.settings.stability, 0.75),
                similarity_boost: this.normalizeValue(message.settings.similarity_boost, 0.85),
                use_speaker_boost: true
            };
            
            console.log('[APIIntegration] Voice settings preparados:', params.voice_settings);
        }
        
        console.log('[APIIntegration] Parámetros finales:', params);
        return params;
    }
    
    /**
     * Normaliza valores del UI (0-100) a API (0.0-1.0)
     */
    normalizeValue(value, defaultValue) {
        if (value === undefined || value === null) {
            return defaultValue;
        }
        
        // Si viene como porcentaje (0-100), convertir
        if (value > 1 && value <= 100) {
            return value / 100;
        }
        
        // Si ya está en rango 0-1, usar directamente
        if (value >= 0 && value <= 1) {
            return value;
        }
        
        // Fallback al default
        return defaultValue;
    }
    
    /**
     * Genera audio desde plantilla - SIMPLIFICADO
     */
    async generateFromTemplate(category, templateId, variables, voice, settings) {
        const params = {
            template: templateId,
            template_category: category,
            template_variables: variables,
            voice: voice || 'fernanda'
        };
        
        // Solo agregar voice_settings si vienen
        if (settings && settings.voice_settings) {
            params.voice_settings = settings.voice_settings;
        }
        
        return apiClient.post('/generate.php', {
            action: 'generate_audio',
            ...params
        });
    }
    
    /**
     * Valida disponibilidad del servicio
     */
    async checkServiceStatus() {
        try {
            const response = await fetch('/api/generate.php', {
                method: 'OPTIONS'
            });
            
            return response.ok;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Debug - Log de parámetros antes de enviar
     */
    debugParams(params) {
        console.group('[APIIntegration] Debug Params');
        console.log('Text length:', params.text?.length || 0);
        console.log('Voice:', params.voice);
        console.log('Voice Settings:', params.voice_settings);
        console.groupEnd();
    }
}