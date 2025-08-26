# MBI-v3 Technical Documentation
**Sistema Text-to-Speech para Mall Barrio Independencia**

## 🎯 Overview
Sistema modular de generación y gestión de anuncios por voz para centros comerciales. Arquitectura ES6 con lazy loading, integración con ElevenLabs TTS y AzuraCast para streaming de radio automatizada.

## 📁 Project Structure
```
mbi-v3/
├── index.html                    # Entry point - SPA container
├── api/                          # PHP Backend
│   ├── config.php                # API keys and settings
│   ├── generate.php              # TTS generation endpoint
│   ├── audio-scheduler.php       # Schedule management
│   ├── audio-favorites.php       # Favorite messages
│   ├── audio-metadata.php        # Audio file metadata
│   ├── library-metadata.php      # Message metadata
│   ├── saved-messages.php        # Saved messages handler
│   ├── test-azuracast.php       # AzuraCast connection test
│   └── db/                       # Database utilities
│       ├── init-audio-db.php    # Database initialization
│       └── calendar.db           # SQLite database
├── shared/                       # Core modules
│   ├── event-bus.js             # Event system (pub/sub)
│   ├── module-loader.js         # Dynamic module loading
│   ├── router.js                # Hash-based routing
│   ├── api-client.js            # HTTP client wrapper
│   ├── audio-manager.js         # Audio playback/generation
│   ├── storage-manager.js       # LocalStorage abstraction
│   └── data-schemas.js          # Data structures
├── modules/                      # Feature modules
│   ├── message-configurator/    # Message creation UI
│   ├── campaign-library/        # Message library
│   ├── calendar/                # Scheduling system v2
│   ├── audio-library/           # Audio file management
│   └── radio/                   # Live radio control
├── calendario/                   # Legacy calendar system
│   └── api/                     # Calendar backend
└── assets/                       
    └── css/                     # Global styles
```

## 🏗️ Architecture

### Frontend Architecture
- **Module System**: ES6 modules with dynamic imports
- **State Management**: Per-module state managers with event-driven updates
- **Event System**: Global event bus for inter-module communication
- **Routing**: Hash-based SPA routing
- **Storage**: LocalStorage with fallback to memory

### Backend Architecture
- **PHP 7.4+**: REST-like API endpoints
- **SQLite**: Message metadata, scheduling, and audio library
- **File Storage**: MP3 files in `temp/` and `biblioteca/`
- **External APIs**: ElevenLabs (TTS), AzuraCast (streaming)

## 🔑 Core Components

### Event Bus (`/shared/event-bus.js`)
```javascript
// Singleton event system
eventBus.emit('event:name', data);
eventBus.on('event:name', callback);
eventBus.once('event:name', callback);
eventBus.off('event:name', callback);

// System events
SystemEvents = {
    MODULE_LOADED: 'module:loaded',
    MODULE_UNLOADED: 'module:unloaded',
    NAVIGATION_CHANGE: 'navigation:change',
    AUDIO_GENERATED: 'audio:generated',
    MESSAGE_SAVED: 'message:saved',
    SCHEDULE_CREATED: 'schedule:created',
    RADIO_INTERRUPTED: 'radio:interrupted'
}
```

### Module Loader (`/shared/module-loader.js`)
```javascript
// Dynamic module loading with CSS injection
moduleLoader.init(container);
await moduleLoader.switchTo('module-name');
moduleLoader.unloadModule('module-name');

// Module interface requirement
class Module {
    getName() { return 'module-name'; }
    async load(container) { /* initialize */ }
    async unload() { /* cleanup */ }
}
```

### Router (`/shared/router.js`)
```javascript
// Routes configuration
routes = {
    '/radio': 'radio',
    '/configuracion': 'message-configurator',
    '/campanas': 'campaign-library',
    '/calendario': 'calendar',
    '/biblioteca': 'audio-library'
}
// Default route: '/radio'
```

### API Client (`/shared/api-client.js`)
```javascript
// Centralized API communication
apiClient.post('/generate.php', {
    action: 'generate_audio',
    text: 'message',
    voice: 'cristian',
    voice_settings: { /* settings */ }
});
```

## 📦 Main Modules

### 1. Message Configurator
**Path**: `/modules/message-configurator/`  
**Purpose**: Create and configure TTS messages  
**Key Files**:
- `index.js` - Main module class
- `state-manager.js` - Message state management
- `api-integration.js` - Backend communication
- `voice-presets.js` - Voice configurations

