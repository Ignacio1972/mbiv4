# 🚨 CRITICAL FEATURES AUDIT - MBI-v3 System

## Executive Summary

This document identifies **ALL critical functionalities** that **MUST NOT BREAK** during any migration, refactoring, or design update of the MBI-v3 system. These features are essential for the mall's automated radio operations.

---

## 🎯 TIER 1: MISSION-CRITICAL FEATURES (System Failure if Broken)

### 1. **Text-to-Speech Generation**
**Priority:** MAXIMUM  
**Component:** `/api/generate.php`  
**Dependencies:** ElevenLabs API, audio-processor.php

#### Critical Functions:
```javascript
// CRITICAL: Voice settings conversion (UI → API)
{
    style: value !== undefined ? value : 0.5,  // MUST allow 0 value
    stability: 0-1 range,
    similarity_boost: 0-1 range,
    use_speaker_boost: boolean
}
```

#### What CANNOT break:
- ✅ Text input → Audio generation flow
- ✅ Voice selection with dynamic voices
- ✅ Template support with variables
- ✅ Automatic silence padding (3 seconds)
- ✅ Upload to AzuraCast after generation
- ✅ Immediate radio interruption capability

#### Validation Rules:
```php
// File naming convention (MUST maintain)
'/^tts\d+(_[a-zA-Z0-9_\-ñÑáéíóúÁÉÍÓÚ]+)?\.mp3$/'

// Voice settings (EXACT format required)
['style', 'stability', 'similarity_boost', 'use_speaker_boost']
```

---

### 2. **Radio Interruption System**
**Priority:** MAXIMUM  
**Component:** `/api/services/radio-service.php`  
**Dependencies:** AzuraCast API, Docker, Liquidsoap

#### Critical Configuration:
```php
AZURACAST_BASE_URL = 'http://51.222.25.222'
AZURACAST_STATION_ID = 1
PLAYLIST_ID_GRABACIONES = 3
```

#### What CANNOT break:
- ✅ Immediate radio interruption via liquidsoap.sock
- ✅ File upload to AzuraCast with base64 encoding
- ✅ Playlist assignment to "Grabaciones"
- ✅ Docker command execution for file management
- ✅ Stream metadata updates

#### Critical Commands:
```bash
# Radio interruption (EXACT format)
echo "interrupting_requests.push file_uri" | \
socat - UNIX-CONNECT:/var/azuracast/stations/test/config/liquidsoap.sock
```

---

### 3. **Audio Library Management**
**Priority:** HIGH  
**Component:** `/api/biblioteca.php`  
**Dependencies:** File system, Docker, AzuraCast

#### What CANNOT break:
- ✅ File listing with optimized find command
- ✅ Audio streaming for playback
- ✅ File deletion with Docker exec
- ✅ File renaming with descriptions
- ✅ Send to radio functionality

#### Critical Paths:
```php
// Docker path (MUST be exact)
'/var/azuracast/stations/test/media/Grabaciones/'

// Local path
__DIR__ . '/temp/'
```

---

## 🎯 TIER 2: BUSINESS-CRITICAL FEATURES (Major Impact if Broken)

### 4. **Automatic Scheduling System**
**Component:** `/api/audio-scheduler.php`  
**Database:** `/calendario/api/db/calendar.db`

#### What CANNOT break:
- ✅ Schedule creation (interval, specific, once)
- ✅ Execution detection at scheduled times
- ✅ Category support (7 categories)
- ✅ Schedule logging to database
- ✅ Active/inactive schedule management

#### Critical Tables:
```sql
audio_schedule      -- Active schedules
audio_schedule_log  -- Execution history
audio_metadata      -- File metadata
```

---

### 5. **Frontend Module System**
**Component:** `/shared/module-loader.js`

#### What CANNOT break:
- ✅ Dynamic module loading with lazy imports
- ✅ CSS isolation per module
- ✅ Module lifecycle (load/unload)
- ✅ Navigation between modules
- ✅ Event cleanup on module switch

#### Module Interface Contract:
```javascript
interface IModule {
    load(container: HTMLElement): Promise<void>
    unload(): Promise<void>
    getName(): string
}
```

---

### 6. **Event Bus Communication**
**Component:** `/shared/event-bus.js`

#### Critical Events:
```javascript
// System events
MODULE_LOADED, MODULE_UNLOADED, MODULE_ERROR
NAVIGATION_CHANGE

// Feature events
message:saved:library
schedule:created
audio:generated

// API events
api:request, api:response, api:error
```

