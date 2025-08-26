/**
 * Calendar Module - Sistema de Programación de Anuncios
 * @module CalendarModule
 * Version: 2.0 - Fixed event detection
 */

console.log('[CalendarModule] Loading version 2.0 with event detection fix');

import { eventBus } from '../../shared/event-bus.js';
import { apiClient } from '../../shared/api-client.js';
import { CalendarView } from './components/calendar-view.js';
// import { EventModal } from './components/event-modal.js'; // REMOVED 2025-08-18 - using schedule-modal.js
// import { CalendarAPI } from './services/calendar-api.js'; // REMOVED - using audio-scheduler.php directly

export default class CalendarModule {
    constructor() {
        this.name = 'calendar';
        this.container = null;
        this.calendarView = null;
        // this.eventModal = null; // REMOVED
        // this.api = new CalendarAPI(); // REMOVED
        
        // Cache de archivos disponibles
        this.availableFiles = [];
        this.categories = [
            { id: 'ofertas', name: '🛒 Ofertas', color: '#FF6B6B' },
            { id: 'horarios', name: '🕐 Horarios', color: '#4DABF7' },
            { id: 'eventos', name: '🎉 Eventos', color: '#51CF66' },
            { id: 'seguridad', name: '⚠️ Seguridad', color: '#FFD43B' },
            { id: 'servicios', name: '🛎️ Servicios', color: '#845EF7' },
            { id: 'emergencias', name: '🚨 Emergencias', color: '#FF0000' }
        ];
    }
    
    getName() {
        return this.name;
    }
    
    async load(container) {
        console.log('[Calendar] Loading module...');
        this.container = container;
        
        try {
            // Cargar template HTML
            await this.loadTemplate();
            
            // Cargar archivos disponibles de la biblioteca
            await this.loadAvailableFiles();
            
            // Inicializar componentes
            await this.initializeComponents();
            
            // Cargar eventos del calendario
            await this.loadCalendarEvents();
            
            // Adjuntar event listeners
            this.attachEventListeners();
            
            eventBus.emit('calendar:loaded');
            console.log('[Calendar] Module loaded successfully');
            
        } catch (error) {
            console.error('[Calendar] Load failed:', error);
            this.showError('Error al cargar el calendario: ' + error.message);
        }
    }
    
    async unload() {
        console.log('[Calendar] Unloading module...');
        
        // Limpiar componentes
        if (this.calendarView) {
            this.calendarView.destroy();
        }
        
        // Limpiar event listeners
        eventBus.clear('calendar:*');
        
        this.container = null;
    }
    
    async loadTemplate() {
        const response = await fetch('/modules/calendar/templates/calendar.html');
        const html = await response.text();
        this.container.innerHTML = html;
    }
    
    async loadAvailableFiles() {
        try {
            // Usar la API existente de biblioteca
            const response = await apiClient.post('/biblioteca.php', {
                action: 'list_library'
            });
            
            if (response.success) {
                this.availableFiles = response.files.map(file => ({
                    value: file.filename,
                    label: file.filename,
                    duration: file.duration || 0,
                    size: file.size,
                    date: file.date
                }));
                
                console.log(`[Calendar] Loaded ${this.availableFiles.length} audio files`);
            }
        } catch (error) {
            console.error('[Calendar] Error loading files:', error);
            this.availableFiles = [];
        }
    }
    
    async initializeComponents() {
        // Inicializar vista de calendario
        const calendarContainer = this.container.querySelector('#calendar-container');
        this.calendarView = new CalendarView(calendarContainer, {
            onEventClick: (event) => this.handleEventClick(event),
            onDateClick: (date) => this.handleDateClick(date),
            categories: this.categories
        });
        
        // Modal removed - using schedule-modal.js from campaign-library
    }
    
    async loadCalendarEvents() {
        try {
            this.showLoading(true);
            
            // Cargar schedules de audio desde el sistema funcional
            const audioSchedules = await this.calendarView.loadAudioSchedules();
            
            // Establecer eventos en el calendario
            this.calendarView.setEvents(audioSchedules);
            
            console.log(`[Calendar] Loaded ${audioSchedules.length} audio schedules`);
            
        } catch (error) {
            console.error('[Calendar] Error loading events:', error);
            this.showError('Error al cargar eventos');
        } finally {
            this.showLoading(false);
        }
    }
    
