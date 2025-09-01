/**
 * Template Modal Component
 * Modal fullscreen para selección de plantillas
 * @module TemplateModal
 */

export class TemplateModal {
    constructor() {
        this.isOpen = false;
        this.selectedCategory = 'celebracion';
        this.selectedTemplate = null;
        this.onSelect = null;
        this.onClose = null;
        
        // Templates organizados por categoría (mismo formato que el backend)
        this.templates = {
            celebracion: [
                {
                    id: 'evento_general',
                    name: 'Evento Especial',
                    template: '¡No se lo pierdan! {evento} este {dia} a las {hora} en {ubicacion} del Mol. {detalles}',
                    variables: ['evento', 'dia', 'hora', 'ubicacion', 'detalles'],
                    example: {
                        evento: 'Gran show de magia familiar',
                        dia: 'sábado 20',
                        hora: '4',
                        ubicacion: 'la plaza central',
                        detalles: 'Recuerden. Gran show de magia familiar el sabado 20 a las 4 de la tarde.'
                    }
                },
                {
                    id: 'dia_madre',
                    name: 'Día de la Madre',
                    template: '¡Feliz día de la Madre! El Mol, Barrio Independencia celebra con todas las mamás en su día especial. {mensaje_carino}. {actividad_especial}. {regalo_promocion}.',
                    variables: ['mensaje_carino', 'actividad_especial', 'regalo_promocion']
                },
                {
                    id: 'dia_padre',
                    name: 'Día del Padre',
                    template: '¡Feliz día del Padre! En el Mol, Barrio Independencia queremos homenajear a todos los papás. {mensaje_especial}. {actividad_del_dia}. {beneficio_especial}.',
                    variables: ['mensaje_especial', 'actividad_del_dia', 'beneficio_especial']
                },
                {
                    id: 'dia_nino',
                    name: 'Día del Niño',
                    template: '¡Feliz día del Niño! El Mol, Barrio Independencia se llena de magia para todos los pequeños. {actividades_dia}. {horario_actividades}. {sorpresas_adicionales}.',
                    variables: ['actividades_dia', 'horario_actividades', 'sorpresas_adicionales']
                }
            ],
            cine: [
                {
                    id: 'estreno_pelicula',
                    name: 'Estreno de Película',
                    template: '¡Gran estreno en Cines del Mol! {titulo_pelicula} llega {cuando} a nuestras salas. {descripcion_breve}. {horarios_funciones}. {promocion_estreno}.',
                    variables: ['titulo_pelicula', 'cuando', 'descripcion_breve', 'horarios_funciones', 'promocion_estreno']
                },
                {
                    id: 'promocion_cine',
                    name: 'Promoción de Cine',
                    template: '¡{dia_promocion} de cine en el Mol, Barrio Independencia! {descripcion_promo}. {peliculas_incluidas}. {condiciones}. {llamado_accion}.',
                    variables: ['dia_promocion', 'descripcion_promo', 'peliculas_incluidas', 'condiciones', 'llamado_accion']
                }
            ],
            eventos_infantiles: [
                {
                    id: 'show_infantil',
                    name: 'Show Infantil',
                    template: '¡Atención niños y niñas! El Mol, Barrio Independencia presenta {show_titulo} {cuando}. {descripcion_show}. {edades_recomendadas}. {ubicacion_detalles}. ¡{mensaje_entusiasta}!',
                    variables: ['show_titulo', 'cuando', 'descripcion_show', 'edades_recomendadas', 'ubicacion_detalles', 'mensaje_entusiasta']
                },
                {
                    id: 'taller_infantil',
                    name: 'Taller Infantil',
                    template: '¡Inscripciones abiertas! Taller de {tipo_taller} para niños en el Mol, Barrio Independencia. {descripcion_taller}. {cuando_donde}. {materiales_incluidos}. {inscripcion_info}.',
                    variables: ['tipo_taller', 'descripcion_taller', 'cuando_donde', 'materiales_incluidos', 'inscripcion_info']
                }
            ],
            recordatorio: [
                {
                    id: 'recordatorio_estacionamiento',
                    name: 'Recordatorio de Estacionamiento',
                    template: 'Estimados visitantes del Mol, Barrio Independencia: {recordatorio_principal}. {informacion_adicional}. {instruccion_final}.',
                    variables: ['recordatorio_principal', 'informacion_adicional', 'instruccion_final']
                },
                {
                    id: 'recordatorio_seguridad',
                    name: 'Recordatorio de Seguridad',
                    template: 'El Mol, Barrio Independencia les recuerda: {mensaje_seguridad}. {recomendacion_especifica}. {donde_ayuda}. Su seguridad es nuestra prioridad.',
                    variables: ['mensaje_seguridad', 'recomendacion_especifica', 'donde_ayuda']
                }
            ],
            ofertas: [
                {
                    id: 'descuento_simple',
                    name: 'Descuento Simple',
                    template: 'Atención clientes, {producto} con un {descuento}% de descuento. {duracion}.',
                    variables: ['producto', 'descuento', 'duracion']
                },
                {
                    id: 'dos_por_uno',
                    name: '2x1 o 3x2',
                    template: 'Increíble promoción {tipo} en {producto}. {detalle}. {duracion}.',
                    variables: ['tipo', 'producto', 'detalle', 'duracion']
                }
            ]
        };
        
        this.categories = [
            { id: 'celebracion', name: '🎊 Celebraciones', icon: '🎊' },
            { id: 'cine', name: '🎬 Cine', icon: '🎬' },
            { id: 'eventos_infantiles', name: '👶 Eventos Infantiles', icon: '👶' },
            { id: 'recordatorio', name: '🔔 Recordatorios', icon: '🔔' },
            { id: 'ofertas', name: '🛒 Ofertas', icon: '🛒' }
        ];
    }
    
