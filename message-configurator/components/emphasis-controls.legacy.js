/**
 * Emphasis Controls Component
 * Controles para gestión de énfasis en palabras
 * @module EmphasisControls
 */

export class EmphasisControls {
    constructor() {
        this.enabled = true;
        this.level = 'medium'; // soft, medium, strong
        this.autoNumbers = true;
        this.autoPrices = true;
        this.customWords = [];
        this.onChange = null;
        
        // Palabras predefinidas por categoría
        this.predefinedWords = {
            ofertas: ['gratis', 'descuento', 'oferta', 'promoción', 'rebaja', 'liquidación', '50%', '2x1'],
            urgencia: ['hoy', 'ahora', 'último', 'última', 'termina', 'finaliza', 'apúrate'],
            importante: ['importante', 'atención', 'aviso', 'urgente', 'nuevo', 'exclusivo'],
            celebracion: ['feliz', 'celebra', 'especial', 'gran', 'increíble', 'maravilloso']
        };
    }
    
    /**
     * Renderiza el componente
     * @param {HTMLElement} container - Contenedor donde renderizar
     * @param {Object} options - Opciones de configuración
     */
    static async render(container, options = {}) {
        const instance = new EmphasisControls();
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
            <div class="emphasis-controls">
                <div class="emphasis-controls__header">
                    <label class="toggle-control">
                        <input type="checkbox" 
                               class="toggle-control__input" 
                               id="emphasisEnabled"
                               ${this.enabled ? 'checked' : ''}>
                        <span class="toggle-control__slider"></span>
                        <span class="toggle-control__label">
                            <span class="toggle-control__icon">💪</span>
                            Activar énfasis automático
                        </span>
                    </label>
                </div>
                
                <div class="emphasis-controls__settings ${!this.enabled ? 'emphasis-controls__settings--disabled' : ''}">
                    <!-- Nivel de énfasis -->
                    <div class="emphasis-controls__level">
                        <label class="form-label">
                            <span class="form-label__icon">📊</span>
                            Nivel de énfasis
                        </label>
                        <div class="emphasis-level-selector">
                            <button class="emphasis-level ${this.level === 'soft' ? 'emphasis-level--active' : ''}" 
                                    data-level="soft">
                                <span class="emphasis-level__icon">🌱</span>
                                <span class="emphasis-level__text">Suave</span>
                            </button>
                            <button class="emphasis-level ${this.level === 'medium' ? 'emphasis-level--active' : ''}" 
                                    data-level="medium">
                                <span class="emphasis-level__icon">🌿</span>
                                <span class="emphasis-level__text">Medio</span>
                            </button>
                            <button class="emphasis-level ${this.level === 'strong' ? 'emphasis-level--active' : ''}" 
                                    data-level="strong">
                                <span class="emphasis-level__icon">🌳</span>
                                <span class="emphasis-level__text">Fuerte</span>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Opciones automáticas -->
                    <div class="emphasis-controls__auto">
                        <label class="toggle-control toggle-control--small">
                            <input type="checkbox" 
                                   class="toggle-control__input" 
                                   id="autoNumbers"
                                   ${this.autoNumbers ? 'checked' : ''}>
                            <span class="toggle-control__slider"></span>
                            <span class="toggle-control__label">
                                <span class="toggle-control__icon">🔢</span>
                                Enfatizar números automáticamente
                            </span>
                        </label>
                        
                        <label class="toggle-control toggle-control--small">
                            <input type="checkbox" 
                                   class="toggle-control__input" 
                                   id="autoPrices"
                                   ${this.autoPrices ? 'checked' : ''}>
                            <span class="toggle-control__slider"></span>
                            <span class="toggle-control__label">
                                <span class="toggle-control__icon">💲</span>
                                Enfatizar precios automáticamente ($)
                            </span>
                        </label>
                    </div>
                    
                    <!-- Palabras personalizadas -->
                    <div class="emphasis-controls__custom">
                        <label class="form-label">
                            <span class="form-label__icon">📝</span>
                            Palabras personalizadas para enfatizar
                        </label>
                        
                        <!-- Categorías rápidas -->
                        <div class="emphasis-controls__categories">
                            <span class="emphasis-controls__category-label">Agregar rápido:</span>
                            ${Object.entries(this.predefinedWords).map(([cat, words]) => `
                                <button class="btn-chip" data-category="${cat}" title="${words.join(', ')}">
                                    ${cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </button>
                            `).join('')}
                        </div>
                        
                        <!-- Lista de palabras -->
                        <div class="emphasis-controls__words" id="emphasisWords">
                            ${this.customWords.map(word => `
                                <div class="emphasis-word">
                                    <span class="emphasis-word__text">${word}</span>
                                    <button class="emphasis-word__remove" data-word="${word}" aria-label="Eliminar ${word}">×</button>
                                </div>
                            `).join('')}
                        </div>
                        
                        <!-- Input para agregar -->
                        <div class="emphasis-controls__input-group">
                            <input type="text" 
                                   class="form-input" 
                                   id="emphasisWordInput"
                                   placeholder="Escriba una palabra y presione Enter">
                            <button class="btn btn-secondary" id="addWordBtn">
                                <span>➕</span> Agregar
                            </button>
                        </div>
                    </div>
                    
                    <!-- Vista previa -->
                    <div class="emphasis-controls__preview">
                        <label class="form-label">
                            <span class="form-label__icon">👁️</span>
                            Vista previa de énfasis
                        </label>
                        <div class="emphasis-preview-text">
                            <span class="emphasis-preview__normal">¡Atención! </span>
                            <span class="emphasis-preview__${this.level}">Oferta especial</span>
                            <span class="emphasis-preview__normal"> solo </span>
                            <span class="emphasis-preview__${this.level}">hoy</span>
                            <span class="emphasis-preview__normal">: </span>
                            <span class="emphasis-preview__${this.level}">50% descuento</span>
                            <span class="emphasis-preview__normal"> en productos seleccionados. </span>
                            <span class="emphasis-preview__${this.level}">$9.990</span>
                            <span class="emphasis-preview__normal"> precio final.</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Adjunta event listeners
     */
    attachEvents(container) {
        // Toggle principal
        const mainToggle = container.querySelector('#emphasisEnabled');
        mainToggle.addEventListener('change', (e) => {
            this.enabled = e.target.checked;
            this.toggleSettings(container);
            this.triggerChange();
        });
        
        // Nivel de énfasis
        container.querySelectorAll('[data-level]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectLevel(btn.dataset.level, container);
            });
        });
        
        // Toggles automáticos
        container.querySelector('#autoNumbers').addEventListener('change', (e) => {
            this.autoNumbers = e.target.checked;
            this.triggerChange();
        });
        
        container.querySelector('#autoPrices').addEventListener('change', (e) => {
            this.autoPrices = e.target.checked;
            this.triggerChange();
        });
        
        // Categorías rápidas
        container.querySelectorAll('[data-category]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.addCategoryWords(btn.dataset.category, container);
            });
        });
        
        // Input de palabras
        const input = container.querySelector('#emphasisWordInput');
        const addBtn = container.querySelector('#addWordBtn');
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addCustomWord(input.value, container);
                input.value = '';
            }
        });
        
        addBtn.addEventListener('click', () => {
            this.addCustomWord(input.value, container);
            input.value = '';
            input.focus();
        });
        
        // Eliminar palabras (delegación de eventos)
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('emphasis-word__remove')) {
                this.removeWord(e.target.dataset.word, container);
            }
        });
    }
    
    /**
     * Activa/desactiva configuraciones
     */
    toggleSettings(container) {
        const settings = container.querySelector('.emphasis-controls__settings');
        
        if (this.enabled) {
            settings.classList.remove('emphasis-controls__settings--disabled');
        } else {
            settings.classList.add('emphasis-controls__settings--disabled');
        }
    }
    
    /**
     * Selecciona nivel de énfasis
     */
    selectLevel(level, container) {
        this.level = level;
        
        // Actualizar botones
        container.querySelectorAll('.emphasis-level').forEach(btn => {
            btn.classList.toggle('emphasis-level--active', btn.dataset.level === level);
        });
        
        // Actualizar preview
        this.updatePreview(container);
        
        // Animación
        container.querySelector('.emphasis-controls__preview').classList.add('level-changed');
        setTimeout(() => {
            container.querySelector('.emphasis-controls__preview').classList.remove('level-changed');
        }, 300);
        
        this.triggerChange();
    }
    
    /**
     * Agrega palabras de una categoría
     */
    addCategoryWords(category, container) {
        const words = this.predefinedWords[category] || [];
        
        words.forEach(word => {
            if (!this.customWords.includes(word)) {
                this.customWords.push(word);
            }
        });
        
        this.updateWordsList(container);
        this.triggerChange();
        
        // Feedback visual
        const btn = container.querySelector(`[data-category="${category}"]`);
        btn.classList.add('btn-chip--added');
        setTimeout(() => {
            btn.classList.remove('btn-chip--added');
        }, 1000);
    }
    
    /**
     * Agrega palabra personalizada
     */
    addCustomWord(word, container) {
        word = word.trim().toLowerCase();
        
        if (!word || this.customWords.includes(word)) return;
        
        this.customWords.push(word);
        this.updateWordsList(container);
        this.triggerChange();
    }
    
    /**
     * Elimina palabra
     */
    removeWord(word, container) {
        this.customWords = this.customWords.filter(w => w !== word);
        this.updateWordsList(container);
        this.triggerChange();
    }
    
    /**
     * Actualiza lista de palabras
     */
    updateWordsList(container) {
        const wordsContainer = container.querySelector('#emphasisWords');
        
        wordsContainer.innerHTML = this.customWords.map(word => `
            <div class="emphasis-word">
                <span class="emphasis-word__text">${word}</span>
                <button class="emphasis-word__remove" data-word="${word}" aria-label="Eliminar ${word}">×</button>
            </div>
        `).join('');
    }
    
    /**
     * Actualiza preview
     */
    updatePreview(container) {
        // Re-aplicar clases según nivel actual
        const preview = container.querySelector('.emphasis-preview-text');
        preview.innerHTML = preview.innerHTML.replace(/emphasis-preview__(soft|medium|strong)/g, `emphasis-preview__${this.level}`);
    }
    
    /**
     * Dispara evento de cambio
     */
    triggerChange() {
        if (this.onChange) {
            this.onChange({
                enabled: this.enabled,
                level: this.level,
                custom_words: this.customWords,
                auto_numbers: this.autoNumbers,
                auto_prices: this.autoPrices
            });
        }
    }
    
    /**
     * Obtiene la configuración actual
     */
    getValue() {
        return {
            enabled: this.enabled,
            level: this.level,
            custom_words: this.customWords,
            auto_numbers: this.autoNumbers,
            auto_prices: this.autoPrices
        };
    }
}

// Export default para import dinámico
export default EmphasisControls;