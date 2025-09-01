/**
 * Profile Handler - Gestión de perfiles de voz
 * @module ProfileHandler
 */

import { VoicePresets } from '../voice-presets.js';

export class ProfileHandler {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }
    
    /**
     * Carga un perfil completo
     */
    loadProfile(profile) {
        if (!profile?.settings) {
            throw new Error('Perfil inválido');
        }
        
        // Actualizar settings en el estado
        this.stateManager.updateSettings(profile.settings);
        
        // Retornar datos para actualizar UI
        return {
            voice: profile.settings.voice,
            settings: profile.settings,
            name: profile.name
        };
    }
    
    /**
     * Aplica preset de voz
     */
    applyVoicePreset(voice) {
        const preset = VoicePresets.getPreset(voice);
        if (!preset?.settings) {
            console.warn(`No preset found for voice: ${voice}`);
            return null;
        }
        
        this.stateManager.updateSettings(preset.settings);
        return preset;
    }
    
    /**
     * Obtiene configuración actual para guardar
     */
    getCurrentConfiguration() {
        const message = this.stateManager.getCurrentMessage();
        
        return {
            voice: message.voice || 'fernanda',
            style: message.settings.style || 0.5,
            stability: message.settings.stability || 0.75,
            similarity_boost: message.settings.similarity_boost || 0.8,
            speed: message.settings.speed || 'normal',
            pauses: message.settings.pauses || {},
            emphasis: message.settings.emphasis || {},
            modulation: message.settings.modulation || {}
        };
    }
    
    /**
     * Resetea a valores por defecto
     */
    resetToDefaults() {
        const defaults = VoicePresets.getDefaults();
        this.stateManager.updateSettings(defaults.settings);
        return defaults;
    }
    
    /**
     * Valida configuración de perfil
     */
    validateProfileSettings(settings) {
        const required = ['style', 'stability', 'similarity_boost'];
        const missing = required.filter(key => !(key in settings));
        
        if (missing.length > 0) {
            throw new Error(`Configuración incompleta: faltan ${missing.join(', ')}`);
        }
        
        // Validar rangos
        const ranges = {
            style: [0, 1],
            stability: [0, 1],
            similarity_boost: [0, 1]
        };
        
        for (const [key, [min, max]] of Object.entries(ranges)) {
            const value = settings[key];
            if (value < min || value > max) {
                throw new Error(`${key} debe estar entre ${min} y ${max}`);
            }
        }
        
        return true;
    }
}