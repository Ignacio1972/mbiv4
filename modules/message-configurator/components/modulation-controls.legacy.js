/**
 * Modulation Controls Component
 * Controles para modulación de voz (pitch y volumen)
 * @module ModulationControls
 */

import AudioSlider from './audio-slider.js';

export class ModulationControls {
    constructor() {
        this.pitch = 0; // -20 a +20%
        this.volume = 0; // -6 a +6 dB
        this.dynamicRate = false;
        this.onChange = null;
        
        // Slider instances
        this.pitchSlider = null;
        this.volumeSlider = null;
    }
    
    /**
     * Renderiza el componente
     * @param {HTMLElement} container - Contenedor donde renderizar
     * @param {Object} options - Opciones de configuración
     */
    static async render(container, options = {}) {
        const instance = new ModulationControls();
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
            <div class="modulation-controls">
                <div class="modulation-controls__header">
                    <h4 class="modulation-controls__title">
                        <span class="modulation-controls__icon">🎚️</span>
                        Modulación de Voz
                    </h4>
                    <p class="modulation-controls__description">
                        Ajusta las características de la voz para darle más personalidad
                    </p>
                </div>
                
                <div class="modulation-controls__content">
                    <!-- Slider de Pitch -->
                    <div id="pitchSlider"></div>
                    
                    <!-- Slider de Volumen -->
                    <div id="volumeSlider"></div>
                    
                    <!-- Control de velocidad dinámica -->
                    <div class="modulation-controls__dynamic">
                        <label class="toggle-control">
                            <input type="checkbox" 
                                   class="toggle-control__input" 
                                   id="dynamicRate"
                                   ${this.dynamicRate ? 'checked' : ''}>
                            <span class="toggle-control__slider"></span>
                            <span class="toggle-control__label">
                                <span class="toggle-control__icon">🌊</span>
                                Velocidad dinámica (varía automáticamente)
                            </span>
                        </label>
                        <small class="form-help">
                            La velocidad variará sutilmente durante el mensaje para hacerlo más natural
                        </small>
                    </div>
                    
                    <!-- Presets de modulación -->
                    <div class="modulation-controls__presets">
                        <label class="form-label">
                            <span class="form-label__icon">🎭</span>
                            Presets de carácter
                        </label>
                        <div class="modulation-presets">
                            <button class="modulation-preset" data-preset="neutral" title="Voz natural sin modificaciones">
                                <span class="modulation-preset__icon">😐</span>
                                <span class="modulation-preset__name">Neutral</span>
                                <span class="modulation-preset__values">0% / 0dB</span>
                            </button>
                            <button class="modulation-preset" data-preset="energetic" title="Voz más aguda y fuerte">
                                <span class="modulation-preset__icon">😄</span>
                                <span class="modulation-preset__name">Energético</span>
                                <span class="modulation-preset__values">+10% / +2dB</span>
                            </button>
                            <button class="modulation-preset" data-preset="serious" title="Voz más grave y moderada">
                                <span class="modulation-preset__icon">🧐</span>
                                <span class="modulation-preset__name">Serio</span>
                                <span class="modulation-preset__values">-10% / -1dB</span>
                            </button>
                            <button class="modulation-preset" data-preset="dramatic" title="Voz muy expresiva">
                                <span class="modulation-preset__icon">🎭</span>
                                <span class="modulation-preset__name">Dramático</span>
                                <span class="modulation-preset__values">+15% / +3dB</span>
                            </button>
                            <button class="modulation-preset" data-preset="soft" title="Voz suave y calmada">
                                <span class="modulation-preset__icon">🤗</span>
                                <span class="modulation-preset__name">Suave</span>
                                <span class="modulation-preset__values">-5% / -2dB</span>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Visualizador de onda -->
                    <div class="modulation-controls__visualizer">
                        <label class="form-label">
                            <span class="form-label__icon">📊</span>
                            Visualización del efecto
                        </label>
                        <div class="wave-visualizer">
                            <div class="wave-visualizer__line wave-visualizer__line--original"></div>
                            <div class="wave-visualizer__line wave-visualizer__line--modulated" 
                                 style="transform: scaleY(${1 + (this.pitch / 100)}) scaleX(${1 + (this.volume / 20)})"></div>
                            <div class="wave-visualizer__labels">
                                <span class="wave-visualizer__label">Original</span>
                                <span class="wave-visualizer__label wave-visualizer__label--modulated">Modulado</span>
                            </div>
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
        // Slider de Pitch
        const pitchContainer = container.querySelector('#pitchSlider');
        this.pitchSlider = await AudioSlider.render(pitchContainer, {
            label: 'Tono (Pitch)',
            icon: '🎵',
            min: -20,
            max: 20,
            value: this.pitch,
            step: 1,
            unit: '%',
            minLabel: 'Grave',
            maxLabel: 'Agudo',
            showLabels: true,
            colorGradient: true,
            formatValue: (value) => {
                const sign = value > 0 ? '+' : '';
                return sign + value + '%';
            },
            onInput: (value) => {
                this.pitch = value;
                this.updateVisualizer(container);
            },
            onChange: (value) => {
                this.pitch = value;
                this.triggerChange();
            }
        });
        
        // Slider de Volumen
        const volumeContainer = container.querySelector('#volumeSlider');
        this.volumeSlider = await AudioSlider.render(volumeContainer, {
            label: 'Volumen',
            icon: '🔊',
            min: -6,
            max: 6,
            value: this.volume,
            step: 0.5,
            unit: 'dB',
            minLabel: 'Suave',
            maxLabel: 'Fuerte',
            showLabels: true,
            formatValue: (value) => {
                const sign = value > 0 ? '+' : '';
                return sign + value + 'dB';
            },
            onInput: (value) => {
                this.volume = value;
                this.updateVisualizer(container);
            },
            onChange: (value) => {
                this.volume = value;
                this.triggerChange();
            }
        });
    }
    
