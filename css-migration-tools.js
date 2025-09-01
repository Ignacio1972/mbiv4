#!/usr/bin/env node

/**
 * CSS Migration Tools - Herramienta simple de análisis CSS
 * Para MBI-v4 - Extracción y limpieza de estilos
 */

const fs = require('fs');
const path = require('path');

// Configuración
const CONFIG = {
    modules: [
        'dashboard-v2',
        'calendar', 
        'campaign-library',
        'audio-archive'
    ],
    outputDir: 'styles-v5'
};

console.log('🚀 CSS Migration Tool - MBI-v4\n');
console.log('Analizando estructura CSS actual...\n');

// Crear carpeta de salida
if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

// Analizar cada módulo
CONFIG.modules.forEach(module => {
    const modulePath = `modules/${module}`;
    console.log(`📦 Analizando módulo: ${module}`);
    
    // Buscar archivos CSS
    if (fs.existsSync(modulePath)) {
        const findCSS = (dir) => {
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory() && !file.includes('backup')) {
                    findCSS(fullPath);
                } else if (file.endsWith('.css') && !file.includes('backup')) {
                    const size = (stat.size / 1024).toFixed(2);
                    console.log(`  - ${fullPath} (${size} KB)`);
                }
            });
        };
        
        findCSS(modulePath);
    }
    console.log('');
});

console.log('✅ Análisis completado!');
console.log('\nPróximo paso: Ejecutar extracción de CSS con:');
console.log('  bash css-cleanup-script.sh\n');
