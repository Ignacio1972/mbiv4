/**
 * API Integration - Conexión con backend para el configurador
 * VERSIÓN CORREGIDA - Fix del bug del operador OR
 * @module APIIntegration
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
     * Prepara los parámetros para generar audio
     * CORREGIDO: Usar verificación explícita en lugar de OR
     */
    prepareGenerationParams(message) {
        const params = {
            text: message.text,
            voice: message.voice,
            voice_settings: {
                // FIX: Usar verificación explícita para permitir valor 0
                style: message.settings.style !== undefined ? message.settings.style : 0.5,
                stability: message.settings.stability !== undefined ? message.settings.stability : 0.75,
                similarity_boost: message.settings.similarity_boost !== undefined ? message.settings.similarity_boost : 0.8,
                use_speaker_boost: message.settings.use_speaker_boost !== false // default true
            }
        };
        
        // Log para debugging
        console.log('[APIIntegration] Parámetros preparados:', {
            voice: params.voice,
            voice_settings: params.voice_settings
        });
        
        return params;
    }
    
    /**
     * Genera audio desde plantilla
     */
    async generateFromTemplate(category, templateId, variables, voice, settings) {
        const params = {
            template: templateId,
            template_category: category,
            template_variables: variables,
            voice: voice,
            voice_settings: {
                // FIX: Usar verificación explícita
                style: settings.style !== undefined ? settings.style : 0.5,
                stability: settings.stability !== undefined ? settings.stability : 0.75,
                similarity_boost: settings.similarity_boost !== undefined ? settings.similarity_boost : 0.8,
                use_speaker_boost: settings.use_speaker_boost !== false
            }
        };
        
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
            // Hacer un ping simple al API
            const response = await fetch('/api/generate.php', {
                method: 'OPTIONS'
            });
            
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}