// /var/www/tts-mall/v2/modules/message-configurator/state-manager.js
/**
 * State Manager - Gestión del estado del formulario
 * @module StateManager
 */

import { createMessage } from '../../shared/data-schemas.js';
import { eventBus } from '../../shared/event-bus.js';

export class StateManager {
    constructor() {
        this.currentMessage = null;
        this.originalMessage = null;
        this.templates = [];
        this.voiceProfiles = [];
    }
    
    /**
     * Inicializa un nuevo mensaje
     */
    initializeMessage() {
        this.currentMessage = createMessage();
        this.originalMessage = JSON.parse(JSON.stringify(this.currentMessage));
        return this.currentMessage;
    }
    
    /**
     * Actualiza un campo del mensaje
     */
    updateField(field, value) {
        if (this.currentMessage) {
            this.currentMessage[field] = value;
            this.currentMessage.updatedAt = Date.now();
            
            eventBus.emit('message:field:updated', { field, value });
        }
    }
    
    /**
     * Actualiza configuración de voz
     */
    updateSettings(settings) {
        if (this.currentMessage) {
            this.currentMessage.settings = {
                ...this.currentMessage.settings,
                ...settings
            };
            this.currentMessage.updatedAt = Date.now();
            
            eventBus.emit('message:settings:updated', settings);
        }
    }
    
    /**
     * Actualiza un setting específico
     */
    updateSetting(path, value) {
        if (!this.currentMessage) return;
        
        const paths = path.split('.');
        let obj = this.currentMessage.settings;
        
        for (let i = 0; i < paths.length - 1; i++) {
            if (!obj[paths[i]]) obj[paths[i]] = {};
            obj = obj[paths[i]];
        }
        
        obj[paths[paths.length - 1]] = value;
        this.currentMessage.updatedAt = Date.now();
        
        eventBus.emit('message:setting:updated', { path, value });
    }
    
    /**
     * Verifica si hay cambios sin guardar
     */
    hasChanges() {
        if (!this.currentMessage || !this.originalMessage) return false;
        
        return JSON.stringify(this.currentMessage) !== JSON.stringify(this.originalMessage);
    }
    
    /**
     * Obtiene el mensaje actual
     */
    getCurrentMessage() {
        return this.currentMessage;
    }
    
    /**
     * Carga un mensaje existente
     */
    loadMessage(message) {
        this.currentMessage = JSON.parse(JSON.stringify(message));
        this.originalMessage = JSON.parse(JSON.stringify(message));
        
        eventBus.emit('message:loaded', message);
    }
    
    /**
     * Resetea el estado
     */
    reset() {
        this.currentMessage = null;
        this.originalMessage = null;
    }
    
    /**
     * Guarda las plantillas disponibles
     */
    setTemplates(templates) {
        this.templates = templates;
    }
    
    /**
     * Guarda los perfiles de voz
     */
    setVoiceProfiles(profiles) {
        this.voiceProfiles = profiles;
    }
    
    /**
     * Obtiene plantillas por categoría
     */
    getTemplatesByCategory(category) {
        return this.templates[category] || [];
    }
    
    /**
     * Aplica una plantilla al mensaje actual
     */
    applyTemplate(category, templateId, variables) {
        // TODO: Implementar aplicación de plantilla
        eventBus.emit('template:applied', { category, templateId });
    }
}