    /**
     * Abre el modal
     */
    static async open(options = {}) {
        const instance = new TemplateModal();
        Object.assign(instance, options);
        
        // Crear y agregar al DOM
        const modalElement = document.createElement('div');
        modalElement.id = 'template-modal';
        modalElement.innerHTML = instance.getHTML();
        document.body.appendChild(modalElement);
        
        // Attachar eventos
        instance.attachEvents();
        
        // Abrir con animación
        requestAnimationFrame(() => {
            modalElement.querySelector('.template-modal').classList.add('template-modal--active');
        });
        
        instance.isOpen = true;
        
        // Prevenir scroll del body
        document.body.style.overflow = 'hidden';
        
        return instance;
    }
    
    /**
     * Genera el HTML del modal
     */
    getHTML() {
        const currentTemplates = this.templates[this.selectedCategory] || [];
        
        return `
            <div class="template-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div class="template-modal__overlay" aria-hidden="true"></div>
                <div class="template-modal__content">
                    <div class="template-modal__header">
                        <h2 id="modal-title" class="template-modal__title">
                            📋 Seleccionar Plantilla
                        </h2>
                        <button class="template-modal__close" aria-label="Cerrar modal">
                            ×
                        </button>
                    </div>
                    
                    <div class="template-modal__body">
                        <!-- Categorías -->
                        <div class="template-modal__categories" role="tablist">
                            ${this.categories.map(cat => `
                                <button class="template-modal__category ${cat.id === this.selectedCategory ? 'template-modal__category--active' : ''}"
                                        role="tab"
                                        aria-selected="${cat.id === this.selectedCategory}"
                                        data-category="${cat.id}">
                                    ${cat.name}
                                </button>
                            `).join('')}
                        </div>
                        
                        <!-- Grid de templates -->
                        <div class="template-modal__grid" role="tabpanel">
                            ${currentTemplates.length > 0 ? currentTemplates.map(template => `
                                <div class="template-card" 
                                     data-template-id="${template.id}"
                                     role="button"
                                     tabindex="0">
                                    <h3 class="template-card__name">${template.name}</h3>
                                    <p class="template-card__preview">${this.getPreview(template)}</p>
                                    <div class="template-card__variables">
                                        ${template.variables.map(v => `
                                            <span class="template-card__variable">{${v}}</span>
                                        `).join('')}
                                    </div>
                                </div>
                            `).join('') : '<p class="text-center text-secondary">No hay plantillas en esta categoría</p>'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Obtiene preview de template
     */
    getPreview(template) {
        let preview = template.template;
        // Limitar longitud y reemplazar variables con ejemplos
        if (template.example) {
            Object.entries(template.example).forEach(([key, value]) => {
                preview = preview.replace(`{${key}}`, `<strong>${value}</strong>`);
            });
        }
        // Si es muy largo, cortar
        if (preview.length > 150) {
            preview = preview.substring(0, 150) + '...';
        }
        return preview;
    }
    
    /**
     * Attacha eventos del modal
     */
    attachEvents() {
        const modal = document.getElementById('template-modal');
        
        // Cerrar modal
        modal.querySelector('.template-modal__close').addEventListener('click', () => {
            this.close();
        });
        
        modal.querySelector('.template-modal__overlay').addEventListener('click', () => {
            this.close();
        });
        
        // ESC para cerrar
        const escHandler = (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        };
        document.addEventListener('keydown', escHandler);
        
        // Cambiar categoría
        modal.querySelectorAll('.template-modal__category').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectCategory(btn.dataset.category);
            });
        });
        
        // Seleccionar template
        modal.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectTemplate(card.dataset.templateId);
            });
            
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectTemplate(card.dataset.templateId);
                }
            });
        });
        
        // Focus trap
        this.setupFocusTrap(modal);
    }
    
    /**
     * Cambia categoría
     */
    selectCategory(categoryId) {
        this.selectedCategory = categoryId;
        
        // Re-renderizar
        const modal = document.getElementById('template-modal');
        modal.innerHTML = this.getHTML();
        this.attachEvents();
        
        // Mantener foco en la categoría seleccionada
        modal.querySelector(`[data-category="${categoryId}"]`).focus();
    }
    
    /**
     * Selecciona template
     */
    selectTemplate(templateId) {
        const template = this.templates[this.selectedCategory].find(t => t.id === templateId);
        
        if (template && this.onSelect) {
            this.onSelect({
                category: this.selectedCategory,
                templateId: templateId,
                template: template
            });
        }
        
        this.close();
    }
    
    /**
     * Cierra el modal
     */
    close() {
        const modal = document.getElementById('template-modal');
        
        if (!modal) return;
        
        // Animar cierre
        modal.querySelector('.template-modal').classList.remove('template-modal--active');
        
        // Remover después de animación
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
            
            if (this.onClose) {
                this.onClose();
            }
        }, 300);
        
        this.isOpen = false;
    }
    
    /**
     * Setup focus trap
     */
    setupFocusTrap(modal) {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        // Focus inicial
        firstFocusable.focus();
        
        modal.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;
            
            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        });
    }
}

// Export default para import dinámico
export default TemplateModal;