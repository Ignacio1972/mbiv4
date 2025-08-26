/**
 * Message Configurator Module - VERSIÓN SIMPLIFICADA
 * @module MessageConfiguratorModule
 */

import { eventBus } from '../../shared/event-bus.js';
import { storageManager } from '../../shared/storage-manager.js';

import { StateManager } from './state-manager.js';
import { APIIntegration } from './api-integration.js';
import { ComponentFactory } from './component-factory.js';
import { UIHandler } from './handlers/ui-handler.js';
import { AudioHandler } from './handlers/audio-handler.js';
import { TemplateHandler } from './handlers/template-handler.js';
import { ProfileHandler } from './handlers/profile-handler.js';

export default class MessageConfiguratorModule {
    constructor() {
        this.name = 'message-configurator';
        this.container = null;
        this.components = {};
        
        // Inicializar managers
        this.stateManager = new StateManager();
        this.apiIntegration = new APIIntegration();
        this.audioHandler = new AudioHandler(this.apiIntegration);
        this.templateHandler = new TemplateHandler();
        this.profileHandler = new ProfileHandler(this.stateManager);
    }
    
    getName() {
        return this.name;
    }
    
    async load(container) {
        console.log('[MessageConfigurator] Loading...');
        this.container = container;
        
        try {
            // Cargar recursos
            await this.loadResources();
            
            // Configurar UI
            this.uiHandler = new UIHandler(this.container, this.createActionHandlers());
            
            // Inicializar componentes
            await this.initializeComponents();
            
            // Cargar datos
            await this.loadInitialData();
            
            eventBus.emit('configurator:loaded');
            
        } catch (error) {
            console.error('[MessageConfigurator] Load failed:', error);
            this.uiHandler?.showStatus('Error al cargar', 'error');
        }
        // Cargar voces dinámicamente
        await this.loadVoicesInSelect();
    }
    
    // Método para cargar voces dinámicamente en el select
    async loadVoicesInSelect() {
        try {
            const voiceService = await import('../../shared/voice-service.js');
            const voices = await voiceService.VoiceService.loadVoices();
            
            const select = this.container.querySelector('#message-voice');
            if (select) {
                select.innerHTML = '';
                
                Object.entries(voices).forEach(([key, voice]) => {
                    const option = document.createElement('option');
                    option.value = key;
                    option.textContent = `${voice.gender === 'M' ? '👨' : '👩'} ${voice.label}`;
                    select.appendChild(option);
                });
                
                // Seleccionar la primera voz
                if (select.options.length > 0) {
                    select.value = select.options[0].value;
                    this.stateManager.updateField('voice', select.value);
                }
            }
        } catch (error) {
            console.error('Error loading voices:', error);
        }
    }

    async unload() {
        if (this.stateManager?.hasChanges()) {
            const message = this.stateManager.getCurrentMessage();
            if (message?.name) {
                storageManager.save(`draft_${message.id}`, message);
            }
        }
        
        this.cleanup();
    }
    
    async loadResources() {
        // CSS
        if (!document.querySelector('#configurator-styles')) {
            const link = document.createElement('link');
            link.id = 'configurator-styles';
            link.rel = 'stylesheet';
            link.href = '/modules/message-configurator/styles/configurator-layout.css';
            document.head.appendChild(link);
        }
        
        // CSS para el modal de guardado
        if (!document.querySelector('#save-modal-styles')) {
            const link = document.createElement('link');
            link.id = 'save-modal-styles';
            link.rel = 'stylesheet';
            link.href = '/modules/message-configurator/styles/save-message-modal.css';
            document.head.appendChild(link);
        }
        
        // Agregar CSS para SimpleSlider si no existe
        if (!document.querySelector('#simple-slider-styles')) {
            const style = document.createElement('style');
            style.id = 'simple-slider-styles';
            style.textContent = `
                .simple-slider {
                    margin-bottom: 1.5rem;
                }
                .simple-slider__label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                    color: var(--text-primary);
                }
                .simple-slider__icon {
                    font-size: 1.2rem;
                }
                .simple-slider__control {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .simple-slider__input {
                    flex: 1;
                    height: 6px;
                    -webkit-appearance: none;
                    appearance: none;
                    background: var(--bg-input);
                    border-radius: 3px;
                    outline: none;
                }
                .simple-slider__input::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    background: white;
                    border: 2px solid var(--primary-light);
                    border-radius: 50%;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .simple-slider__input::-webkit-slider-thumb:hover {
                    transform: scale(1.1);
                    box-shadow: 0 0 0 6px rgba(99, 102, 241, 0.2);
                }
                .simple-slider__value {
                    min-width: 50px;
                    text-align: right;
                    font-weight: 600;
                    color: var(--primary-light);
                }
            `;
            document.head.appendChild(style);
        }
        
        // HTML Template
        const response = await fetch('/modules/message-configurator/templates/configurator.html');
        this.container.innerHTML = await response.text();
        
        // Estado inicial
        this.stateManager.initializeMessage();
    }
    
