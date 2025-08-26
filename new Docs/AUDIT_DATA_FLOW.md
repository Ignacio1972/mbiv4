# 🔄 Data Flow Architecture - MBI-v3 Technical Documentation

## Executive Summary

MBI-v3 implements a **unidirectional data flow** architecture with event-driven communication between loosely coupled modules. The system follows a modified Flux pattern without a centralized store, instead using module-scoped state management with event propagation for inter-module communication.

## 🏗️ Core Data Flow Patterns

### 1. Primary Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER INTERACTION                             │
└───────────────┬─────────────────────────────────────────────────┘
                │
                ↓
┌───────────────────────────────────────────────────────────────────┐
│                         UI COMPONENTS                              │
│  (buttons, inputs, selects, sliders, toggles)                      │
└───────────────┬─────────────────────────────────────────────────┘
                │ DOM Events
                ↓
┌───────────────────────────────────────────────────────────────────┐
│                      MODULE HANDLERS                               │
│  (ui-handler, audio-handler, template-handler, profile-handler)    │
└───────────────┬─────────────────────────────────────────────────┘
                │ Process & Validate
                ↓
┌───────────────────────────────────────────────────────────────────┐
│                       STATE MANAGER                                │
│  (module-scoped state with getter/setter pattern)                  │
└───────┬───────────────────────────────────────┬───────────────────┘
        │ State Change                          │ Emit Event
        ↓                                       ↓
┌───────────────────────┐       ┌───────────────────────────────────┐
│   UPDATE UI           │       │          EVENT BUS                 │
│   (re-render)         │       │    (cross-module communication)    │
└───────────────────────┘       └───────────────────────────────────┘
```

### 2. Inter-Module Communication Flow

```javascript
// Asynchronous Event-Driven Pattern
Module A                    Event Bus                    Module B
    │                           │                           │
    ├──emit('event:type')──────>│                           │
    │                           ├──broadcast('event:type')──>│
    │                           │                           ├──handler()
    │                           │<──emit('event:response')──┤
    │<──trigger('event:response')│                           │
    │                           │                           │
```

## 📊 Data Flow Scenarios

### Scenario 1: Text-to-Speech Generation Flow

```javascript
// Complete TTS Generation Data Flow
{
    1. "User Input": {
        trigger: "User types text and clicks Generate",
        component: "TextArea + GenerateButton",
        data: { text: string, voiceId: string, settings: object }
    },
    
    2. "Handler Processing": {
        handler: "audioHandler.generate()",
        validation: [
            "Check text length > 0",
            "Verify voice selection",
            "Validate settings ranges"
        ],
        stateUpdate: "stateManager.setState({ generating: true })"
    },
    
    3. "API Request": {
        endpoint: "POST /api/generate.php",
        payload: {
            text: string,
            voice_id: string,
            voice_settings: {
                stability: number,
                similarity_boost: number,
                style: number,
                use_speaker_boost: boolean
            }
        },
        headers: { "Content-Type": "application/json" }
    },
    
    4. "Backend Processing": {
        steps: [
            "Validate API key",
            "Call ElevenLabs API",
            "Save audio file",
            "Generate metadata",
            "Return response"
        ]
    },
    
    5. "Response Handling": {
        success: {
            data: { 
                audioUrl: string, 
                duration: number, 
                characterCount: number 
            },
            stateUpdate: {
                audioUrl: response.audioUrl,
                generating: false,
                lastGenerated: timestamp
            },
            events: [
                "audio:generated",
                "ui:update:player"
            ]
        },
        error: {
            handling: "Display error message",
            stateUpdate: { generating: false, error: message },
            events: ["api:error", "ui:show:error"]
        }
    },
    
    6. "UI Update": {
        components: [
            "AudioPlayer.src = audioUrl",
            "GenerateButton.disabled = false",
            "TokenDisplay.update(characterCount)",
            "SaveButton.enabled = true"
        ]
    }
}
```

### Scenario 2: Message Save to Library Flow

```javascript
// Save Message Data Flow
{
    1. "Save Initiation": {
        trigger: "User clicks Save to Library",
        validation: "audioUrl !== null",
        modal: "SaveMessageModal.open()"
    },
    
    2. "User Input": {
        fields: {
            title: { required: true, maxLength: 100 },
            description: { required: false, maxLength: 500 },
            category: { required: true, enum: categories },
            tags: { required: false, type: "array" }
        }
    },
    
    3. "Data Preparation": {
        messageData: {
            id: "msg_" + Date.now() + "_" + Math.random(),
            title: string,
            description: string,
            category: string,
            tags: string[],
            audioUrl: string,
            voiceId: string,
            voiceSettings: object,
            createdAt: ISO8601,
            duration: number,
            characterCount: number
        }
    },
    
    4. "Storage Operations": {
        local: {
            storage: "localStorage",
            key: "mbi_messages",
            operation: "append to array",
            format: "JSON"
        },
        remote: {
            endpoint: "POST /api/biblioteca.php",
            action: "save",
            response: { success: boolean, id: string }
        }
    },
    
    5. "Event Propagation": {
        event: "message:saved:library",
        payload: messageData,
        consumers: [
            "campaign-library: addToGrid()",
            "statistics: updateCount()",
            "ui: showSuccessToast()"
        ]
    }
}
```

### Scenario 3: Schedule Creation Flow

```javascript
// Schedule Creation Data Flow
{
    1. "Schedule Modal Open": {
        trigger: "campaign-library.scheduleMessage()",
        data: { filename: string, title: string, category: string },
        import: "dynamic('./schedule-modal.js')"
    },
    
    2. "Schedule Configuration": {
        inputs: {
            type: ["interval", "specific", "once"],
            startDate: Date,
            endDate: Date,
            times: string[],
            days: number[],
            interval: number
        }
    },
    
    3. "Validation": {
        rules: [
            "endDate > startDate",
            "times.length > 0 for specific type",
            "interval > 0 for interval type",
            "at least one day selected"
        ]
    },
    
    4. "API Submission": {
        endpoint: "POST /api/audio-scheduler.php",
        payload: {
            filename: string,
            title: string,
            category: string,
            schedule_type: string,
            schedule_config: object,
            is_active: boolean
        }
    },
    
    5. "Backend Processing": {
        database: "SQLite",
        table: "schedules",
        cronJob: "Register in cron system",
        validation: "Check for conflicts"
    },
    
    6. "Response Flow": {
        success: {
            data: { scheduleId: number, nextRun: Date },
            events: [
                "schedule:created",
                "calendar:refresh",
                "ui:show:success"
            ]
        }
    },
    
    7. "UI Updates": {
        affected: [
            "Calendar module: Add event",
            "Schedule list: Refresh",
            "Modal: Close",
            "Toast: Show success"
        ]
    }
}
```

## 🔀 Asynchronous Data Flow Patterns

### 1. Promise Chain Pattern
```javascript
// Sequential async operations
apiClient.request(config)
    .then(response => stateManager.update(response))
    .then(state => updateUI(state))
    .then(() => eventBus.emit('operation:complete'))
    .catch(error => handleError(error))
    .finally(() => setLoading(false));
