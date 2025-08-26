/**
 * Calendar Module - Sistema de Programación de Anuncios
 * @module CalendarModule
 * Version: 2.1 - Added schedules list table
 */

console.log('[CalendarModule] Loading version 2.1 with schedules list');

import { eventBus } from '../../shared/event-bus.js';
import { apiClient } from '../../shared/api-client.js';
import { CalendarView } from './components/calendar-view.js';
import { CalendarFilters } from './components/calendar-filters.js';

export default class CalendarModule {
    constructor() {
        this.name = 'calendar';
        this.container = null;
        this.calendarView = null;
        this.calendarFilters = null;
        
        // Cache de archivos disponibles
        this.availableFiles = [];
    }
    
    getName() {
        return this.name;
    }
    
    /**
     * Carga estilos adicionales del tooltip
     * @private
     */
    loadTooltipStyles() {
        // Verificar si ya existe
        if (!document.getElementById('calendar-tooltip-styles')) {
            const link = document.createElement('link');
            link.id = 'calendar-tooltip-styles';
            link.rel = 'stylesheet';
            link.href = '/modules/calendar/styles/calendar-tooltips.css';
            document.head.appendChild(link);
            console.log('[Calendar] Tooltip styles loaded');
        }
    }

    
    async load(container) {
        console.log('[Calendar] Loading module...');
        this.container = container;
        
        try {
            // Cargar template HTML
            await this.loadTemplate();

            // Cargar estilos del tooltip
            this.loadTooltipStyles();
            
            // Cargar archivos disponibles de la biblioteca
            await this.loadAvailableFiles();
            
            // Inicializar componentes
            await this.initializeComponents();
            
            // Cargar eventos del calendario
            await this.loadCalendarEvents();
            
            // Cargar lista de schedules
            await this.loadSchedulesList();
            
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
        
        // Limpiar filtros
        if (this.calendarFilters) {
            this.calendarFilters.destroy();
            this.calendarFilters = null;
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
            onDateClick: (date) => this.handleDateClick(date)
        });
        
        // Inicializar filtros si existe el contenedor
        const filtersContainer = this.container.querySelector('#calendar-filters');
        if (filtersContainer) {
            this.calendarFilters = new CalendarFilters(filtersContainer, this.calendarView, {
                // Ya no pasamos categories, el componente usa scheduleTypes internamente
            });
        }
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
    
    /**
     * Carga y muestra la lista de todos los schedules
     */
    async loadSchedulesList() {
        try {
            const container = document.getElementById('schedules-table-container');
            if (!container) return;
            
            // Mostrar loading
            container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Cargando programaciones...</p></div>';
            
            const response = await fetch('/api/audio-scheduler.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'list', active_only: true })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.displaySchedulesTable(data.schedules || []);
            } else {
                container.innerHTML = '<p class="error-message">Error al cargar programaciones</p>';
            }
        } catch (error) {
            console.error('[Calendar] Error loading schedules list:', error);
            const container = document.getElementById('schedules-table-container');
            if (container) {
                container.innerHTML = '<p class="error-message">Error al cargar programaciones</p>';
            }
        }
    }
    
    /**
     * Muestra la tabla de schedules
     */
    displaySchedulesTable(schedules) {
        const container = document.getElementById('schedules-table-container');
        if (!container) return;
        
        if (!schedules || schedules.length === 0) {
            container.innerHTML = '<div class="empty-state" style="text-align: center; padding: 2rem; color: #888;">No hay programaciones activas configuradas</div>';
            return;
        }
        
        // Crear tabla HTML
        let tableHTML = `
            <div class="table-responsive" style="overflow-x: auto;">
                <table class="schedules-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: rgba(255,255,255,0.05); border-bottom: 2px solid rgba(255,255,255,0.1);">
                            <th style="padding: 0.75rem; text-align: left;">Archivo</th>
                            <th style="padding: 0.75rem; text-align: left;">Tipo</th>
                            <th style="padding: 0.75rem; text-align: left;">Programación</th>
                            <th style="padding: 0.75rem; text-align: center;">Estado</th>
                            <th style="padding: 0.75rem; text-align: center;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        schedules.forEach(schedule => {
            const type = this.getScheduleTypeLabel(schedule);
            const timing = this.getScheduleTimingForTable(schedule);
            const status = schedule.is_active ? 
                '<span style="color: #22c55e;">✅ Activo</span>' : 
                '<span style="color: #888;">⏸️ Inactivo</span>';
            
            // Título o nombre del archivo
            const displayName = schedule.title || schedule.filename || 'Sin archivo';
            
            tableHTML += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 0.75rem;" title="${schedule.filename || ''}">${this.truncateText(displayName, 30)}</td>
                    <td style="padding: 0.75rem;">${type}</td>
                    <td style="padding: 0.75rem;">${timing}</td>
                    <td style="padding: 0.75rem; text-align: center;">${status}</td>
                    <td style="padding: 0.75rem; text-align: center;">
                        <button class="btn-icon" onclick="window.calendarModule.viewScheduleFromList(${schedule.id})" 
                                title="Ver detalles" style="background: none; border: none; cursor: pointer; font-size: 1.2rem; padding: 0.25rem;">
                            👁️
                        </button>
                        <button class="btn-icon btn-danger" onclick="window.calendarModule.deleteScheduleFromList(${schedule.id})" 
                                title="Eliminar" style="background: none; border: none; cursor: pointer; font-size: 1.2rem; padding: 0.25rem;">
                            🗑️
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tableHTML += `
                    </tbody>
                </table>
            </div>
            <div style="margin-top: 1rem; padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 4px;">
                <small style="color: #888;">Total: ${schedules.length} programación${schedules.length !== 1 ? 'es' : ''} activa${schedules.length !== 1 ? 's' : ''}</small>
            </div>
        `;
        
        container.innerHTML = tableHTML;
        
        // Hacer disponibles las funciones globalmente para onclick
        window.calendarModule = {
            viewScheduleFromList: (id) => this.viewScheduleFromList(id),
            deleteScheduleFromList: (id) => this.deleteScheduleFromList(id)
        };
    }
    
    /**
     * Obtiene el label del tipo de schedule
     */
    getScheduleTypeLabel(schedule) {
        const types = {
            'interval': '⏱️ Intervalo',
            'specific': '📅 Días específicos',
            'once': '1️⃣ Una vez'
        };
        return types[schedule.schedule_type] || '❓ Desconocido';
    }
    
    /**
     * Formatea el timing del schedule para la tabla
     */
    getScheduleTimingForTable(schedule) {
        try {
            switch(schedule.schedule_type) {
                case 'interval':
                    const h = parseInt(schedule.interval_hours) || 0;
                    const m = parseInt(schedule.interval_minutes) || 0;
                    if (h > 0 && m > 0) {
                        return `Cada ${h}h ${m}min`;
                    } else if (h > 0) {
                        return `Cada ${h} hora${h > 1 ? 's' : ''}`;
                    } else if (m > 0) {
                        return `Cada ${m} minuto${m > 1 ? 's' : ''}`;
                    }
                    return 'No configurado';
                    
                case 'specific':
                    // Mapeo de días en inglés a español
                    const dayMap = {
                        'monday': 'Lun', 'tuesday': 'Mar', 'wednesday': 'Mié',
                        'thursday': 'Jue', 'friday': 'Vie', 'saturday': 'Sáb', 'sunday': 'Dom'
                    };
                    
                    let days = [];
                    if (Array.isArray(schedule.schedule_days)) {
                        days = schedule.schedule_days.map(d => dayMap[d.toLowerCase()] || d);
                    } else if (schedule.schedule_days) {
                        // Intentar parsear si es string
                        try {
                            const parsed = JSON.parse(schedule.schedule_days);
                            if (Array.isArray(parsed)) {
                                days = parsed.map(d => dayMap[d.toLowerCase()] || d);
                            }
                        } catch(e) {
                            days = [schedule.schedule_days];
                        }
                    }
                    
                    const daysStr = days.length > 0 ? days.join(', ') : 'Sin días';
                    
                    // Obtener hora
                    let time = '00:00';
                    if (schedule.schedule_time) {
                        if (typeof schedule.schedule_time === 'string' && schedule.schedule_time.startsWith('[')) {
                            try {
                                const parsed = JSON.parse(schedule.schedule_time);
                                time = Array.isArray(parsed) ? parsed[0] : parsed;
                            } catch(e) {
                                time = schedule.schedule_time;
                            }
                        } else {
                            time = schedule.schedule_time;
                        }
                    }
                    
                    return `${daysStr} a las ${time}`;
                    
                case 'once':
                    const date = schedule.start_date ? 
                        new Date(schedule.start_date).toLocaleDateString('es-CL') : 
                        'Fecha no definida';
                    return date;
                    
                default:
                    return 'No configurado';
            }
        } catch (error) {
            console.error('[Calendar] Error formatting schedule timing:', error);
            return 'Error en formato';
        }
    }
    
    /**
     * Trunca texto largo
     */
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    /**
     * Ver detalles de un schedule desde la lista
     */
    viewScheduleFromList(scheduleId) {
        // Buscar el schedule en los datos
        fetch('/api/audio-scheduler.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'list' })
        })
        .then(response => response.json())
        .then(data => {
            const schedule = data.schedules.find(s => s.id === scheduleId);
            if (schedule) {
                // Convertir a formato esperado por el modal
                const eventData = {
                    id: `audio_schedule_${schedule.id}`,
                    type: 'audio_schedule',
                    scheduleId: schedule.id,
                    filename: schedule.filename,
                    title: schedule.title,
                    scheduleType: schedule.schedule_type,
                    intervalMinutes: schedule.interval_minutes,
                    intervalHours: schedule.interval_hours,
                    scheduleDays: schedule.schedule_days,
                    scheduleTime: schedule.schedule_time,
                    startDate: schedule.start_date,
                    endDate: schedule.end_date,
                    isActive: schedule.is_active,
                    createdAt: schedule.created_at
                };
                this.showScheduleInfoModal(eventData);
            }
        })
        .catch(error => {
            console.error('[Calendar] Error loading schedule details:', error);
            this.showError('Error al cargar detalles del schedule');
        });
    }
    
    /**
     * Eliminar schedule desde la lista
     */
    async deleteScheduleFromList(scheduleId) {
        await this.confirmDeleteSchedule(scheduleId, () => {
            // Refrescar tanto la lista como el calendario
            this.loadSchedulesList();
            this.loadCalendarEvents();
        });
    }
    
    attachEventListeners() {
        // Event listeners removidos: create-event-btn y refresh-calendar-btn (ya no existen en el HTML)
        
        // Botón actualizar lista de schedules
        const refreshSchedulesBtn = this.container.querySelector('#refresh-schedules-btn');
        refreshSchedulesBtn?.addEventListener('click', () => {
            this.loadSchedulesList();
        });
        
        // Filtros de categoría removidos (ya no existen en el HTML)
        
        // Escuchar eventos del sistema de scheduling
        eventBus.on('library:file:added', () => {
            this.loadAvailableFiles();
        });
        
        // Escuchar cuando se crean/modifican schedules
        eventBus.on('schedule:created', () => {
            console.log('[Calendar] Schedule created, refreshing calendar...');
            this.loadCalendarEvents();
            this.loadSchedulesList();
        });
        
        eventBus.on('schedule:updated', () => {
            console.log('[Calendar] Schedule updated, refreshing calendar...');
            this.loadCalendarEvents();
            this.loadSchedulesList();
        });
        
        eventBus.on('schedule:deleted', () => {
            console.log('[Calendar] Schedule deleted, refreshing calendar...');
            this.loadCalendarEvents();
            this.loadSchedulesList();
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
        const audioUrl = `/api/biblioteca.php?filename=${filename}`;
        
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
    
    // Función updateCategoryFilters removida (filtros ya no existen)
    
    // Método getCategoryColor removido - ya no se usan categorías
    
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