**State Structure**:
```javascript
MessageSchema = {
    id: 'msg_xxx',
    name: '',
    text: '',
    voice: 'cristian',
    settings: {
        speed: 'normal',
        style: 0.5,          // 0-1
        stability: 0.75,     // 0-1
        similarity_boost: 0.8, // 0-1
        use_speaker_boost: true
    },
    category: 'general',
    tags: [],
    audioFilename: null,     // Local file
    azuracastFilename: null, // Radio file
}
```

### 2. Campaign Library
**Path**: `/modules/campaign-library/`  
**Purpose**: Manage saved messages  
**Features**:
- Local + backend storage sync
- Category filtering
- Search and sort
- Audio playback
- Send to radio
- Rename audio files

**Storage Pattern**:
```javascript
// LocalStorage keys
'tts_mall_library_message_{id}' // Saved messages
'tts_mall_draft_{id}'           // Drafts

// Backend sync
POST /api/library-metadata.php
{
    action: 'save|list|update|delete',
    data: { /* message data */ }
}
```

### 3. Calendar Module v2
**Path**: `/modules/calendar/`  
**Purpose**: Schedule announcements  
**Components**:
- `index.js` - Main calendar module
- `components/calendar-view.js` - FullCalendar wrapper
- `components/event-modal.js` - Event creation/editing
- `components/calendar-filters.js` - Category filters

**Schedule Types**:
```javascript
ScheduleTypes = {
    interval: 'Repetir cada X tiempo',
    specific: 'Días específicos',
    once: 'Una sola vez'
}

ScheduleSchema = {
    id: 'sch_xxx',
    title: 'Schedule name',
    filename: 'audio.mp3',
    schedule_type: 'interval|specific|once',
    interval_hours: 0,
    interval_minutes: 30,
    specific_days: [], // ['monday', 'tuesday']
    specific_times: [], // ['09:00', '14:00']
    once_datetime: '2024-01-01T10:00:00',
    category: 'ofertas|eventos|informacion|emergencias|servicios|horarios',
    is_active: true,
    priority: 1
}
```

### 4. Audio Library
**Path**: `/modules/audio-library/`  
**Purpose**: Manage audio files and favorites  
**Features**:
- File listing and search
- Favorite management
- Play/pause controls
- Send to radio
- Delete files

### 5. Radio Module
**Path**: `/modules/radio/`  
**Purpose**: Live radio control  
**Features**:
- Real-time radio status
- Play/pause/stop controls
- Volume control
- Interrupt with announcement
- Now playing information

## 🔧 API Endpoints

### `/api/generate.php`
```php
// Actions:
'list_templates'      // Get announcement templates
'generate_audio'      // Generate TTS audio
'send_to_radio'       // Interrupt radio with audio
'rename_audio_file'   // Rename audio file in system
```

### `/api/audio-scheduler.php`
```php
// Actions:
'create'    // Create new schedule
'list'      // List all schedules
'update'    // Update schedule
'delete'    // Delete schedule
'toggle'    // Enable/disable schedule
```

### `/api/saved-messages.php`
```php
// Actions:
'save'      // Save message with metadata
'list'      // List saved messages
'get'       // Get single message
'update'    // Update message
'delete'    // Delete message
'search'    // Search messages by text/category
```

### `/api/audio-favorites.php`
```php
// Actions:
'toggle'    // Add/remove from favorites
'list'      // List favorite files
'check'     // Check if file is favorite
```

### `/api/library-metadata.php`
```php
// Actions:
'save'      // Save message metadata
'list'      // List all messages
'update'    // Update message
'delete'    // Delete message
```

## 🎤 Voice Configuration

### Available Voices (ElevenLabs)
```javascript
voices = [
    'cristian', 'fernanda', 'juan', 'sofia',
    'carlos', 'laura', 'diego', 'maria'
    // 30+ voices total
]
```

### Voice Settings Ranges
```javascript
{
    style: 0-1,           // Voice style (0=neutral, 1=expressive)
    stability: 0-1,       // Voice consistency (0=variable, 1=stable)
    similarity_boost: 0-1, // Voice clarity (0=low, 1=high)
    use_speaker_boost: boolean // Enhanced voice
}
```

## 🔄 Data Flow

### Message Generation Flow
1. User enters text in Message Configurator
2. Selects voice and adjusts settings
3. Clicks "Generate Audio"
4. Frontend sends to `/api/generate.php`
5. Backend calls ElevenLabs API
6. Audio processed (add silence)
7. Uploaded to AzuraCast
8. Assigned to playlist
9. Returns filenames to frontend
10. User can save to library or send to radio

