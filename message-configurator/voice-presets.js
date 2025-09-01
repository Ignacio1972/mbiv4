// Voice Presets - DEPRECADO - Ahora se usan voces dinámicas
export class VoicePresets {
    static presets = {};
    
    static getPreset(voice) {
        return {
            settings: {
                style: 0.5,
                stability: 0.75,
                similarity_boost: 0.8,
                speed: 'normal'
            }
        };
    }
    
    static getDefaults() {
        return {
            settings: {
                style: 0.5,
                stability: 0.75,
                similarity_boost: 0.8,
                speed: 'normal'
            }
        };
    }
    
    static getAllVoices() {
        return [];
    }
    
    static getRecommendedVoices(type) {
        return [];
    }
}
