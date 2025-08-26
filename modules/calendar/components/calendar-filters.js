/**
 * Calendar Filters Component
 * Componente independiente para filtrar eventos del calendario
 * @module CalendarFilters
 */

export class CalendarFilters {
    constructor(container, calendarView, options = {}) {
        this.container = container;
        this.calendarView = calendarView;
        this.categories = options.categories || [
            { id: 'interval', name: 'Repeticiones', color: '#3498db', icon: '⏱️' },
            { id: 'specific', name: 'Días específicos', color: '#9b59b6', icon: '📅' },
            { id: 'once', name: 'Evento único', color: '#e67e22', icon: '1️⃣' }
        ];
        this.activeCategories = this.categories.map(c => c.id);
        this.collapsed = false;
        
        this.init();
    }
    
    init() {
        this.render();
        this.attachListeners();
        this.loadStyles();
        this.loadPreferences(); // Agregar esta línea
    }
    
    render() {
        const html = `
            <div class="calendar-filters-bar">
                <div class="filters-content">
                    <span class="filters-label">
                        <span class="filters-icon">🎯</span>
                        Filtrar:
                    </span>
                    <div class="filters-checkboxes">
                        ${this.createCheckboxesHTML()}
                    </div>
                    <button class="filters-toggle" title="Mostrar/Ocultar filtros">
                        ▼
                    </button>
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
    }
    
    createCheckboxesHTML() {
        return this.categories.map(cat => `
            <label class="filter-checkbox-item" title="${cat.name}">
                <input type="checkbox" 
                       class="category-filter" 
                       value="${cat.id}" 
                       checked>
                <span class="filter-color-dot" 
                      style="background-color: ${cat.color}">
                </span>
                <span class="filter-label-text">
                    ${cat.icon} ${cat.name}
                </span>
            </label>
        `).join('');
    }
    
    attachListeners() {
        // Listeners para checkboxes
        this.container.querySelectorAll('.category-filter').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.handleFilterChange());
        });
        
        // Listener para toggle de colapsar
        const toggleBtn = this.container.querySelector('.filters-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleCollapse());
        }
        
        // Teclas rápidas (opcional)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                this.toggleCollapse();
            }
        });
    }
    
    handleFilterChange() {
        this.activeCategories = Array.from(
            this.container.querySelectorAll('.category-filter:checked')
        ).map(cb => cb.value);
        
        console.log('[CalendarFilters] Active types:', this.activeCategories);
        
        // Aplicar filtros al calendario usando el método correcto
        if (this.calendarView && this.calendarView.filterByScheduleType) {
            this.calendarView.filterByScheduleType(this.activeCategories);
        }
        
        // Guardar preferencias en localStorage
        this.savePreferences();
    }
    
    toggleCollapse() {
        this.collapsed = !this.collapsed;
        const bar = this.container.querySelector('.calendar-filters-bar');
        const toggle = this.container.querySelector('.filters-toggle');
        
        if (this.collapsed) {
            bar.classList.add('collapsed');
            toggle.innerHTML = '▶';
            toggle.title = 'Mostrar filtros';
        } else {
            bar.classList.remove('collapsed');
            toggle.innerHTML = '▼';
            toggle.title = 'Ocultar filtros';
        }
        
        this.savePreferences();
    }
    
    savePreferences() {
        const prefs = {
            activeCategories: this.activeCategories,
            collapsed: this.collapsed
        };
        localStorage.setItem('calendar_filters_prefs', JSON.stringify(prefs));
    }
    
    loadPreferences() {
        try {
            const saved = localStorage.getItem('calendar_filters_prefs');
            if (saved) {
                const prefs = JSON.parse(saved);
                
                // Restaurar categorías activas
                if (prefs.activeCategories) {
                    this.activeCategories = prefs.activeCategories;
                    this.container.querySelectorAll('.category-filter').forEach(cb => {
                        cb.checked = this.activeCategories.includes(cb.value);
                    });
                }
                
                // Restaurar estado colapsado
                if (prefs.collapsed) {
                    this.toggleCollapse();
                }
            }
        } catch (error) {
            console.error('[CalendarFilters] Error loading preferences:', error);
        }
    }
    
    loadStyles() {
        if (document.getElementById('calendar-filters-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'calendar-filters-styles';
        styles.textContent = `
            .calendar-filters-bar {
                background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px;
                padding: 0.75rem;
                margin-bottom: 1rem;
                transition: all 0.3s ease;
            }
            
            .calendar-filters-bar.collapsed {
                padding: 0.5rem;
            }
            
            .calendar-filters-bar.collapsed .filters-checkboxes {
                display: none;
            }
            
            .filters-content {
                display: flex;
                align-items: center;
                gap: 1rem;
                flex-wrap: wrap;
            }
            
            .filters-label {
                font-weight: 500;
                color: rgba(255,255,255,0.9);
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .filters-icon {
                font-size: 1.1rem;
            }
            
            .filters-checkboxes {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
                flex: 1;
            }
            
            .filter-checkbox-item {
                display: inline-flex;
                align-items: center;
                gap: 0.4rem;
                padding: 0.25rem 0.75rem;
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 20px;
                cursor: pointer;
                transition: all 0.2s ease;
                user-select: none;
            }
            
            .filter-checkbox-item:hover {
                background: rgba(255,255,255,0.08);
                border-color: rgba(255,255,255,0.15);
                transform: translateY(-1px);
            }
            
            .filter-checkbox-item:has(input:not(:checked)) {
                opacity: 0.5;
                background: rgba(0,0,0,0.2);
            }
            
            .category-filter {
                width: 16px;
                height: 16px;
                cursor: pointer;
            }
            
            .filter-color-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                display: inline-block;
                box-shadow: 0 0 4px rgba(0,0,0,0.3);
            }
            
            .filter-label-text {
                font-size: 0.9rem;
                color: rgba(255,255,255,0.85);
            }
            
            .filters-toggle {
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.2);
                color: rgba(255,255,255,0.8);
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 0.8rem;
            }
            
            .filters-toggle:hover {
                background: rgba(255,255,255,0.15);
                color: #fff;
            }
            
            @media (max-width: 768px) {
                .filters-checkboxes {
                    width: 100%;
                }
                
                .filter-checkbox-item {
                    font-size: 0.85rem;
                    padding: 0.2rem 0.5rem;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Métodos públicos
    selectAll() {
        this.container.querySelectorAll('.category-filter').forEach(cb => {
            cb.checked = true;
        });
        this.handleFilterChange();
    }
    
    selectNone() {
        this.container.querySelectorAll('.category-filter').forEach(cb => {
            cb.checked = false;
        });
        this.handleFilterChange();
    }
    
    destroy() {
        // Limpiar event listeners si es necesario
        this.container.innerHTML = '';
    }
}