###  **Dynamic Voice Management System**
**Priority:** HIGH  
**Components:** `/playground/api/voice-admin.php`, `/playground/api/voice-manager.php`  
**Configuration:** `/api/data/voices-config.json`, `/api/data/custom-voices.json`  
**Dependencies:** ElevenLabs Voice IDs, Dynamic Voice Selector Component

#### Critical Functions:
```javascript
// Voice configuration structure (MUST maintain)
{
    "voices": {
        "[voice_key]": {
            "id": "ElevenLabs_Voice_ID",    // CRITICAL: Valid ElevenLabs ID
            "label": "Display Name",         // UI display name
            "gender": "M|F",                 // Gender identifier
            "active": true,                  // Enable/disable flag
            "category": "custom",            // Identifies custom voices
            "added_date": "YYYY-MM-DD HH:mm:ss",
            "is_default": boolean            // Default voice flag
        }
    },
    "settings": {
        "default_voice": "voice_key",       // CRITICAL: Must exist in voices
        "last_updated": "ISO8601",
        "version": "2.0"
    }
}
```

#### What CANNOT break:
- ✅ Voice configuration file structure and location
- ✅ Default voice assignment (currently "juan_carlos")
- ✅ Voice key generation from label (lowercase, underscores)
- ✅ Integration with Message Configurator voice selector
- ✅ Category identification for custom voices
- ✅ Gender assignment for voice cards display

#### Critical Integration Points:

##### A. Voice Admin API (`/playground/api/voice-admin.php`)
```php
// Critical actions
'list_all'  // Returns complete voice configuration
'add'       // Adds new custom voice
'update'    // Updates existing voice
'delete'    // Removes voice (with safeguards)
'toggle'    // Enable/disable voice

// Key generation rule (MUST maintain)
$voiceKey = strtolower(str_replace(' ', '_', $input['label']));
```

##### B. Voice Manager API (`/playground/api/voice-manager.php`)
```php
// Alternative storage for custom voices
'/api/data/custom-voices.json'

// Structure for custom voices
{
    "[voice_key]": {
        "id": "voice_id",
        "label": "voice_name",
        "gender": "M|F",
        "custom": true,
        "added_date": "timestamp"
    }
}
```

##### C. Dynamic Voice Selector Component
```javascript
// Component expectations
- Reads from voices configuration
- Identifies custom voices by category
- Shows gender icons (👨/👩)
- Marks custom voices with badge
- Handles empty voice list gracefully
```

#### Validation Rules:
```php
// Voice ID validation (MUST be valid ElevenLabs ID)
if (!preg_match('/^[a-zA-Z0-9_-]+$/', $voiceId)) {
    throw new Exception("Invalid voice ID format");
}

// Voice key uniqueness
if (isset($config['voices'][$voiceKey])) {
    throw new Exception("Voice key already exists");
}

// Default voice validation
if ($isDefault && !isset($config['voices'][$voiceKey])) {
    throw new Exception("Cannot set non-existent voice as default");
}
```

#### Critical Files and Permissions:
```bash
# Configuration files (MUST be writable by PHP)
/api/data/voices-config.json     # 644 permissions
/api/data/custom-voices.json     # 644 permissions

# API endpoints (MUST be accessible)
/playground/api/voice-admin.php   # Voice administration
/playground/api/voice-manager.php # Alternative manager
```

#### Dependencies on this Feature:
1. **Message Configurator** - Loads available voices from config
2. **Generate API** - Uses voice IDs for TTS generation
3. **Templates System** - May reference specific voice keys
4. **User Profiles** - May save preferred voice selections

#### Current Production Voices:
```json
// CRITICAL: These voices are in active use
"juan_carlos": {
    "id": "G4IAP30yc6c1gK0csDfu",  // DEFAULT VOICE - DO NOT DELETE
    "label": "Juan Carlos",
    "gender": "M",
    "is_default": true
}
```

#### Testing Requirements:
- [ ] Add new custom voice via playground
- [ ] Verify voice appears in Message Configurator
- [ ] Generate audio with new voice
- [ ] Set new voice as default
- [ ] Delete non-default voice
- [ ] Handle duplicate voice key error
- [ ] Verify JSON file integrity after operations