    attachEventListeners() {
        // Botón crear evento
        const createBtn = this.container.querySelector('#create-event-btn');
        createBtn?.addEventListener('click', () => {
            // TODO: Abrir schedule-modal.js para crear nuevo schedule
            console.log('TODO: Open schedule-modal.js for new schedule');
            this.showError('Usa "Mensajes Guardados" para programar nuevos audios por ahora');
        });
        
        // Botón actualizar
        const refreshBtn = this.container.querySelector('#refresh-calendar-btn');
        refreshBtn?.addEventListener('click', () => {
            this.loadCalendarEvents();
        });
        
        // Filtros de categoría
        this.container.querySelectorAll('.category-filter').forEach(filter => {
            filter.addEventListener('change', () => {
                this.updateCategoryFilters();
            });
        });
        
        // Escuchar eventos del sistema de scheduling
        eventBus.on('library:file:added', () => {
            this.loadAvailableFiles();
        });
        
        // Escuchar cuando se crean/modifican schedules
        eventBus.on('schedule:created', () => {
            console.log('[Calendar] Schedule created, refreshing calendar...');
            this.loadCalendarEvents();
        });
        
        eventBus.on('schedule:updated', () => {
            console.log('[Calendar] Schedule updated, refreshing calendar...');
            this.loadCalendarEvents();
        });
        
        eventBus.on('schedule:deleted', () => {
            console.log('[Calendar] Schedule deleted, refreshing calendar...');
            this.loadCalendarEvents();
        });
    }
    
    handleEventClick(event) {
        console.log('[Calendar] Event clicked:', event);
        
        // Verificar múltiples formas de detectar un audio schedule
        const isAudioSchedule = 
            (event && event.type === 'audio_schedule') ||
            (event && event.id && String(event.id).includes('audio_schedule')) ||
            (event && event.scheduleId !== undefined);
        
        console.log('[Calendar] Is audio schedule?', isAudioSchedule);
        console.log('[Calendar] Event type:', event.type);
        console.log('[Calendar] Event id:', event.id);
        console.log('[Calendar] Has scheduleId?', event.scheduleId !== undefined);
        
        if (isAudioSchedule) {
            console.log('[Calendar] Audio schedule detected, opening modal');
            
            // Asegurarnos de que el modal se abra
            try {
                this.showScheduleInfoModal(event);
            } catch (error) {
                console.error('[Calendar] Error showing modal:', error);
                this.showError('Error al mostrar información del schedule');
            }
        } else {
            console.log('[Calendar] Not an audio schedule');
            // No mostrar error para eventos normales, simplemente ignorar
        }
    }
    
