/**
 * Radio Module - Player de AzuraCast
 * @module RadioModule
 */

import { eventBus } from '../../shared/event-bus.js';
import { apiClient } from '../../shared/api-client.js';

export default class RadioModule {
    constructor() {
        this.name = 'radio';
        this.container = null;
        this.audioPlayer = null;
        this.streamUrl = 'http://51.222.25.222/listen/ovh/radio.mp3';
        this.apiUrl = 'http://51.222.25.222/api/nowplaying/ovh';
        this.updateInterval = null;
        this.isPlaying = false;
        this.popupWindow = null;
    }
    
    getName() {
        return this.name;
    }
    
    async load(container) {
        console.log('[Radio] Loading module...');
        this.container = container;
        
        try {
            // Renderizar el HTML
            this.render();
            
            // Inicializar el player
            this.initializePlayer();
            
            // Cargar metadata inicial
            await this.updateNowPlaying();
            
            // Iniciar actualización automática
            this.startMetadataUpdates();
            
            // Adjuntar event listeners
            this.attachEventListeners();
            
            eventBus.emit('radio:loaded');
            
        } catch (error) {
            console.error('[Radio] Load failed:', error);
            this.showError('Error al cargar el módulo de radio');
        }
    }
    
    async unload() {
        console.log('[Radio] Unloading module...');
        
        // Detener actualizaciones
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Pausar el audio
        if (this.audioPlayer) {
            this.audioPlayer.pause();
        }
        
        this.container = null;
    }
    
