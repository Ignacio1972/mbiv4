/**
 * Component Factory - Inicialización centralizada de componentes
 * VERSIÓN SIMPLIFICADA - Sin multiplicadores, conversión directa
 * @module ComponentFactory
 */

export class ComponentFactory {
    /**
     * Configuración de todos los componentes
     */
    static componentConfig = {
        tagInput: {
            module: './components/tag-input.js',
            container: '#tags-container',
            config: {
                placeholder: 'Agregar etiqueta...',
                suggestions: ['urgente', 'oferta', 'evento', 'información', 'promoción']
            }
        },
        styleSlider: {
            module: './components/simple-slider.js',
            container: '#style-slider-container',
            stateField: 'settings.style'
        },
        stabilitySlider: {
            module: './components/simple-slider.js',
            container: '#stability-slider-container',
            stateField: 'settings.stability'
        },
        similaritySlider: {
            module: './components/simple-slider.js',
            container: '#similarity-slider-container',
            stateField: 'settings.similarity_boost'
        },
        speakerBoostToggle: {
            module: './components/speaker-boost-toggle.js',
            container: '#speaker-boost-container',
            stateField: 'settings.use_speaker_boost'
        },
        profileSelector: {
            module: './components/profile-selector.js',
            container: '#voice-profiles-container'
        }
    };
    
    /**
     * Inicializa todos los componentes de forma paralela
     */
    static async initializeAll(container, state, callbacks) {
        const components = {};
        const loadPromises = [];
        
        // Preparar todas las cargas en paralelo
        Object.entries(this.componentConfig).forEach(([name, config]) => {
            const element = container.querySelector(config.container);
            if (!element) {
                console.warn(`[ComponentFactory] Container not found for ${name}: ${config.container}`);
                return;
            }
            
            const promise = this.loadComponent(name, config, element, state, callbacks)
                .then(component => {
                    if (component) components[name] = component;
                })
                .catch(error => {
                    console.warn(`[ComponentFactory] Failed to load ${name}:`, error);
                });
                
            loadPromises.push(promise);
        });
        
        // Esperar a que todos terminen
        await Promise.all(loadPromises);
        
        return components;
    }
    
    /**
     * Carga un componente individual
     * SIMPLIFICADO - Sin multiplicadores complejos
     */
    static async loadComponent(name, config, element, state, callbacks) {
        try {
            // Importar módulo
            const module = await import(config.module);
            const Component = module.default || module[Object.keys(module)[0]];
            
            if (!Component || typeof Component.render !== 'function') {
                throw new Error(`Invalid component export for ${name}`);
            }
            
            // Preparar configuración base
            let componentConfig = { ...config.config };
            
            // Si tiene configuración en atributo data (para compatibilidad)
            if (element.hasAttribute('data-slider-config')) {
                try {
                    const attrConfig = JSON.parse(element.getAttribute('data-slider-config'));
                    Object.assign(componentConfig, attrConfig);
                } catch (e) {
                    console.warn(`[ComponentFactory] Invalid data-slider-config for ${name}`);
                }
            }
            
            // SIMPLIFICADO: Configuración específica para sliders
            if (name.includes('Slider') && name !== 'profileSelector') {
                // Configuración común para todos los sliders
                componentConfig = {
                    ...componentConfig,
                    min: 0,
                    max: 100,
                    unit: '%'
                };
                
                // Configuración específica por slider
                switch(name) {
                    case 'styleSlider':
                        componentConfig.label = ' Expresividad';
                        componentConfig.icon = '🎭';
                        break;
                    case 'stabilitySlider':
                        componentConfig.label = ' Estabilidad';
                        componentConfig.icon = '🎯';
                        break;
                    case 'similaritySlider':
                        componentConfig.label = ' Fidelidad';
                        componentConfig.icon = '🔊';
                        break;
                }
                
                // Obtener valor inicial del estado (0-1) y convertir a porcentaje (0-100)
                if (config.stateField && state) {
                    const value = this.getNestedValue(state, config.stateField);
                    componentConfig.value = Math.round((value || 0) * 100);
                }
            }
            
            // Para otros componentes, obtener valor directo
            else if (config.stateField && state) {
                componentConfig.value = this.getNestedValue(state, config.stateField);
            }
            
            // Agregar callback si existe
            if (callbacks[name]) {
                componentConfig.onChange = callbacks[name];
            }
            
            // Renderizar componente
            return await Component.render(element, componentConfig);
            
        } catch (error) {
            console.error(`[ComponentFactory] Error loading ${name}:`, error);
            return null;
        }
    }
    
    /**
     * Obtiene valor anidado del estado
     */
    static getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
}