```

### 2. Parallel Data Fetching
```javascript
// Concurrent data loading
async loadModuleData() {
    const [messages, metadata, schedules] = await Promise.all([
        this.loadMessages(),
        this.loadMetadata(),
        this.loadSchedules()
    ]);
    
    this.mergeData({ messages, metadata, schedules });
    this.renderUI();
}
```

### 3. Event-Driven Async Flow
```javascript
// Decoupled async communication
// Producer
eventBus.emit('data:request', { type: 'messages' });

// Consumer
eventBus.on('data:request', async ({ type }) => {
    const data = await fetchData(type);
    eventBus.emit('data:response', { type, data });
});

// Handler
eventBus.on('data:response', ({ type, data }) => {
    updateUIWithData(type, data);
});
```

## 📦 State Management Patterns

### 1. Module State Pattern
```javascript
class ModuleState {
    constructor() {
        this.state = this.getInitialState();
        this.subscribers = new Set();
    }
    
    getInitialState() {
        return {
            data: [],
            loading: false,
            error: null,
            filters: {},
            ui: {
                view: 'grid',
                sortBy: 'date',
                page: 1
            }
        };
    }
    
    setState(updates) {
        this.state = { ...this.state, ...updates };
        this.notify();
        this.persist();
    }
    
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }
    
    notify() {
        this.subscribers.forEach(cb => cb(this.state));
    }
    
    persist() {
        storageManager.set('module_state', this.state);
    }
}
```

### 2. Component State Binding
```javascript
class Component {
    constructor(stateManager) {
        this.state = stateManager;
        this.unsubscribe = this.state.subscribe(this.onStateChange.bind(this));
    }
    
    onStateChange(newState) {
        this.render(newState);
    }
    
    updateState(changes) {
        this.state.setState(changes);
        // UI updates automatically via subscription
    }
    
