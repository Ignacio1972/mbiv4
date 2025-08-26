/**
 * Modal para programar reproducción automática de audios
 * @version 2.0 - Agregado soporte para categorías
 * @modified 2024-11-28 - Claude - Enviar categoría al crear schedule
 */

export class ScheduleModal {
    constructor() {
        this.modalId = 'scheduleModal';
        this.selectedFile = null;
        this.selectedTitle = null;
        this.selectedCategory = null; // NUEVO: Guardar categoría
        this.scheduleType = 'interval'; // interval, specific, once
    }
    
    /**
     * Mostrar modal
     * @param {string} filename - Nombre del archivo
     * @param {string} title - Título del audio
     * @param {string} category - Categoría del mensaje (NUEVO)
     */
    show(filename, title, category = null) {
        console.log('[ScheduleModal] Abriendo con categoría:', category);
        
        // Cargar CSS externo
        if (!document.getElementById("schedule-modal-css")) {
            const link = document.createElement("link");
            link.id = "schedule-modal-css";
            link.rel = "stylesheet";
            link.href = "./modules/campaign-library/styles/schedule-modal.css";
            document.head.appendChild(link);
        }
        
        this.selectedFile = filename;
        this.selectedTitle = title;
        this.selectedCategory = category || 'sin_categoria'; // NUEVO
        
        this.createModal();
        document.getElementById(this.modalId).style.display = 'block';
    }
    