    async initializeComponents() {
        const state = this.stateManager.getCurrentMessage();
        
        // SIMPLIFICADO: Callbacks con conversión directa
        const callbacks = {
            tagInput: (tags) => this.stateManager.updateField('tags', tags),
            // Los sliders ahora envían valores 0-100, convertimos a 0-1
            styleSlider: (value) => {
                console.log(`[Slider] Style: UI=${value}% → State=${value/100}`);
                this.stateManager.updateSetting('style', value / 100);
            },
            stabilitySlider: (value) => {
                console.log(`[Slider] Stability: UI=${value}% → State=${value/100}`);
                this.stateManager.updateSetting('stability', value / 100);
            },
            similaritySlider: (value) => {
                console.log(`[Slider] Similarity: UI=${value}% → State=${value/100}`);
                this.stateManager.updateSetting('similarity_boost', value / 100);
            },
            speakerBoostToggle: (value) => {
                this.stateManager.updateSetting('use_speaker_boost', value);
            },
            profileSelector: (profile) => this.handleProfileChange(profile)
        };
        
        this.components = await ComponentFactory.initializeAll(this.container, state, callbacks);
    }
    
    async loadInitialData() {
        try {
            const templates = await this.apiIntegration.loadTemplates();
            this.templateHandler.setTemplates(templates);
        } catch (error) {
            console.warn('[MessageConfigurator] Templates unavailable');
        }
    }
    
    createActionHandlers() {
        return {
            'new-message': () => this.handleNewMessage(),
            'load-saved': () => this.uiHandler.showStatus('En desarrollo', 'info'),
            'use-template': () => this.handleUseTemplate(),
            'reset-controls': () => this.handleResetControls(),
            'generate-audio': () => this.handleGenerateAudio(),
// ELIMINADO:             'save-message': () => this.handleSaveMessage(),
// ELIMINADO:             'send-radio': () => this.handleSendRadio(),
// ELIMINADO:             'download-audio': () => this.handleDownloadAudio(),
            'clear-result': () => this.handleClearResult(),
            updateField: (field, value) => {
                this.stateManager.updateField(field, value);
                if (field === 'voice') {
                    this.profileHandler.applyVoicePreset(value);
                    this.updateComponentsFromState();
                }
            },
            updateText: (text) => {
                this.stateManager.updateField('text', text);
                this.uiHandler.updateCharCounter(text.length);
            }
        };
    }
    
    async handleNewMessage() {
        if (this.stateManager.hasChanges() && !confirm('¿Crear nuevo mensaje sin guardar?')) {
            return;
        }
        
        await this.loadResources();
        await this.initializeComponents();
        this.uiHandler.showStatus('Nuevo mensaje', 'info');
    }
    
    async handleUseTemplate() {
        try {
            const result = await this.templateHandler.showSelector();
            
            // Actualizar texto
            this.container.querySelector('#message-text').value = result.text;
            this.stateManager.updateField('text', result.text);
            this.uiHandler.updateCharCounter(result.text.length);
            
            // Actualizar categoría
            if (result.category) {
                this.container.querySelector('#message-category').value = result.category;
                this.stateManager.updateField('category', result.category);
            }
            
            // Actualizar voz si tiene recomendación
            if (result.metadata.recommendedVoice) {
                this.container.querySelector('#message-voice').value = result.metadata.recommendedVoice;
                this.stateManager.updateField('voice', result.metadata.recommendedVoice);
                this.profileHandler.applyVoicePreset(result.metadata.recommendedVoice);
                this.updateComponentsFromState();
            }
            
            this.uiHandler.showStatus('Plantilla aplicada', 'success');
            
        } catch (error) {
            if (error.message !== 'Cancelado por usuario') {
                this.uiHandler.showStatus(error.message, 'error');
            }
        }
    }
    
    handleResetControls() {
        if (!confirm('¿Restaurar controles a valores por defecto?')) return;
        
        this.profileHandler.resetToDefaults();
        this.updateComponentsFromState();
        this.uiHandler.showStatus('Controles restaurados', 'info');
    }
    
    async handleGenerateAudio() {
        try {
            this.uiHandler.showStatus('Generando audio...', 'loading');
            
            const message = this.stateManager.getCurrentMessage();
            
            // Log para debugging
            console.log('[Generate] Message settings:', message.settings);
            
            const result = await this.audioHandler.generate(message);
            
            this.stateManager.updateField('audioFilename', result.filename);
            this.stateManager.updateField('azuracastFilename', result.azuracastFilename);
            
            this.uiHandler.showAudioPlayer(result.filename);
            this.uiHandler.showStatus('✅ Audio generado y guardado automáticamente en la Biblioteca', 'success');
            
            // Mostrar texto procesado si existe
            const processedTextEl = this.container.querySelector('#processedText');
            if (processedTextEl && result.processed_text) {
                processedTextEl.textContent = result.processed_text;
            }
            
            // Mostrar botón de guardar
            const saveBtn = this.container.querySelector('#saveMessageBtn');
            if (saveBtn) {
                saveBtn.style.display = 'inline-flex';
            }
            
        } catch (error) {
            this.uiHandler.showStatus(error.message, 'error');
        }
    }
    