    destroy() {
        this.unsubscribe();
    }
}
```

## 🔄 Data Transformation Pipeline

### 1. Input Processing Pipeline
```javascript
InputPipeline = {
    1: "Raw User Input",
    2: "Sanitization (XSS prevention)",
    3: "Validation (schema checking)",
    4: "Normalization (format consistency)",
    5: "Transformation (business logic)",
    6: "State Update",
    7: "Persistence"
}
```

### 2. API Response Pipeline
```javascript
ResponsePipeline = {
    1: "Raw Response",
    2: "Status Check",
    3: "Error Handling",
    4: "Data Extraction",
    5: "Schema Validation",
    6: "Data Transformation",
    7: "State Merge",
    8: "UI Update",
    9: "Event Emission"
}
```

## 🎯 Critical Data Flows

### 1. Real-time Audio Streaming
```javascript
AudioStreamFlow {
    Source: "AzuraCast API",
    Transport: "HTTP Stream / WebSocket",
    Buffer: "MediaSource API",
    Output: "Audio Context",
    Metadata: {
        update_interval: "5 seconds",
        fields: ["title", "artist", "listeners"]
    }
}
```

### 2. File Upload Flow
```javascript
FileUploadFlow {
    1: "File Selection (input[type=file])",
    2: "Client Validation (size, type)",
    3: "FormData Preparation",
    4: "Chunked Upload (if > 5MB)",
    5: "Server Processing",
    6: "Database Entry",
    7: "Response with metadata",
    8: "UI Update with new file",
    9: "Event broadcast"
}
```

### 3. Batch Operations Flow
```javascript
BatchOperationFlow {
    Selection: "Multi-select UI",
    Validation: "Check permissions",
    Confirmation: "Modal dialog",
    Processing: {
        strategy: "Sequential with rollback",
        progress: "Progress bar updates",
        errors: "Collect and display at end"
    },
    Completion: "Refresh affected components"
}
```

## 🚦 Data Flow Control Mechanisms

### 1. Rate Limiting
```javascript
RateLimiter = {
    debounce: "Search input (300ms)",
    throttle: "Scroll events (100ms)",
    queue: "API requests (max 5 concurrent)",
    retry: "Failed requests (3 attempts with backoff)"
}
```

### 2. Cache Strategy
```javascript
CacheStrategy = {
    memory: {
        scope: "Module lifecycle",
        size: "50 items max",
        ttl: "5 minutes"
    },
    localStorage: {
        scope: "Persistent",
        size: "5MB max",
        ttl: "24 hours"
    },
    invalidation: {
        triggers: ["create", "update", "delete"],
        strategy: "Selective invalidation"
    }
}
```

## 🔒 Data Flow Security

### 1. Input Sanitization Points
```javascript
SanitizationPoints = [
    "Form submission",
    "URL parameters",
    "File uploads",
    "API responses",
    "localStorage reads"
]
```

### 2. Data Validation Layers
```javascript
ValidationLayers = {
    client: {
        html5: "Input attributes",
        javascript: "Custom validators",
        schema: "JSON Schema validation"
    },
    server: {
        php: "Filter functions",
        database: "Prepared statements",
        api: "Request validation"
    }
}
```

## 📈 Performance Optimizations

### 1. Data Flow Optimizations
- **Lazy Loading**: Modules and data loaded on demand
- **Virtualization**: Large lists rendered partially
- **Memoization**: Computed values cached
- **Debouncing**: User input delays
- **Batch Updates**: DOM updates batched

### 2. Memory Management
- **Cleanup on Unload**: Event listeners and subscriptions
- **Weak References**: For cache entries
- **Pagination**: Large datasets
- **Stream Processing**: Audio data
- **Garbage Collection**: Explicit null assignments

## 🔍 Data Flow Monitoring

### Debug Helpers
```javascript
// Data flow tracing
if (DEBUG_MODE) {
    eventBus.on('*', (event) => {
        console.log(`[EVENT] ${event.type}`, event.payload);
    });
    
    apiClient.interceptors.request.use(config => {
        console.log(`[API REQUEST]`, config);
        return config;
    });
}
```

### Performance Metrics
```javascript
DataFlowMetrics = {
    eventLatency: "< 10ms",
    apiResponseTime: "< 500ms avg",
    stateUpdateTime: "< 50ms",
    renderTime: "< 100ms",
    memoryUsage: "< 50MB"
}
```

## 🎯 Best Practices

1. **Unidirectional Flow**: Data flows in one direction
2. **Immutable Updates**: Never mutate state directly
3. **Event Namespacing**: Clear event naming conventions
4. **Error Boundaries**: Catch errors at module level
5. **Data Validation**: Validate at every boundary
6. **Async Handling**: Consistent promise/async patterns
7. **Memory Cleanup**: Proper lifecycle management

---

*This data flow documentation serves as the authoritative reference for understanding how information moves through the MBI-v3 system.*