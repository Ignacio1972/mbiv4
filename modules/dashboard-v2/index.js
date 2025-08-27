/**
 * Dashboard v2 Module
 * Módulo principal del nuevo dashboard con diseño actualizado
 * Integra generación TTS, controles de voz, quota chart y mensajes recientes
 */

export default class DashboardV2Module {
    constructor() {
        this.name = 'dashboard-v2';
        this.container = null;
        this.eventBus = window.eventBus;
        this.apiClient = window.apiClient;
        
        // Estado del módulo
        this.state = {
            generating: false,
            currentAudio: null,
            controlsVisible: false,
            voices: [],
            selectedVoice: 'juan_carlos',
            voiceSettings: {
                style: 0.5,
                stability: 0.75,
                similarity_boost: 0.8,
                use_speaker_boost: true
            },
            quotaData: null,
            recentMessages: []
        };
        
        // Referencias a elementos DOM
        this.elements = {};
        
        // Intervalos para actualizaciones
        this.quotaInterval = null;
        this.messagesInterval = null;
        
        // Exponer para onclick handlers
        window.dashboardV2 = this;
    }
    
    /**
     * Obtiene el nombre del módulo
     */
    getName() {
        return this.name;
    }
    
    /**
     * Carga los estilos necesarios para el dashboard v2
     */
    loadStyles() {
        // Remover CSS antiguos si existen
        const oldStyles = document.querySelectorAll('link[data-module]');
        oldStyles.forEach(link => link.remove());
        
        // Rutas confirmadas de tus archivos CSS
        const styles = [
            '/new-design/mbi-corporate-dark.css',
            '/new-design/palette-custom.css',
            '/modules/dashboard-v2/styles/dashboard.css'
        ];
        
        styles.forEach(href => {
            if (!document.querySelector(`link[href="${href}"]`)) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                link.setAttribute('data-module', this.name);
                document.head.appendChild(link);
            }
        });
    }
    
    /**
     * Carga el módulo en el contenedor
     */
    async load(container) {
        this.container = container;
        
        // Cargar los CSS del nuevo diseño
        this.loadStyles();
        
        try {
            // 1. Cargar el template HTML
            await this.loadTemplate();
            
            // 2. Obtener referencias a elementos DOM
            this.cacheElements();
            
            // 3. Cargar voces disponibles
            await this.loadVoices();
            
            // 4. Configurar event listeners
            this.setupEventListeners();
            
            // 5. Cargar datos iniciales
            await this.loadInitialData();
            
            // 6. Iniciar actualizaciones periódicas
            this.startPeriodicUpdates();
            
            // 7. Emitir evento de módulo cargado
            this.eventBus.emit('module:loaded', { module: this.name });
            
        } catch (error) {
            console.error('[Dashboard v2] Error loading module:', error);
            this.showError('Error al cargar el módulo');
        }
    }
    
    /**
     * Carga el template HTML
     */
    async loadTemplate() {
        const response = await fetch('/modules/dashboard-v2/template.html');
        if (!response.ok) {
            throw new Error('Failed to load template');
        }
        const html = await response.text();
        this.container.innerHTML = html;
    }
    
    /**
     * Cachea referencias a elementos DOM
     */
    cacheElements() {
        this.elements = {
            // Generador
            messageText: document.getElementById('messageText'),
            voiceSelect: document.getElementById('voiceSelect'),
            generateBtn: document.getElementById('generateBtn'),
            messageForm: document.getElementById('messageForm'),
            
            // Controles avanzados
            toggleControls: document.getElementById('toggleControls'),
            controlsSection: document.getElementById('controlsSection'),
            styleSlider: document.getElementById('styleSlider'),
            styleValue: document.getElementById('styleValue'),
            styleTrack: document.getElementById('styleTrack'),
            stabilitySlider: document.getElementById('stabilitySlider'),
            stabilityValue: document.getElementById('stabilityValue'),
            stabilityTrack: document.getElementById('stabilityTrack'),
            claritySlider: document.getElementById('claritySlider'),
            clarityValue: document.getElementById('clarityValue'),
            clarityTrack: document.getElementById('clarityTrack'),
            
            // Quota chart
            quotaProgressCircle: document.getElementById('quotaProgressCircle'),
            quotaPercentage: document.getElementById('quotaPercentage'),
            quotaUsed: document.getElementById('quotaUsed'),
            quotaRemaining: document.getElementById('quotaRemaining'),
            quotaResetDate: document.getElementById('quotaResetDate'),
            
            // Mensajes
            messageList: document.getElementById('messageList'),
            refreshMessages: document.getElementById('refreshMessages')
        };
    }
    
    /**
     * Carga las voces disponibles
     */
    async loadVoices() {
        try {
            const response = await fetch('/api/data/voices-config.json');
            const config = await response.json();
            
            this.state.voices = Object.entries(config.voices || {})
                .filter(([key, voice]) => voice.active !== false)
                .map(([key, voice]) => ({
                    key: key,
                    ...voice
                }));
            
            // Poblar el selector de voces
            this.populateVoiceSelector();
            
            // Establecer voz por defecto
            if (config.settings?.default_voice) {
                this.state.selectedVoice = config.settings.default_voice;
                this.elements.voiceSelect.value = config.settings.default_voice;
            }
            
        } catch (error) {
            console.error('[Dashboard v2] Error loading voices:', error);
            // Voz por defecto si falla
            this.state.voices = [{
                key: 'juan_carlos',
                label: 'Juan Carlos',
                id: 'G4IAP30yc6c1gK0csDfu'
            }];
            this.populateVoiceSelector();
        }
    }
    
    /**
     * Pobla el selector de voces
     */
    populateVoiceSelector() {
        this.elements.voiceSelect.innerHTML = '';
        
        this.state.voices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.key;
            option.textContent = voice.label;
            this.elements.voiceSelect.appendChild(option);
        });
    }
    
    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Botón generar
        this.elements.generateBtn.addEventListener('click', () => this.handleGenerate());
        
        // Toggle controles avanzados
        this.elements.toggleControls.addEventListener('click', () => this.toggleAdvancedControls());
        
        // Sliders
        this.setupSlider('style', 'Style', value => this.state.voiceSettings.style = value / 100);
        this.setupSlider('stability', 'Stability', value => this.state.voiceSettings.stability = value / 100);
        this.setupSlider('clarity', 'Similarity', value => this.state.voiceSettings.similarity_boost = value / 100);
        
        // Selector de voz
        this.elements.voiceSelect.addEventListener('change', (e) => {
            this.state.selectedVoice = e.target.value;
        });
        
        // Refrescar mensajes
        this.elements.refreshMessages.addEventListener('click', () => this.loadRecentMessages());
        
        // Escuchar eventos del sistema
        this.eventBus.on('message:saved:library', () => this.loadRecentMessages());
    }
    
    /**
     * Configura un slider
     */
    setupSlider(name, setting, callback) {
        const slider = this.elements[`${name}Slider`];
        const value = this.elements[`${name}Value`];
        const track = this.elements[`${name}Track`];
        
        slider.addEventListener('input', (e) => {
            const val = e.target.value;
            value.textContent = val + '%';
            track.style.width = val + '%';
            callback(val);
        });
    }
    
    /**
     * Maneja la generación de audio
     */
    async handleGenerate() {
        if (this.state.generating) return;
        
        const text = this.elements.messageText.value.trim();
        if (!text) {
            this.showError('Por favor ingrese un texto');
            return;
        }
        
        this.state.generating = true;
        this.elements.generateBtn.disabled = true;
        this.elements.generateBtn.textContent = 'Generando...';
        
        try {
            const voice = this.state.voices.find(v => v.key === this.state.selectedVoice);
            console.log('Voz seleccionada:', this.state.selectedVoice);
            console.log('Voz encontrada:', voice);
            
            if (!voice) {
                this.showError('No se encontró la voz seleccionada');
                return;
            }
            
            const response = await this.apiClient.post('/api/generate.php', {
                action: 'generate_audio',
                text: text,
                voice: voice.id,
                voice_settings: {
                    style: this.state.voiceSettings.style,
                    stability: this.state.voiceSettings.stability,
                    similarity_boost: this.state.voiceSettings.similarity_boost,
                    use_speaker_boost: this.state.voiceSettings.use_speaker_boost
                }
            });
            
            // La API devuelve filename, no audio_url
            if (response.success && (response.audio_url || response.filename)) {
                const audioUrl = response.audio_url || `/api/temp/${response.filename}`;
                this.playAudio(audioUrl);
                this.showSuccess('Audio generado exitosamente');
                
                // Actualizar quota después de generar
                await this.updateQuotaChart();
            } else {
                throw new Error(response.error || 'Error al generar audio');
            }
            
        } catch (error) {
            console.error('[Dashboard v2] Generation error:', error);
            this.showError('Error al generar el audio: ' + error.message);
        } finally {
            this.state.generating = false;
            this.elements.generateBtn.disabled = false;
            this.elements.generateBtn.innerHTML = '<span>🎙️</span> Generar Audio';
        }
    }
    
    /**
     * Reproduce el audio generado
     */
    playAudio(url) {
        // Crear reproductor si no existe
        let playerContainer = document.getElementById('audioPlayerContainer');
        if (!playerContainer) {
            playerContainer = document.createElement('div');
            playerContainer.id = 'audioPlayerContainer';
            playerContainer.className = 'audio-player-container';
            playerContainer.style.marginTop = '1rem';
            playerContainer.innerHTML = `
                <audio id="audioPlayer" controls class="audio-player" style="width: 100%;"></audio>
                <div class="player-actions" style="margin-top: 1rem; display: flex; gap: 1rem;">
                    <button type="button" id="saveToLibraryBtn" class="btn btn-secondary">
                        💾 Guardar en Biblioteca
                    </button>
                </div>
            `;
            this.elements.messageForm.parentNode.insertBefore(playerContainer, this.elements.toggleControls.parentNode);
        }
        
        const audio = playerContainer.querySelector('#audioPlayer');
        audio.src = url;
        audio.play();
        playerContainer.style.display = 'block';
        
        // Configurar botón de guardar
        const saveBtn = playerContainer.querySelector('#saveToLibraryBtn');
        saveBtn.onclick = () => this.saveToLibrary(url);
    }
    
    /**
     * Guarda el mensaje en la biblioteca
     */
    async saveToLibrary(audioUrl) {
        const text = this.elements.messageText.value;
        const voice = this.state.voices.find(v => v.key === this.state.selectedVoice);
        
        // Aquí iría la lógica para guardar
        // Por ahora solo emitimos el evento
        this.eventBus.emit('message:saved:library', {
            text: text,
            audioUrl: audioUrl,
            voice: voice.label,
            timestamp: new Date().toISOString()
        });
        
        this.showSuccess('Mensaje guardado en la biblioteca');
    }
    
    /**
     * Toggle de controles avanzados
     */
    toggleAdvancedControls() {
        this.state.controlsVisible = !this.state.controlsVisible;
        
        if (this.state.controlsVisible) {
            this.elements.controlsSection.style.display = 'block';
            this.elements.toggleControls.innerHTML = '<span>⚙️ Controles Avanzados ▲</span>';
        } else {
            this.elements.controlsSection.style.display = 'none';
            this.elements.toggleControls.innerHTML = '<span>⚙️ Controles Avanzados ▼</span>';
        }
        
        // Guardar preferencia
        localStorage.setItem('mbi_controlsVisible', this.state.controlsVisible);
    }
    
    /**
     * Actualiza el chart de quota
     */
    async updateQuotaChart() {
        try {
            const response = await fetch('/playground/api/quota.php');
            const data = await response.json();
            
            this.state.quotaData = data;
            
            // Calcular porcentaje
            const percentage = Math.round((data.used / data.limit) * 100);
            
            // Actualizar círculo
            const circumference = 100;
            const strokeDasharray = `${percentage} ${circumference}`;
            this.elements.quotaProgressCircle.setAttribute('stroke-dasharray', strokeDasharray);
            
            // Actualizar textos
            this.elements.quotaPercentage.textContent = percentage + '%';
            this.elements.quotaUsed.textContent = this.formatNumber(data.used);
            this.elements.quotaRemaining.textContent = this.formatNumber(data.remaining);
            
            // Formatear fecha de reset
            if (data.reset_date) {
                const resetDate = new Date(data.reset_date);
                const days = Math.ceil((resetDate - new Date()) / (1000 * 60 * 60 * 24));
                this.elements.quotaResetDate.textContent = `Renueva en ${days} días`;
            }
            
        } catch (error) {
            console.error('[Dashboard v2] Error updating quota:', error);
        }
    }
    
    /**
     * Carga los mensajes recientes
     */
    async loadRecentMessages() {
        try {
            const response = await this.apiClient.post('/api/saved-messages.php', {
                action: 'list',
                limit: 6,
                orderBy: 'created_at',
                order: 'DESC'
            });
            
            // La API devuelve "messages", no "data"
            if (response.success && (response.data || response.messages)) {
                this.state.recentMessages = response.data || response.messages;
                this.renderMessages();
            }
            
        } catch (error) {
            console.error('[Dashboard v2] Error loading messages:', error);
            // Mostrar mensajes de ejemplo si falla
            this.renderExampleMessages();
        }
    }
    
    /**
     * Renderiza los mensajes
     */
    renderMessages() {
        if (!this.state.recentMessages.length) {
            this.elements.messageList.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    No hay mensajes recientes
                </div>
            `;
            return;
        }
        
        this.elements.messageList.innerHTML = this.state.recentMessages.map(msg => `
            <div class="message-item" data-id="${msg.id}">
                <div class="message-header">
                    <span class="message-title">${this.truncateText(msg.title || msg.content || 'Audio', 30)}</span>
                    <span class="message-badge badge-${msg.category || 'sin-categoria'}">${this.getCategoryLabel(msg.category)}</span>
                </div>
                <div class="message-preview">${this.truncateText(msg.notes || msg.content || 'Archivo de audio guardado', 100)}</div>
                <div class="message-footer">
                    <span class="message-time">${this.getRelativeTime(msg.createdAt || msg.saved_at)}</span>
                    <div class="message-actions">
                        ${msg.filename ? `<button class="btn-icon" title="Reproducir" onclick="window.dashboardV2.playMessageAudio('${msg.filename}')">▶</button>` : ''}
                        <button class="btn-icon btn-save" title="Guardar" onclick="window.dashboardV2.saveToFavorites('${msg.id}', '${msg.filename || ''}', '${(msg.title || '').replace(/'/g, "\\'")}')">✓</button>
                        <button class="btn-icon btn-delete" title="Eliminar" onclick="window.dashboardV2.removeMessage('${msg.id}')">🗑️</button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    // Método para reproducir audio
    playMessageAudio(filename) {
        if (!filename) {
            this.showError('Audio no disponible');
            return;
        }
        const audioUrl = `/api/biblioteca.php?filename=${filename}`;
        this.playAudio(audioUrl);
    }

    // Método para guardar en favoritos
    saveToFavorites(id, filename, title) {
        if (confirm(`¿Guardar "${title}" en favoritos?`)) {
            const btn = event.target;
            btn.style.color = '#10b981';
            btn.style.background = 'rgba(16, 185, 129, 0.1)';
            btn.disabled = true;
            btn.textContent = '✓';
            
            // Emitir evento para que otros módulos lo escuchen
            this.eventBus.emit('message:saved:library', {
                id: id,
                filename: filename,
                title: title,
                savedAt: new Date().toISOString()
            });
            
            this.showSuccess('Guardado en favoritos');
        }
    }

    // Método para eliminar mensaje
    removeMessage(id) {
        if (confirm('¿Eliminar este mensaje de la lista?')) {
            const card = this.elements.messageList.querySelector(`[data-id="${id}"]`);
            if (card) {
                card.style.transition = 'all 0.3s ease';
                card.style.opacity = '0';
                card.style.transform = 'translateX(-20px)';
                setTimeout(() => {
                    this.state.recentMessages = this.state.recentMessages.filter(m => m.id !== id);
                    this.renderMessages();
                }, 300);
            }
        }
    }
    
    /**
     * Renderiza mensajes de ejemplo
     */
    renderExampleMessages() {
        const examples = [
            { title: 'Oferta Black Friday', text: 'Atención visitantes, este viernes...', category: 'ofertas', created_at: new Date() },
            { title: 'Cambio de Horario', text: 'Informamos a nuestros visitantes...', category: 'informacion', created_at: new Date(Date.now() - 3600000) },
            { title: 'Evento Musical', text: 'Este sábado presentamos música en vivo...', category: 'eventos', created_at: new Date(Date.now() - 7200000) }
        ];
        
        this.state.recentMessages = examples;
        this.renderMessages();
    }
    
    /**
     * Carga datos iniciales
     */
    async loadInitialData() {
        // Cargar preferencias guardadas
        const controlsVisible = localStorage.getItem('mbi_controlsVisible') === 'true';
        if (controlsVisible) {
            this.toggleAdvancedControls();
        }
        
        // Cargar quota y mensajes
        await Promise.all([
            this.updateQuotaChart(),
            this.loadRecentMessages()
        ]);
    }
    
    /**
     * Inicia actualizaciones periódicas
     */
    startPeriodicUpdates() {
        // Actualizar quota cada 30 segundos
        this.quotaInterval = setInterval(() => this.updateQuotaChart(), 30000);
        
        // Actualizar mensajes cada minuto
        this.messagesInterval = setInterval(() => this.loadRecentMessages(), 60000);
    }
    
    /**
     * Descarga el módulo
     */
    async unload() {
        // Limpiar estilos del módulo
        const moduleStyles = document.querySelectorAll(`link[data-module="${this.name}"]`);
        moduleStyles.forEach(link => link.remove());
        
        // Limpiar intervalos
        if (this.quotaInterval) clearInterval(this.quotaInterval);
        if (this.messagesInterval) clearInterval(this.messagesInterval);
        
        // Limpiar event listeners
        this.eventBus.off('message:saved:library');
        
        // Limpiar contenedor
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        // Emitir evento de módulo descargado
        this.eventBus.emit('module:unloaded', { module: this.name });
    }
    
    // ========== Utilidades ==========
    
    formatNumber(num) {
        if (num > 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num > 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
    
    truncateText(text, length) {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
    }
    
    getCategoryLabel(category) {
        const labels = {
            'ofertas': 'Ofertas',
            'eventos': 'Eventos',
            'informacion': 'Info',
            'servicios': 'Servicios',
            'horarios': 'Horarios',
            'emergencias': 'Urgente'
        };
        return labels[category] || 'Sin Cat.';
    }
    
    getRelativeTime(date) {
        if (!date) return 'Ahora';
        
        const now = new Date();
        const past = new Date(date);
        const diff = Math.floor((now - past) / 1000);
        
        if (diff < 60) return 'Hace un momento';
        if (diff < 3600) return `Hace ${Math.floor(diff / 60)} minutos`;
        if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} horas`;
        return `Hace ${Math.floor(diff / 86400)} días`;
    }
    
    showSuccess(message) {
        // Aquí podrías implementar un toast notification
        console.log('[Dashboard v2] Success:', message);
    }
    
    showError(message) {
        // Aquí podrías implementar un toast notification
        console.error('[Dashboard v2] Error:', message);
        alert(message); // Temporal
    }
}