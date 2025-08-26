/**
 * Voice Selector Component - VERSIÓN DINÁMICA
 * Carga voces desde el backend
 */

import { VoiceService } from '../../../shared/voice-service.js';

export class VoiceSelector {
    constructor() {
        this.voices = [];
        this.selectedVoice = null;
        this.onChange = null;
        this.loaded = false;
    }
    
    async loadVoices() {
        const voicesData = await VoiceService.loadVoices();
        
        // Convertir objeto a array con formato esperado
        this.voices = Object.entries(voicesData).map(([key, voice]) => ({
            id: key,
            name: voice.label,
            icon: voice.gender === 'M' ? '👨' : '👩',
            description: `Voz ${voice.gender === 'M' ? 'masculina' : 'femenina'}`,
            category: 'dynamic'
        }));
        
        // Seleccionar la primera voz si no hay ninguna seleccionada
        if (!this.selectedVoice && this.voices.length > 0) {
            this.selectedVoice = this.voices[0].id;
        }
        
        this.loaded = true;
    }
    
    static async render(container, options = {}) {
        const instance = new VoiceSelector();
        Object.assign(instance, options);
        
        // Cargar voces antes de renderizar
        await instance.loadVoices();
        
        container.innerHTML = instance.getHTML();
        instance.attachEvents(container);
        
        return instance;
    }
    
    getHTML() {
        if (!this.loaded) {
            return '<div class="voice-selector">Cargando voces...</div>';
        }
        
        if (this.voices.length === 0) {
            return '<div class="voice-selector">No hay voces disponibles</div>';
        }
        
        return `
            <div class="voice-selector">
                ${this.voices.map(voice => `
                    <div class="voice-card ${voice.id === this.selectedVoice ? 'voice-card--active' : ''}" 
                         data-voice-id="${voice.id}"
                         role="button"
                         tabindex="0"
                         aria-label="Seleccionar voz ${voice.name}">
                        <div class="voice-card__icon">${voice.icon}</div>
                        <div class="voice-card__name">${voice.name}</div>
                        <div class="voice-card__description">${voice.description}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    attachEvents(container) {
        const cards = container.querySelectorAll('.voice-card');
        
        cards.forEach(card => {
            card.addEventListener('click', () => {
                this.selectVoice(card.dataset.voiceId, container);
            });
            
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectVoice(card.dataset.voiceId, container);
                }
            });
        });
    }
    
    selectVoice(voiceId, container) {
        if (this.selectedVoice === voiceId) return;
        
        this.selectedVoice = voiceId;
        
        // Actualizar UI
        container.querySelectorAll('.voice-card').forEach(card => {
            const isSelected = card.dataset.voiceId === voiceId;
            card.classList.toggle('voice-card--active', isSelected);
            card.setAttribute('aria-pressed', isSelected);
        });
        
        // Disparar evento
        if (this.onChange) {
            const selectedVoiceData = this.voices.find(v => v.id === this.selectedVoice);
            this.onChange(this.selectedVoice, selectedVoiceData);
        }
    }
    
    getValue() {
        return this.selectedVoice;
    }
    
    setValue(voiceId) {
        if (this.voices.find(v => v.id === voiceId)) {
            this.selectedVoice = voiceId;
        }
    }
}

export default VoiceSelector;