    async handleSaveMessage() {
        const message = this.stateManager.getCurrentMessage();
        
        // Verificar que hay texto
        if (!message.text?.trim()) {
            this.uiHandler.showStatus('No hay mensaje para guardar', 'error');
            return;
        }
        
        // Verificar que hay audio generado
        if (!message.audioFilename || !message.azuracastFilename) {
            this.uiHandler.showStatus('Debes generar el audio primero', 'error');
            return;
        }
        
        try {
            // Cargar y mostrar modal
            const { default: SaveMessageModal } = await import('./components/save-message-modal.js');
            
            const result = await SaveMessageModal.open({
                messageText: message.text
            });
            
            // Preparar datos completos para guardar
            const messageData = {
                ...message,
                id: message.id || this.generateId(),
                title: result.title,
                category: result.category,
                excerpt: message.text.substring(0, 100) + '...',
                savedAt: Date.now()
            };
            
            // Guardar en storage local
            storageManager.save(`library_message_${messageData.id}`, messageData);
            
            // Guardar en backend
            await this.saveToBackend(messageData);
            
            // Emitir evento
            eventBus.emit('message:saved:library', messageData);
            
            this.uiHandler.showStatus('¡Mensaje guardado en la biblioteca!', 'success');
            
            // Preguntar si crear nuevo mensaje
            setTimeout(() => {
                if (confirm('¿Deseas crear un nuevo mensaje?')) {
                    this.handleNewMessage();
                }
            }, 1000);
            
        } catch (error) {
            if (error.message && error.message !== 'Cancelado por usuario') {
                console.error('Error guardando mensaje:', error);
                this.uiHandler.showStatus('Error al guardar', 'error');
            }
        }
    }
    
    async saveToBackend(messageData) {
        try {
            const response = await fetch('/api/library-metadata.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'save',
                    data: messageData
                })
            });
            
            if (!response.ok) {
                throw new Error('Error al guardar en servidor');
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Error desconocido');
            }
            
        } catch (error) {
            console.error('Error guardando en backend:', error);
            // No lanzar error para que al menos quede guardado localmente
        }
    }
    
    generateId() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    async handleSendRadio() {
        try {
            const filename = this.stateManager.getCurrentMessage().azuracastFilename;
            await this.audioHandler.sendToRadio(filename);
            this.uiHandler.showStatus('¡Enviado a la radio!', 'success');
        } catch (error) {
            this.uiHandler.showStatus(error.message, 'error');
        }
    }
    
    handleDownloadAudio() {
        try {
            const filename = this.stateManager.getCurrentMessage().audioFilename;
            this.audioHandler.downloadAudio(filename);
        } catch (error) {
            this.uiHandler.showStatus(error.message, 'error');
        }
    }
    
    handleClearResult() {
        // Ocultar el player de audio
        const playerContainer = this.container.querySelector('#audio-player-container');
        if (playerContainer) {
            playerContainer.style.display = 'none';
        }
        
        // Ocultar botón de guardar
        const saveBtn = this.container.querySelector('#saveMessageBtn');
        if (saveBtn) {
            saveBtn.style.display = 'none';
        }
        
        // Limpiar el audio actual
        this.audioHandler.clear();
        
        // Limpiar campos relacionados en el estado
        this.stateManager.updateField('audioFilename', null);
        this.stateManager.updateField('azuracastFilename', null);
        
        this.uiHandler.showStatus('Audio limpiado', 'info');
    }
    
    handleProfileChange(profile) {
        try {
            const result = this.profileHandler.loadProfile(profile);
            
            if (result.voice) {
                this.container.querySelector('#message-voice').value = result.voice;
            }
            
            this.updateComponentsFromState();
            this.uiHandler.showStatus(`Perfil "${profile.name}" cargado`, 'success');
            
        } catch (error) {
            this.uiHandler.showStatus(error.message, 'error');
        }
    }
    
    updateComponentsFromState() {
        const state = this.stateManager.getCurrentMessage();
        
        // SIMPLIFICADO: Actualizar sliders con valores en porcentaje
        const updates = {
            styleSlider: Math.round((state.settings.style || 0.5) * 100),
            stabilitySlider: Math.round((state.settings.stability || 0.75) * 100),
            similaritySlider: Math.round((state.settings.similarity_boost || 0.8) * 100),
            speakerBoostToggle: state.settings.use_speaker_boost !== false
        };
        
        console.log('[UpdateComponents] Valores a establecer:', updates);
        
        Object.entries(updates).forEach(([name, value]) => {
            if (this.components[name]?.setValue && value !== undefined) {
                this.components[name].setValue(value);
            }
        });
    }
    
    cleanup() {
        this.stateManager?.reset();
        this.audioHandler?.clear();
        this.components = {};
        this.container = null;
    }
}