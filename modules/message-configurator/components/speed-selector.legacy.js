/**
 * Speed Selector Component
 * Selector visual de velocidad con iconos
 * @module SpeedSelector
 */

export class SpeedSelector {
    constructor() {
        this.speeds = [
            {
                id: 'muy_lento',
                label: 'Muy Lento',
                icon: '🐌',
                description: 'Para mensajes que requieren máxima claridad'
            },
            {
                id: 'lento',
                label: 'Lento',
                icon: '🐢',
                description: 'Ritmo pausado y claro'
            },
            {
                id: 'normal',
                label: 'Normal',
                icon: '👤',
                description: 'Velocidad estándar recomendada',
                default: true
            },
            {
                id: 'rapido',
                label: 'Rápido',
                icon: '🏃',
                description: 'Para mensajes dinámicos'
            },
            {
                id: 'emergencia',
                label: 'Emergencia',
                icon: '🚨',
                description: 'Máxima velocidad para urgencias'
            }
        ];
        
        this.selectedSpeed = 'normal'; // Default
        this.onChange = null;
    }
    
    /**
     * Renderiza el componente
     * @param {HTMLElement} container - Contenedor donde renderizar
     * @param {Object} options - Opciones de configuración
     */
    static async render(container, options = {}) {
        const instance = new SpeedSelector();
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
            <div class="speed-selector" role="radiogroup" aria-label="Seleccionar velocidad">
                ${this.speeds.map(speed => `
                    <div class="speed-option ${speed.id === this.selectedSpeed ? 'speed-option--active' : ''}" 
                         data-speed-id="${speed.id}"
                         role="radio"
                         aria-checked="${speed.id === this.selectedSpeed}"
                         tabindex="${speed.id === this.selectedSpeed ? '0' : '-1'}"
                         title="${speed.description}">
                        <span class="speed-option__icon" aria-hidden="true">${speed.icon}</span>
                        <span class="speed-option__label">${speed.label}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * Adjunta los event listeners
     */
    attachEvents(container) {
        const options = container.querySelectorAll('.speed-option');
        
        options.forEach(option => {
            // Click en opción
            option.addEventListener('click', () => {
                this.selectSpeed(option.dataset.speedId, container);
            });
            
            // Soporte teclado
            option.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectSpeed(option.dataset.speedId, container);
                } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.navigateSpeed('next', container);
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.navigateSpeed('prev', container);
                }
            });
            
            // Tooltip en hover
            let tooltipTimeout;
            option.addEventListener('mouseenter', () => {
                tooltipTimeout = setTimeout(() => {
                    this.showTooltip(option);
                }, 500);
            });
            
            option.addEventListener('mouseleave', () => {
                clearTimeout(tooltipTimeout);
                this.hideTooltip();
            });
        });
        
        // Atajos de teclado globales (1-5)
        container.addEventListener('keydown', (e) => {
            const num = parseInt(e.key);
            if (num >= 1 && num <= 5) {
                const speedId = this.speeds[num - 1]?.id;
                if (speedId) {
                    this.selectSpeed(speedId, container);
                }
            }
        });
    }
    
    /**
     * Selecciona una velocidad
     */
    selectSpeed(speedId, container) {
        if (this.selectedSpeed === speedId) return;
        
        // Actualizar estado
        this.selectedSpeed = speedId;
        
        // Actualizar UI con animación
        container.querySelectorAll('.speed-option').forEach(option => {
            const isSelected = option.dataset.speedId === speedId;
            
            // Remover clase activa con transición
            if (option.classList.contains('speed-option--active') && !isSelected) {
                option.classList.add('speed-option--deactivating');
                setTimeout(() => {
                    option.classList.remove('speed-option--active', 'speed-option--deactivating');
                }, 150);
            }
            
            // Agregar clase activa
            if (isSelected) {
                option.classList.add('speed-option--active');
                option.setAttribute('aria-checked', 'true');
                option.setAttribute('tabindex', '0');
                option.focus();
            } else {
                option.setAttribute('aria-checked', 'false');
                option.setAttribute('tabindex', '-1');
            }
        });
        
        // Disparar evento
        this.triggerChange();
        
        // Animación visual de cambio
        this.animateSpeedChange(speedId);
    }
    
    /**
     * Navega entre velocidades con teclado
     */
    navigateSpeed(direction, container) {
        const currentIndex = this.speeds.findIndex(s => s.id === this.selectedSpeed);
        let newIndex;
        
        if (direction === 'next') {
            newIndex = Math.min(this.speeds.length - 1, currentIndex + 1);
        } else {
            newIndex = Math.max(0, currentIndex - 1);
        }
        
        if (newIndex !== currentIndex) {
            this.selectSpeed(this.speeds[newIndex].id, container);
        }
    }
    
    /**
     * Muestra tooltip
     */
    showTooltip(option) {
        const speedData = this.speeds.find(s => s.id === option.dataset.speedId);
        if (!speedData) return;
        
        // Crear tooltip si no existe
        let tooltip = document.getElementById('speed-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'speed-tooltip';
            tooltip.className = 'speed-tooltip';
            document.body.appendChild(tooltip);
        }
        
        // Posicionar y mostrar
        const rect = option.getBoundingClientRect();
        tooltip.textContent = speedData.description;
        tooltip.style.left = rect.left + (rect.width / 2) + 'px';
        tooltip.style.top = (rect.top - 40) + 'px';
        tooltip.classList.add('speed-tooltip--visible');
    }
    
    /**
     * Oculta tooltip
     */
    hideTooltip() {
        const tooltip = document.getElementById('speed-tooltip');
        if (tooltip) {
            tooltip.classList.remove('speed-tooltip--visible');
        }
    }
    
    /**
     * Animación visual de cambio
     */
    animateSpeedChange(speedId) {
        // Emitir evento para feedback visual/auditivo
        const event = new CustomEvent('speed:changed', {
            detail: { speedId },
            bubbles: true
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Dispara evento de cambio
     */
    triggerChange() {
        if (this.onChange) {
            const selectedSpeedData = this.speeds.find(s => s.id === this.selectedSpeed);
            this.onChange(this.selectedSpeed, selectedSpeedData);
        }
    }
    
    /**
     * Obtiene la velocidad seleccionada
     */
    getValue() {
        return this.selectedSpeed;
    }
    
    /**
     * Establece la velocidad seleccionada
     */
    setValue(speedId) {
        if (this.speeds.find(s => s.id === speedId)) {
            this.selectedSpeed = speedId;
        }
    }
}

// Export default para import dinámico
export default SpeedSelector;