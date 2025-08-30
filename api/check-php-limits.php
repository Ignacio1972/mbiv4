<?php
header('Content-Type: application/json');

echo json_encode([
    'upload_max_filesize' => ini_get('upload_max_filesize'),
    'post_max_size' => ini_get('post_max_size'),
    'max_execution_time' => ini_get('max_execution_time'),
    'php_version' => phpversion(),
    'sapi' => php_sapi_name()
], JSON_PRETTY_PRINT);
?>