    render() {
        this.container.innerHTML = `
            <div class="radio-module">
                <!-- Player Principal -->
                <div class="message-section">
                    <div class="message-header">
                        <h3>📻 Radio en Vivo</h3>
                        <div class="header-actions">
                            <button id="open-popup-btn" class="btn btn-link" style="display: none;">
                                🪟 Abrir en ventana flotante
                            </button>
                            <div class="radio-status">
                                <span class="status-indicator"></span>
                                <span class="status-text">Conectando...</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Player Controls -->
                    <div class="radio-player">
                        <audio id="radio-audio" preload="none">
                            <source src="${this.streamUrl}" type="audio/mpeg">
                            Tu navegador no soporta el elemento de audio.
                        </audio>
                        
                        <div class="player-controls">
                            <button id="play-pause-btn" class="player-btn player-btn--primary">
                                <span class="play-icon">▶️</span>
                                <span class="pause-icon" style="display: none;">⏸️</span>
                            </button>
                            
                            <div class="volume-control">
                                <span class="volume-icon">🔊</span>
                                <input type="range" id="volume-slider" min="0" max="100" value="80" class="volume-slider">
                                <span id="volume-value">80%</span>
                            </div>
                        </div>
                        
                        <!-- Now Playing Info -->
                        <div class="now-playing">
                            <div class="song-info">
                                <h4 id="song-title">Cargando...</h4>
                                <p id="song-artist">--</p>
                            </div>
                            <div class="song-duration">
                                <span id="elapsed-time">--:--</span>
                                <div class="progress-bar">
                                    <div id="progress-fill" class="progress-fill"></div>
                                </div>
                                <span id="duration">--:--</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Metadata Section -->
                <div class="controls-section">
                    <div class="controls-header">
                        <h3>📊 Información de la Estación</h3>
                        <button id="refresh-metadata" class="btn btn-link">
                            🔄 Actualizar
                        </button>
                    </div>
                    
                    <div class="station-info">
                        <div class="info-grid">
                            <div class="info-item">
                                <span class="info-label">Oyentes:</span>
                                <span id="listeners-count" class="info-value">--</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Estado:</span>
                                <span id="station-status" class="info-value">--</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Bitrate:</span>
                                <span id="stream-bitrate" class="info-value">--</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Formato:</span>
                                <span id="stream-format" class="info-value">MP3</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Próximos Anuncios (preparado para futuro) -->
                <div class="audio-section" style="margin-top: 2rem;">
                    <div class="result-header">
                        <h3>📅 Próximos Anuncios Programados</h3>
                    </div>
                    <div class="upcoming-announcements">
                        <div class="processed-text">
                            Esta función estará disponible próximamente. 
                            Aquí se mostrarán los anuncios programados en el calendario.
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    initializePlayer() {
        this.audioPlayer = document.getElementById('radio-audio');
        
        // Configurar volumen inicial
        this.audioPlayer.volume = 0.8;
    }
    
    attachEventListeners() {
        // Play/Pause
        const playPauseBtn = document.getElementById('play-pause-btn');
        playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        
        // Control de volumen
        const volumeSlider = document.getElementById('volume-slider');
        volumeSlider.addEventListener('input', (e) => this.updateVolume(e.target.value));
        
        // Actualizar metadata manualmente
        const refreshBtn = document.getElementById('refresh-metadata');
        refreshBtn.addEventListener('click', () => this.updateNowPlaying());
        
        // Botón de popup
        const popupBtn = document.getElementById('open-popup-btn');
        popupBtn.addEventListener('click', () => this.openPopupPlayer());
        
        // Audio events
        this.audioPlayer.addEventListener('play', () => this.onPlay());
        this.audioPlayer.addEventListener('pause', () => this.onPause());
        this.audioPlayer.addEventListener('error', (e) => this.onError(e));
        this.audioPlayer.addEventListener('loadstart', () => this.onLoadStart());
        this.audioPlayer.addEventListener('canplay', () => this.onCanPlay());
    }
    
    togglePlayPause() {
        if (this.isPlaying) {
            this.audioPlayer.pause();
        } else {
            this.audioPlayer.play();
        }
    }
    
    updateVolume(value) {
        this.audioPlayer.volume = value / 100;
        document.getElementById('volume-value').textContent = `${value}%`;
    }
    
    onPlay() {
        this.isPlaying = true;
        document.querySelector('.play-icon').style.display = 'none';
        document.querySelector('.pause-icon').style.display = 'inline';
        document.getElementById('open-popup-btn').style.display = 'inline-flex';
        this.updateStatus('En vivo', 'online');
    }
    
    onPause() {
        this.isPlaying = false;
        document.querySelector('.play-icon').style.display = 'inline';
        document.querySelector('.pause-icon').style.display = 'none';
        document.getElementById('open-popup-btn').style.display = 'none';
        this.updateStatus('Pausado', 'offline');
    }
    
    onError(error) {
        console.error('[Radio] Error:', error);
        this.updateStatus('Error de conexión', 'error');
        this.showError('No se pudo conectar con la radio');
    }
    
    onLoadStart() {
        this.updateStatus('Conectando...', 'loading');
    }
    
    onCanPlay() {
        if (this.isPlaying) {
            this.updateStatus('En vivo', 'online');
        }
    }
    
    updateStatus(text, status) {
        const statusText = document.querySelector('.status-text');
        const statusIndicator = document.querySelector('.status-indicator');
        
        statusText.textContent = text;
        statusIndicator.className = `status-indicator status-indicator--${status}`;
    }
    
    async updateNowPlaying() {
        try {
            // Hacer petición a la API de AzuraCast
            const response = await fetch(this.apiUrl);
            const data = await response.json();
            
            // Actualizar información de la canción
            document.getElementById('song-title').textContent = data.now_playing.song.title || 'Sin título';
            document.getElementById('song-artist').textContent = data.now_playing.song.artist || 'Artista desconocido';
            
            // Actualizar estadísticas
            document.getElementById('listeners-count').textContent = data.listeners.current || 0;
            document.getElementById('station-status').textContent = data.live.is_live ? 'En vivo' : 'AutoDJ';
            document.getElementById('stream-bitrate').textContent = `${data.station.mounts[0].bitrate || 128}kbps`;
            
            // Actualizar duración si está disponible
            if (data.now_playing.duration) {
                const duration = this.formatTime(data.now_playing.duration);
                const elapsed = this.formatTime(data.now_playing.elapsed);
                document.getElementById('duration').textContent = duration;
                document.getElementById('elapsed-time').textContent = elapsed;
                
                // Actualizar barra de progreso
                const progress = (data.now_playing.elapsed / data.now_playing.duration) * 100;
                document.getElementById('progress-fill').style.width = `${progress}%`;
            }
            
        } catch (error) {
            console.error('[Radio] Error fetching metadata:', error);
        }
    }
    
    startMetadataUpdates() {
        // Actualizar cada 15 segundos
        this.updateInterval = setInterval(() => {
            this.updateNowPlaying();
        }, 15000);
    }
    
    formatTime(seconds) {
        if (!seconds) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    showError(message) {
        // Usar el sistema de notificaciones existente si está disponible
        console.error('[Radio]', message);
    }
    
    openPopupPlayer() {
        // Verificar si ya hay un popup abierto
        if (this.popupWindow && !this.popupWindow.closed) {
            // Si existe, enfocarlo
            this.popupWindow.focus();
            return;
        }
        
        // Pausar el player principal
        this.audioPlayer.pause();
        
        // Calcular posición centrada
        const width = 420;
        const height = 580;
        const left = (screen.width - width) / 2;
        const top = (screen.height - height) / 2;
        
        // Abrir popup
        this.popupWindow = window.open(
            '/modules/radio/popup.html',
            'RadioPopup',
            `width=${width},height=${height},left=${left},top=${top},` +
            'toolbar=no,menubar=no,location=no,status=no,resizable=yes,scrollbars=no'
        );
        
        // Verificar si se abrió correctamente
        if (!this.popupWindow) {
            alert('No se pudo abrir la ventana flotante. Por favor, permite las ventanas emergentes para este sitio.');
        }
    }
}