#### Fallback Strategy:
```javascript
// If voices config is corrupted or empty
const fallbackVoices = {
    "default": {
        "id": "21m00Tcm4TlvDq8ikWAM",  // Rachel (ElevenLabs default)
        "label": "Default Voice",
        "gender": "F",
        "active": true,
        "category": "system"
    }
};

// Auto-repair mechanism
if (Object.keys(voices).length === 0) {
    console.warn("No voices found, using fallback");
    voices = fallbackVoices;
}
```

#### Migration Considerations:
- **Data Migration**: Preserve all custom voices during updates
- **Backward Compatibility**: Support both voices-config.json and custom-voices.json
- **Voice ID Validation**: Verify all voice IDs are still valid with ElevenLabs
- **Default Voice**: Never remove the default voice without setting a new one
- **Merge Strategy**: If both config files exist, merge without duplicates

#### Security Considerations:
```php
// Sanitization requirements
$label = filter_var($input['label'], FILTER_SANITIZE_STRING);
$voiceId = preg_replace('/[^a-zA-Z0-9_-]/', '', $input['voice_id']);
$gender = in_array($input['gender'], ['M', 'F']) ? $input['gender'] : 'F';

// Access control (future implementation)
// TODO: Add authentication for voice management endpoints
```

#### Performance Impact:
- Voice list cached in frontend for 5 minutes
- Configuration file < 10KB (negligible load time)
- No database queries (file-based storage)
- Instant updates (no restart required)

#### Error Recovery:
```bash
# If voice configuration is corrupted
cp /api/data/voices-config.json.backup /api/data/voices-config.json

# If no backup exists, minimal recovery file
echo '{
    "voices": {
        "default": {
            "id": "21m00Tcm4TlvDq8ikWAM",
            "label": "Default",
            "gender": "F",
            "active": true
        }
    },
    "settings": {
        "default_voice": "default",
        "version": "2.0"
    }
}' > /api/data/voices-config.json
```

#### Monitoring Points:
- File modification time of voices-config.json
- Number of active voices in configuration
- Default voice availability
- Voice ID validation with ElevenLabs API

---

### Why This Is Business-Critical:

1. **Operational Flexibility**: Mall staff can add location-specific voices without developer intervention
2. **Brand Consistency**: Custom voices like "Juan Carlos" maintain mall's audio identity
3. **Quick Updates**: New promotional voices can be added for special events
4. **No Code Changes**: Voice updates don't require system deployment
5. **User Preference**: Different departments may prefer different voices

### Integration Test Checklist:
```javascript
// Full integration test
1. Add voice via playground → 
2. Verify in voices-config.json → 
3. Check Message Configurator dropdown → 
4. Generate audio with new voice → 
5. Save message with voice metadata → 
6. Verify voice ID in saved message → 
7. Schedule message with custom voice → 
8. Confirm playback uses correct voice
```

---



## 🎯 TIER 3: USER-CRITICAL FEATURES (UX Impact if Broken)

### 7. **Message Configurator UI**
**Component:** `/modules/message-configurator/`

#### What CANNOT break:
- ✅ Voice selection dropdown
- ✅ Slider controls (0-100% → 0-1 conversion)
- ✅ Template system with categories
- ✅ Save to library functionality
- ✅ Audio preview player
- ✅ Character count tracking

#### Critical State Management:
```javascript
// State persistence
localStorage: 'mbi_messageState'
localStorage: 'mbi_voiceProfiles'
```

---

### 8. **Campaign Library Features**
**Component:** `/modules/campaign-library/`

#### What CANNOT break:
- ✅ Dual storage (localStorage + backend)
- ✅ Category filtering (7 categories)
- ✅ Search functionality
- ✅ Grid/List view toggle
- ✅ Floating audio player
- ✅ Schedule modal integration

---

### 9. **Calendar Module**
**Component:** `/modules/calendar/`

#### What CANNOT break:
- ✅ Calendar view rendering
- ✅ Event display with tooltips
- ✅ Schedule management table
- ✅ Filter by event type
- ✅ Delete schedule confirmation

---

## 🔧 CRITICAL INTEGRATIONS

### External Services
| Service | Endpoint | Critical For | Fallback |
|---------|----------|--------------|----------|
| ElevenLabs | api.elevenlabs.io | TTS Generation | None - System fails |
| AzuraCast | 51.222.25.222 | Radio Stream | None - System fails |
| SQLite DB | calendar.db | Scheduling | None - Feature fails |

