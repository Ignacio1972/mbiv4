/**
 * Audio Handler - Gestión de generación y reproducción de audio
 * @module AudioHandler
 */

import { audioManager } from '../../../shared/audio-manager.js';

export class AudioHandler {
    constructor(apiIntegration) {
        this.apiIntegration = apiIntegration;
        this.isGenerating = false;
        this.currentAudio = null;
    }
    
    /**
     * Genera audio con la configuración del mensaje
     */
    async generate(message) {
        if (this.isGenerating) {
            throw new Error('Ya hay una generación en proceso');
        }
        
        if (!message.text?.trim()) {
            throw new Error('El mensaje está vacío');
        }
        
        this.isGenerating = true;
        
        try {
            // Preparar parámetros
            const params = this.apiIntegration.prepareGenerationParams(message);
            
            // Generar audio
            const result = await audioManager.generateAudio(params);
            
            this.currentAudio = {
                filename: result.filename,
                azuracastFilename: result.azuracast_filename,
                url: '/api/temp/' + result.filename,
                timestamp: Date.now()
            };
            
            return this.currentAudio;
            
        } finally {
            this.isGenerating = false;
        }
    }
    
    /**
     * Envía el audio actual a la radio
     */
    async sendToRadio(azuracastFilename) {
        if (!azuracastFilename) {
            throw new Error('No hay audio para enviar');
        }
        
        return await audioManager.sendToRadio(azuracastFilename);
    }
    
    /**
     * Descarga el audio actual
     */
    downloadAudio(filename) {
        if (!filename) {
            throw new Error('No hay audio para descargar');
        }
        
        const link = document.createElement('a');
        link.href = '/api/temp/' + filename;
        link.download = filename;
        link.click();
    }
    
    /**
     * Obtiene el estado actual
     */
    getStatus() {
        return {
            isGenerating: this.isGenerating,
            hasAudio: !!this.currentAudio,
            currentAudio: this.currentAudio
        };
    }
    
    /**
     * Limpia el audio actual
     */
    clear() {
        this.currentAudio = null;
        this.isGenerating = false;
    }
}