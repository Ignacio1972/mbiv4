/**
 * Pause Controls Component
 * Controles para gestión de pausas en el audio
 * @module PauseControls
 */

import AudioSlider from './audio-slider.js';

export class PauseControls {
    constructor() {
        this.enabled = true;
        this.sentencePause = 0.5; // segundos
        this.commaPause = 0.2; // segundos
        this.customMarkers = [];
        this.onChange = null;
        
        // Sliders instances
        this.sentenceSlider = null;
        this.commaSlider = null;
    }
    
    /**
     * Renderiza el componente
     * @param {HTMLElement} container - Contenedor donde renderizar
     * @param {Object} options - Opciones de configuración
     */
    static async render(container, options = {}) {
        const instance = new PauseControls();
        Object.assign(instance, options);
        
        container.innerHTML = instance.getHTML();
        await instance.attachComponents(container);
        instance.attachEvents(container);
        
        return instance;
    }
    
    /**
     * Genera el HTML del componente
     */
    getHTML() {
        return `
            <div class="pause-controls">
                <div class="pause-controls__header">
                    <label class="toggle-control">
                        <input type="checkbox" 
                               class="toggle-control__input" 
                               id="pausesEnabled"
                               ${this.enabled ? 'checked' : ''}>
                        <span class="toggle-control__slider"></span>
                        <span class="toggle-control__label">
                            <span class="toggle-control__icon">⏸️</span>
                            Activar pausas automáticas
                        </span>
                    </label>
                </div>
                
                <div class="pause-controls__settings ${!this.enabled ? 'pause-controls__settings--disabled' : ''}">
                    <!-- Slider para pausas de oraciones -->
                    <div id="sentencePauseSlider"></div>
                    
                    <!-- Slider para pausas de comas -->
                    <div id="commaPauseSlider"></div>
                    
                    <!-- Marcadores personalizados -->
                    <div class="pause-controls__custom">
                        <label class="form-label">
                            <span class="form-label__icon">🏷️</span>
                            Marcadores de pausa personalizados
                        </label>
                        <div class="pause-controls__markers">
                            <input type="text" 
                                   class="form-input pause-controls__marker-input" 
                                   placeholder="Escriba || donde quiera una pausa de 1 segundo"
                                   value="${this.customMarkers.join(' || ')}">
                            <small class="form-help">
                                Use || en su texto para agregar pausas de 1 segundo. 
                                Ejemplo: "Atención || oferta especial"
                            </small>
                        </div>
                        
                        <!-- Presets de pausas -->
                        <div class="pause-controls__presets">
                            <span class="pause-controls__preset-label">Presets rápidos:</span>
                            <button class="btn-chip" data-preset="normal">
                                Normal
                            </button>
                            <button class="btn-chip" data-preset="dramatic">
                                Dramático
                            </button>
                            <button class="btn-chip" data-preset="fast">
                                Rápido
                            </button>
                            <button class="btn-chip" data-preset="slow">
                                Lento
                            </button>
                        </div>
                    </div>
                    
                    <!-- Vista previa de pausas -->
                    <div class="pause-controls__preview">
                        <label class="form-label">
                            <span class="form-label__icon">👁️</span>
                            Vista previa de pausas
                        </label>
                        <div class="pause-controls__preview-text">
                            Hola<span class="pause-dot" style="width: ${this.commaPause * 30}px"></span>, 
                            bienvenidos<span class="pause-dot" style="width: ${this.sentencePause * 30}px"></span>. 
                            Oferta especial<span class="pause-dot pause-dot--custom"></span> 
                            solo hoy<span class="pause-dot" style="width: ${this.sentencePause * 30}px"></span>.
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Adjunta componentes hijos
     */
    async attachComponents(container) {
        // Slider para pausas de oraciones
        const sentenceContainer = container.querySelector('#sentencePauseSlider');
        this.sentenceSlider = await AudioSlider.render(sentenceContainer, {
            label: 'Pausa entre frases (.)',
            icon: '📍',
            min: 10,
            max: 200,
            value: this.sentencePause * 100,
            step: 10,
            unit: 's',
            minLabel: '0.1s',
            maxLabel: '2s',
            formatValue: (value) => (value / 100).toFixed(1) + 's',
            onInput: (value) => {
                this.sentencePause = value / 100;
                this.updatePreview(container);
            },
            onChange: (value) => {
                this.sentencePause = value / 100;
                this.triggerChange();
            }
        });
        
        // Slider para pausas de comas
        const commaContainer = container.querySelector('#commaPauseSlider');
        this.commaSlider = await AudioSlider.render(commaContainer, {
            label: 'Pausa después de comas (,)',
            icon: '📌',
            min: 0,
            max: 100,
            value: this.commaPause * 100,
            step: 5,
            unit: 's',
            minLabel: '0s',
            maxLabel: '1s',
            formatValue: (value) => (value / 100).toFixed(1) + 's',
            onInput: (value) => {
                this.commaPause = value / 100;
                this.updatePreview(container);
            },
            onChange: (value) => {
                this.commaPause = value / 100;
                this.triggerChange();
            }
        });
    }
    
    /**
     * Adjunta event listeners
     */
    attachEvents(container) {
        // Toggle de activación
        const toggle = container.querySelector('#pausesEnabled');
        toggle.addEventListener('change', (e) => {
            this.enabled = e.target.checked;
            this.toggleSettings(container);
            this.triggerChange();
        });
        
        // Input de marcadores personalizados
        const markerInput = container.querySelector('.pause-controls__marker-input');
        markerInput.addEventListener('input', (e) => {
            const text = e.target.value;
            // Extraer marcadores ||
            this.customMarkers = text.split('||').map(s => s.trim()).filter(Boolean);
            this.updatePreview(container);
        });
        
        markerInput.addEventListener('blur', () => {
            this.triggerChange();
        });
        
        // Botones de preset
        container.querySelectorAll('[data-preset]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.applyPreset(btn.dataset.preset, container);
            });
        });
    }
    
    /**
     * Activa/desactiva configuraciones
     */
    toggleSettings(container) {
        const settings = container.querySelector('.pause-controls__settings');
        
        if (this.enabled) {
            settings.classList.remove('pause-controls__settings--disabled');
            this.sentenceSlider.setEnabled(true);
            this.commaSlider.setEnabled(true);
        } else {
            settings.classList.add('pause-controls__settings--disabled');
            this.sentenceSlider.setEnabled(false);
            this.commaSlider.setEnabled(false);
        }
    }
    
    /**
     * Aplica un preset de pausas
     */
    applyPreset(preset, container) {
        const presets = {
            normal: { sentence: 0.5, comma: 0.2 },
            dramatic: { sentence: 1.0, comma: 0.5 },
            fast: { sentence: 0.3, comma: 0.1 },
            slow: { sentence: 0.8, comma: 0.4 }
        };
        
        const settings = presets[preset];
        if (!settings) return;
        
        // Actualizar valores
        this.sentencePause = settings.sentence;
        this.commaPause = settings.comma;
        
        // Actualizar sliders
        this.sentenceSlider.setValue(settings.sentence * 100);
        this.commaSlider.setValue(settings.comma * 100);
        
        // Actualizar preview
        this.updatePreview(container);
        
        // Feedback visual
        container.querySelectorAll('.btn-chip').forEach(btn => {
            btn.classList.toggle('btn-chip--active', btn.dataset.preset === preset);
        });
        
        // Animar el cambio
        container.querySelector('.pause-controls__settings').classList.add('preset-applied');
        setTimeout(() => {
            container.querySelector('.pause-controls__settings').classList.remove('preset-applied');
        }, 300);
        
        this.triggerChange();
    }
    
    /**
     * Actualiza la vista previa
     */
    updatePreview(container) {
        const dots = container.querySelectorAll('.pause-dot:not(.pause-dot--custom)');
        dots[0].style.width = (this.commaPause * 30) + 'px';
        dots[1].style.width = (this.sentencePause * 30) + 'px';
        dots[2].style.width = (this.sentencePause * 30) + 'px';
    }
    
    /**
     * Dispara evento de cambio
     */
    triggerChange() {
        if (this.onChange) {
            this.onChange({
                enabled: this.enabled,
                sentence: this.sentencePause,
                comma: this.commaPause,
                custom_markers: this.customMarkers
            });
        }
    }
    
    /**
     * Obtiene la configuración actual
     */
    getValue() {
        return {
            enabled: this.enabled,
            sentence: this.sentencePause,
            comma: this.commaPause,
            custom_markers: this.customMarkers
        };
    }
    
    /**
     * Establece la configuración
     */
    setValue(config) {
        if (config.enabled !== undefined) this.enabled = config.enabled;
        if (config.sentence !== undefined) this.sentencePause = config.sentence;
        if (config.comma !== undefined) this.commaPause = config.comma;
        if (config.custom_markers !== undefined) this.customMarkers = config.custom_markers;
        
        // Actualizar UI si es necesario
    }
}

// Export default para import dinámico
export default PauseControls;