    /**
     * Muestra modal con información del schedule y opciones de gestión
     */
    showScheduleInfoModal(scheduleData) {
        console.log('[Calendar] Showing schedule info modal:', scheduleData);
        
        // Formatear información del schedule
        const scheduleInfo = this.formatScheduleInfo(scheduleData);
        
        // Crear HTML del modal
        const modalHTML = this.createScheduleModalHTML(scheduleData, scheduleInfo);
        
        // Insertar modal en el DOM
        const existingModal = document.getElementById('schedule-info-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Obtener referencias a elementos del modal
        const modal = document.getElementById('schedule-info-modal');
        const overlay = modal.querySelector('.modal-overlay');
        const closeBtn = modal.querySelector('.close-modal');
        const deleteBtn = modal.querySelector('.delete-schedule-btn');
        const editBtn = modal.querySelector('.edit-schedule-btn');
        const audioElement = modal.querySelector('audio');
        
        // Event listeners
        const closeModal = () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        };
        
        overlay.addEventListener('click', closeModal);
        closeBtn.addEventListener('click', closeModal);
        
        // Botón eliminar
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.confirmDeleteSchedule(scheduleData.scheduleId, closeModal);
            });
        }
        
        // Botón editar
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                closeModal();
                this.editSchedule(scheduleData);
            });
        }
        
        // Manejar error de carga de audio
        if (audioElement) {
            audioElement.addEventListener('error', () => {
                const audioContainer = modal.querySelector('.audio-preview');
                audioContainer.innerHTML = '<p class="audio-error">⚠️ No se puede cargar el audio</p>';
            });
        }
        
        // Mostrar modal con animación
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
    }
    
    /**
     * Formatea la información del schedule para mostrar
     */
    formatScheduleInfo(scheduleData) {
        const { scheduleType, intervalMinutes, intervalHours, scheduleDays, scheduleTime, startDate, endDate } = scheduleData;
        
        let info = '';
        
        switch(scheduleType) {
            case 'interval':
                const hours = intervalHours || 0;
                const minutes = intervalMinutes || 0;
                if (hours > 0 && minutes > 0) {
                    info = `Cada ${hours} hora${hours > 1 ? 's' : ''} y ${minutes} minuto${minutes > 1 ? 's' : ''}`;
                } else if (hours > 0) {
                    info = `Cada ${hours} hora${hours > 1 ? 's' : ''}`;
                } else {
                    info = `Cada ${minutes} minuto${minutes > 1 ? 's' : ''}`;
                }
                break;
                
            case 'specific':
                const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                // Asegurar que scheduleDays sea string
                const daysString = scheduleDays ? String(scheduleDays) : '';
                const dayNames = daysString ? daysString.split(',')
                    .map(d => days[parseInt(d.trim())])
                    .filter(Boolean)
                    .join(', ') : 'Días no especificados';
                info = `${dayNames} a las ${scheduleTime || '00:00'}`;
                break;
                
            case 'once':
                const dateStr = startDate ? new Date(startDate).toLocaleDateString('es-CL') : 'Fecha no especificada';
                info = `Una vez el ${dateStr} a las ${scheduleTime || '00:00'}`;
                break;
                
            default:
                info = 'Programación desconocida';
        }
        
        // Agregar periodo si existe
        if (startDate || endDate) {
            info += '<br><small>📅 Periodo: ';
            if (startDate) info += `Desde ${new Date(startDate).toLocaleDateString('es-CL')}`;
            if (endDate) info += ` hasta ${new Date(endDate).toLocaleDateString('es-CL')}`;
            info += '</small>';
        }
        
        return info;
    }
    
    /**
     * Crea el HTML del modal de información
     */
    createScheduleModalHTML(scheduleData, scheduleInfo) {
        const { filename, scheduleId, isActive, createdAt } = scheduleData;
        const title = scheduleData.title || filename || 'Sin título';
        
        // URL del audio
        const audioUrl = `http://51.222.25.222:8000/files/uploads/${filename}`;
        
        // Formatear fecha de creación
        const createdDate = createdAt ? new Date(createdAt).toLocaleString('es-CL') : 'Fecha desconocida';
        
        return `
            <div id="schedule-info-modal" class="schedule-info-modal">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>🎵 ${title}</h3>
                        <button class="close-modal">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="schedule-details">
                            <div class="detail-item">
                                <strong>📁 Archivo:</strong> ${filename || 'No especificado'}
                            </div>
                            
                            <div class="detail-item">
                                <strong>📅 Programación:</strong>
                                <div class="schedule-timing">${scheduleInfo}</div>
                            </div>
                            
                            <div class="detail-item">
                                <strong>📊 Estado:</strong>
                                <span class="status-badge ${isActive ? 'active' : 'inactive'}">
                                    ${isActive ? '✅ Activo' : '⏸️ Inactivo'}
                                </span>
                            </div>
                            
                            <div class="detail-item">
                                <strong>🕐 Creado:</strong> ${createdDate}
                            </div>
                            
                            ${filename ? `
                            <div class="detail-item audio-section">
                                <strong>🎧 Preview:</strong>
                                <div class="audio-preview">
                                    <audio controls preload="metadata">
                                        <source src="${audioUrl}" type="audio/mpeg">
                                        Tu navegador no soporta reproducción de audio.
                                    </audio>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn btn-secondary close-modal">Cerrar</button>
                        <button class="btn btn-primary edit-schedule-btn">
                            ✏️ Editar
                        </button>
                        <button class="btn btn-danger delete-schedule-btn">
                            🗑️ Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Confirma y elimina un schedule
     */
    async confirmDeleteSchedule(scheduleId, onSuccess) {
        const confirmed = confirm('¿Estás seguro de que quieres eliminar este schedule?\n\nEsta acción no se puede deshacer.');
        
        if (!confirmed) return;
        
        try {
            console.log('[Calendar] Deleting schedule:', scheduleId);
            
            const response = await fetch('/api/audio-scheduler.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete',
                    id: scheduleId
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccess('Schedule eliminado correctamente');
                
                // Cerrar modal
                if (onSuccess) onSuccess();
                
                // Refrescar calendario
                this.loadCalendarEvents();
                
                // Emitir evento
                eventBus.emit('schedule:deleted', { scheduleId });
            } else {
                throw new Error(result.error || 'Error al eliminar');
            }
            
        } catch (error) {
            console.error('[Calendar] Error deleting schedule:', error);
            this.showError('Error al eliminar el schedule: ' + error.message);
        }
    }
    
    /**
     * Abre el modal de edición para un schedule existente
     */
    async editSchedule(scheduleData) {
        try {
            console.log('[Calendar] Opening schedule for editing:', scheduleData);
            
            // Por ahora, mostrar mensaje informativo
            // TODO: Implementar edición completa cuando schedule-modal.js soporte modo edición
            this.showError('La edición de schedules se implementará próximamente. Por ahora, puedes eliminar y crear uno nuevo.');
            
            // Código para cuando esté listo:
            /*
            if (!window.ScheduleModal) {
                const module = await import('../campaign-library/schedule-modal.js');
                window.ScheduleModal = module.ScheduleModal || module.default;
            }
            
            const modal = new window.ScheduleModal();
            modal.showWithExistingData(scheduleData);
            */
            
        } catch (error) {
            console.error('[Calendar] Error opening edit modal:', error);
            this.showError('Error al abrir el editor');
        }
    }
    
    handleDateClick(date) {
        console.log('[Calendar] Date clicked:', date);
        // Por ahora, redirigir a mensajes guardados para crear schedules
        this.showSuccess('Ve a "Mensajes Guardados" para programar un nuevo audio');
        
        // Opcional: navegar automáticamente
        setTimeout(() => {
            eventBus.emit('navigate', { module: 'campaign-library' });
        }, 1500);
    }
    
    // REMOVED - saveEvent functionality moved to schedule-modal.js
    
    /**
     * Abre el modal de scheduling para editar un schedule existente
     * @param {string} filename - Nombre del archivo de audio
     * @param {string} title - Título del schedule
     * @param {number} scheduleId - ID del schedule (opcional, para edición)
     */
    async openScheduleModal(filename, title, scheduleId = null) {
        try {
            console.log('[Calendar] Opening schedule modal:', { filename, title, scheduleId });
            
            // Cargar el modal dinámicamente desde campaign-library
            if (!window.ScheduleModal) {
                const module = await import('../campaign-library/schedule-modal.js');
                window.ScheduleModal = module.ScheduleModal || module.default;
            }
            
            // Crear instancia del modal
            const modal = new window.ScheduleModal();
            
            if (scheduleId) {
                // TODO: Para edición, cargar datos existentes del schedule
                console.log('[Calendar] TODO: Load existing schedule data for editing');
                // Por ahora, mostrar modal vacío con aviso
                modal.show(filename, title);
                this.showError('Edición desde calendario próximamente. Usa "Mensajes Guardados" para editar.');
            } else {
                // Para nuevo schedule
                modal.show(filename, title);
            }
            
            // Escuchar cuando se guarde para refrescar calendario
            window.scheduleModal = modal;
            
        } catch (error) {
            console.error('[Calendar] Error loading schedule modal:', error);
            this.showError('Error al abrir editor. Usa "Mensajes Guardados" para programar.');
        }
    }
    
    updateCategoryFilters() {
        const activeCategories = [];
        
        this.container.querySelectorAll('.category-filter:checked').forEach(checkbox => {
            activeCategories.push(checkbox.value);
        });
        
        this.calendarView.filterByCategories(activeCategories);
    }
    
    getCategoryColor(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        return category?.color || '#666666';
    }
    
    // UI Helpers
    showLoading(show) {
        const loader = this.container.querySelector('.calendar-loading');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    }
    
    showSuccess(message) {
        eventBus.emit('ui:notification', { 
            message, 
            type: 'success' 
        });
    }
    
    showError(message) {
        eventBus.emit('ui:notification', { 
            message, 
            type: 'error' 
        });
    }
}