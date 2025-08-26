/**
 * Tag Input Component
 * Componente para agregar categorías/tags con sugerencias
 * @module TagInput
 */

export class TagInput {
    constructor() {
        this.tags = [];
        this.maxTags = 5;
        this.suggestions = [
            'Promoción', 'Oferta', 'Evento', 'Información', 
            'Urgente', 'Horario', 'Servicio', 'Novedad'
        ];
        this.onChange = null;
    }
    
    /**
     * Renderiza el componente
     * @param {HTMLElement} container - Contenedor donde renderizar
     * @param {Object} options - Opciones de configuración
     */
    static async render(container, options = {}) {
        const instance = new TagInput();
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
            <div class="tag-input">
                <div class="tag-input__container" tabindex="0">
                    ${this.tags.map(tag => `
                        <div class="tag-input__tag" data-tag="${tag}">
                            <span class="tag-input__tag-text">${tag}</span>
                            <button class="tag-input__tag-remove" aria-label="Eliminar ${tag}">×</button>
                        </div>
                    `).join('')}
                    <input 
                        type="text" 
                        class="tag-input__input" 
                        placeholder="${this.tags.length >= this.maxTags ? 'Límite alcanzado' : this.placeholder || 'Agregar categoría...'}"
                        ${this.tags.length >= this.maxTags ? 'disabled' : ''}
                        autocomplete="off"
                    >
                </div>
                <div class="tag-input__suggestions">
                    ${this.suggestions.map(sug => `
                        <div class="tag-input__suggestion" data-suggestion="${sug}">${sug}</div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Adjunta los event listeners
     */
    attachEvents(container) {
        const input = container.querySelector('.tag-input__input');
        const containerEl = container.querySelector('.tag-input__container');
        const suggestions = container.querySelector('.tag-input__suggestions');
        
        // Focus en input al clickear container
        containerEl.addEventListener('click', (e) => {
            if (e.target === containerEl) {
                input.focus();
            }
        });
        
        // Agregar tag con Enter
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && input.value.trim()) {
                e.preventDefault();
                this.addTag(input.value.trim(), container);
                input.value = '';
                this.hideSuggestions(suggestions);
            } else if (e.key === 'Backspace' && !input.value && this.tags.length > 0) {
                // Eliminar último tag con backspace
                this.removeTag(this.tags[this.tags.length - 1], container);
            }
        });
        
        // Mostrar sugerencias
        input.addEventListener('focus', () => {
            if (this.tags.length < this.maxTags) {
                this.showSuggestions(suggestions);
            }
        });
        
        // Ocultar sugerencias al perder foco
        input.addEventListener('blur', (e) => {
            setTimeout(() => {
                this.hideSuggestions(suggestions);
            }, 200);
        });
        
        // Click en sugerencia
        container.querySelectorAll('.tag-input__suggestion').forEach(sug => {
            sug.addEventListener('click', () => {
                const value = sug.dataset.suggestion;
                this.addTag(value, container);
                input.value = '';
                input.focus();
            });
        });
        
        // Eliminar tags
        container.querySelectorAll('.tag-input__tag-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tag = e.target.closest('.tag-input__tag').dataset.tag;
                this.removeTag(tag, container);
            });
        });
    }
    
    /**
     * Agrega un tag
     */
    addTag(tag, container) {
        if (this.tags.includes(tag) || this.tags.length >= this.maxTags) return;
        
        this.tags.push(tag);
        this.updateUI(container);
        this.triggerChange();
    }
    
    /**
     * Elimina un tag
     */
    removeTag(tag, container) {
        this.tags = this.tags.filter(t => t !== tag);
        this.updateUI(container);
        this.triggerChange();
    }
    
    /**
     * Actualiza la UI
     */
    updateUI(container) {
        const newHTML = this.getHTML();
        container.innerHTML = newHTML;
        this.attachEvents(container);
    }
    
    /**
     * Muestra sugerencias
     */
    showSuggestions(suggestions) {
        suggestions.classList.add('tag-input__suggestions--active');
    }
    
    /**
     * Oculta sugerencias
     */
    hideSuggestions(suggestions) {
        suggestions.classList.remove('tag-input__suggestions--active');
    }
    
    /**
     * Dispara evento de cambio
     */
    triggerChange() {
        if (this.onChange) {
            this.onChange(this.tags);
        }
    }
}

// Export default para import dinámico
export default TagInput;