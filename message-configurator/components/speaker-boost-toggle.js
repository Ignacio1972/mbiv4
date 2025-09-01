/**
 * Speaker Boost Toggle Component
 * Toggle switch visual para mejorar altavoz
 * @module SpeakerBoostToggle
 */

export class SpeakerBoostToggle {
    constructor() {
        this.enabled = true; // Default activado
        this.onChange = null;
    }
    
    /**
     * Renderiza el componente
     * @param {HTMLElement} container - Contenedor donde renderizar
     * @param {Object} options - Opciones de configuración
     */
    static async render(container, options = {}) {
        const instance = new SpeakerBoostToggle();
        Object.assign(instance, options);
        
        container.innerHTML = instance.getHTML();
        instance.attachEvents(container);
        
        return instance;
    }
    
    /**
     * Genera el HTML del componente
     */
    getHTML() {
        return `
            <div class="speaker-boost-toggle">
                <label class="toggle-switch">
                    <input type="checkbox" 
                           class="toggle-switch__input" 
                           id="speakerBoostToggle"
                           ${this.enabled ? 'checked' : ''}>
                    <span class="toggle-switch__slider"></span>
                    <span class="toggle-switch__label">
                        <span class="toggle-switch__icon">🔊</span>
                        <span class="toggle-switch__text">Mejorar Altavoz</span>
                    </span>
                </label>
             
            </div>
        `;
    }
    
    /**
     * Adjunta event listeners
     */
    attachEvents(container) {
        const toggle = container.querySelector('#speakerBoostToggle');
        const status = container.querySelector('.toggle-switch__status');
        
        toggle.addEventListener('change', (e) => {
            this.enabled = e.target.checked;
            
            // Actualizar texto de estado
          //   status.textContent = this.enabled ? 'Activado' : 'Desactivado';
            
            // Animación visual
            const slider = container.querySelector('.toggle-switch__slider');
            if (this.enabled) {
                slider.classList.add('toggle-switch__slider--active');
            } else {
                slider.classList.remove('toggle-switch__slider--active');
            }
            
            // Disparar callback
            if (this.onChange) {
                this.onChange(this.enabled);
            }
        });
    }
    
    /**
     * Obtiene el valor actual
     */
    getValue() {
        return this.enabled;
    }
    
    /**
     * Establece el valor
     */
    setValue(value) {
        this.enabled = !!value;
        const toggle = document.querySelector('#speakerBoostToggle');
        if (toggle) {
            toggle.checked = this.enabled;
        }
    }
}

// Export default para import dinámico
export default SpeakerBoostToggle;