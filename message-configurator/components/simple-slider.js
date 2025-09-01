/**
 * Simple Slider Component - Versión minimalista
 * Basado en el patrón de Supermercado
 * @module SimpleSlider
 */

export class SimpleSlider {
    /**
     * Renderiza un slider simple
     * UI siempre en 0-100, conversión solo al final
     */
    static async render(container, options = {}) {
        const {
            label = 'Control',
            icon = '🎚️',
            min = 0,
            max = 100,
            value = 50,
            unit = '%',
            onChange = null
        } = options;
        
        container.innerHTML = `
            <div class="simple-slider">
                <label class="simple-slider__label">
                    <span class="simple-slider__icon">${icon}</span>
                    <span>${label}</span>
                </label>
                <div class="simple-slider__control">
                    <input type="range" 
                           class="simple-slider__input"
                           min="${min}" 
                           max="${max}" 
                           value="${value}"
                           id="${container.id}-input">
                    <span class="simple-slider__value">${value}${unit}</span>
                </div>
            </div>
        `;
        
        // Event listeners
        const input = container.querySelector('.simple-slider__input');
        const display = container.querySelector('.simple-slider__value');
        
        input.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            display.textContent = val + unit;
            
            // Callback con valor 0-100 (sin conversión)
            if (onChange) {
                onChange(val);
            }
        });
        
        // Retornar métodos útiles
        return {
            getValue: () => parseInt(input.value),
            setValue: (newValue) => {
                input.value = newValue;
                display.textContent = newValue + unit;
                // Disparar evento input para mantener sincronizado
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        };
    }
}

// Export default para import dinámico
export default SimpleSlider;