    /**
     * Adjunta event listeners
     */
    attachEvents(container) {
        // Toggle velocidad dinámica
        const dynamicToggle = container.querySelector('#dynamicRate');
        dynamicToggle.addEventListener('change', (e) => {
            this.dynamicRate = e.target.checked;
            this.triggerChange();
            
            // Animación visual
            if (this.dynamicRate) {
                container.querySelector('.wave-visualizer').classList.add('wave-visualizer--dynamic');
            } else {
                container.querySelector('.wave-visualizer').classList.remove('wave-visualizer--dynamic');
            }
        });
        
        // Botones de preset
        container.querySelectorAll('[data-preset]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.applyPreset(btn.dataset.preset, container);
            });
        });
        
        // Hover en presets para preview
        container.querySelectorAll('.modulation-preset').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                this.previewPreset(btn.dataset.preset, container);
            });
            
            btn.addEventListener('mouseleave', () => {
                this.updateVisualizer(container);
            });
        });
    }
    
    /**
     * Aplica un preset
     */
    applyPreset(preset, container) {
        const presets = {
            neutral: { pitch: 0, volume: 0, dynamic: false },
            energetic: { pitch: 10, volume: 2, dynamic: true },
            serious: { pitch: -10, volume: -1, dynamic: false },
            dramatic: { pitch: 15, volume: 3, dynamic: true },
            soft: { pitch: -5, volume: -2, dynamic: false }
        };
        
        const settings = presets[preset];
        if (!settings) return;
        
        // Aplicar valores
        this.pitch = settings.pitch;
        this.volume = settings.volume;
        this.dynamicRate = settings.dynamic;
        
        // Actualizar sliders
        this.pitchSlider.setValue(settings.pitch);
        this.volumeSlider.setValue(settings.volume);
        
        // Actualizar toggle
        document.querySelector('#dynamicRate').checked = settings.dynamic;
        
        // Actualizar visualizador
        this.updateVisualizer(container);
        
        // Feedback visual
        container.querySelectorAll('.modulation-preset').forEach(btn => {
            btn.classList.toggle('modulation-preset--active', btn.dataset.preset === preset);
        });
        
        // Animación
        container.querySelector('.modulation-controls__content').classList.add('preset-applied');
        setTimeout(() => {
            container.querySelector('.modulation-controls__content').classList.remove('preset-applied');
        }, 300);
        
        this.triggerChange();
    }
    
    /**
     * Preview de preset sin aplicar
     */
    previewPreset(preset, container) {
        const presets = {
            neutral: { pitch: 0, volume: 0 },
            energetic: { pitch: 10, volume: 2 },
            serious: { pitch: -10, volume: -1 },
            dramatic: { pitch: 15, volume: 3 },
            soft: { pitch: -5, volume: -2 }
        };
        
        const settings = presets[preset];
        if (!settings) return;
        
        // Actualizar solo visualizador temporalmente
        const modLine = container.querySelector('.wave-visualizer__line--modulated');
        modLine.style.transform = `scaleY(${1 + (settings.pitch / 100)}) scaleX(${1 + (settings.volume / 20)})`;
        modLine.style.opacity = '0.7';
    }
    
    /**
     * Actualiza el visualizador
     */
    updateVisualizer(container) {
        const modLine = container.querySelector('.wave-visualizer__line--modulated');
        modLine.style.transform = `scaleY(${1 + (this.pitch / 100)}) scaleX(${1 + (this.volume / 20)})`;
        modLine.style.opacity = '1';
        
        // Actualizar clase dinámica
        const visualizer = container.querySelector('.wave-visualizer');
        if (this.dynamicRate) {
            visualizer.classList.add('wave-visualizer--dynamic');
        } else {
            visualizer.classList.remove('wave-visualizer--dynamic');
        }
    }
    
    /**
     * Dispara evento de cambio
     */
    triggerChange() {
        if (this.onChange) {
            this.onChange({
                pitch: this.pitch,
                volume: this.volume,
                dynamic_rate: this.dynamicRate
            });
        }
    }
    
    /**
     * Obtiene la configuración actual
     */
    getValue() {
        return {
            pitch: this.pitch,
            volume: this.volume,
            dynamic_rate: this.dynamicRate
        };
    }
}

// Export default para import dinámico
export default ModulationControls;