### Radio Interrupt Flow
1. User clicks "Send to Radio"
2. Frontend sends filename to `/api/generate.php`
3. Backend calls AzuraCast API
4. Interrupts current playlist
5. Plays announcement
6. Returns to regular programming

### Schedule Execution Flow
1. Cron job runs every minute
2. Checks active schedules in database
3. Evaluates schedule conditions
4. Executes matching schedules
5. Sends audio to radio
6. Logs execution

## 🛠️ Development Guide

### Adding a New Module
1. Create folder in `/modules/your-module/`
2. Create `index.js` implementing module interface:
```javascript
export default class YourModule {
    constructor() {
        this.name = 'your-module';
        this.container = null;
        this.eventBus = window.eventBus;
    }
    
    getName() { return this.name; }
    
    async load(container) {
        this.container = container;
        this.setupEventListeners();
        this.render();
        this.eventBus.emit('module:loaded', { module: this.name });
    }
    
    setupEventListeners() {
        // Listen to events
        this.eventBus.on('some:event', (data) => {
            this.handleEvent(data);
        });
    }
    
    render() {
        this.container.innerHTML = `
            <div class="${this.name}">
                <!-- Your UI here -->
            </div>
        `;
    }
    
    async unload() {
        // Cleanup
        this.eventBus.off('some:event');
        this.container = null;
    }
}
```
3. Add route in `/shared/router.js`
4. Add navigation tab in `index.html`

### Adding New Feature to Existing Module
1. Locate module in `/modules/[module-name]/`
2. Add method to module class:
```javascript
// In module's index.js
newFeature() {
    // Implementation
    this.eventBus.emit('feature:executed', { data });
}
```
3. Update UI in `render()` method
4. Add event listeners if needed
5. Update backend API if required

### Adding API Endpoint
1. Create PHP file or add to existing
2. Handle CORS headers:
```php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
```
3. Parse JSON input:
```php
$input = json_decode(file_get_contents('php://input'), true);
```
4. Return JSON response:
```php
echo json_encode(['success' => true, 'data' => $result]);
```

## 🔐 Configuration

### Required API Keys (`/api/config.php`)
```php
define('ELEVENLABS_API_KEY', 'your_key');
define('AZURACAST_API_KEY', 'station_key');
define('AZURACAST_BASE_URL', 'http://51.222.25.222');
define('AZURACAST_STATION_ID', 1);
define('PLAYLIST_ID_GRABACIONES', 3);
```

### File Paths
```php
define('UPLOAD_DIR', __DIR__ . '/temp/');        // Temporary files
define('BIBLIOTECA_DIR', __DIR__ . '/biblioteca/'); // Saved audio files
```

## 📝 Coding Conventions

### Naming Conventions
- **Files**: kebab-case (`module-name.js`)
- **Classes**: PascalCase (`MessageConfigurator`)
- **Functions**: camelCase (`loadModule()`)
- **Events**: colon-separated (`module:event:detail`)
- **IDs**: underscore with timestamp (`msg_1234567890_abc123`)

### Storage Keys
- **Prefix**: `tts_mall_`
- **Messages**: `library_message_{id}`
- **Drafts**: `draft_{id}`
- **Profiles**: `voice_profile_{id}`
- **Favorites**: `audio_favorites`

### CSS Classes
- **BEM-like**: `.module-name__element--modifier`
- **States**: `.is-active`, `.is-loading`, `.is-selected`
- **Actions**: `.btn`, `.btn-primary`, `.btn-danger`

### Error Handling Pattern
```javascript
try {
    const response = await apiClient.post('/endpoint', data);
    if (!response.success) {
        throw new Error(response.error || 'Unknown error');
    }
    // Handle success
    return response.data;
} catch (error) {
    console.error('Operation failed:', error);
    this.showError(error.message);
    this.eventBus.emit('error:api', { error });
    return null;
}
```

## 🐛 Common Issues & Solutions

### Module Not Loading
- Check route in `router.js`
- Verify module exports default class
- Check console for import errors
- Ensure module path is correct

### Audio Not Generating
- Verify ElevenLabs API key
- Check voice name is valid
- Ensure text is not empty
- Check API quota limits

### Radio Not Interrupting
- Verify AzuraCast API key
- Check playlist ID is correct
- Ensure file exists in AzuraCast
- Check network connectivity

### Schedule Not Executing
- Verify cron job is running
- Check schedule is active
- Ensure audio file exists
- Check timezone settings

### Storage Not Persisting
- Check localStorage is enabled
- Verify key prefix is correct
- Check for quota exceeded
- Clear old/corrupted data