    hide() {
        const modal = document.getElementById(this.modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    createModal() {
        // Remover modal existente si hay
        const existing = document.getElementById(this.modalId);
        if (existing) existing.remove();
        
        // NUEVO: Obtener emoji y nombre de categoría
        const categoryInfo = this.getCategoryInfo(this.selectedCategory);
        
        const modal = document.createElement('div');
        modal.id = this.modalId;
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content schedule-modal">
                <div class="modal-header">
                    <h3>🕐 Programar Reproducción Automática</h3>
                    <button class="close-btn" onclick="window.scheduleModal.hide()">✕</button>
                </div>
                
                <div class="modal-body">
                    <div class="schedule-info">
                        <div class="info-row">
                            <strong>Audio:</strong> ${this.selectedTitle || this.selectedFile}
                        </div>
                        <div class="info-row">
                            <strong>Categoría:</strong> 
                            <span class="category-badge category-${this.selectedCategory}">
                                ${categoryInfo.emoji} ${categoryInfo.name}
                            </span>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>📅 Tipo de programación:</label>
                        <div class="radio-group">
                            <label>
                                <input type="radio" name="scheduleType" value="interval" checked 
                                       onchange="window.scheduleModal.changeType('interval')">
                                Por intervalos
                            </label>
                            <label>
                                <input type="radio" name="scheduleType" value="specific"
                                       onchange="window.scheduleModal.changeType('specific')">
                                Días y horas específicas
                            </label>
                            <label>
                                <input type="radio" name="scheduleType" value="once"
                                       onchange="window.scheduleModal.changeType('once')">
                                Una sola vez
                            </label>
                        </div>
                    </div>
                    
                    <!-- Configuración por intervalos -->
                    <div id="intervalConfig" class="config-section">
                        <div class="form-group">
                            <label>⏰ Repetir cada:</label>
                            <div class="interval-inputs">
                                <input type="number" id="intervalHours" min="0" max="24" value="4">
                                <span>horas</span>
                                <input type="number" id="intervalMinutes" min="0" max="59" value="0">
                                <span>minutos</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Configuración días específicos -->
                    <div id="specificConfig" class="config-section" style="display:none;">
                        <div class="form-group">
                            <label>📅 Días de la semana:</label>
                            <div class="days-selector">
                                ${this.createDaysSelector()}
                            </div>
                        </div>
                        <div class="form-group">
                            <label>⏰ Horas del día:</label>
                            <div id="timesContainer">
                                <div class="time-input">
                                    <input type="time" class="schedule-time" value="14:00">
                                    <button onclick="window.scheduleModal.addTimeSlot()">➕</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Configuración una vez -->
                    <div id="onceConfig" class="config-section" style="display:none;">
                        <div class="form-group">
                            <label>📅 Fecha y hora:</label>
                            <input type="datetime-local" id="onceDateTime">
                        </div>
                    </div>
                    
                    <!-- Fechas de inicio y fin -->
                    <div class="form-group">
                        <label>📆 Fecha inicio:</label>
                        <input type="date" id="startDate" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    
                    <div class="form-group">
                        <label>📆 Fecha fin (opcional):</label>
                        <input type="date" id="endDate">
                    </div>
                    
                    <div class="form-group">
                        <label>📝 Notas (opcional):</label>
                        <textarea id="scheduleNotes" rows="2" placeholder="Ej: Oferta especial de temporada"></textarea>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="window.scheduleModal.save()">
                        ✅ Programar
                    </button>
                    <button class="btn btn-secondary" onclick="window.scheduleModal.hide()">
                        ❌ Cancelar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.addCategoryStyles(); // NUEVO: Agregar estilos de categorías
    }
    
    /**
     * NUEVO: Obtener información de categoría
     */
    getCategoryInfo(category) {
        const categories = {
            'ofertas': { name: 'Ofertas', emoji: '🛒' },
            'eventos': { name: 'Eventos', emoji: '🎉' },
            'informacion': { name: 'Información', emoji: 'ℹ️' },
            'emergencias': { name: 'Emergencias', emoji: '🚨' },
            'servicios': { name: 'Servicios', emoji: '🛎️' },
            'horarios': { name: 'Horarios', emoji: '🕐' },
            'sin_categoria': { name: 'Sin categoría', emoji: '📁' }
        };
        
        return categories[category] || categories['sin_categoria'];
    }
    
    /**
     * NUEVO: Agregar estilos de categorías
     */
    addCategoryStyles() {
        if (document.getElementById('category-badge-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'category-badge-styles';
        styles.textContent = `
            .category-badge {
                display: inline-flex;
                align-items: center;
                padding: 4px 12px;
                border-radius: 16px;
                font-size: 0.9rem;
                font-weight: 500;
                gap: 4px;
            }
            
            .category-ofertas {
                background: rgba(34, 197, 94, 0.2);
                color: #22c55e;
                border: 1px solid rgba(34, 197, 94, 0.3);
            }
            
            .category-eventos {
                background: rgba(59, 130, 246, 0.2);
                color: #3b82f6;
                border: 1px solid rgba(59, 130, 246, 0.3);
            }
            
            .category-informacion {
                background: rgba(6, 182, 212, 0.2);
                color: #06b6d4;
                border: 1px solid rgba(6, 182, 212, 0.3);
            }
            
            .category-emergencias {
                background: rgba(239, 68, 68, 0.2);
                color: #ef4444;
                border: 1px solid rgba(239, 68, 68, 0.3);
            }
            
            .category-servicios {
                background: rgba(168, 85, 247, 0.2);
                color: #a855f7;
                border: 1px solid rgba(168, 85, 247, 0.3);
            }
            
            .category-horarios {
                background: rgba(245, 158, 11, 0.2);
                color: #f59e0b;
                border: 1px solid rgba(245, 158, 11, 0.3);
            }
            
            .category-sin_categoria {
                background: rgba(107, 114, 128, 0.2);
                color: #6b7280;
                border: 1px solid rgba(107, 114, 128, 0.3);
            }
            
            .info-row {
                margin-bottom: 8px;
            }
        `;
        document.head.appendChild(styles);
    }
    
    createDaysSelector() {
        const days = [
            { value: 'monday', label: 'Lun' },
            { value: 'tuesday', label: 'Mar' },
            { value: 'wednesday', label: 'Mié' },
            { value: 'thursday', label: 'Jue' },
            { value: 'friday', label: 'Vie' },
            { value: 'saturday', label: 'Sáb' },
            { value: 'sunday', label: 'Dom' }
        ];
        
        return days.map(day => `
            <label class="day-checkbox">
                <input type="checkbox" value="${day.value}" class="schedule-day">
                <span>${day.label}</span>
            </label>
        `).join('');
    }
    
    changeType(type) {
        this.scheduleType = type;
        
        // Ocultar todas las secciones
        document.querySelectorAll('.config-section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Mostrar la sección correspondiente
        if (type === 'interval') {
            document.getElementById('intervalConfig').style.display = 'block';
        } else if (type === 'specific') {
            document.getElementById('specificConfig').style.display = 'block';
        } else if (type === 'once') {
            document.getElementById('onceConfig').style.display = 'block';
        }
    }
    
    addTimeSlot() {
        const container = document.getElementById('timesContainer');
        const timeDiv = document.createElement('div');
        timeDiv.className = 'time-input';
        timeDiv.innerHTML = `
            <input type="time" class="schedule-time" value="16:00">
            <button onclick="this.parentElement.remove()">➖</button>
        `;
        container.appendChild(timeDiv);
    }
    
    async save() {
        const data = {
            action: 'create',
            filename: this.selectedFile,
            title: this.selectedTitle,
            category: this.selectedCategory, // NUEVO: Enviar categoría
            schedule_type: this.scheduleType,
            start_date: document.getElementById('startDate').value,
            end_date: document.getElementById('endDate').value || null,
            notes: document.getElementById('scheduleNotes').value,
            is_active: true
        };
        
        console.log('[ScheduleModal] Guardando con categoría:', data.category);
        
        // Agregar configuración según el tipo
        if (this.scheduleType === 'interval') {
            data.interval_hours = document.getElementById('intervalHours').value;
            data.interval_minutes = document.getElementById('intervalMinutes').value;
            
        } else if (this.scheduleType === 'specific') {
            // Obtener días seleccionados
            const days = [];
            document.querySelectorAll('.schedule-day:checked').forEach(checkbox => {
                days.push(checkbox.value);
            });
            data.schedule_days = days;
            
            // Obtener horas
            const times = [];
            document.querySelectorAll('.schedule-time').forEach(input => {
                if (input.value) times.push(input.value);
            });
            data.schedule_times = times;
            
        } else if (this.scheduleType === 'once') {
            const dateTime = document.getElementById('onceDateTime').value;
            if (!dateTime) {
                this.showNotification('⚠️ Por favor selecciona fecha y hora', 'error');
                return; // Detener el guardado
            }
            // Enviar el datetime completo para tipo "once"
            data.once_datetime = dateTime;
            // También separar para compatibilidad
            const [date, time] = dateTime.split('T');
            data.start_date = date;
            data.schedule_times = [time];
        }
        
        try {
            const response = await fetch('/api/audio-scheduler.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('✅ Programación creada exitosamente', 'success');
                this.hide();
                
                // Emitir evento para actualizar calendario
                if (window.eventBus) {
                    window.eventBus.emit('schedule:created', {
                        scheduleId: result.schedule_id,
                        category: result.category
                    });
                }
                
                // Recargar lista si existe
                if (window.campaignLibrary && window.campaignLibrary.loadSchedules) {
                    window.campaignLibrary.loadSchedules();
                }
            } else {
                this.showNotification('Error: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error guardando programación:', error);
            this.showNotification('Error al guardar programación', 'error');
        }
    }
    
    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Exponer globalmente
window.scheduleModal = new ScheduleModal();

// Auto-registrar en window cuando se carga
if (typeof window !== "undefined") {
    window.ScheduleModal = ScheduleModal;
}