### File System Requirements
| Path | Purpose | Permissions | Clean-up |
|------|---------|-------------|----------|
| /api/temp/ | Temporary files | 755 | 1 hour |
| /media/Grabaciones/ | Audio library | 755 | Manual |
| /calendario/api/db/ | Database | 644 | Never |

---

## 🚫 BREAKING CHANGES TO AVOID

### 1. **DOM Structure Changes**
```javascript
// CRITICAL SELECTORS - DO NOT CHANGE
#app-container          // Module container
.tab-button            // Navigation tabs
#message-text          // Text input
#audio-player-container // Player mount point
.message-card          // Library cards
```

### 2. **Event Signatures**
```javascript
// MUST maintain payload structure
eventBus.emit('message:saved:library', {
    id: string,
    title: string,
    audioUrl: string,
    category: string
})
```

### 3. **API Response Formats**
```javascript
// generate.php response (MUST maintain)
{
    success: boolean,
    audioUrl: string,
    duration: number,
    characterCount: number
}
```

### 4. **LocalStorage Keys**
```javascript
// DO NOT CHANGE these keys
'mbi_messages'        // Campaign library
'mbi_messageState'    // Message configurator
'mbi_voiceProfiles'   // Voice presets
```

---

## ✅ TESTING CHECKLIST

### Before ANY Migration/Update:

#### Core Functionality Tests:
- [ ] Generate TTS with style=0 (edge case)
- [ ] Generate TTS with all voice settings
- [ ] Upload and interrupt radio immediately
- [ ] List library with 20+ files
- [ ] Delete file from library
- [ ] Rename file with special characters

#### Module System Tests:
- [ ] Navigate between all modules
- [ ] Verify CSS isolation
- [ ] Check memory cleanup on unload
- [ ] Test event propagation

#### Scheduling Tests:
- [ ] Create interval schedule
- [ ] Create specific time schedule
- [ ] Delete active schedule
- [ ] Verify execution at scheduled time

#### Integration Tests:
- [ ] ElevenLabs API connection
- [ ] AzuraCast streaming
- [ ] Database read/write
- [ ] Docker command execution

---

## 🔒 CONFIGURATION PROTECTION

### Files That MUST NOT Change Without Backup:
```bash
/api/config.php           # API keys
/api/data/voices-config.json  # Voice configuration
/calendario/api/db/calendar.db  # Schedule database
```

### Environment Variables to Preserve:
```php
ELEVENLABS_API_KEY
AZURACAST_API_KEY
AZURACAST_BASE_URL
AZURACAST_STATION_ID
PLAYLIST_ID_GRABACIONES
```

---

## 📊 PERFORMANCE REQUIREMENTS

### Response Time Limits:
- TTS Generation: < 30 seconds
- Library Loading: < 2 seconds
- Module Switch: < 500ms
- Radio Interruption: < 3 seconds

### Resource Limits:
- Max concurrent API calls: 5
- Max file upload size: 10MB
- Max temp directory size: 1GB
- Max localStorage usage: 5MB

---

## 🚨 EMERGENCY RECOVERY

### If System Breaks:

1. **Check API Keys:**
   - Verify ElevenLabs key is valid
   - Verify AzuraCast connection

2. **Check File Permissions:**
   ```bash
   chmod 755 /api/temp/
   chmod 644 /calendario/api/db/calendar.db
   ```

3. **Clear Temp Files:**
   ```bash
   find /api/temp/ -name "*.mp3" -mtime +1 -delete
   ```

4. **Restart Services:**
   ```bash
   sudo docker restart azuracast
   sudo systemctl restart apache2
   ```

5. **Restore from Backup:**
   - Database: Restore calendar.db
   - Config: Restore config.php
   - Voices: Restore voices-config.json

---

## 📝 MIGRATION RULES

### Golden Rules for ANY Changes:

1. **NEVER** modify without testing in development first
2. **ALWAYS** backup database and config before changes
3. **MAINTAIN** backward compatibility for events
4. **PRESERVE** localStorage key names
5. **TEST** with style=0 voice setting (known edge case)
6. **VERIFY** Docker commands still work
7. **ENSURE** API response formats unchanged
8. **CHECK** all 7 categories still function
9. **VALIDATE** file naming conventions
10. **CONFIRM** radio interruption works

---

*This document serves as the authoritative reference for critical system features that must be protected during any development work.*