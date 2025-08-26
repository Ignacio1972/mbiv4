/**
 * Template Handler - Gestión de plantillas
 * @module TemplateHandler
 */

export class TemplateHandler {
    constructor() {
        this.templates = {};
        this.modalInstance = null;
    }
    
    /**
     * Establece las plantillas disponibles
     */
    setTemplates(templates) {
        this.templates = templates || {};
    }
    
    /**
     * Muestra el selector de plantillas
     */
    async showSelector() {
        if (!this.hasTemplates()) {
            throw new Error('No hay plantillas disponibles');
        }
        
        // Lazy load del modal
        if (!this.modalInstance) {
            const { default: TemplateModal } = await import('../components/template-modal.js');
            this.modalInstance = TemplateModal;
        }
        
        return new Promise((resolve, reject) => {
            this.modalInstance.open({
                templates: this.templates,
                onSelect: (selection) => {
                    if (selection?.template) {
                        resolve(this.processTemplate(selection));
                    } else {
                        reject(new Error('No se seleccionó ninguna plantilla'));
                    }
                },
                onClose: () => {
                    reject(new Error('Cancelado por usuario'));
                }
            }).catch(reject);
        });
    }
    
    /**
     * Procesa una plantilla seleccionada
     */
    processTemplate(selection) {
        const { template, category, variables = {} } = selection;
        
        // Usar valores de ejemplo si no hay variables
        const values = { ...template.example, ...variables };
        
        // Reemplazar variables en el texto
        let processedText = template.template;
        Object.entries(values).forEach(([key, value]) => {
            processedText = processedText.replace(
                new RegExp(`{${key}}`, 'g'), 
                value
            );
        });
        
        return {
            text: processedText,
            category: category,
            templateId: selection.templateId,
            metadata: {
                name: template.name,
                recommendedVoice: template.recommendedVoice,
                speechPreset: template.speech_preset
            }
        };
    }
    
    /**
     * Verifica si hay plantillas disponibles
     */
    hasTemplates() {
        return Object.keys(this.templates).length > 0;
    }
    
    /**
     * Obtiene plantillas por categoría
     */
    getByCategory(category) {
        return this.templates[category] || [];
    }
    
    /**
     * Obtiene todas las categorías
     */
    getCategories() {
        return Object.keys(this.templates);
    }
}