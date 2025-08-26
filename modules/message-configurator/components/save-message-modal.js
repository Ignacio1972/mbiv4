// /var/www/tts-mall/v2/modules/message-configurator/components/save-message-modal.js

/**
 * Save Message Modal Component
 * Modal para guardar mensajes en la biblioteca
 * @module SaveMessageModal
 */

export class SaveMessageModal {
    constructor() {
        this.isOpen = false;
        this.onSave = null;
        this.onCancel = null;
        
        // Categorías disponibles
        this.categories = [
            { id: 'ofertas', name: '🛒 Ofertas', color: '#10b981' },
            { id: 'eventos', name: '🎉 Eventos', color: '#3b82f6' },
            { id: 'informacion', name: 'ℹ️ Información', color: '#6366f1' },
            { id: 'emergencias', name: '🚨 Emergencias', color: '#ef4444' },
            { id: 'servicios', name: '🛎️ Servicios', color: '#8b5cf6' },
            { id: 'horarios', name: '🕐 Horarios', color: '#f59e0b' },
            { id: 'sin-categoria', name: '📁 Sin categoría', color: '#6b7280' }
        ];
    }
    
    /**
     * Abre el modal
     */
    static async open(options = {}) {
        const instance = new SaveMessageModal();
        Object.assign(instance, options);
        
        // Crear y agregar al DOM
        const modalElement = document.createElement('div');
        modalElement.id = 'save-message-modal';
        modalElement.innerHTML = instance.getHTML();
        document.body.appendChild(modalElement);
        
        // Attachar eventos
        instance.attachEvents();
        
        // Abrir con animación
        requestAnimationFrame(() => {
            modalElement.querySelector('.save-modal').classList.add('save-modal--active');
        });
        
        instance.isOpen = true;
        
        // Focus en el input de título
        modalElement.querySelector('#messageTitle').focus();
        
        return new Promise((resolve, reject) => {
            instance.onSave = resolve;
            instance.onCancel = reject;
        });
    }
    
    /**
     * Genera el HTML del modal
     */
    getHTML() {
        return `
            <div class="save-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div class="save-modal__overlay" aria-hidden="true"></div>
                <div class="save-modal__content">
                    <div class="save-modal__header">
                        <h2 id="modal-title" class="save-modal__title">
                            💾 Guardar Mensaje en Biblioteca
                        </h2>
                        <button class="save-modal__close" aria-label="Cerrar modal">
                            ×
                        </button>
                    </div>
                    
                    <div class="save-modal__body">
                        <!-- Título del mensaje -->
                        <div class="form-group">
                            <label for="messageTitle" class="form-label required">
                                Título del mensaje
                            </label>
                            <input 
                                type="text" 
                                id="messageTitle" 
                                class="form-control" 
                                placeholder="Ej: Oferta fin de semana"
                                maxlength="50"
                                required>
                            <small class="form-help">
                                Este título te ayudará a identificar el mensaje en la biblioteca
                            </small>
                        </div>
                        
                        <!-- Categoría -->
                        <div class="form-group">
                            <label class="form-label">
                                Categoría (opcional)
                            </label>
                            <div class="category-grid">
                                ${this.categories.map(cat => `
                                    <div class="category-option" 
                                         data-category="${cat.id}"
                                         role="button"
                                         tabindex="0"
                                         style="--category-color: ${cat.color}">
                                        <span class="category-option__icon">${cat.name.split(' ')[0]}</span>
                                        <span class="category-option__name">${cat.name.split(' ')[1]}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <!-- Preview del mensaje -->
                        <div class="form-group">
                            <label class="form-label">
                                Vista previa del mensaje
                            </label>
                            <div class="message-preview">
                                <p id="messagePreview" class="message-preview__text">
                                    ${this.messageText ? this.getExcerpt(this.messageText) : 'Sin texto'}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="save-modal__footer">
                        <button class="btn btn-secondary" id="cancelBtn">
                            Cancelar
                        </button>
                        <button class="btn btn-primary" id="saveBtn" disabled>
                            <span>💾</span> Guardar en Biblioteca
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Adjunta eventos
     */
    attachEvents() {
        const modal = document.getElementById('save-message-modal');
        const titleInput = modal.querySelector('#messageTitle');
        const saveBtn = modal.querySelector('#saveBtn');
        const cancelBtn = modal.querySelector('#cancelBtn');
        const closeBtn = modal.querySelector('.save-modal__close');
        
        // Validar título
        titleInput.addEventListener('input', (e) => {
            const isValid = e.target.value.trim().length >= 3;
            saveBtn.disabled = !isValid;
            
            if (e.target.value.length > 0 && !isValid) {
                e.target.classList.add('error');
            } else {
                e.target.classList.remove('error');
            }
        });
        
        // Seleccionar categoría
        modal.querySelectorAll('.category-option').forEach(option => {
            option.addEventListener('click', () => this.selectCategory(option));
            option.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectCategory(option);
                }
            });
        });
        
        // Guardar
        saveBtn.addEventListener('click', () => this.save());
        titleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !saveBtn.disabled) {
                this.save();
            }
        });
        
        // Cancelar
        cancelBtn.addEventListener('click', () => this.close(false));
        closeBtn.addEventListener('click', () => this.close(false));
        modal.querySelector('.save-modal__overlay').addEventListener('click', () => this.close(false));
        
        // ESC para cerrar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close(false);
            }
        });
    }
    
    /**
     * Selecciona una categoría
     */
    selectCategory(option) {
        const modal = document.getElementById('save-message-modal');
        
        // Toggle selection
        const wasSelected = option.classList.contains('selected');
        
        // Limpiar todas las selecciones
        modal.querySelectorAll('.category-option').forEach(opt => {
            opt.classList.remove('selected');
            opt.setAttribute('aria-checked', 'false');
        });
        
        // Si no estaba seleccionada, seleccionar
        if (!wasSelected) {
            option.classList.add('selected');
            option.setAttribute('aria-checked', 'true');
        }
    }
    
    /**
     * Guarda el mensaje
     */
    save() {
        const modal = document.getElementById('save-message-modal');
        const title = modal.querySelector('#messageTitle').value.trim();
        const selectedCategory = modal.querySelector('.category-option.selected');
        const category = selectedCategory ? selectedCategory.dataset.category : 'sin-categoria';
        
        if (!title || title.length < 3) {
            return;
        }
        
        const data = {
            title: title,
            category: category
        };
        
        if (this.onSave) {
            this.onSave(data);
        }
        
        this.close(true);
    }
    
    /**
     * Cierra el modal
     */
    close(saved = false) {
        const modal = document.getElementById('save-message-modal');
        
        if (!modal) return;
        
        // Animar cierre
        modal.querySelector('.save-modal').classList.remove('save-modal--active');
        
        // Remover después de animación
        setTimeout(() => {
            modal.remove();
            
            if (!saved && this.onCancel) {
                this.onCancel();
            }
        }, 300);
        
        this.isOpen = false;
    }
    
    /**
     * Obtiene extracto del texto
     */
    getExcerpt(text, maxLength = 100) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }
}

// Export default para import dinámico
export default SaveMessageModal;