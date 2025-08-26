<?php
// Script para inicializar el sistema de voces con Juan Carlos

$voicesConfig = [
    "voices" => [
        "juan_carlos" => [
            "id" => "G4IAP30yc6c1gK0csDfu",
            "label" => "Juan Carlos",
            "gender" => "M",
            "active" => true,
            "category" => "custom",
            "added_date" => "2025-08-23 17:06:14",
            "is_default" => true
        ]
    ],
    "settings" => [
        "default_voice" => "juan_carlos",
        "last_updated" => date('c'),
        "version" => "2.0"
    ]
];

$file = __DIR__ . '/voices-config.json';

// Crear el archivo
if (file_put_contents($file, json_encode($voicesConfig, JSON_PRETTY_PRINT))) {
    echo "✅ Sistema de voces inicializado con Juan Carlos como default\n";
    echo "📁 Archivo creado: " . $file . "\n";
    
    // Verificar permisos
    chmod($file, 0666);
    echo "🔐 Permisos establecidos: 666\n";
    
    // Mostrar contenido
    echo "\n📋 Contenido del archivo:\n";
    echo file_get_contents($file);
} else {
    echo "❌ Error al crear el archivo\n";
}
?>