## 📚 External Dependencies

### Frontend
- No frameworks (vanilla JS)
- ES6 modules (native)
- FullCalendar 6.1 (calendar module only)

### Backend
- PHP 7.4+
- SQLite3
- cURL for API calls
- FFmpeg for audio processing (optional)

### APIs
- ElevenLabs TTS API v1
- AzuraCast API v0.17+

## 🔗 Important URLs

### Development
- **Local**: `http://localhost/mbi-v3/`
- **API**: `http://localhost/mbi-v3/api/`

### Production (VPS)
- **Frontend**: `http://51.222.25.222/mbi-v3/`
- **Radio**: `http://51.222.25.222:8000`
- **GitHub**: `https://github.com/Ignacio1972/mbi-v3`

## 🚀 Deployment Guide

### VPS Requirements
- Ubuntu 20.04+ or similar
- PHP 7.4+ with SQLite support
- Apache/Nginx web server
- 2GB+ RAM
- 10GB+ storage

### Deployment Steps
1. Clone repository:
```bash
cd /var/www
git clone https://github.com/Ignacio1972/mbi-v3.git
```

2. Set permissions:
```bash
chmod -R 755 /var/www/mbi-v3
chmod -R 777 /var/www/mbi-v3/api/temp
chmod -R 777 /var/www/mbi-v3/api/biblioteca
chmod 777 /var/www/mbi-v3/calendario/api/db
```

3. Configure API keys in `/api/config.php`

4. Set up cron for scheduler:
```bash
* * * * * php /var/www/mbi-v3/calendario/api/cron.php
```

5. Configure web server to serve from `/var/www/mbi-v3`

## 📌 Architecture Decisions

### Why No Build Process?
- **Simplicity**: Direct deployment without build steps
- **Debugging**: Source maps not needed
- **Updates**: Can edit directly on VPS if needed
- **Performance**: Modern browsers handle ES6 modules efficiently

### Why Event-Driven Architecture?
- **Decoupling**: Modules don't know about each other
- **Extensibility**: Easy to add new modules
- **Debugging**: Can trace events in console
- **Flexibility**: Any module can react to any event

### Why SQLite?
- **Simplicity**: No database server needed
- **Portability**: Database is a single file
- **Performance**: Sufficient for expected load
- **Backup**: Easy to backup/restore

### Why Vanilla JS?
- **No Dependencies**: Reduces complexity
- **Performance**: No framework overhead
- **Learning Curve**: Any developer can contribute
- **Longevity**: No framework version conflicts

## 🎯 Key Insights for New Developers

1. **User Context**: System is for non-technical mall staff
2. **Critical Feature**: Real-time radio interruption must work 24/7
3. **Voice Quality**: Natural-sounding Spanish (Chilean) is essential
4. **Reliability**: System must handle network/API failures gracefully
5. **Performance**: Must work on low-spec hardware (2GB RAM VPS)
6. **Maintenance**: Designed for minimal maintenance requirements

## 🔄 Recent Updates

### November 2024
- Added category colors and emojis to calendar module
- Implemented audio file renaming functionality
- Added saved messages management system
- Improved schedule filtering by category
- Added favorite audio files feature

## 📋 Roadmap

### Short Term (1-2 months)
- [ ] Dashboard with system metrics
- [ ] Automatic database backup
- [ ] User authentication system
- [ ] Playback history log

### Medium Term (3-6 months)
- [ ] Mobile responsive design
- [ ] Multi-language support
- [ ] Advanced scheduling (holidays, special events)
- [ ] Audio effects and mixing

### Long Term (6+ months)
- [ ] Multi-tenant support (multiple malls)
- [ ] AI-powered schedule optimization
- [ ] Social media integration
- [ ] Analytics dashboard

## 🤝 Contributing

### Code Style
- Use ESLint configuration in project
- Follow existing patterns in codebase
- Comment complex logic
- Update documentation for new features

### Testing
- Test on both Chrome and Firefox
- Verify mobile responsiveness
- Test API error scenarios
- Check memory leaks in long sessions

### Git Workflow
1. Create feature branch: `feature/your-feature`
2. Make changes with clear commits
3. Test thoroughly
4. Update documentation
5. Push to GitHub
6. Create pull request

## 📞 Support & Contact

For development questions or issues:
- GitHub Issues: https://github.com/Ignacio1972/mbi-v3/issues
- Documentation: This file and `/docs/` folder

---

*Last updated: November 2024*  
*Version: 3.0.0*